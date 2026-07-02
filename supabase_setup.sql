-- ============================================================
-- SheTech — Configuração da tabela 'users' no Supabase (VERSÃO CORRIGIDA)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Garante que a tabela 'users' exista com os tipos corretos
-- Se a tabela já existir, este comando não fará nada.
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

-- 3. Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ler todos os perfis" ON public.users;
DROP POLICY IF EXISTS "Usuário pode inserir o próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuário pode atualizar o próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Leitura pública de perfis" ON public.users;

-- 4. Política: QUALQUER PESSOA AUTENTICADA pode ler TODOS os perfis
CREATE POLICY "Qualquer usuário autenticado pode ler todos os perfis"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- 5. Política: Usuário autenticado pode inserir o próprio perfil
-- Corrigido: Usando cast (::uuid) para evitar erro de tipo caso a coluna id seja texto
CREATE POLICY "Usuário pode inserir o próprio perfil"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id::uuid);

-- 6. Política: Usuário autenticado pode atualizar o próprio perfil
-- Corrigido: Usando cast (::uuid) para evitar erro de tipo
CREATE POLICY "Usuário pode atualizar o próprio perfil"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id::uuid)
    WITH CHECK (auth.uid() = id::uuid);

-- 7. Gatilho para atualizar o campo 'updatedAt' automaticamente
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
-- DICA DE OURO: Se o erro persistir, significa que sua tabela 
-- 'users' foi criada com o ID como TEXTO em vez de UUID.
-- Você pode tentar rodar este comando extra para converter a coluna:
-- ALTER TABLE public.users ALTER COLUMN id TYPE UUID USING id::uuid;
-- ============================================================
