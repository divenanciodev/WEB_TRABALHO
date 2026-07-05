
document.addEventListener('DOMContentLoaded', () => {
    // Render Auth Links
    const authLinks = document.getElementById('auth-links');
    const user = State.getCurrentUser();
    
    if (authLinks) {
        if (user) {
            const avatarUrl = user.foto_perfil || `assets/avatars/avatar.svg`;
            authLinks.innerHTML = `
                <div class="user-dropdown" id="user-dropdown">
                    <button class="dropdown-trigger" id="dropdown-trigger">
                        <img src="${avatarUrl}" alt="Foto de Perfil" class="dropdown-avatar">
                        <span class="dropdown-username">Olá, ${user.nome_completo.split(' ')[0]}</span>
                        <i class="icon-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu" id="dropdown-menu">
                        <a href="dashboard.html" class="dropdown-item">
                            <i class="icon-layout-dashboard"></i> Dashboard
                        </a>
                        <a href="https://discord.gg/hkc34REy9" target="_blank" class="dropdown-item">
                            <i class="icon-message-square"></i> Discord
                        </a>
                        <div class="dropdown-divider"></div>
                        <button onclick="State.logout()" class="dropdown-item logout-btn">
                            <i class="icon-log-out"></i> Sair
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

    // Sincroniza os contadores da seção de stats com dados reais do banco
    syncLandingStats();
});

/* ── Animação de contagem crescente ──────────────────────────── */
function animateCount(el, target) {
    if (!el) return;
    const duration = 1400;
    const start = performance.now();
    const from = 0;

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        // Easing out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + (target - from) * eased);
        el.textContent = current.toLocaleString('pt-BR') + (progress < 1 ? '' : '+');
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

async function syncLandingStats() {
    const elMembers  = document.getElementById('stat-members');
    const elProjects = document.getElementById('stat-projects');
    const elIdeas    = document.getElementById('stat-events');

    // Enquanto carrega, mantém os valores atuais
    try {
        await State.ensureReady();

        const [membersCount, projects, posts] = await Promise.all([
            State.getMembersCount(),
            State.getProjects(),
            State.getPosts()
        ]);

        const members  = membersCount  || 0;
        const projCount = (projects || []).length;
        const ideasCount = (posts   || []).length;

        animateCount(elMembers,  members);
        animateCount(elProjects, projCount);
        animateCount(elIdeas,    ideasCount);

    } catch (err) {
        console.warn('[SheTech] Erro ao sincronizar stats da landing:', err);
        // Mantém os valores hardcoded como fallback visual
    }
}
