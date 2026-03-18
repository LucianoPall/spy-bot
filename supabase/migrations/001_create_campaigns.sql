-- Create spybot_campaigns table
CREATE TABLE IF NOT EXISTS spybot_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_emoji VARCHAR(10),
  color_hex VARCHAR(7) DEFAULT '#10b981',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_user_campaigns ON spybot_campaigns(user_id);
CREATE INDEX idx_campaign_status ON spybot_campaigns(user_id, status);

-- Create spybot_campaign_clones table
CREATE TABLE IF NOT EXISTS spybot_campaign_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES spybot_campaigns(id) ON DELETE CASCADE,
  clone_id UUID NOT NULL REFERENCES spybot_generations(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  performance_notes TEXT,
  tags TEXT[],
  position INT DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, clone_id)
);

CREATE INDEX idx_campaign_clones ON spybot_campaign_clones(campaign_id);
CREATE INDEX idx_clone_campaigns ON spybot_campaign_clones(clone_id);
CREATE INDEX idx_favorites ON spybot_campaign_clones(campaign_id, is_favorite);

-- Create spybot_campaign_stats table
CREATE TABLE IF NOT EXISTS spybot_campaign_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL UNIQUE REFERENCES spybot_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_clones INT DEFAULT 0,
  favorite_clones INT DEFAULT 0,
  clones_with_high_ctr INT DEFAULT 0,
  avg_ctr DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaign_stats ON spybot_campaign_stats(user_id);

-- Modify spybot_generations table
ALTER TABLE spybot_generations
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES spybot_campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS clone_tags TEXT[];

CREATE INDEX IF NOT EXISTS idx_clone_campaign ON spybot_generations(campaign_id);

-- RLS Policies
ALTER TABLE spybot_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE spybot_campaign_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE spybot_campaign_stats ENABLE ROW LEVEL SECURITY;

-- Policies for spybot_campaigns
CREATE POLICY "Users can view own campaigns"
  ON spybot_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create campaigns"
  ON spybot_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON spybot_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON spybot_campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for spybot_campaign_clones
CREATE POLICY "Users can view campaign clones"
  ON spybot_campaign_clones FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM spybot_campaigns
      WHERE spybot_campaigns.id = spybot_campaign_clones.campaign_id
      AND spybot_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage campaign clones"
  ON spybot_campaign_clones FOR INSERT, UPDATE, DELETE
  USING (
    EXISTS(
      SELECT 1 FROM spybot_campaigns
      WHERE spybot_campaigns.id = spybot_campaign_clones.campaign_id
      AND spybot_campaigns.user_id = auth.uid()
    )
  );

-- Policies for spybot_campaign_stats
CREATE POLICY "Users can view campaign stats"
  ON spybot_campaign_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger function to update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE spybot_campaign_stats
  SET
    total_clones = (
      SELECT COUNT(*) FROM spybot_campaign_clones
      WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
    ),
    favorite_clones = (
      SELECT COUNT(*) FROM spybot_campaign_clones
      WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
      AND is_favorite = TRUE
    ),
    last_updated = NOW()
  WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_campaign_stats_trigger
AFTER INSERT, UPDATE, DELETE ON spybot_campaign_clones
FOR EACH ROW EXECUTE FUNCTION update_campaign_stats();
