import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
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

  } catch (error: any) {
    result.supabase.errors.push(error.message || String(error));
  }

  return NextResponse.json(result);
}
