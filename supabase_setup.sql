-- ============================================================
-- SheTech — Configuração da tabela 'users' no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Cria a tabela 'users' caso ainda não exista
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    nome_completo  TEXT DEFAULT '',
    nome_usuario   TEXT DEFAULT '',
    foto_perfil    TEXT DEFAULT '',
    bio            TEXT DEFAULT '',
    habilidades    JSONB DEFAULT '[]'::jsonb,
    experiencia    JSONB DEFAULT '[]'::jsonb,
    cargo          TEXT DEFAULT '',
    area           TEXT DEFAULT '',
    linkedin       TEXT DEFAULT '',
    github         TEXT DEFAULT '',
    portfolio      TEXT DEFAULT '',
    instagram      TEXT DEFAULT '',
    biografia      TEXT DEFAULT '',
    sobre          TEXT DEFAULT '',
    capa_perfil    TEXT DEFAULT '',
    data_cadastro  TEXT DEFAULT '',
    "createdAt"    TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilita Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Remove políticas antigas (caso existam) para evitar conflitos
DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ler todos os perfis" ON public.users;
DROP POLICY IF EXISTS "Usuário pode inserir o próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuário pode atualizar o próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Leitura pública de perfis" ON public.users;

-- 4. Política: QUALQUER PESSOA AUTENTICADA pode ler TODOS os perfis
--    (necessário para que membros apareçam na aba Comunidade)
CREATE POLICY "Qualquer usuário autenticado pode ler todos os perfis"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- 5. Política: Usuário autenticado pode inserir o próprio perfil
CREATE POLICY "Usuário pode inserir o próprio perfil"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 6. Política: Usuário autenticado pode atualizar o próprio perfil
CREATE POLICY "Usuário pode atualizar o próprio perfil"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 7. (Opcional) Garante que o campo 'updatedAt' seja atualizado automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- IMPORTANTE: Verifique também nas configurações do Supabase:
--   Authentication > Settings > "Confirm email"
--   Se estiver ATIVADO, o usuário precisa confirmar o e-mail
--   antes de conseguir fazer login. Para testes, você pode
--   DESATIVAR temporariamente essa opção.
-- ============================================================
