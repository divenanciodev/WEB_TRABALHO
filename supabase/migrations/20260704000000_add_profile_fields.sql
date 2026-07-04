-- ============================================================
-- SheTech — Adicionar campos extras ao perfil de usuário
-- Execute no SQL Editor: https://supabase.com/dashboard/project/gkwlqkfkqlzfwnpvkrsn/sql
-- ============================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS formacao        TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS localizacao     TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS interesses      JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS disponivel_para JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tipo_membro     TEXT DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS behance         TEXT DEFAULT '';
