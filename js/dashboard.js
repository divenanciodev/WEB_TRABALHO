const user = State.getCurrentUser();
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

/* ── SINCRONIZAÇÃO COM SUPABASE ── */
async function syncUserToSupabase() {
    const client = window.SupabaseAuth && window.SupabaseAuth.client;
    if (!client || !user) return;

    try {
        const profileToSync = {
            id: user.id,
            email: user.email,
            nome_completo: user.nome_completo || '',
            nome_usuario: user.nome_usuario || '',
            foto_perfil: user.foto_perfil || '',
            bio: user.bio || '',
            habilidades: user.habilidades || [],
            experiencia: user.experiencia || [],
            createdat: user.createdAt || new Date().toISOString(),
            updatedat: new Date().toISOString()
        };

        const { error } = await client.from('users').upsert(profileToSync, { onConflict: 'id' });
        if (error) {
            console.warn('[Dashboard] Erro ao sincronizar perfil:', error.message);
        } else {
            console.log('[Dashboard] Perfil sincronizado com sucesso');
        }
    } catch (err) {
        console.warn('[Dashboard] Erro ao sincronizar:', err);
    }
}

async function updateMembersCountFromSupabase() {
    const client = window.SupabaseAuth && window.SupabaseAuth.client;
    if (!client) return;

    try {
        const { data: users, error } = await client
            .from('users')
            .select('id', { count: 'exact', head: true });

        if (!error && users !== null) {
            const countEl = document.getElementById('dash-members-count');
            if (countEl) countEl.innerText = users.length || 0;
        }
    } catch (err) {
        console.warn('[Dashboard] Erro ao contar membros:', err);
    }
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
                alt="${p.author}"
                style="width:32px;height:32px;border-radius:50%;object-fit:cover"
            />
            <div style="flex:1">
                <div style="font-weight:500;font-size:14px">${p.author}</div>
                <div style="font-size:12px;color:var(--gray-500)">${p.text?.substring(0, 50)}...</div>
            </div>
            <div style="font-size:12px;color:var(--gray-500)">${p.time || 'Recente'}</div>
        </div>
    `).join('');
}

/* ── QUICK ACTIONS ── */
function setupQuickActions() {
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            window.location.href = 'projetos.html';
        });
    }

    const newEventBtn = document.getElementById('new-event-btn');
    if (newEventBtn) {
        newEventBtn.addEventListener('click', () => {
            window.location.href = 'eventos.html';
        });
    }

    const communityBtn = document.getElementById('community-btn');
    if (communityBtn) {
        communityBtn.addEventListener('click', () => {
            window.location.href = 'comunidade.html';
        });
    }
}

/* ── INICIALIZAÇÃO ── */
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof Layout !== 'undefined') {
        Layout.init({ active: 'dashboard' });
    }

    // Sincroniza o perfil do usuário com Supabase
    await syncUserToSupabase();

    // Atualiza contagem de membros do Supabase
    await updateMembersCountFromSupabase();

    // Renderiza componentes
    renderWelcome();
    dummyStreak();
    updateDashboardStats();
    renderProfileProgress();
    renderRecentActivity();
    setupQuickActions();

    // Chama lucide para renderizar ícones
    if (window.lucide) lucide.createIcons();
});
