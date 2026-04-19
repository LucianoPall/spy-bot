-- ============================================
-- Enable RLS on legacy tables (no policies)
-- ============================================
-- These tables exist in production but are not referenced by src/ code.
-- Enabling RLS without policies blocks all anon/authenticated access while
-- still allowing service_role (used by API routes) to operate normally.
--
-- If a future feature needs client-side access, add a targeted policy in a
-- new migration (e.g. 007_user_credits_self_select.sql).
--
-- Applied in production on 2026-04-19.

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supabase_logs ENABLE ROW LEVEL SECURITY;
