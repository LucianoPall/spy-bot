-- ============================================
-- BLOCKED CONTENT AUDIT SCHEMA
-- ============================================
-- Registra tentativas de clonagem bloqueadas pelo filtro de conteúdo
-- (conteúdo adulto, etc). Serve pra auditoria, métricas e tuning de filtros.

-- 1. Criar tabela spybot_blocked_content
CREATE TABLE IF NOT EXISTS public.spybot_blocked_content (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ad_url TEXT,
  layer SMALLINT NOT NULL,              -- 1 = pré-Apify (só URL), 2 = pós-Apify (URL + copy)
  reason TEXT NOT NULL,                 -- 'known_domain' | 'strong_keyword' | 'suspicious_pattern'
  matches TEXT[],                        -- Keywords/domínios que bateram (pra tuning)
  copy_preview TEXT,                    -- Primeiros 200 chars do copy (se disponível)
  trace_id UUID,                        -- Correlation ID do request
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices pra queries de auditoria
CREATE INDEX IF NOT EXISTS idx_blocked_content_user
  ON public.spybot_blocked_content(user_id);

CREATE INDEX IF NOT EXISTS idx_blocked_content_created
  ON public.spybot_blocked_content(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blocked_content_reason
  ON public.spybot_blocked_content(reason);

-- 3. RLS: usuários comuns não leem auditoria; apenas service_role
ALTER TABLE public.spybot_blocked_content ENABLE ROW LEVEL SECURITY;

-- Política: só admin/service_role pode ler (via policies de admin já existentes)
-- Inserts sempre feitos via service_role no backend, não direto do client.
CREATE POLICY "blocked_content_admin_only_select"
  ON public.spybot_blocked_content
  FOR SELECT
  USING (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- Comentários
COMMENT ON TABLE public.spybot_blocked_content IS
  'Auditoria de anúncios bloqueados pelo filtro de conteúdo (adult/NSFW)';
COMMENT ON COLUMN public.spybot_blocked_content.layer IS
  '1 = pré-Apify (bloqueio só por URL), 2 = pós-Apify (bloqueio por copy extraído)';
COMMENT ON COLUMN public.spybot_blocked_content.reason IS
  'known_domain | strong_keyword | suspicious_pattern';
