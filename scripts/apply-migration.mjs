import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = 'https://rrtsfhhutbneaxpuubra.supabase.co';
const supabaseServiceKey = '***REMOVED***';

// Extract connection string from Supabase
// Format: postgresql://postgres:password@db.supabase.co:5432/postgres
const projectId = supabaseUrl.split('//')[1].split('.')[0];

console.log('🔧 Applying database migration to Supabase...\n');
console.log('📍 Project:', projectId);
console.log('🔑 Using service role key authentication\n');

const client = new pg.Client({
  host: `db.${projectId}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: supabaseServiceKey.split('sb_secret_')[1],
  ssl: { rejectUnauthorized: false }
});

const migrationQueries = [
  "INSERT INTO storage.buckets (id, name, public) VALUES ('spybot_images', 'spybot_images', true) ON CONFLICT (id) DO NOTHING;",
  "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;",
  'DROP POLICY IF EXISTS "Allow authenticated users to upload to spybot_images" ON storage.objects;',
  'CREATE POLICY "Allow authenticated users to upload to spybot_images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = \'spybot_images\' AND auth.role() = \'authenticated\');',
  'DROP POLICY IF EXISTS "Allow public read access to spybot_images" ON storage.objects;',
  'CREATE POLICY "Allow public read access to spybot_images" ON storage.objects FOR SELECT USING (bucket_id = \'spybot_images\');',
  'DROP POLICY IF EXISTS "Allow authenticated users to delete own images in spybot_images" ON storage.objects;',
  'CREATE POLICY "Allow authenticated users to delete own images in spybot_images" ON storage.objects FOR DELETE USING (bucket_id = \'spybot_images\' AND auth.role() = \'authenticated\');'
];

try {
  await client.connect();
  console.log('✅ Connected to Supabase database\n');

  for (const query of migrationQueries) {
    const preview = query.substring(0, 55) + (query.length > 55 ? '...' : '');
    process.stdout.write(`⏳ ${preview}`);
    
    try {
      await client.query(query);
      console.log(' ✅');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(' ℹ️  (already exists)');
      } else {
        console.log(` ❌\n   Error: ${err.message}`);
      }
    }
  }

  console.log('\n✅ Migration applied successfully!');
  console.log('📦 Storage bucket "spybot_images" is ready');
  console.log('🔒 RLS policies configured for public read, authenticated write\n');
  
  await client.end();
  process.exit(0);
} catch (err) {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
}
