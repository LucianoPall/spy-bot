-- Create bucket for spy bot generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('spybot_images', 'spybot_images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (should already be enabled globally, but ensure it)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to upload images to spybot_images
CREATE POLICY "Allow authenticated users to upload to spybot_images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'spybot_images'
    AND auth.role() = 'authenticated'
)
ON CONFLICT DO NOTHING;

-- Policy 2: Allow public read access to spybot_images
CREATE POLICY "Allow public read access to spybot_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'spybot_images');

-- Policy 3: Allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated users to delete own images in spybot_images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'spybot_images'
    AND auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to update their own images
CREATE POLICY "Allow authenticated users to update own images in spybot_images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'spybot_images'
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'spybot_images'
    AND auth.role() = 'authenticated'
);
