document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  try {
    const { data, error } = await window.SupabaseAuth.signIn(email, senha);

    if (error) {
      Layout.showToast(error.message || 'E-mail ou senha incorretos!', 'error');
      return;
    }

    const profile = window.SupabaseAuth.buildUserProfile(data.user);
    State.setCurrentUser(profile);

    // Sincroniza o perfil na tabela 'users' do Supabase para que
    // outros usuários possam visualizá-lo na comunidade.
    if (window.SupabaseAuth && window.SupabaseAuth.client) {
      const profileToSave = {
        id: profile.id,
        email: profile.email,
        nome_completo: profile.nome_completo,
        nome_usuario: profile.nome_usuario,
        foto_perfil: profile.foto_perfil || '',
        bio: profile.bio || '',
        habilidades: profile.habilidades || [],
        experiencia: profile.experiencia || [],
        createdat: profile.createdAt || new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      const { error: upsertError } = await window.SupabaseAuth.client
        .from('users')
        .upsert(profileToSave, { onConflict: 'id' });

      if (upsertError) {
        console.warn('[Login] Não foi possível sincronizar perfil no Supabase:', upsertError.message);
      }
    }

    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('Login error:', err);
    Layout.showToast('Falha ao entrar. Verifique sua conexão e tente novamente.', 'error');
  }
});
