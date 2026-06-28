/* ============================================
   SheTech — Perfil JS
   Tabs, filtro de timeline, share, interações
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─── TABS ───────────────────────────────── */
  const tabs     = document.querySelectorAll('.profile-tab');
  const panels   = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t  => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const panel = document.getElementById(`tab-${target}`);
      if (panel) panel.classList.add('active');
    });
  });

  /* ─── FILTRO TIMELINE ────────────────────── */
  const filterBtns  = document.querySelectorAll('.tl-filter-btn');
  const tlItems     = document.querySelectorAll('.tl-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tlItems.forEach(item => {
        if (filter === 'all' || item.dataset.type === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });

      // reposiciona a linha vertical após filtrar
      updateTimelineLine();
    });
  });

  function updateTimelineLine() {
    // Força o reflow para a pseudoclasse ::before recalcular
    const timeline = document.querySelector('.timeline');
    if (timeline) {
      timeline.style.display = 'none';
      // eslint-disable-next-line no-unused-expressions
      timeline.offsetHeight; // força reflow
      timeline.style.display = '';
    }
  }

  /* ─── SHARE BUTTON ───────────────────────── */
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const url  = window.location.href;
      const name = document.getElementById('profile-name')?.textContent || 'SheTech';

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${name} — SheTech`,
            url,
          });
        } catch {
          // usuário cancelou
        }
      } else {
        try {
          await navigator.clipboard.writeText(url);
          showToast('Link copiado!');
        } catch {
          showToast('Não foi possível copiar o link.');
        }
      }
    });
  }

  /* ─── BADGE TOOLTIP ──────────────────────── */
  // Usa o atributo title nativo; melhoria futura: tooltip personalizado

  /* ─── CARREGAR DADOS DO USUÁRIO ──────────── */
  // Integra com o sistema existente (app.js / layout.js)
  // Se houver um usuário logado salvo em localStorage, popula os campos
  loadUserData();

  function loadUserData() {
    try {
      const stored = localStorage.getItem('shetech_user');
      if (!stored) return;

      const user = JSON.parse(stored);

      setField('profile-name',    user.name);
      setField('profile-user',    user.username ? `@${user.username}` : null);
      setField('profile-bio',     user.bio);
      setField('profile-email',   user.email);
      setField('profile-location', user.location);
      setField('profile-role',    user.role);
      setField('profile-company', user.company);
      setField('profile-website', user.website);
      setField('profile-date',    formatDate(user.createdAt));

      setField('top-name', user.name);

      // Contadores
      setField('stat-projetos',   user.projectCount  ?? '—');
      setField('stat-eventos',    user.eventCount    ?? '—');
      setField('stat-conexoes',   user.connections   ?? '—');
      setField('stat-conquistas', user.badgeCount    ?? '—');

      // Avatares
      if (user.avatarUrl) {
        setAttr('profile-avatar', 'src', user.avatarUrl);
        setAttr('top-avatar',     'src', user.avatarUrl);
      }

      // Skills
      if (Array.isArray(user.skills) && user.skills.length) {
        const skillsList = document.getElementById('skills-list');
        if (skillsList) {
          skillsList.innerHTML = user.skills
            .map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`)
            .join('');
        }
      }

    } catch (e) {
      // dados corrompidos — silencia e usa os defaults do HTML
      console.warn('perfil.js: erro ao carregar dados do usuário', e);
    }
  }

  /* ─── HELPERS ────────────────────────────── */
  function setField(id, value) {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setAttr(id, attr, value) {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
  }

  function formatDate(iso) {
    if (!iso) return null;
    try {
      return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  /* ─── TOAST ──────────────────────────────── */
  function showToast(msg, type = '') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = msg;
    toast.className   = `toast${type ? ` ${type}` : ''} show`;

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // expõe para uso externo (ex: app.js)
  window.showToast = showToast;

  /* ─── ANIMAÇÃO DE ENTRADA DA TIMELINE ──────── */
  // Intersection Observer para animar os itens ao scrollar
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateX(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    tlItems.forEach((item, i) => {
      item.style.opacity   = '0';
      item.style.transform = 'translateX(-12px)';
      item.style.transition = `opacity .35s ease ${i * 60}ms, transform .35s ease ${i * 60}ms`;
      observer.observe(item);
    });
  }

});