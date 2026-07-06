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

    if (allProjects.length === 0) {
        container.innerHTML = `
            <div class="tech-chart-empty">
                <i data-lucide="bar-chart-2" style="width:32px;height:32px;opacity:.35"></i>
                <p>Nenhum projeto cadastrado ainda.</p>
                <a href="projetos.html" class="stat-link">Criar primeiro projeto →</a>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Conta quantas vezes cada tecnologia aparece nos projetos
    const techCount = {};
    allProjects.forEach(p => {
        // Normaliza tecnologias: achata arrays aninhados, split em strings, limpa espaços
        let rawTechs = p.tecnologias || [];
        if (typeof rawTechs === 'string') {
            rawTechs = rawTechs.split(/[,;]+/);
        }
        if (!Array.isArray(rawTechs)) rawTechs = [rawTechs];

        // Achata caso seja array de arrays (ex: [["React","Python"]])
        const flat = rawTechs.flat(Infinity);

        flat.forEach(t => {
            // Cada item pode ainda ser uma string com vírgulas (ex: "React, Python")
            const parts = String(t ?? '').split(/[,;]+/);
            parts.forEach(part => {
                const key = part.trim().replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200D\uFEFF]/g, '');
                // Ignora strings vazias, "null", "undefined" e variantes
                if (key && key !== 'null' && key !== 'undefined' && /\S/.test(key)) {
                    techCount[key] = (techCount[key] || 0) + 1;
                }
            });
        });
    });

    // Fallback: se nenhum projeto tem tecnologias, usa categorias
    const useFallback = Object.keys(techCount).length === 0;
    if (useFallback) {
        allProjects.forEach(p => {
            const key = (p.categoria || 'Sem categoria').trim();
            techCount[key] = (techCount[key] || 0) + 1;
        });
    }

    // Ordena por contagem, pega top 8 — filtra entradas sem label visível
    console.log('[Dashboard] techCount raw:', JSON.stringify(techCount));
    const sorted = Object.entries(techCount)
        .filter(([k]) => k && /\S/.test(k) && k !== 'null' && k !== 'undefined')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    const labels = sorted.map(([k]) => k);
    const values = sorted.map(([, v]) => v);

    // Paleta de cores gradiente rosa → roxo
    const palette = [
        '#ff3d8b', '#e91e8c', '#c2185b',
        '#9c27b0', '#7b1fa2', '#673ab7',
        '#5e35b1', '#3949ab'
    ];

    // Destrói gráfico anterior se existir
    if (window._techChart instanceof Chart) {
        window._techChart.destroy();
    }

    container.innerHTML = `
        <div class="tech-chart-wrap">
            <div class="tech-chart-legend">
                ${labels.map((l, i) => `
                    <div class="tech-legend-item">
                        <span class="tech-legend-dot" style="background:${palette[i % palette.length]}"></span>
                        <span class="tech-legend-label">${l}</span>
                        <span class="tech-legend-count">${values[i]}x</span>
                    </div>`).join('')}
            </div>
            <div class="tech-chart-canvas-wrap">
                <canvas id="tech-lang-chart"></canvas>
            </div>
        </div>
        ${useFallback ? '<p class="tech-chart-hint">Exibindo categorias (projetos sem tecnologias cadastradas)</p>' : ''}
    `;

    const ctx = document.getElementById('tech-lang-chart').getContext('2d');
    window._techChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Projetos',
                data: values,
                backgroundColor: labels.map((_, i) => palette[i % palette.length] + 'cc'),
                borderColor: labels.map((_, i) => palette[i % palette.length]),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.parsed.y} projeto${ctx.parsed.y !== 1 ? 's' : ''}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 11, family: "'Inter', sans-serif" },
                        color: '#6b7280',
                        maxRotation: 30,
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 11 },
                        color: '#6b7280',
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            }
        }
    });
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
        // Formata data para exibição legível
        let dataLabel = ev.data || 'Em breve';
        if (ev.data) {
            const [y, m, d] = ev.data.split('-');
            dataLabel = `${d}/${m}/${y}`;
        }

        let btnHtml = '';
        if (currentUser && ev.author_id !== currentUser.id) {
            const isSubscribed = Array.isArray(ev.membros) && ev.membros.includes(currentUser.id);
            if (isSubscribed) {
                btnHtml = `<button class="btn-subscribe-event btn-subscribe-event--done" onclick="event.stopPropagation(); window.toggleEventSubscription('${ev.id}')"><i class="icon-check"></i> Inscrita</button>`;
            } else {
                btnHtml = `<button class="btn-subscribe-event" onclick="event.stopPropagation(); window.openParticipacaoEventoModal('${ev.id}')"><span class="btn-subscribe-shine"></span><i class="icon-user-plus"></i> Se inscrever</button>`;
            }
        }

        const isOnline = ev.tipo === 'online';
        const tipoIcon = isOnline ? 'icon-video' : 'icon-map-pin';
        const tipoLabel = isOnline ? 'Online' : 'Presencial';

        return `
        <div class="upcoming-event-row">
            <div class="upcoming-event-stripe ${isOnline ? '' : 'upcoming-event-stripe--presencial'}"></div>
            <div class="upcoming-event-info">
                <h4 class="upcoming-event-title">${ev.titulo}</h4>
                <div class="upcoming-event-meta">
                    <span><i class="icon-calendar"></i> ${dataLabel}${ev.horario ? ' às ' + ev.horario : ''}</span>
                    <span><i class="${tipoIcon}"></i> ${tipoLabel}</span>
                </div>
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

    // Dados calculados
    const myProjects      = projects.filter(p => p.author_id === currentUser.id);
    const joinedProjects  = projects.filter(p => Array.isArray(p.membros) && p.membros.includes(currentUser.id));
    const myEvents        = events.filter(e => e.author_id === currentUser.id);
    const joinedEvents    = events.filter(e => Array.isArray(e.membros) && e.membros.includes(currentUser.id));
    const allMyProjects   = [...myProjects, ...joinedProjects];
    const allMyEvents     = [...myEvents, ...joinedEvents];

    // Tecnologias consolidadas dos projetos envolvidos
    const techCount = {};
    allMyProjects.forEach(p => {
        // Normaliza tecnologias: achata arrays aninhados, split em strings, limpa espaços
        let rawTechs = p.tecnologias || [];
        if (typeof rawTechs === 'string') {
            rawTechs = rawTechs.split(/[,;]+/);
        }
        if (!Array.isArray(rawTechs)) rawTechs = [rawTechs];

        const flat = rawTechs.flat(Infinity);

        flat.forEach(t => {
            const parts = String(t ?? '').split(/[,;]+/);
            parts.forEach(part => {
                const k = part.trim().replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200D\uFEFF]/g, '');
                if (k && k !== 'null' && k !== 'undefined' && /\S/.test(k)) {
                    techCount[k] = (techCount[k] || 0) + 1;
                }
            });
        });
    });
    const topTechs = Object.entries(techCount).sort((a,b) => b[1]-a[1]).slice(0, 5);

    // Progresso médio dos projetos
    const avgProgress = myProjects.length
        ? Math.round(myProjects.reduce((s, p) => s + (p.progresso || 0), 0) / myProjects.length)
        : 0;

    // Helper: formata data ISO → dd/mm/aaaa
    const fmtDate = iso => {
        if (!iso) return '—';
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    // KPIs
    const kpis = [
        { label: 'Projetos Criados',   value: myProjects.length,               icon: 'folder-kanban', color: '#ff3d8b' },
        { label: 'Projetos Membros',   value: joinedProjects.length,            icon: 'users',         color: '#673ab7' },
        { label: 'Eventos Criados',    value: myEvents.length,                  icon: 'calendar-days', color: '#0ea5e9' },
        { label: 'Eventos Inscritos',  value: joinedEvents.length,              icon: 'calendar-check',color: '#10b981' },
        { label: 'Progresso Médio',    value: avgProgress + '%',                icon: 'bar-chart-2',   color: '#f59e0b' },
        { label: 'Tecnologias Usadas', value: Object.keys(techCount).length,   icon: 'cpu',           color: '#8b5cf6' },
    ];

    // HTML das seções de detalhe
    const projectsDetailHTML = allMyProjects.length ? `
        <div class="perf-section">
            <div class="perf-section-title"><i data-lucide="folder-kanban"></i> Projetos</div>
            <div class="perf-projects-grid">
                ${allMyProjects.map(p => {
                    const isOwner = p.author_id === currentUser.id;
                    const rawTechs = p.tecnologias || [];
                    const techArr = (typeof rawTechs === 'string' ? rawTechs.split(',') : Array.isArray(rawTechs) ? rawTechs : [])
                        .map(t => String(t || '').trim()).filter(Boolean);
                    const techPills = techArr.slice(0,3).map(t => `<span class="perf-tech-pill">${t}</span>`).join('');
                    const extra = techArr.length > 3 ? `<span class="perf-tech-pill perf-tech-more">+${techArr.length-3}</span>` : '';
                    return `
                    <div class="perf-project-card">
                        <div class="perf-project-header">
                            <span class="perf-project-title">${p.titulo || 'Sem título'}</span>
                            <span class="perf-role-badge ${isOwner ? 'perf-role-owner' : 'perf-role-member'}">${isOwner ? 'Criadora' : 'Membro'}</span>
                        </div>
                        <div class="perf-project-meta">
                            <span>${p.categoria || '—'}</span>
                            <span class="perf-status-dot perf-status-${(p.status||'').toLowerCase().replace(/\s/g,'-')}">${p.status || '—'}</span>
                        </div>
                        ${p.descricao ? `<p class="perf-project-desc">${p.descricao.slice(0,100)}${p.descricao.length>100?'…':''}</p>` : ''}
                        <div class="perf-progress-row">
                            <div class="perf-progress-bar-bg">
                                <div class="perf-progress-bar-fill" style="width:${p.progresso||0}%"></div>
                            </div>
                            <span class="perf-progress-label">${p.progresso||0}%</span>
                        </div>
                        ${techPills || extra ? `<div class="perf-tech-row">${techPills}${extra}</div>` : ''}
                    </div>`;
                }).join('')}
            </div>
        </div>` : '';

    const eventsDetailHTML = allMyEvents.length ? `
        <div class="perf-section">
            <div class="perf-section-title"><i data-lucide="calendar-days"></i> Eventos</div>
            <div class="perf-events-list">
                ${allMyEvents.map(ev => {
                    const isOwner = ev.author_id === currentUser.id;
                    const isOnline = ev.tipo === 'online';
                    return `
                    <div class="perf-event-row">
                        <div class="perf-event-stripe ${isOnline ? '' : 'perf-event-stripe--presencial'}"></div>
                        <div class="perf-event-body">
                            <div class="perf-event-top">
                                <span class="perf-event-name">${ev.titulo || 'Sem título'}</span>
                                <span class="perf-role-badge ${isOwner ? 'perf-role-owner' : 'perf-role-member'}">${isOwner ? 'Organizadora' : 'Participante'}</span>
                            </div>
                            <div class="perf-event-meta">
                                <span><i data-lucide="calendar"></i> ${fmtDate(ev.data)}${ev.horario ? ' às '+ev.horario : ''}</span>
                                <span><i data-lucide="${isOnline ? 'video' : 'map-pin'}"></i> ${isOnline ? 'Online' : 'Presencial'}</span>
                                ${ev.categoria ? `<span><i data-lucide="tag"></i> ${ev.categoria}</span>` : ''}
                            </div>
                            ${ev.descricao ? `<p class="perf-event-desc">${ev.descricao.slice(0,90)}${ev.descricao.length>90?'…':''}</p>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>` : '';

    const techsDetailHTML = topTechs.length ? `
        <div class="perf-section">
            <div class="perf-section-title"><i data-lucide="cpu"></i> Top Tecnologias</div>
            <div class="perf-tech-bars">
                ${topTechs.map(([name, count]) => {
                    const max = topTechs[0][1];
                    const pct = Math.round((count / max) * 100);
                    return `
                    <div class="perf-tech-bar-row">
                        <span class="perf-tech-bar-label">${name}</span>
                        <div class="perf-tech-bar-track">
                            <div class="perf-tech-bar-fill" style="width:${pct}%"></div>
                        </div>
                        <span class="perf-tech-bar-count">${count}x</span>
                    </div>`;
                }).join('')}
            </div>
        </div>` : '';

    container.innerHTML = `
        <!-- KPIs -->
        <div class="perf-kpi-grid">
            ${kpis.map(k => `
            <div class="perf-kpi-card">
                <div class="perf-kpi-icon" style="background:${k.color}22; color:${k.color}">
                    <i data-lucide="${k.icon}"></i>
                </div>
                <div class="perf-kpi-info">
                    <div class="perf-kpi-value">${k.value}</div>
                    <div class="perf-kpi-label">${k.label}</div>
                </div>
            </div>`).join('')}
        </div>

        <!-- Detalhes -->
        <div class="perf-details">
            ${projectsDetailHTML}
            ${eventsDetailHTML}
            ${techsDetailHTML}
            ${!allMyProjects.length && !allMyEvents.length ? `
                <div class="perf-empty">
                    <i data-lucide="inbox" style="width:36px;height:36px;opacity:.3"></i>
                    <p>Ainda sem atividade registrada.</p>
                    <div style="display:flex;gap:10px;margin-top:4px">
                        <a href="projetos.html" class="stat-link">Criar projeto →</a>
                        <a href="eventos.html" class="stat-link">Ver eventos →</a>
                    </div>
                </div>` : ''}
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    // Guarda dados para uso no PDF
    window._perfData = { currentUser, myProjects, joinedProjects, myEvents, joinedEvents, topTechs, avgProgress, fmtDate };

    // Botão PDF
    const btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) {
        btnPdf.onclick = () => window.downloadDesempenhoPDF();
    }
};

window.downloadDesempenhoPDF = function() {
    const d = window._perfData;
    if (!d) return;

    const { currentUser, myProjects, joinedProjects, myEvents, joinedEvents, topTechs, avgProgress, fmtDate } = d;
    const allMyProjects = [...myProjects, ...joinedProjects];
    const allMyEvents   = [...myEvents, ...joinedEvents];
    const now = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });

    const techsHTML = topTechs.length
        ? topTechs.map(([name, count]) => `<span style="display:inline-block;background:#f3e8ff;color:#673ab7;border-radius:6px;padding:3px 10px;font-size:12px;margin:2px;">${name} (${count}x)</span>`).join(' ')
        : '<span style="color:#9ca3af;font-size:13px">Nenhuma tecnologia registrada</span>';

    const projectsHTML = allMyProjects.length ? allMyProjects.map(p => {
        const isOwner = p.author_id === currentUser.id;
        const techs = (p.tecnologias || []).join(', ') || '—';
        const membros = Array.isArray(p.membros) ? p.membros.length : 0;
        return `
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:12px;break-inside:avoid;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                <strong style="font-size:14px;color:#1a1a1f">${p.titulo || 'Sem título'}</strong>
                <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${isOwner?'#fce4ec':'#ede9fe'};color:${isOwner?'#c2185b':'#673ab7'};font-weight:600">${isOwner?'Criadora':'Membro'}</span>
            </div>
            <div style="display:flex;gap:16px;font-size:12px;color:#6b7280;margin-bottom:6px;flex-wrap:wrap;">
                <span>📂 ${p.categoria || '—'}</span>
                <span>🏷 ${p.status || '—'}</span>
                <span>📊 ${p.progresso||0}% concluído</span>
                <span>👥 ${membros} membro${membros!==1?'s':''}</span>
            </div>
            ${p.descricao ? `<p style="font-size:12px;color:#374151;line-height:1.5;margin:0 0 6px">${p.descricao}</p>` : ''}
            <div style="font-size:12px;color:#6b7280"><strong>Tecnologias:</strong> ${techs}</div>
            ${p.repo ? `<div style="font-size:12px;margin-top:4px"><strong>Repositório:</strong> <span style="color:#673ab7">${p.repo}</span></div>` : ''}
        </div>`;
    }).join('') : '<p style="color:#9ca3af;font-size:13px">Nenhum projeto registrado.</p>';

    const eventsHTML = allMyEvents.length ? allMyEvents.map(ev => {
        const isOwner = ev.author_id === currentUser.id;
        const isOnline = ev.tipo === 'online';
        const membros = Array.isArray(ev.membros) ? ev.membros.length : 0;
        return `
        <div style="border:1px solid #e5e7eb;border-left:4px solid ${isOnline?'#ff3d8b':'#16a34a'};border-radius:10px;padding:14px 16px;margin-bottom:12px;break-inside:avoid;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                <strong style="font-size:14px;color:#1a1a1f">${ev.titulo || 'Sem título'}</strong>
                <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${isOwner?'#fce4ec':'#d1fae5'};color:${isOwner?'#c2185b':'#065f46'};font-weight:600">${isOwner?'Organizadora':'Participante'}</span>
            </div>
            <div style="display:flex;gap:16px;font-size:12px;color:#6b7280;margin-bottom:6px;flex-wrap:wrap;">
                <span>📅 ${fmtDate(ev.data)}${ev.horario?' às '+ev.horario:''}</span>
                <span>${isOnline?'💻 Online':'📍 Presencial'}</span>
                ${ev.categoria?`<span>🏷 ${ev.categoria}</span>`:''}
                <span>👥 ${membros} participante${membros!==1?'s':''}</span>
            </div>
            ${ev.descricao ? `<p style="font-size:12px;color:#374151;line-height:1.5;margin:0">${ev.descricao}</p>` : ''}
        </div>`;
    }).join('') : '<p style="color:#9ca3af;font-size:13px">Nenhum evento registrado.</p>';

    const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1f;max-width:720px;margin:0 auto;padding:0;">

        <!-- Cabeçalho -->
        <div style="background:linear-gradient(135deg,#ff3d8b 0%,#673ab7 100%);border-radius:16px;padding:32px 36px;margin-bottom:28px;color:#fff;">
            <div style="display:flex;align-items:center;gap:18px;">
                ${currentUser.foto_perfil
                    ? `<img src="${currentUser.foto_perfil}" style="width:72px;height:72px;border-radius:50%;border:3px solid rgba(255,255,255,.5);object-fit:cover;" />`
                    : `<div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700">${(currentUser.nome_completo||'U').charAt(0).toUpperCase()}</div>`
                }
                <div>
                    <div style="font-size:22px;font-weight:800;margin-bottom:4px">${currentUser.nome_completo || currentUser.nome_usuario || 'Usuária'}</div>
                    <div style="font-size:13px;opacity:.85">${currentUser.cargo || currentUser.area || 'Membro SheTech'}</div>
                    <div style="font-size:12px;opacity:.7;margin-top:2px">${currentUser.email}</div>
                </div>
                <div style="margin-left:auto;text-align:right;">
                    <div style="font-size:11px;opacity:.7;margin-bottom:4px">Relatório gerado em</div>
                    <div style="font-size:13px;font-weight:600">${now}</div>
                </div>
            </div>
            ${currentUser.bio || currentUser.biografia
                ? `<p style="margin:16px 0 0;font-size:13px;opacity:.85;line-height:1.6;border-top:1px solid rgba(255,255,255,.25);padding-top:14px">${currentUser.bio || currentUser.biografia}</p>`
                : ''}
        </div>

        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;">
            ${[
                ['Projetos Criados',   myProjects.length,                '#ff3d8b'],
                ['Proj. como Membro',  joinedProjects.length,             '#673ab7'],
                ['Eventos Criados',    myEvents.length,                   '#0ea5e9'],
                ['Eventos Inscritos',  joinedEvents.length,               '#10b981'],
                ['Progresso Médio',    avgProgress+'%',                   '#f59e0b'],
                ['Tecnologias',        Object.keys(Object.fromEntries(topTechs)).length, '#8b5cf6'],
            ].map(([label,value,color]) => `
                <div style="border:2px solid ${color}22;border-radius:12px;padding:14px;text-align:center;">
                    <div style="font-size:24px;font-weight:800;color:${color}">${value}</div>
                    <div style="font-size:11px;color:#6b7280;margin-top:2px">${label}</div>
                </div>`).join('')}
        </div>

        <!-- Tecnologias -->
        <div style="margin-bottom:28px;">
            <h2 style="font-size:15px;font-weight:700;color:#1a1a1f;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">⚡ Top Tecnologias</h2>
            <div>${techsHTML}</div>
        </div>

        <!-- Projetos -->
        <div style="margin-bottom:28px;">
            <h2 style="font-size:15px;font-weight:700;color:#1a1a1f;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">📁 Projetos (${allMyProjects.length})</h2>
            ${projectsHTML}
        </div>

        <!-- Eventos -->
        <div style="margin-bottom:28px;">
            <h2 style="font-size:15px;font-weight:700;color:#1a1a1f;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">📅 Eventos (${allMyEvents.length})</h2>
            ${eventsHTML}
        </div>

        <!-- Habilidades -->
        ${(currentUser.habilidades||[]).length ? `
        <div style="margin-bottom:28px;">
            <h2 style="font-size:15px;font-weight:700;color:#1a1a1f;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">🛠 Habilidades</h2>
            <div>${(currentUser.habilidades||[]).map(h=>`<span style="display:inline-block;background:#fce4ec;color:#c2185b;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:600;margin:3px;">${h}</span>`).join(' ')}</div>
        </div>` : ''}

        <!-- Rodapé -->
        <div style="text-align:center;padding:20px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;margin-top:8px;">
            Relatório de Desempenho SheTech &nbsp;•&nbsp; ${now}
        </div>
    </div>`;

    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el);

    const nomeArquivo = `shetech-desempenho-${(currentUser.nome_usuario || 'usuario').replace(/\s/g,'-')}.pdf`;

    html2pdf().set({
        margin: [12, 10],
        filename: nomeArquivo,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(el).save().then(() => {
        document.body.removeChild(el);
    });
};
