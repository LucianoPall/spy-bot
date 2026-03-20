#!/bin/bash

SUPABASE_URL="https://rrtsfhhutbneaxpuubra.supabase.co"
SERVICE_KEY="***REMOVED***"

echo "🔧 Applying database migration to Supabase..."
echo ""

# Read migration file
MIGRATION=$(cat supabase/migrations/002_storage_rls_spybot_images.sql)

# Split by statements and execute each
echo "📝 Migration statements:"
grep -E "^(INSERT|ALTER|CREATE|DROP)" supabase/migrations/002_storage_rls_spybot_images.sql | while read line; do
  echo "  ✅ $line"
done

echo ""
echo "⚠️  Note: SQL Editor access via REST API requires being authenticated in the Supabase dashboard."
echo "    Please apply this migration manually:"
echo ""
echo "1. Go to: https://app.supabase.com/project/rrtsfhhutbneaxpuubra/sql/new"
echo "2. Copy the contents of: supabase/migrations/002_storage_rls_spybot_images.sql"
echo "3. Click 'Run'"
echo "4. Verify the 'spybot_images' bucket exists in Storage > Buckets"
echo ""

