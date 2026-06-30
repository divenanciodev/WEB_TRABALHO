document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const user = State.getUsers().find(u => u.email === email);
  
  if (user && user.senha === senha) {
    State.setCurrentUser(user);
    window.location.href = 'dashboard.html';
  } else {
    alert('E-mail ou senha incorretos!');
  }
});