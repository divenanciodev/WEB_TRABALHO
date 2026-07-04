let user = null;

async function updateDashboardStats() {
    const [projects, events, membersCount] = await Promise.all([
        State.getProjects(),
        State.getEvents(),
        State.getMembersCount()
    ]);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('dash-projects-count', projects.length);
    set('dash-events-count', events.length);
    set('dash-members-count', membersCount);
}

function renderWelcome() {
    const nameEl = document.getElementById('welcome-name');
    if (nameEl) nameEl.textContent = user.nome_completo || user.nome || user.name || 'Usuária';
    if (window.lucide) lucide.createIcons();
}

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

function renderProfileProgress() {
    const campos = [
        !!user.foto_perfil,
        !!(user.habilidades && user.habilidades.length),
        !!(user.experiencia || user.bio),
        !!user.linkedin,
        !!(user.bio && user.bio.length > 20),
    ];
    const pct = Math.round((campos.filter(Boolean).length / campos.length) * 100);
    const pctStr = pct + '%';

    const bar = document.getElementById('progresso-bar');
    const badge = document.getElementById('pct-badge');
    if (bar) bar.style.width = pctStr;
    if (badge) badge.textContent = pctStr;

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

    const miniBar = document.getElementById('mini-bar');
    const miniPct = document.getElementById('dash-profile-pct');
    if (miniBar) miniBar.style.width = pctStr;
    if (miniPct) miniPct.textContent = pctStr;
}

async function renderRecentActivity() {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;

    const posts = (await State.getPosts()).slice(0, 3);

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
            <img src="${p.avatar || 'assets/avatars/avatar.svg'}" alt="${p.author}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" />
            <div style="flex:1">
                <div style="font-weight:500;font-size:14px">${p.author}</div>
                <div style="font-size:12px;color:var(--gray-500)">${p.text?.substring(0, 50)}...</div>
            </div>
            <div style="font-size:12px;color:var(--gray-500)">${p.time || 'Recente'}</div>
        </div>
    `).join('');
}

function setupQuickActions() {
    document.getElementById('new-project-btn')?.addEventListener('click', () => { window.location.href = 'projetos.html'; });
    document.getElementById('new-event-btn')?.addEventListener('click', () => { window.location.href = 'eventos.html'; });
    document.getElementById('community-btn')?.addEventListener('click', () => { window.location.href = 'comunidade.html'; });
}

document.addEventListener('DOMContentLoaded', async () => {
    await State.ensureReady();
    user = State.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    if (typeof Layout !== 'undefined') {
    await Layout.init({ active: 'dashboard' });
    }

    // CORREÇÃO: removida chamada desnecessária a setCurrentUser no carregamento
    // do dashboard, que sobrescrevia foto_perfil e capa_perfil com dados do cache
    // possivelmente incompletos (sem buscar o perfil atualizado do banco).
    renderWelcome();
    dummyStreak();
    await updateDashboardStats();
    renderProfileProgress();
    await renderRecentActivity();
    setupQuickActions();

    if (window.lucide) lucide.createIcons();
});
