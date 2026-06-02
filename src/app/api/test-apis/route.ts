import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/utils/supabase/server';
import { ensureError } from '@/lib/types-common';

/**
 * Tipos para teste de APIs
 */
interface TestResult {
  status: 'testing...' | 'ok' | 'error' | 'warning';
  details?: Record<string, unknown> | string | null;
  error?: string | null;
}

interface TestResults {
  timestamp: string;
  claude: TestResult;
  pollinations: TestResult;
  apify: TestResult;
  supabase: TestResult;
  supabaseStorage: TestResult;
  summary: { allOk: boolean; failedServices: string[]; status?: string };
}

/**
 * Endpoint para testar status de todas as APIs externas
 * GET /api/test-apis
 * AUTENTICADO: Requer usuário logado (evita abuso de APIs pagas)
 */
export async function GET() {
  // Verificar autenticação
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  const results: TestResults = {
    timestamp: new Date().toISOString(),
    claude: { status: 'testing...', details: null, error: null },
    pollinations: { status: 'testing...', details: null, error: null },
    apify: { status: 'testing...', details: null, error: null },
    supabase: { status: 'testing...', details: null, error: null },
    supabaseStorage: { status: 'testing...', details: null, error: null },
    summary: { allOk: false, failedServices: [] }
  };

  // TEST 1: Claude / Anthropic (geração de copy + prompts de imagem)
  // Usa Haiku 4.5 (modelo mais barato) só para confirmar chave + billing ativos.
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      results.claude = {
        status: 'warning',
        details: 'ANTHROPIC_API_KEY not set',
        error: null
      };
    } else {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const message = await anthropic.messages.create(
        {
          model: 'claude-haiku-4-5',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Respond with: OK' }]
        },
        { timeout: 10000 }
      );

      const textBlock = message.content.find((b) => b.type === 'text');
      results.claude = {
        status: 'ok',
        details: {
          model: message.model,
          testCompletion: textBlock?.type === 'text' ? textBlock.text : null
        },
        error: null
      };
    }
  } catch (error: unknown) {
    const err = ensureError(error);
    results.claude = {
      status: 'error',
      details: null,
      error: err.message
    };
    results.summary.failedServices.push('Claude');
  }

  // TEST 2: Pollinations.ai (geração de imagens via Flux).
  // API nova (gen.pollinations.ai) exige API key. sk_ = sem rate limit.
  // Gera uma imagem pequena (256px) só pra confirmar que o serviço responde.
  try {
    const token = process.env.POLLINATIONS_TOKEN;
    if (!token) {
      results.pollinations = {
        status: 'warning',
        details: 'POLLINATIONS_TOKEN not set — imagens cairão no fallback Unsplash',
        error: null
      };
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const ping = await fetch(
        'https://gen.pollinations.ai/image/test?width=256&height=256&model=flux',
        { signal: controller.signal, headers: { 'User-Agent': 'SpyBot/1.0', Authorization: `Bearer ${token}` } }
      );
      clearTimeout(timeoutId);

      const contentType = ping.headers.get('content-type') || '';
      results.pollinations = {
        status: ping.ok && contentType.startsWith('image/') ? 'ok' : 'error',
        details: { httpStatus: ping.status, contentType, keyPrefix: token.slice(0, 3) },
        error: ping.ok ? null : `HTTP ${ping.status}`
      };
      if (!ping.ok || !contentType.startsWith('image/')) {
        results.summary.failedServices.push('Pollinations');
      }
    }
  } catch (error: unknown) {
    const err = ensureError(error);
    results.pollinations = {
      status: 'error',
      error: err.message
    };
    results.summary.failedServices.push('Pollinations');
  }

  // TEST 3: Apify
  try {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      results.apify = {
        status: 'warning',
        details: 'Token not set'
      };
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(
        `https://api.apify.com/v2/actors?token=${apifyToken}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      results.apify = {
        status: response.ok ? 'ok' : 'error',
        details: { httpStatus: response.status }
      };
    }
  } catch (error: unknown) {
    const err = ensureError(error);
    results.apify = {
      status: 'error',
      error: err.message
    };
    results.summary.failedServices.push('Apify');
  }

  // TEST 4: Supabase
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { count, error } = await supabase
      .from('spybot_generations')
      .select('id', { count: 'exact' })
      .limit(1);

    results.supabase = {
      status: error ? 'error' : 'ok',
      details: {
        authenticated: !!user,
        userEmail: user?.email,
        recordCount: count
      },
      error: error?.message
    };
  } catch (error: unknown) {
    const err = ensureError(error);
    results.supabase = {
      status: 'error',
      error: err.message
    };
    results.summary.failedServices.push('Supabase');
  }

  // TEST 5: Supabase Storage
  try {
    const supabase = await createClient();
    const { data: buckets, error } = await supabase.storage.listBuckets();
    const bucket = buckets?.find(b => b.name === 'spybot_images');

    results.supabaseStorage = {
      status: bucket ? 'ok' : 'error',
      details: {
        bucketFound: !!bucket,
        bucketPublic: bucket?.public
      },
      error: error?.message
    };
  } catch (error: unknown) {
    const err = ensureError(error);
    results.supabaseStorage = {
      status: 'error',
      error: err.message
    };
    results.summary.failedServices.push('SupabaseStorage');
  }

  results.summary.allOk = results.summary.failedServices.length === 0;
  results.summary.status = results.summary.allOk ? '✅ ALL OK' : '❌ FAILED';

  return NextResponse.json(results, {
    status: results.summary.allOk ? 200 : 503
  });
}
