-- ============================================
-- RATE LIMITING SCHEMA - Execute no Supabase
-- ============================================
-- Este script cria a tabela e políticas de RLS para rate limiting

-- 1. Criar tabela rate_limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, route, window_start)
);

-- 2. Criar índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_route_window
  ON public.rate_limits(user_id, route, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON public.rate_limits(window_start);

-- 3. Habilitar RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 4. Política: Usuários só podem ver seus próprios rate limits
CREATE POLICY "rate_limits_users_can_view_own"
  ON public.rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Política: Sistema (service role) pode inserir/atualizar/deletar
CREATE POLICY "rate_limits_service_role_all"
  ON public.rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Grant permissions
GRANT SELECT ON public.rate_limits TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.rate_limits TO authenticated;
GRANT SELECT ON public.rate_limits TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.rate_limits TO service_role;

-- ============================================
-- LIMPEZA AUTOMÁTICA (Job Scheduler - opcional)
-- ============================================
-- Para manter a tabela limpa, execute periodicamente:
-- DELETE FROM public.rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
-- Você pode usar pg_cron se disponível em seu plano Supabase
