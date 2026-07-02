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
-- 8. Tabelas Adicionais para Sincronização Global
-- ============================================================

-- PROJETOS
CREATE TABLE IF NOT EXISTS public.shetech_projetos (
    id TEXT PRIMARY KEY,
    titulo TEXT,
    categoria TEXT,
    status TEXT,
    progresso INTEGER,
    repo TEXT,
    demo TEXT,
    descricao TEXT,
    tecnologias JSONB,
    criador_id TEXT,
    proprietaria_id TEXT,
    author_id UUID REFERENCES auth.users(id),
    author_email TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTOS
CREATE TABLE IF NOT EXISTS public.shetech_eventos (
    id TEXT PRIMARY KEY,
    titulo TEXT,
    tipo TEXT,
    link TEXT,
    endereco TEXT,
    data TEXT,
    horario TEXT,
    categoria TEXT,
    descricao TEXT,
    criador_id TEXT,
    organizador_id TEXT,
    author_id UUID REFERENCES auth.users(id),
    author_email TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- LINKS
CREATE TABLE IF NOT EXISTS public.links (
    id BIGINT PRIMARY KEY,
    titulo TEXT,
    url TEXT,
    descricao TEXT,
    categoria TEXT,
    "folderId" BIGINT,
    proprietaria_id TEXT,
    favorito BOOLEAN DEFAULT false,
    author_id UUID REFERENCES auth.users(id),
    author_email TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- PASTAS (FOLDERS)
CREATE TABLE IF NOT EXISTS public.folders (
    id BIGINT PRIMARY KEY,
    nome TEXT,
    proprietaria_id TEXT,
    author_id UUID REFERENCES auth.users(id),
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Habilitar RLS para todas as tabelas
ALTER TABLE public.shetech_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shetech_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- 10. Políticas de Leitura (Qualquer usuário autenticado pode ver tudo)
DROP POLICY IF EXISTS "Leitura global de projetos" ON public.shetech_projetos;
DROP POLICY IF EXISTS "Leitura global de eventos" ON public.shetech_eventos;
DROP POLICY IF EXISTS "Leitura global de links" ON public.links;
DROP POLICY IF EXISTS "Leitura global de pastas" ON public.folders;
CREATE POLICY "Leitura global de projetos" ON public.shetech_projetos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura global de eventos" ON public.shetech_eventos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura global de links" ON public.links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura global de pastas" ON public.folders FOR SELECT TO authenticated USING (true);

-- 11. Políticas de Escrita (Qualquer usuário autenticado pode criar/editar)
DROP POLICY IF EXISTS "Escrita global de projetos" ON public.shetech_projetos;
DROP POLICY IF EXISTS "Escrita global de eventos" ON public.shetech_eventos;
DROP POLICY IF EXISTS "Escrita global de links" ON public.links;
DROP POLICY IF EXISTS "Escrita global de pastas" ON public.folders;
CREATE POLICY "Escrita global de projetos" ON public.shetech_projetos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Escrita global de eventos" ON public.shetech_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Escrita global de links" ON public.links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Escrita global de pastas" ON public.folders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DICA: Se a coluna id da tabela users for texto, rode:
-- ALTER TABLE public.users ALTER COLUMN id TYPE UUID USING id::uuid;
