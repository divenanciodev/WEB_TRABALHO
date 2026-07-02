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
                src="${p.autor_avatar || `assets/avatars/avatar.svg`}"
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
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
                    <span class="tag-pill">${p.categoria || 'Geral'}</span>
                    ${p.status ? `<span class="tag-pill" style="background:var(--pink-soft);color:var(--pink)">${p.status}</span>` : ''}
                    ${p.progresso ? `<span class="tag-pill" style="background:#e8f5e9;color:#2e7d32">${p.progresso}% pronto</span>` : ''}
                </div>
                ${p.descricao ? `<p style="font-size:12px;color:var(--gray-500);margin-top:8px;line-height:1.4">${p.descricao.slice(0, 60)}...</p>` : ''}
            </div>
            <a href="projetos.html" class="icon-btn" style="width:32px;height:32px" title="Ver projeto">
                <i class="icon-chevron-right"></i>
            </a>
        </div>
    `).join('');
}

/* ── PRÓXIMOS EVENTOS ── */
function renderUpcomingEvents() {
    const container = document.getElementById('upcoming-events-list');
    if (!container) return;

    const events = State.getEvents ? State.getEvents() : [];
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="icon-calendar-plus" style="font-size:28px;color:var(--pink);opacity:.6"></i>
                <p>Nenhum evento agendado.</p>
                <a href="eventos.html" class="link">Criar primeiro evento →</a>
            </div>`;
        return;
    }

    container.innerHTML = events.slice(0, 3).map(e => `
        <div class="event-row">
            <div class="event-icon" style="width:40px;height:40px;border-radius:10px;background:var(--pink-soft);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="icon-calendar" style="color:var(--pink);font-size:18px"></i>
            </div>
            <div class="event-info" style="flex:1">
                <h4 style="font-size:14px;font-weight:600;color:var(--ink);margin:0">${e.titulo}</h4>
                <div style="display:flex;gap:12px;margin-top:4px;font-size:12px;color:var(--gray-500)">
                    ${e.data ? `<span>📅 ${new Date(e.data).toLocaleDateString('pt-BR')}</span>` : ''}
                    ${e.horario ? `<span>🕐 ${e.horario}</span>` : ''}
                </div>
                ${e.tipo ? `<span class="tag-pill" style="display:inline-block;margin-top:6px;font-size:11px">${e.tipo}</span>` : ''}
            </div>
            <a href="eventos.html" class="icon-btn" style="width:32px;height:32px" title="Ver evento">
                <i class="icon-chevron-right"></i>
            </a>
        </div>
    `).join('');
}

/* ── ESTATÍSTICAS DE CRIADOR ── */
function renderCreatorStats() {
    const container = document.getElementById('creator-stats-container');
    if (!container) return;

    const projects = State.getProjects ? State.getProjects() : [];
    const events = State.getEvents ? State.getEvents() : [];
    const posts = State.getPosts ? State.getPosts() : [];

    const projectsByStatus = {
        'Planejamento': projects.filter(p => p.status === 'Planejamento').length,
        'Em Progresso': projects.filter(p => p.status === 'Em Progresso').length,
        'Concluído': projects.filter(p => p.status === 'Concluído').length
    };

    const eventsByType = {
        'Online': events.filter(e => e.tipo === 'Online').length,
        'Presencial': events.filter(e => e.tipo === 'Presencial').length
    };

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
            <div class="stat-mini-card">
                <div style="font-size:12px;color:var(--gray-500);margin-bottom:6px">Projetos em Progresso</div>
                <div style="font-size:24px;font-weight:700;color:var(--pink)">${projectsByStatus['Em Progresso']}</div>
            </div>
            <div class="stat-mini-card">
                <div style="font-size:12px;color:var(--gray-500);margin-bottom:6px">Eventos Criados</div>
                <div style="font-size:24px;font-weight:700;color:var(--pink)">${events.length}</div>
            </div>
            <div class="stat-mini-card">
                <div style="font-size:12px;color:var(--gray-500);margin-bottom:6px">Posts Publicados</div>
                <div style="font-size:24px;font-weight:700;color:var(--pink)">${posts.length}</div>
            </div>
            <div class="stat-mini-card">
                <div style="font-size:12px;color:var(--gray-500);margin-bottom:6px">Projetos Concluídos</div>
                <div style="font-size:24px;font-weight:700;color:#4caf50">${projectsByStatus['Concluído']}</div>
            </div>
        </div>
    `;
}

/* ── SINCRONIZA PERFIL NO SUPABASE ── */
async function syncUserToSupabase() {
    const currentUser = State.getCurrentUser();
    const client = window.SupabaseAuth && window.SupabaseAuth.client;
    if (!currentUser || !client) return;
    try {
        const profileToSync = {
            id: currentUser.id,
            email: currentUser.email,
            nome_completo: currentUser.nome_completo || '',
            nome_usuario: currentUser.nome_usuario || '',
            foto_perfil: currentUser.foto_perfil || '',
            bio: currentUser.bio || '',
            habilidades: currentUser.habilidades || [],
            experiencia: currentUser.experiencia || [],
            createdAt: currentUser.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await client.from('users').upsert(profileToSync, { onConflict: 'id' });
    } catch (err) {
        console.warn('[Dashboard] Não foi possível sincronizar perfil:', err);
    }
}

/* ── ATUALIZA CONTAGEM DE MEMBROS DO SUPABASE ── */
async function updateMembersCountFromSupabase() {
    const client = window.SupabaseAuth && window.SupabaseAuth.client;
    if (!client) return;
    try {
        const { count, error } = await client
            .from('users')
            .select('*', { count: 'exact', head: true });
        if (!error && count !== null) {
            const el = document.getElementById('dash-members-count');
            if (el) el.innerText = count;
        }
    } catch (err) {
        console.warn('[Dashboard] Não foi possível buscar contagem de membros:', err);
    }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
    renderWelcome();
    updateDashboardStats();
    renderRecentActivity();
    renderFeaturedProjects();
    renderUpcomingEvents();
    renderCreatorStats();
    renderProfileProgress();
    // Sincroniza perfil e atualiza contagem global em background
    syncUserToSupabase();
    updateMembersCountFromSupabase();
});