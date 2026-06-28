
document.addEventListener('DOMContentLoaded', () => {
    // Render Auth Links
    const authLinks = document.getElementById('auth-links');
    const user = State.getCurrentUser();
    
    if (authLinks) {
        if (user) {
            authLinks.innerHTML = `
                <span style="font-size:14px; color:var(--gray-700)">Olá, ${user.nome_completo.split(' ')[0]}</span>
                <a href="dashboard.html" class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;">Dashboard</a>
                <button onclick="State.logout()" class="btn btn-ghost" style="padding: 8px 16px; font-size: 13px;">Sair</button>
            `;
        } else {
            authLinks.innerHTML = `
                <a href="login.html" class="btn btn-ghost" style="padding: 8px 16px; font-size: 13px;">Entrar</a>
                <a href="cadastro.html" class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;">Cadastrar</a>
            `;
        }
    }

    const heroBtns = document.getElementById('hero-auth-btns');
    if (heroBtns && user) {
        heroBtns.innerHTML = `<a href="dashboard.html" class="btn btn-primary">Ir para o Dashboard</a>`;
    }

    try {
        const projects = State.getProjects().slice(0, 3);
        const events = State.getEvents().slice(0, 3);

        const projectsContainer = document.getElementById('featured-projects');
        if (projectsContainer) {
            projectsContainer.innerHTML = projects.map(p => `
                <div class="card">
                    <h3>${p.titulo}</h3>
                    <p>${p.descricao}</p>
                    <span class="badge">${p.categoria}</span>
                </div>
            `).join('');
        }

        const eventsContainer = document.getElementById('upcoming-events');
        if (eventsContainer) {
            eventsContainer.innerHTML = events.map(e => `
                <div class="card">
                    <h3>${e.titulo}</h3>
                    <p>Data: ${e.data}</p>
                    <p>Local: ${e.local}</p>
                    <span class="badge">${e.categoria}</span>
                </div>
            `).join('');
        }
    } catch (e) {
        console.log("Containers não encontrados na Home, ignorando renderização dinâmica.");
    }
});
