-- Create scraping_jobs table for managing queued ad URLs
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'error')),
  result jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Index for efficient querying of pending jobs
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status, created_at);

-- Enable RLS
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role (internal API) can access
CREATE POLICY "Service role only" ON scraping_jobs
  USING (false) -- Block all SELECT by default
  WITH CHECK (false); -- Block all INSERT/UPDATE by default
