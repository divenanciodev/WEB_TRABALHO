-- USUÁRIOS / PERFIS
CREATE TABLE IF NOT EXISTS public.users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT UNIQUE NOT NULL,
    nome_completo   TEXT DEFAULT '',
    nome_usuario    TEXT DEFAULT '',
    foto_perfil     TEXT DEFAULT '',
    bio             TEXT DEFAULT '',
    biografia       TEXT DEFAULT '',
    habilidades     JSONB DEFAULT '[]'::jsonb,
    experiencia     JSONB DEFAULT '[]'::jsonb,
    cargo           TEXT DEFAULT '',
    area            TEXT DEFAULT '',
    linkedin        TEXT DEFAULT '',
    github          TEXT DEFAULT '',
    portfolio       TEXT DEFAULT '',
    instagram       TEXT DEFAULT '',
    sobre           TEXT DEFAULT '',
    capa_perfil     TEXT DEFAULT '',
    data_cadastro   TEXT DEFAULT '',
    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- PROJETOS
CREATE TABLE IF NOT EXISTS public.shetech_projetos (
    id              TEXT PRIMARY KEY,
    titulo          TEXT,
    categoria       TEXT,
    status          TEXT,
    progresso       INTEGER DEFAULT 0,
    repo            TEXT,
    demo            TEXT,
    descricao       TEXT,
    tecnologias     JSONB DEFAULT '[]'::jsonb,
    membros         JSONB DEFAULT '[]'::jsonb,
    criador_id      TEXT,
    proprietaria_id TEXT,
    author_id       UUID REFERENCES auth.users(id),
    author_email    TEXT,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTOS
CREATE TABLE IF NOT EXISTS public.shetech_eventos (
    id              TEXT PRIMARY KEY,
    titulo          TEXT,
    tipo            TEXT,
    link            TEXT,
    endereco        TEXT,
    data            TEXT,
    horario         TEXT,
    categoria       TEXT,
    descricao       TEXT,
    imagemLocal     TEXT,
    membros         JSONB DEFAULT '[]'::jsonb,
    criador_id      TEXT,
    organizador_id  TEXT,
    author_id       UUID REFERENCES auth.users(id),
    author_email    TEXT,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- FEED DA COMUNIDADE
CREATE TABLE IF NOT EXISTS public.posts (
    id              BIGINT PRIMARY KEY,
    author          TEXT,
    role            TEXT,
    avatar          TEXT,
    time            TEXT,
    text            TEXT,
    tags            JSONB DEFAULT '[]'::jsonb,
    likes           INTEGER DEFAULT 0,
    comments        INTEGER DEFAULT 0,
    liked           BOOLEAN DEFAULT false,
    image           TEXT,
    link            JSONB,
    author_id       UUID REFERENCES auth.users(id),
    author_email    TEXT,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- LINKS COMPARTILHADOS NA COMUNIDADE
CREATE TABLE IF NOT EXISTS public.community_links (
    id              BIGINT PRIMARY KEY,
    title           TEXT,
    url             TEXT,
    descricao       TEXT,
    category        TEXT DEFAULT 'Geral',
    destaque        BOOLEAN DEFAULT false,
    author_id       UUID REFERENCES auth.users(id),
    author_email    TEXT,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- LINKS PESSOAIS
CREATE TABLE IF NOT EXISTS public.links (
    id              BIGINT PRIMARY KEY,
    titulo          TEXT,
    url             TEXT,
    descricao       TEXT,
    categoria       TEXT,
    "folderId"      BIGINT,
    proprietaria_id TEXT,
    favorito        BOOLEAN DEFAULT false,
    author_id       UUID REFERENCES auth.users(id),
    author_email    TEXT,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- PASTAS PESSOAIS
CREATE TABLE IF NOT EXISTS public.folders (
    id              BIGINT PRIMARY KEY,
    nome            TEXT,
    proprietaria_id TEXT,
    author_id       UUID REFERENCES auth.users(id),
    "createdAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
    id              BIGINT PRIMARY KEY,
    destinataria_id TEXT,
    mensagem        TEXT,
    lida            BOOLEAN DEFAULT false,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- COMENTÁRIOS NAS POSTAGENS
CREATE TABLE IF NOT EXISTS public.comments (
    id              BIGINT PRIMARY KEY,
    post_id         BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    author          TEXT,
    author_id       UUID REFERENCES public.users(id),
    author_email    TEXT,
    avatar          TEXT,
    text            TEXT,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGER updatedAt
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users', 'shetech_projetos', 'shetech_eventos', 'posts', 'community_links', 'links', 'comments']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I', t, t);
        EXECUTE format(
            'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
            t, t
        );
    END LOOP;
END $$;

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shetech_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shetech_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('users', 'shetech_projetos', 'shetech_eventos', 'posts', 'community_links', 'links', 'folders', 'notifications', 'comments')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- LEITURA PÚBLICA (anon + authenticated)
CREATE POLICY "public_read_users" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_projetos" ON public.shetech_projetos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_eventos" ON public.shetech_eventos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_posts" ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_community_links" ON public.community_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_comments" ON public.comments FOR SELECT TO anon, authenticated USING (true);

-- ESCRITA AUTENTICADA
CREATE POLICY "auth_insert_users" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "auth_update_users" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "auth_write_projetos" ON public.shetech_projetos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write_eventos" ON public.shetech_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write_posts" ON public.posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write_community_links" ON public.community_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write_comments" ON public.comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Links e pastas pessoais
CREATE POLICY "auth_read_own_links" ON public.links FOR SELECT TO authenticated USING (proprietaria_id = auth.jwt() ->> 'email' OR true);
CREATE POLICY "auth_write_own_links" ON public.links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write_folders" ON public.folders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_read_folders" ON public.folders FOR SELECT TO authenticated USING (true);

-- Notificações privadas
CREATE POLICY "auth_read_notifications" ON public.notifications FOR SELECT TO authenticated USING (destinataria_id = auth.jwt() ->> 'email');
CREATE POLICY "auth_write_notifications" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- REALTIME (Lógica segura para evitar erros de duplicidade)
DO $$
BEGIN
    -- Tenta adicionar as tabelas à publicação se elas ainda não estiverem lá
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shetech_projetos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.shetech_projetos;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shetech_eventos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.shetech_eventos;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'posts') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'community_links') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.community_links;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'comments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    END IF;
EXCEPTION
    WHEN others THEN
        -- Ignora erros se a publicação não existir ou outros problemas menores
        NULL;
END $$;

-- Perfil automático ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, nome_completo, nome_usuario, "createdAt")
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'nome_usuario', split_part(NEW.email, '@', 1)),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
