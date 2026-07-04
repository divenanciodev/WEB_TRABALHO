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
    await renderPerformanceChart();
    setupQuickActions();

    if (window.lucide) lucide.createIcons();
});
async function renderPerformanceChart() {
    const canvas = document.getElementById('performance-chart');
    if (!canvas) return;
    // Fetch performance data (dummy if not implemented)
    let data = [];
    if (State.getPerformanceData) {
        data = await State.getPerformanceData();
    } else {
        // fallback dummy data for the past 7 days
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            data.push({ date: d.toISOString().split('T')[0], score: Math.floor(Math.random() * 100) + 1 });
        }
    }
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: 'Desempenho',
                data: data.map(d => d.score),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
    // Attach PDF download handler
    const btn = document.getElementById('download-pdf');
    if (btn) {
        btn.addEventListener('click', downloadPerformancePDF);
    }
}
// ---------- ANALYTICS CHARTS ----------
async function renderParticipationLineChart() {
  const data = await State.getActivityTimeline();
  const ctx = document.getElementById('participation-line').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'Posts',
          data: data.map(d => d.posts),
          borderColor: '#ff6384',
          tension: 0.2,
          fill: false
        },
        {
          label: 'Eventos',
          data: data.map(d => d.events),
          borderColor: '#36a2eb',
          tension: 0.2,
          fill: false
        },
        {
          label: 'Projetos',
          data: data.map(d => d.projects),
          borderColor: '#ffcd56',
          tension: 0.2,
          fill: false
        }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } } }
  });
}

async function renderActivityPieChart() {
  const dist = await State.getActivityDistribution();
  const ctx = document.getElementById('activity-pie').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Posts', 'Eventos', 'Projetos'],
      datasets: [{ data: [dist.posts, dist.events, dist.projects], backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56'] }]
    },
    options: { responsive: true }
  });
}

async function renderCategoryBarChart() {
  const cat = await State.getCategoryDistribution();
  const labels = Object.keys(cat);
  const values = Object.values(cat);
  const ctx = document.getElementById('category-bar').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Participação por categoria', data: values, backgroundColor: '#673ab7' }]
    },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }
  });
}

async function renderEventsMonthBarChart() {
  const months = await State.getEventsByMonth();
  const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const labels = monthOrder.filter(m => months[m] !== undefined);
  const values = labels.map(m => months[m] || 0);
  const ctx = document.getElementById('events-month-bar').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Eventos por mês', data: values, backgroundColor: '#ff9f40' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

async function renderProjectStatusBarChart() {
  const status = await State.getProjectStatus();
  const ctx = document.getElementById('project-status-bar').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Concluídos', 'Em andamento'],
      datasets: [{ data: [status.concluido, status.andamento], backgroundColor: ['#4caf50', '#ff5252'] }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

async function renderTechBarChart() {
  const tech = await State.getTechUsage();
  const labels = Object.keys(tech);
  const values = Object.values(tech);
  const ctx = document.getElementById('tech-bar').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Tecnologias utilizadas', data: values, backgroundColor: '#00bcd4' }] },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }
  });
}

// Call analytics charts after dashboard init
document.addEventListener('DOMContentLoaded', async () => {
  await State.ensureReady();
  user = State.getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return; }
  if (typeof Layout !== 'undefined') await Layout.init({ active: 'dashboard' });
  renderWelcome();
  dummyStreak();
  await updateDashboardStats();
  renderProfileProgress();
  await renderPerformanceChart();
  // Render analytics charts
  await renderParticipationLineChart();
  await renderActivityPieChart();
  await renderCategoryBarChart();
  await renderEventsMonthBarChart();
  await renderProjectStatusBarChart();
  await renderTechBarChart();
  setupQuickActions();
  if (window.lucide) lucide.createIcons();
});

function downloadPerformancePDF() {
    const canvas = document.getElementById('performance-chart');
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('landscape');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save('desempenho.pdf');
}
