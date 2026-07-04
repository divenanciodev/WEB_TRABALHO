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

    // CORREÇÃO: após o signIn, o refreshProfile já foi chamado internamente
    // e o cachedProfile já contém os dados do banco (foto_perfil, capa_perfil etc.).
    // NÃO chamamos setCurrentUser aqui para não sobrescrever o banco com dados
    // incompletos vindos apenas do user_metadata do Auth.
    // O perfil em cache já está atualizado pelo refreshProfile dentro de signIn.

    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('Login error:', err);
    Layout.showToast('Falha ao entrar. Verifique sua conexão e tente novamente.', 'error');
  }
});
