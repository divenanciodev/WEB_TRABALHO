document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const user = State.getUsers().find(u => u.email === email);
      if (user) {
        State.setCurrentUser(user);
        window.location.href = 'dashboard.html';
      } else {
        alert('Usuário não encontrado ou senha incorreta!');
      }
    });