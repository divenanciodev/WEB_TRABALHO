const user = Layout.init({ active: 'dashboard' });
if (!user) throw new Error('auth');

/* ── MÉTRICAS ── */
function updateDashboardStats() {
    const projects = State.getProjects();
    const events   = State.getEvents();
    const members  = State.getUsers();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('dash-projects-count', projects.length);
    set('dash-events-count',   events.length);
    set('dash-members-count',  members.length);
}

/* ── BOAS-VINDAS ── */
function renderWelcome() {
    const nameEl   = document.getElementById('welcome-name');
    if (nameEl) nameEl.textContent = user.nome_completo || user.nome || user.name || 'Usuária';

    // Chama lucide.createIcons para garantir que ícones injetados via JS também apareçam
    if (window.lucide) lucide.createIcons();
}

// Removendo streak logic se não houver chip-streak no HTML
function dummyStreak() {
    const streakEl = document.getElementById('chip-streak');
    if (streakEl && user.createdAt) {
        const dias = Math.min(
            Math.floor((Date.now() - new Date(user.createdAt)) / 86400000),
            30
        );
        streakEl.innerHTML = `🔥 ${dias} dia${dias !== 1 ? 's' : ''} seguido${dias !== 1 ? 's' : ''}`;
    }
}

/* ── PROGRESSO DO PERFIL ── */
function renderProfileProgress() {
    const campos = [
        !!user.avatar,
        !!(user.habilidades && user.habilidades.length),
        !!(user.experiencia || user.bio),
        !!user.linkedin,
        !!(user.bio && user.bio.length > 20),
    ];
    const pct = Math.round((campos.filter(Boolean).length / campos.length) * 100);
    const pctStr = pct + '%';

    // Card grande (bottom-grid)
    const bar    = document.getElementById('progresso-bar');
    const badge  = document.getElementById('pct-badge');
    if (bar)   bar.style.width = pctStr;
    if (badge) badge.textContent = pctStr;

    // Checklist dinâmica
    const labels = [
        'Foto de perfil adicionada',
        'Habilidades preenchidas',
        'Experiência adicionada',
        'Link do LinkedIn adicionado',
        'Bio de apresentação escrita',
    ];
    const checklist = document.getElementById('checklist');
    if (checklist) {
        checklist.innerHTML = campos.map((ok, i) => `
            <li class="check-item ${ok ? 'done' : 'pend'}">
                <i class="icon-${ok ? 'check-circle' : 'circle'}"></i>
                ${labels[i]}
            </li>
        `).join('');
    }

    // Mini barra no stat-card
    const miniBar = document.getElementById('mini-bar');
    const miniPct = document.getElementById('dash-profile-pct');
    if (miniBar) miniBar.style.width = pctStr;
    if (miniPct) miniPct.textContent = pctStr;
}

/* ── ATIVIDADES RECENTES ── */
function renderRecentActivity() {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;

    const posts = State.getPosts ? State.getPosts().slice(-3).reverse() : [];

    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="icon-message-square-plus" style="font-size:28px;color:var(--pink);opacity:.6"></i>
                <p>Nenhuma atividade ainda.</p>
                <a href="comunidade.html" class="link">Ir para a comunidade →</a>
            </div>`;
        return;
    }

    container.innerHTML = posts.map(p => `
        <div class="activity-row">
            <img
                src="${p.autor_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.autor_nome)}&background=ff3d8b&color=fff`}"
                class="activity-av"
                alt="${p.autor_nome}"
            >
            <div class="activity-info">
                <p class="activity-text"><strong>${p.autor_nome}</strong> publicou um pensamento</p>
                <p class="activity-preview">${(p.conteudo || '').slice(0, 80)}${p.conteudo && p.conteudo.length > 80 ? '…' : ''}</p>
                <small class="activity-time">${new Date(p.createdAt).toLocaleDateString('pt-BR')}</small>
            </div>
        </div>
    `).join('');
}

/* ── PROJETOS EM DESTAQUE ── */
function renderFeaturedProjects() {
    const container = document.getElementById('featured-projects-list');
    if (!container) return;

    const projects = State.getProjects ? State.getProjects().slice(0, 3) : [];

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="icon-folder-plus" style="font-size:28px;color:var(--pink);opacity:.6"></i>
                <p>Ainda sem projetos criados.</p>
                <a href="projetos.html" class="link">Criar primeiro projeto →</a>
            </div>`;
        return;
    }

    container.innerHTML = projects.map(p => `
        <div class="project-row">
            <div class="project-info">
                <h4 class="project-title">${p.titulo}</h4>
                <span class="tag-pill">${p.categoria || 'Geral'}</span>
            </div>
            <a href="projetos.html" class="icon-btn" style="width:32px;height:32px" title="Ver projeto">
                <i class="icon-chevron-right"></i>
            </a>
        </div>
    `).join('');
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
    renderWelcome();
    updateDashboardStats();
    renderRecentActivity();
    renderFeaturedProjects();
    renderProfileProgress();
});