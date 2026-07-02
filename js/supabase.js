const SUPABASE_URL = 'https://vsuugdcbfcwjgxqbjusx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2C82UfoK0j4LdSgtNBg5zw_hAzNmtDv';

const supabaseClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

function buildUserProfile(user) {
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const email = user.email || '';
  const baseName = metadata.nome_completo || email.split('@')[0] || 'Usuário';

  return {
    id: user.id,
    email,
    nome_completo: metadata.nome_completo || baseName,
    nome_usuario: metadata.nome_usuario || email.split('@')[0] || 'usuario',
    foto_perfil: metadata.foto_perfil || '',
    bio: metadata.bio || '',
    habilidades: metadata.habilidades || [],
    experiencia: metadata.experiencia || [],
    createdAt: user.created_at || new Date().toISOString()
  };
}

window.SupabaseAuth = {
  client: supabaseClient,
  buildUserProfile,
  async signIn(email, password) {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Cliente do Supabase indisponível.' } };
    }

    return supabaseClient.auth.signInWithPassword({ email, password });
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
  }
};