-- Migration 003: Análise Estratégica Profunda
-- Adiciona coluna JSONB compatível com dados pré-existentes (DEFAULT NULL)

ALTER TABLE spybot_generations
  ADD COLUMN IF NOT EXISTS strategic_analysis JSONB DEFAULT NULL;

-- Index GIN para queries futuras nos campos JSONB
CREATE INDEX IF NOT EXISTS idx_strategic_analysis
  ON spybot_generations USING GIN (strategic_analysis);

COMMENT ON COLUMN spybot_generations.strategic_analysis IS
  'Análise estratégica do anúncio original extraída pelo GPT-4o.
   Campos: hook, promise, emotion, cta, persuasion_structure, angle, offer_type';
