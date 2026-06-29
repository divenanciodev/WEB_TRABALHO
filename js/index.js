
document.addEventListener('DOMContentLoaded', () => {
    // Render Auth Links
    const authLinks = document.getElementById('auth-links');
    const user = State.getCurrentUser();
    
    if (authLinks) {
        if (user) {
            const avatarUrl = user.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome_completo)}&background=ff3d8b&color=fff`;
            authLinks.innerHTML = `
                <div class="user-dropdown" id="user-dropdown">
                    <button class="dropdown-trigger" id="dropdown-trigger">
                        <img src="${avatarUrl}" alt="Foto de Perfil" class="dropdown-avatar">
                        <span class="dropdown-username">Olá, ${user.nome_completo.split(' ')[0]}</span>
                        <i class="lucide-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu" id="dropdown-menu">
                        <a href="dashboard.html" class="dropdown-item">
                            <i class="lucide-layout-dashboard"></i> Dashboard
                        </a>
                        <a href="https://discord.gg/hkc34REy9" target="_blank" class="dropdown-item">
                            <i class="lucide-message-square"></i> Discord
                        </a>
                        <div class="dropdown-divider"></div>
                        <button onclick="State.logout()" class="dropdown-item logout-btn">
                            <i class="lucide-log-out"></i> Sair
                        </button>
                    </div>
                </div>
            `;

            // Toggle dropdown behavior
            const dropdown = document.getElementById('user-dropdown');
            const trigger = document.getElementById('dropdown-trigger');

            if (dropdown && trigger) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('active');
                });

                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target)) {
                        dropdown.classList.remove('active');
                    }
                });
            }
        } else {
            authLinks.innerHTML = `
                <a href="login.html" class="btn btn-outline" style="padding: 8px 16px; font-size: 13px;">Entrar</a>
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
