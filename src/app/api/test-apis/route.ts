import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';
import { ensureError } from '@/lib/types-common';

/**
 * Tipos para teste de APIs
 */
interface TestResult {
  status: 'testing...' | 'ok' | 'error' | 'warning';
  details?: Record<string, any> | string | null;
  error?: string | null;
}

interface TestResults {
  timestamp: string;
  openai: TestResult;
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
export async function GET(req: Request) {
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
    openai: { status: 'testing...', details: null, error: null },
    apify: { status: 'testing...', details: null, error: null },
    supabase: { status: 'testing...', details: null, error: null },
    supabaseStorage: { status: 'testing...', details: null, error: null },
    summary: { allOk: false, failedServices: [] }
  };

  // TEST 1: OpenAI
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy_key_for_build") {
      results.openai = {
        status: 'warning',
        details: 'Dummy key detected',
        error: null
      };
    } else {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Respond with: OK' }],
        max_tokens: 10
      });

      results.openai = {
        status: 'ok',
        details: {
          testCompletion: completion.choices[0].message.content
        },
        error: null
      };
    }
  } catch (error: unknown) {
    const err = ensureError(error);
    results.openai = {
      status: 'error',
      details: null,
      error: err.message
    };
    results.summary.failedServices.push('OpenAI');
  }

  // TEST 2: Apify
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

  // TEST 3: Supabase
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, count, error } = await supabase
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

  // TEST 4: Supabase Storage
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
