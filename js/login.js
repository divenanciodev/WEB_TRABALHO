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
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Login error:', error);
    Layout.showToast('Falha ao entrar. Verifique sua conexão e tente novamente.', 'error');
  }
});