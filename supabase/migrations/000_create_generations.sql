-- Create spybot_generations table (Clones de Anúncios)
CREATE TABLE IF NOT EXISTS spybot_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Original ad data
  original_url VARCHAR(2048),
  original_copy TEXT,
  original_image VARCHAR(2048),

  -- Generated variations (3 copies)
  variante1 TEXT,
  variante2 TEXT,
  variante3 TEXT,

  -- Generated images (3 images)
  image1 VARCHAR(2048),
  image2 VARCHAR(2048),
  image3 VARCHAR(2048),

  -- Niche detection
  niche VARCHAR(50) DEFAULT 'geral',

  -- Strategic analysis (JSONB)
  strategic_analysis JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Soft delete support
  deleted_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_user_generations ON spybot_generations(user_id);
CREATE INDEX idx_generation_niche ON spybot_generations(niche);
CREATE INDEX idx_generation_created ON spybot_generations(user_id, created_at DESC);
CREATE INDEX idx_generation_deleted ON spybot_generations(deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE spybot_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view only their own generations
CREATE POLICY "Users can view own generations"
  ON spybot_generations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create generations
CREATE POLICY "Users can create generations"
  ON spybot_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own generations
CREATE POLICY "Users can update own generations"
  ON spybot_generations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own generations
CREATE POLICY "Users can delete own generations"
  ON spybot_generations FOR DELETE
  USING (auth.uid() = user_id);
