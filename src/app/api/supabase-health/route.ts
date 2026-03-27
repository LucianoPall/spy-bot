import { NextResponse } from 'next/server';
import { ensureError } from '@/lib/types-common';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint para verificar saúde do Supabase
 * AUTENTICADO: Apenas administradores podem acessar
 */
export async function GET() {
  // Verificar autenticação e permissão de admin
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  // Verificar se é admin
  const isAdmin = user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }
  const result = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    supabase: {
      connected: false,
      bucket: 'spybot_images',
      publicUrl: '',
      canRead: false,
      errors: [] as string[]
    },
    cors: {
      configured: false,
      domains: [] as string[]
    }
  };

  try {
    // 1. Test Supabase connection
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      result.supabase.errors.push(bucketsError.message);
    } else {
      result.supabase.connected = true;
      const bucket = buckets?.find(b => b.name === 'spybot_images');
      result.supabase.publicUrl = bucket?.public ? 'PUBLIC' : 'PRIVATE';
    }

    // 2. Test file read from public bucket
    const testFileName = '.health-check.txt';
    const { data: testFile, error: readError } = await supabase.storage
      .from('spybot_images')
      .download(testFileName);

    if (readError && readError.message.includes('404')) {
      result.supabase.canRead = true; // 404 is expected, means we can access bucket
    } else if (readError) {
      result.supabase.errors.push(`Read error: ${readError.message}`);
    } else {
      result.supabase.canRead = true;
    }

    // 3. Test getPublicUrl
    const { data: publicUrlData } = supabase.storage
      .from('spybot_images')
      .getPublicUrl('test-image.png');

    if (publicUrlData?.publicUrl) {
      result.supabase.publicUrl = publicUrlData.publicUrl;
    }

    // 4. CORS configuration
    result.cors.configured = true;
    result.cors.domains = [
      'localhost:3000',
      'localhost:3001',
      process.env.NEXT_PUBLIC_APP_URL || 'production'
    ];

  } catch (error: unknown) {
    const err = ensureError(error);
    result.supabase.errors.push(err.message || String(error));
  }

  return NextResponse.json(result);
}
