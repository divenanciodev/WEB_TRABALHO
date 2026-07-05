/* Credenciais públicas do projeto Supabase */
const SUPABASE_URL = 'https://gkwlqkfkqlzfwnpvkrsn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ynOV2iudBlbAzL1qVaueRg_0dPZQms-';

/* Inicializa o cliente Supabase com persistência de sessão no navegador */
const supabaseClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/* Cache do perfil autenticado e promise que resolve quando a auth estiver pronta */
let cachedProfile = null;
let authReadyResolve;
const authReady = new Promise((resolve) => {
  authReadyResolve = resolve;
});

/* Monta o objeto de perfil unificando dados do Auth e da tabela users */
function buildUserProfile(user, dbProfile = null) {
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const email = user.email || '';
  const baseName = metadata.nome_completo || email.split('@')[0] || 'Usuário';

  return {
    id: user.id,
    email,
    nome_completo: dbProfile?.nome_completo || metadata.nome_completo || baseName,
    nome_usuario: dbProfile?.nome_usuario || metadata.nome_usuario || email.split('@')[0] || 'usuario',
    foto_perfil: dbProfile?.foto_perfil || metadata.foto_perfil || '',
    bio: dbProfile?.bio || dbProfile?.biografia || metadata.bio || '',
    biografia: dbProfile?.biografia || dbProfile?.bio || metadata.bio || '',
    habilidades: dbProfile?.habilidades || metadata.habilidades || [],
    experiencia: dbProfile?.experiencia || metadata.experiencia || [],
    cargo: dbProfile?.cargo || '',
    area: dbProfile?.area || '',
    linkedin: dbProfile?.linkedin || '',
    github: dbProfile?.github || '',
    portfolio: dbProfile?.portfolio || '',
    instagram: dbProfile?.instagram || '',
    sobre: dbProfile?.sobre || '',
    capa_perfil: dbProfile?.capa_perfil || '',
    createdAt: dbProfile?.createdAt || dbProfile?.created_at || user.created_at || new Date().toISOString()
  };
}

/* Busca o registro completo do usuário na tabela users pelo ID */
async function fetchDbProfile(userId) {
  if (!supabaseClient || !userId) return null;

  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Supabase] Erro ao buscar perfil:', error.message);
    return null;
  }

  return data;
}

/* Atualiza o cache local com os dados mais recentes da sessão e do banco */
async function refreshProfile() {
  if (!supabaseClient) {
    cachedProfile = null;
    return null;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session?.user) {
    cachedProfile = null;
    return null;
  }

  const dbProfile = await fetchDbProfile(session.user.id);
  cachedProfile = buildUserProfile(session.user, dbProfile);
  return cachedProfile;
}

/* Inicializa a autenticação: carrega perfil e escuta mudanças de sessão */
async function initAuth() {
  if (!supabaseClient) {
    authReadyResolve();
    return null;
  }

  await refreshProfile();

  supabaseClient.auth.onAuthStateChange(async () => {
    await refreshProfile();
    window.dispatchEvent(new CustomEvent('shetech:auth-changed', { detail: cachedProfile }));
  });

  authReadyResolve();
  return cachedProfile;
}

/* Retorna o perfil em cache sem acesso ao banco */
function getCachedProfile() {
  return cachedProfile;
}

/* Assina mudanças em tempo real de uma tabela via Supabase Realtime */
function subscribeToTable(table, callback, filter = '*') {
  if (!supabaseClient) return () => {};

  const channel = supabaseClient
    .channel(`realtime:${table}:${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, callback)
    .subscribe();

  return () => {
    supabaseClient.removeChannel(channel);
  };
}

/* Comprime imagem Base64 antes de salvar no banco para evitar payload grande */
async function compressImageBase64(base64String, maxWidth = 800, quality = 0.75) {
  if (!base64String || !base64String.startsWith('data:image')) return base64String;

  if (base64String.length < 400 * 1024) return base64String;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64String);
    img.src = base64String;
  });
}

/* API pública exposta globalmente para autenticação e operações de perfil */
window.SupabaseAuth = {
  client: supabaseClient,
  ready: authReady,
  init: initAuth,
  buildUserProfile,
  getCachedProfile,
  refreshProfile,
  subscribeToTable,

  /* Autentica o usuário com email e senha */
  async signIn(email, password) {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Cliente do Supabase indisponível.' } };
    }

    const result = await supabaseClient.auth.signInWithPassword({ email, password });
    if (!result.error) await refreshProfile();
    return result;
  },

  /* Cria nova conta no Supabase Auth com metadados de perfil */
  async signUp(email, password, metadata = {}) {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Cliente do Supabase indisponível.' } };
    }

    const redirectTo = `${window.location.origin}/login.html`;

    return supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: metadata
      }
    });
  },

  /* Encerra a sessão e limpa o cache */
  async signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    cachedProfile = null;
  },

  /* Salva ou atualiza o perfil na tabela users, comprimindo imagens antes */
  async upsertProfile(profile) {
    if (!supabaseClient) return { error: { message: 'Cliente indisponível' } };

    const fotoComprimida = await compressImageBase64(profile.foto_perfil || '');
    const capaComprimida = await compressImageBase64(profile.capa_perfil || '');

    const payload = {
      ...profile,
      foto_perfil: fotoComprimida,
      capa_perfil: capaComprimida,
      updatedAt: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('users')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Erro no upsert do perfil:', error);
    } else {
      await refreshProfile();
    }

    return { error };
  }
};

/* Inicia autenticação automaticamente ao carregar o script */
if (supabaseClient) {
  initAuth();
}
