let user = null;
let isViewingOtherProfile = false;
let _profileProjects = [];
let _profileEvents   = [];

/* ── helpers ──────────────────────────────────────── */
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function formatMemberSince(value) {
    if (!value) return 'hoje';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'hoje';
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
               .replace('.', '');
}

function fmtDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function statusConfig(status) {
    const s = (status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (s.includes('conclu'))  return { label: 'Concluído',       cls: 'status--concluido'    };
    if (s.includes('desenv'))  return { label: 'Em Desenvolvimento', cls: 'status--em-dev'     };
    if (s.includes('planej'))  return { label: 'Em Planejamento', cls: 'status--planejamento' };
    if (s.includes('cancel'))  return { label: 'Cancelado',       cls: 'status--cancelado'    };
    if (s.includes('pause') || s.includes('pausad')) return { label: 'Pausado', cls: 'status--pausado' };
    return { label: status || 'Ativo', cls: 'status--ativo' };
}

/* ── carregamento de dados ───────────────────────── */
async function loadProfileData() {
    const urlParams  = new URLSearchParams(window.location.search);
    const userId     = urlParams.get('user');
    const currentUser = State.getCurrentUser();

    if (userId && userId !== currentUser?.id) {
        user = await State.getUserById(userId);
        isViewingOtherProfile = true;
        if (!user) { window.location.href = 'perfil.html'; return; }
    } else {
        if (window.SupabaseAuth?.refreshProfile) {
            await window.SupabaseAuth.refreshProfile();
        }
        user = State.getCurrentUser();
        if (!user && currentUser?.id) {
            user = await State.getUserById(currentUser.id);
        }
        if (!user) user = currentUser;
    }

    loadUserData();
}

function loadUserData() {
    setText('profile-name', user.nome_completo || 'Seu nome');
    setText('profile-user', user.nome_usuario ? `@${user.nome_usuario}` : '@seuusuario');

    const bio = user.biografia || user.bio || '';
    setText('profile-bio', bio || 'Adicione uma biografia para compartilhar sua história com a comunidade.');
    setText('profile-email', user.email || 'seuemail@shetech.com.br');

    const role = user.cargo || user.area || 'Membro SheTech';
    setText('profile-role-info', role);

    const avatarUrl = user.foto_perfil || 'assets/avatars/avatar.svg';
    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.src = avatarUrl;

    const topAvatar = document.getElementById('top-avatar');
    if (topAvatar) topAvatar.src = avatarUrl;

    const coverBg = document.getElementById('profile-cover-bg');
    if (coverBg && user.capa_perfil) {
        coverBg.style.backgroundImage = `url(${user.capa_perfil})`;
        coverBg.classList.add('has-image');
    }

    const aboutText = document.getElementById('profile-about-text');
    if (aboutText) {
        aboutText.textContent = user.sobre || 'Complete seu perfil para compartilhar mais detalhes sobre você.';
    }

    const skillsContainer = document.getElementById('skills-list');
    if (skillsContainer) {
        const skills = Array.isArray(user.habilidades) ? user.habilidades : [];
        skillsContainer.innerHTML = skills.length
            ? skills.map(s => `<span class="skill-tag">${s}</span>`).join('')
            : '<p style="color:var(--gray-500);font-size:14px;">Nenhuma habilidade adicionada ainda.</p>';
    }

    const socialContainer = document.getElementById('profile-social-links');
    if (socialContainer) {
        let html = '';
        if (user.github)    html += `<a href="${user.github}" class="social-btn" target="_blank" title="GitHub"><i class="icon-github"></i></a>`;
        if (user.linkedin)  html += `<a href="${user.linkedin}" class="social-btn" target="_blank" title="LinkedIn"><i class="icon-linkedin"></i></a>`;
        if (user.instagram) html += `<a href="https://instagram.com/${user.instagram.replace('@','')}" class="social-btn" target="_blank" title="Instagram"><i class="icon-instagram"></i></a>`;
        if (user.portfolio) html += `<a href="${user.portfolio}" class="social-btn" target="_blank" title="Portfólio"><i class="icon-globe"></i></a>`;
        socialContainer.innerHTML = html || '<p style="color:var(--gray-500);font-size:14px;">Nenhum link social adicionado.</p>';
    }

    setText('profile-date', formatMemberSince(user.createdAt || user.created_at));
    loadProfileStats();
}

async function loadProfileStats() {
    const [projects, events] = await Promise.all([State.getProjects(), State.getEvents()]);

    const belongsToUser = (item) =>
        item?.author_id === user?.id ||
        [item?.proprietaria_id, item?.organizador_id, item?.criador_id, item?.author_email].includes(user?.email) ||
        (Array.isArray(item?.membros) && (item.membros.includes(user?.id) || item.membros.includes(user?.email)));

    _profileProjects = projects.filter(belongsToUser);
    _profileEvents   = events.filter(belongsToUser);

    setText('stat-projetos', _profileProjects.length);
    setText('stat-eventos',  _profileEvents.length);
    setText('stat-conexoes', 0);

    renderTimeline('all');
    renderProjectsTab();
    renderEventsTab();
}

/* ── LINHA DO TEMPO ──────────────────────────────── */
function renderTimeline(filter) {
    const container = document.getElementById('timeline-list');
    if (!container) return;

    // Monta itens combinados projetos + eventos
    const items = [];

    _profileProjects.forEach(p => {
        const isOwner = p.author_id === user?.id ||
            [p.proprietaria_id, p.criador_id, p.author_email].includes(user?.email);
        items.push({
            type:   'projeto',
            date:   p.createdAt || p.created_at || '',
            title:  p.titulo || 'Projeto sem título',
            desc:   p.descricao || '',
            status: p.status || '',
            tags:   p.tecnologias || [],
            role:   isOwner ? 'Criadora' : 'Membro',
            prog:   p.progresso || 0,
            raw:    p,
        });
    });

    _profileEvents.forEach(e => {
        const isOwner = e.author_id === user?.id ||
            [e.proprietaria_id, e.organizador_id, e.criador_id, e.author_email].includes(user?.email);
        items.push({
            type:   'evento',
            date:   e.data || e.createdAt || '',
            title:  e.titulo || 'Evento sem título',
            desc:   e.descricao || '',
            status: e.tipo === 'online' ? 'Online' : 'Presencial',
            tags:   e.categoria ? [e.categoria] : [],
            role:   isOwner ? 'Organizadora' : 'Participante',
            horario: e.horario || '',
            raw:    e,
        });
    });

    // Ordena por data decrescente
    items.sort((a, b) => {
        const da = new Date(a.date || 0);
        const db = new Date(b.date || 0);
        return db - da;
    });

    // Filtra
    const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="card" style="padding:24px;text-align:center;color:var(--gray-600);">
                <i class="icon-clock" style="font-size:28px;color:var(--pink);margin-bottom:10px;display:inline-block;"></i>
                <h4 style="margin:0 0 8px;color:var(--ink);">
                    ${filter === 'all' ? 'Sua linha do tempo aparecerá aqui' : filter === 'projeto' ? 'Nenhum projeto encontrado' : 'Nenhum evento encontrado'}
                </h4>
                <p style="margin:0;">
                    ${filter === 'all' ? 'Adicione projetos e eventos para construir seu histórico profissional.' : 'Participe de mais ' + (filter === 'projeto' ? 'projetos' : 'eventos') + ' para vê-los aqui.'}
                </p>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(item => buildTimelineItem(item)).join('');
}

function buildTimelineItem(item) {
    const isProjeto = item.type === 'projeto';
    const dotClass  = isProjeto ? 'tl-dot--projeto' : 'tl-dot--evento';
    const dotIcon   = isProjeto ? 'icon-folder-kanban' : 'icon-calendar-days';
    const badgeClass = isProjeto ? 'tl-badge--projeto' : 'tl-badge--evento';
    const badgeLabel = isProjeto ? 'Projeto' : 'Evento';

    // Status badge
    let statusHTML = '';
    if (isProjeto && item.status) {
        const { label, cls } = statusConfig(item.status);
        statusHTML = `<span class="tl-status-badge ${cls}">${label}</span>`;
    } else if (!isProjeto && item.status) {
        const isOnline = item.status === 'Online';
        statusHTML = `<span class="tl-status-badge ${isOnline ? 'status--online' : 'status--presencial'}">${item.status}</span>`;
    }

    // Data formatada
    const dateLabel = item.date
        ? fmtDate(item.date.split('T')[0])
        : '—';

    // Tags
    const tagsHTML = item.tags.slice(0, 4).map(t =>
        `<span class="tl-tag">${t}</span>`
    ).join('');

    // Barra de progresso (somente projetos)
    const progressHTML = isProjeto ? `
        <div class="tl-progress-row">
            <div class="tl-progress-bg">
                <div class="tl-progress-fill" style="width:${item.prog}%"></div>
            </div>
            <span class="tl-progress-label">${item.prog}%</span>
        </div>` : '';

    // Role pill
    const roleHTML = `<span class="tl-role-pill"><i class="${isProjeto ? 'icon-user' : 'icon-calendar'}"></i>${item.role}</span>`;

    return `
    <div class="tl-item" data-type="${item.type}">
        <div class="tl-dot ${dotClass}">
            <i class="${dotIcon}"></i>
        </div>
        <div class="tl-content card">
            <div class="tl-meta">
                <span class="tl-badge ${badgeClass}">${badgeLabel}</span>
                ${statusHTML}
                <span class="tl-date">
                    <i class="icon-calendar"></i>${dateLabel}
                    ${!isProjeto && item.horario ? ' às ' + item.horario : ''}
                </span>
            </div>
            <div class="tl-title">${item.title}</div>
            ${item.desc ? `<div class="tl-desc">${item.desc.slice(0, 140)}${item.desc.length > 140 ? '…' : ''}</div>` : ''}
            ${tagsHTML ? `<div class="tl-tags">${tagsHTML}</div>` : ''}
            ${progressHTML}
            <div class="tl-footer">
                ${roleHTML}
            </div>
        </div>
    </div>`;
}

/* ── TAB: PROJETOS ────────────────────────────────── */
function renderProjectsTab() {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    if (_profileProjects.length === 0) {
        container.innerHTML = `
            <div class="card" style="padding:24px;text-align:center;color:var(--gray-600);grid-column:1/-1;">
                <i class="icon-folder-kanban" style="font-size:28px;color:var(--pink);margin-bottom:10px;display:inline-block;"></i>
                <h4 style="margin:0 0 8px;color:var(--ink);">Nenhum projeto por enquanto</h4>
                <p style="margin:0;">Crie seu primeiro projeto e ele aparecerá aqui.</p>
            </div>`;
        return;
    }

    container.innerHTML = _profileProjects.map(p => {
        const isOwner = p.author_id === user?.id ||
            [p.proprietaria_id, p.criador_id, p.author_email].includes(user?.email);
        const { label, cls } = statusConfig(p.status);
        const techs = (p.tecnologias || []).slice(0, 4)
            .map(t => `<span class="tl-tag">${t}</span>`).join('');
        const extra = (p.tecnologias || []).length > 4
            ? `<span class="tl-tag">+${(p.tecnologias||[]).length - 4}</span>` : '';

        return `
        <div class="card project-card">
            <div class="project-card-header">
                <span class="project-icon">📁</span>
                <span class="project-status-pill ${cls}">${label}</span>
            </div>
            <div class="project-name">${p.titulo || 'Projeto sem título'}</div>
            ${p.descricao ? `<div class="project-desc">${p.descricao.slice(0, 100)}${p.descricao.length > 100 ? '…' : ''}</div>` : ''}
            ${techs || extra ? `<div class="project-tags">${techs}${extra}</div>` : ''}
            <div class="project-footer">
                <div class="project-progress-wrap">
                    <div class="project-progress-bar">
                        <div class="project-progress-fill" style="width:${p.progresso || 0}%"></div>
                    </div>
                    <span class="project-progress-label">${p.progresso || 0}%</span>
                </div>
                <span class="tl-role-pill" style="font-size:11px">
                    <i class="${isOwner ? 'icon-star' : 'icon-user'}"></i>${isOwner ? 'Criadora' : 'Membro'}
                </span>
            </div>
        </div>`;
    }).join('');
}

/* ── TAB: EVENTOS ─────────────────────────────────── */
function renderEventsTab() {
    const container = document.getElementById('events-list');
    if (!container) return;

    if (_profileEvents.length === 0) {
        container.innerHTML = `
            <div class="card" style="padding:24px;text-align:center;color:var(--gray-600);">
                <i class="icon-calendar-days" style="font-size:28px;color:var(--pink);margin-bottom:10px;display:inline-block;"></i>
                <h4 style="margin:0 0 8px;color:var(--ink);">Nenhum evento cadastrado</h4>
                <p style="margin:0;">Quando você criar ou participar de eventos, eles aparecerão aqui.</p>
            </div>`;
        return;
    }

    container.innerHTML = _profileEvents.map(ev => {
        const isOwner = ev.author_id === user?.id ||
            [ev.proprietaria_id, ev.organizador_id, ev.criador_id, ev.author_email].includes(user?.email);
        const isOnline = ev.tipo === 'online';
        const dateParts = ev.data ? ev.data.split('-') : null;
        const day   = dateParts ? dateParts[2] : '—';
        const month = dateParts
            ? new Date(ev.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.','').toUpperCase()
            : '—';
        const year  = dateParts ? dateParts[0] : '';

        return `
        <div class="card event-row">
            <div class="event-date-block">
                <span class="event-month">${month}</span>
                <span class="event-day">${day}</span>
                ${year ? `<span class="event-year">${year}</span>` : ''}
            </div>
            <div class="event-info">
                <div class="event-header-row">
                    <div class="event-title">${ev.titulo || 'Evento sem título'}</div>
                    <span class="event-badge ${isOnline ? 'event-badge--online' : 'event-badge--presencial'}">
                        ${isOnline ? 'Online' : 'Presencial'}
                    </span>
                </div>
                ${ev.descricao ? `<div class="event-desc">${ev.descricao.slice(0, 100)}${ev.descricao.length > 100 ? '…' : ''}</div>` : ''}
                <div class="event-meta-row">
                    ${ev.horario ? `<span class="event-meta"><i class="icon-clock"></i> ${ev.horario}</span>` : ''}
                    ${ev.categoria ? `<span class="event-meta"><i class="icon-tag"></i> ${ev.categoria}</span>` : ''}
                    <span class="event-role-pill ${isOwner ? 'event-role--speaker' : 'event-role--participante'}">
                        <i class="${isOwner ? 'icon-mic-2' : 'icon-user'}"></i>
                        ${isOwner ? 'Organizadora' : 'Participante'}
                    </span>
                </div>
            </div>
        </div>`;
    }).join('');
}

/* ── TABS: troca entre painéis ────────────────────── */
document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panelId = 'tab-' + tab.dataset.tab;
        document.getElementById(panelId)?.classList.add('active');
    });
});

/* ── FILTROS DA TIMELINE ─────────────────────────── */
document.querySelectorAll('.tl-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tl-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTimeline(btn.dataset.filter);
    });
});

/* ── COMPARTILHAR PERFIL (popover igual à comunidade) ── */
document.getElementById('share-btn')?.addEventListener('click', function(evt) {
    openSharePopover(evt.currentTarget);
});

function openSharePopover(triggerBtn) {
    // Toggle: fecha se já estiver aberto
    const existing = document.getElementById('profile-share-popover');
    const existingOverlay = document.getElementById('profile-share-overlay');
    if (existing) { existing.remove(); existingOverlay?.remove(); return; }

    const shareUrl  = window.location.href;
    const shareName = user?.nome_completo || 'uma membra';
    const shareText = `Confira o perfil de ${shareName} na SheTech!`;

    const rect = triggerBtn.getBoundingClientRect();
    let top  = rect.top - 230;
    let left = rect.left - 200;
    if (top  < 10) top  = rect.bottom + 10;
    if (left < 10) left = 10;
    if (left + 320 > window.innerWidth) left = window.innerWidth - 330;

    const wa  = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    const fb  = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const tw  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const li  = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    const ml  = `mailto:?subject=${encodeURIComponent('Perfil na SheTech')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;

    const overlay = `<div id="profile-share-overlay" class="share-popover-overlay"></div>`;
    const popover = `
        <div id="profile-share-popover" class="share-popover-container" style="top:${top}px;left:${left}px;z-index:9999;">
            <span class="share-popover-title">Compartilhar Perfil</span>
            <div class="share-options-grid">
                <a href="${wa}" class="share-option-item" target="_blank" rel="noopener">
                    <div class="share-icon-circle whatsapp">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    </div>
                    <span>WhatsApp</span>
                </a>
                <a href="${fb}" class="share-option-item" target="_blank" rel="noopener">
                    <div class="share-icon-circle facebook">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </div>
                    <span>Facebook</span>
                </a>
                <a href="${tw}" class="share-option-item" target="_blank" rel="noopener">
                    <div class="share-icon-circle x-twitter">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                    </div>
                    <span>X</span>
                </a>
                <a href="${li}" class="share-option-item" target="_blank" rel="noopener">
                    <div class="share-icon-circle linkedin">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    </div>
                    <span>LinkedIn</span>
                </a>
                <a href="${ml}" class="share-option-item" target="_blank" rel="noopener">
                    <div class="share-icon-circle email">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <span>E-mail</span>
                </a>
            </div>
            <div class="share-url-box">
                <input type="text" id="profile-share-url-input" value="${shareUrl}" readonly />
                <button class="btn-copy-small" onclick="copyProfileLink()">Copiar</button>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', overlay + popover);

    const close = () => {
        document.getElementById('profile-share-popover')?.remove();
        document.getElementById('profile-share-overlay')?.remove();
    };
    document.getElementById('profile-share-overlay').onclick = close;
}

window.copyProfileLink = function() {
    const input = document.getElementById('profile-share-url-input');
    if (!input) return;
    navigator.clipboard.writeText(input.value).then(() => {
        if (typeof Layout !== 'undefined' && Layout.showToast) {
            Layout.showToast('Link copiado! 📋', 'success');
        }
        // Feedback visual no botão
        const btn = input.nextElementSibling;
        if (btn) { btn.textContent = 'Copiado!'; setTimeout(() => { btn.textContent = 'Copiar'; }, 2000); }
    }).catch(() => {
        input.select();
        document.execCommand('copy');
    });
};

/* ── INIT ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
    await State.ensureReady();
    if (!State.getCurrentUser()) {
        window.location.href = 'login.html';
        return;
    }

    if (typeof Layout !== 'undefined') {
        await Layout.init({ active: 'perfil' });
    }

    await loadProfileData();

    // Oculta botões de edição quando visualizando outro perfil
    if (isViewingOtherProfile) {
        document.querySelectorAll('.btn-edit-profile, [href="editar-perfil.html"]')
            .forEach(el => { el.style.display = 'none'; });
        document.getElementById('share-btn')?.style &&
            (document.getElementById('share-btn').style.display = 'none');
    }
});
