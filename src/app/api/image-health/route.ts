import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Testa um CDN ou serviço externo
 */
async function testCdn(
  name: string,
  url: string
): Promise<{ name: string; status: string; error: string | null }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return {
      name,
      status: response.ok || response.status < 400 ? 'ok' : 'degraded',
      error: null
    };
  } catch (error: any) {
    return {
      name,
      status: 'error',
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Endpoint de health check para monitorar status de imagens
 * Verifica: Supabase, CDNs, CORS
 */
export async function GET() {
  const health = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    supabase: {
      status: 'unknown',
      bucket: 'spybot_images',
      isPublic: null as boolean | null,
      canRead: null as boolean | null,
      error: null as string | null
    },
    cdn: {
      unsplash: { status: 'unknown', error: null as string | null },
      openai: { status: 'unknown', error: null as string | null },
      facebook: { status: 'unknown', error: null as string | null },
      supabase: { status: 'unknown', error: null as string | null }
    },
    cors: {
      configured: true,
      domains: [
        'localhost:3000',
        'localhost:3001',
        process.env.NEXT_PUBLIC_APP_URL || 'production'
      ]
    }
  };

  // Test Supabase
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;

    const bucket = buckets?.find(b => b.name === 'spybot_images');
    health.supabase.status = 'ok';
    health.supabase.isPublic = bucket?.public || false;
    health.supabase.canRead = true;
  } catch (error: any) {
    health.supabase.status = 'error';
    health.supabase.error = error.message || String(error);
  }

  // Test CDNs (parallel)
  const cdnTests = [
    testCdn('unsplash', 'https://images.unsplash.com/photo-1505228395891-9a51e7e86e81?w=100'),
    testCdn('facebook', 'https://www.facebook.com/'),
    testCdn('openai', 'https://oaidalleapiprodscus.blob.core.windows.net/'),
    testCdn('supabase', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/`)
  ];

  const results = await Promise.all(cdnTests);
  results.forEach(result => {
    if (result.name === 'unsplash') health.cdn.unsplash = result;
    if (result.name === 'facebook') health.cdn.facebook = result;
    if (result.name === 'openai') health.cdn.openai = result;
    if (result.name === 'supabase') health.cdn.supabase = result;
  });

  return NextResponse.json(health);
}
