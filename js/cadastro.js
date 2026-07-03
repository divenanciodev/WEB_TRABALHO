document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmar_senha').value;

  if (senha !== confirmarSenha) {
    Layout.showToast('As senhas não coincidem!', 'error');
    return;
  }

  const newUser = {
    nome_completo: document.getElementById('nome_completo').value.trim(),
    nome_usuario: document.getElementById('nome_usuario').value.trim(),
    email: document.getElementById('email').value.trim(),
    foto_perfil: '',
    bio: '',
    habilidades: [],
    experiencia: []
  };

  try {
    const { data, error } = await window.SupabaseAuth.signUp(newUser.email, senha, {
      nome_completo: newUser.nome_completo,
      nome_usuario: newUser.nome_usuario,
      foto_perfil: newUser.foto_perfil,
      bio: newUser.bio,
      habilidades: newUser.habilidades,
      experiencia: newUser.experiencia
    });

    if (error) {
      Layout.showToast(error.message || 'Erro ao cadastrar usuário.', 'error');
      return;
    }

    if (data?.user) {
      await State.setCurrentUser({
        ...newUser,
        id: data.user.id,
        createdAt: data.user.created_at || new Date().toISOString()
      });
    }

    const message = data?.session
      ? 'Sua conta foi criada com sucesso. Você já pode entrar na plataforma.'
      : 'Enviamos um e-mail de confirmação para você. Abra o link para ativar a conta e entrar na plataforma.';

    Layout.showSuccessModal(
      'Conta Criada!',
      message,
      () => { window.location.href = 'login.html'; }
    );
  } catch (err) {
    console.error('Registration error:', err);
    Layout.showToast('Falha ao cadastrar. Verifique sua conexão e tente novamente.', 'error');
  }
});
