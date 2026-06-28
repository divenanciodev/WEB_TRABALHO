document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (document.getElementById('senha').value !== document.getElementById('confirmar_senha').value) {
        alert('As senhas não coincidem!');
        return;
      }
      const newUser = {
        nome_completo: document.getElementById('nome_completo').value,
        nome_usuario: document.getElementById('nome_usuario').value,
        email: document.getElementById('email').value,
        data_cadastro: new Date().toISOString()
      };
      const users = State.getUsers();
      if (users.find(u => u.email === newUser.email || u.nome_usuario === newUser.nome_usuario)) {
        alert('E-mail ou nome de usuário já cadastrado!');
        return;
      }
      users.push(newUser);
      State.setUsers(users);
      alert('Cadastro realizado com sucesso!');
      window.location.href = 'login.html';
    });