# Supabase Configuration

## Storage Buckets

### spybot_images

**Purpose:** Store AI-generated images from DALL-E

**Configuration:**
- **Public:** YES (allows getPublicUrl() and public access)
- **RLS:** ENABLED
- **Max Size:** 50MB per file

**File Structure:**
```
spybot_images/
├── {user_id}/
│   ├── 1710787200000-1.png  (image1, timestamp-number.png)
│   ├── 1710787200000-2.png  (image2)
│   └── 1710787200000-3.png  (image3)
```

**Policies:**
1. **INSERT:** `auth.role() = 'authenticated'` (only logged-in users can upload)
2. **SELECT:** `bucket_id = 'spybot_images'` (public read)
3. **DELETE:** `auth.role() = 'authenticated'` (logged-in users delete own files)
4. **UPDATE:** `auth.role() = 'authenticated'` (logged-in users update own files)

**Caching:**
- HTTP Cache-Control: `public, max-age=31536000, immutable` (1 year)
- Recommended CDN cache: 1 year (images are immutable)

**Monitoring:**
- Monitor storage usage: `SELECT SUM(size) FROM storage.objects WHERE bucket_id = 'spybot_images'`
- Monitor failed uploads: Check application logs for `STORAGE_FAIL` events
- Monitor deletion operations: RLS prevents users from deleting others' files

**Troubleshooting:**
- **403 Forbidden:** RLS policy blocked the operation. Verify user is authenticated.
- **404 Not Found:** File doesn't exist or URL is expired (should use getPublicUrl).
- **Upload fails:** Check RLS policies, bucket permissions, user authentication state.

---

## Migration History

### 001_create_campaigns.sql
- Initial schema for spy-bot campaigns
- Tables: spybot_subscriptions, spybot_generations, spybot_billing

### 002_storage_rls_spybot_images.sql
- Create spybot_images bucket
- Configure RLS policies for secure image storage
- Enable public access to generated images
