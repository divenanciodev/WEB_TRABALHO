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

    await window.renderFeaturedProjects();
    await window.renderUpcomingEvents();
    await window.renderCreatorStats();

    if (window.lucide) lucide.createIcons();
});

window.renderFeaturedProjects = async function() {
    const container = document.getElementById('featured-projects-list');
    if (!container) return;
    const allProjects = await State.getProjects();
    const currentUser = window.State?.getCurrentUser();
    
    // Sort by createdAt desc, take top 3
    const projects = allProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
    
    if (projects.length === 0) {
        container.innerHTML = `<p style="color:var(--gray-500);text-align:center;padding:20px">Nenhum projeto encontrado.</p>`;
        return;
    }

    container.innerHTML = projects.map(p => {
        let btnHtml = '';
        if (currentUser && p.author_id !== currentUser.id) {
            const isSubscribed = Array.isArray(p.membros) && p.membros.includes(currentUser.id);
            const btnClass = isSubscribed ? 'card-link-btn card-link-btn--subscribed' : 'card-link-btn';
            const icon = isSubscribed ? 'check' : 'user-plus';
            const text = isSubscribed ? 'Inscrito' : 'Se inscrever';
            btnHtml = `<button class="${btnClass}" onclick="event.stopPropagation(); window.toggleProjectSubscription('${p.id}')"><i class="icon-${icon}"></i> ${text}</button>`;
        }
        return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid var(--gray-200); border-radius:8px; background:#fff;">
            <div>
                <h4 style="margin:0; font-size:14px; color:var(--gray-800)">${p.titulo}</h4>
                <p style="margin:4px 0 0; font-size:12px; color:var(--gray-500)">${p.categoria || 'Sem Categoria'} • ${p.status || 'Novo'}</p>
            </div>
            ${btnHtml}
        </div>`;
    }).join('');
};

window.renderUpcomingEvents = async function() {
    const container = document.getElementById('upcoming-events-list');
    if (!container) return;
    const allEvents = await State.getEvents();
    const currentUser = window.State?.getCurrentUser();
    
    const events = allEvents.sort((a, b) => (a.data || '').localeCompare(b.data || '')).slice(0, 3);
    
    if (events.length === 0) {
        container.innerHTML = `<p style="color:var(--gray-500);text-align:center;padding:20px">Nenhum evento encontrado.</p>`;
        return;
    }

    container.innerHTML = events.map(ev => {
        let btnHtml = '';
        if (currentUser && ev.author_id !== currentUser.id) {
            const isSubscribed = Array.isArray(ev.membros) && ev.membros.includes(currentUser.id);
            const btnClass = isSubscribed ? 'card-link-btn card-link-btn--subscribed' : 'card-link-btn';
            const icon = isSubscribed ? 'check' : 'user-plus';
            const text = isSubscribed ? 'Inscrito' : 'Se inscrever';
            btnHtml = `<button class="${btnClass}" onclick="event.stopPropagation(); window.toggleEventSubscription('${ev.id}')"><i class="icon-${icon}"></i> ${text}</button>`;
        }
        return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid var(--gray-200); border-radius:8px; background:#fff;">
            <div>
                <h4 style="margin:0; font-size:14px; color:var(--gray-800)">${ev.titulo}</h4>
                <p style="margin:4px 0 0; font-size:12px; color:var(--gray-500)">${ev.data || 'Em breve'}</p>
            </div>
            ${btnHtml}
        </div>`;
    }).join('');
};

window.renderCreatorStats = async function() {
    const container = document.getElementById('creator-stats-container');
    if (!container) return;
    const currentUser = window.State?.getCurrentUser();
    if (!currentUser) return;

    const [projects, events] = await Promise.all([
        State.getProjects(),
        State.getEvents()
    ]);

    const myProjects = projects.filter(p => p.author_id === currentUser.id).length;
    const joinedProjects = projects.filter(p => Array.isArray(p.membros) && p.membros.includes(currentUser.id)).length;
    const myEvents = events.filter(e => e.author_id === currentUser.id).length;
    const joinedEvents = events.filter(e => Array.isArray(e.membros) && e.membros.includes(currentUser.id)).length;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div style="padding:16px; border:1px solid var(--gray-200); border-radius:8px; text-align:center;">
                <h4 style="margin:0; font-size:24px; color:var(--primary);">${myProjects + joinedProjects}</h4>
                <p style="margin:4px 0 0; font-size:12px; color:var(--gray-500)">Projetos Envolvidos</p>
            </div>
            <div style="padding:16px; border:1px solid var(--gray-200); border-radius:8px; text-align:center;">
                <h4 style="margin:0; font-size:24px; color:var(--primary);">${myEvents + joinedEvents}</h4>
                <p style="margin:4px 0 0; font-size:12px; color:var(--gray-500)">Eventos Participados</p>
            </div>
            <div style="padding:16px; border:1px solid var(--gray-200); border-radius:8px; text-align:center;">
                <h4 style="margin:0; font-size:24px; color:var(--primary);">${myProjects}</h4>
                <p style="margin:4px 0 0; font-size:12px; color:var(--gray-500)">Projetos Criados</p>
            </div>
            <div style="padding:16px; border:1px solid var(--gray-200); border-radius:8px; text-align:center;">
                <h4 style="margin:0; font-size:24px; color:var(--primary);">${myEvents}</h4>
                <p style="margin:4px 0 0; font-size:12px; color:var(--gray-500)">Eventos Criados</p>
            </div>
        </div>
    `;
};
