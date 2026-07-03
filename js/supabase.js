const SUPABASE_URL = 'https://gkwlqkfkqlzfwnpvkrsn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ynOV2iudBlbAzL1qVaueRg_0dPZQms-';

const supabaseClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

let cachedProfile = null;
let authReadyResolve;
const authReady = new Promise((resolve) => {
  authReadyResolve = resolve;
});

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

function getCachedProfile() {
  return cachedProfile;
}

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

window.SupabaseAuth = {
  client: supabaseClient,
  ready: authReady,
  init: initAuth,
  buildUserProfile,
  getCachedProfile,
  refreshProfile,
  subscribeToTable,
  async signIn(email, password) {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Cliente do Supabase indisponível.' } };
    }

    const result = await supabaseClient.auth.signInWithPassword({ email, password });
    if (!result.error) await refreshProfile();
    return result;
  },
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
  async signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    cachedProfile = null;
  },
  async upsertProfile(profile) {
    if (!supabaseClient) return { error: { message: 'Cliente indisponível' } };

    const payload = {
      ...profile,
      updatedAt: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('users')
      .upsert(payload, { onConflict: 'id' });

    if (!error) await refreshProfile();
    return { error };
  }
};

if (supabaseClient) {
  initAuth();
}
