/* ============================================
   SheTech — Comunidade JS
   ============================================ */

/* ─── DADOS MOCK ──────────────────────────── */

const CURRENT_USER = {
  id: 0,
  name: 'Ana Luiza',
  role: 'Desenvolvedora Front-end',
  avatar: 'https://i.pravatar.cc/44?img=47'
};

const MOCK_POSTS = [
  {
    id: 1,
    author: 'Carla Mendes',
    role: 'Full Stack Dev',
    avatar: 'https://i.pravatar.cc/44?img=5',
    time: '5 minutos atrás',
    text: 'Acabei de lançar meu primeiro projeto open source! 🚀 Um template de autenticação com Next.js e Prisma. Se quiserem colaborar, o PR é bem-vindo! #opensource #nextjs #carreira',
    tags: ['#opensource', '#nextjs'],
    likes: 42,
    comments: 8,
    liked: false,
    link: { title: 'she-auth — GitHub', url: 'github.com/carla/she-auth' }
  },
  {
    id: 2,
    author: 'Bia Torres',
    role: 'UX Designer',
    avatar: 'https://i.pravatar.cc/44?img=9',
    time: '32 minutos atrás',
    text: 'Dica rápida de acessibilidade: sempre use aria-label em ícones sem texto visível. Parece pequeno, mas faz uma diferença enorme para usuárias de leitores de tela. A gente faz código para todas. 💜 #uxdesign #acessibilidade',
    tags: ['#uxdesign', '#acessibilidade'],
    likes: 87,
    comments: 14,
    liked: true,
    image: null
  },
  {
    id: 3,
    author: 'Julia Costa',
    role: 'Data Scientist',
    avatar: 'https://i.pravatar.cc/44?img=16',
    time: '1 hora atrás',
    text: 'Compartilhando um recurso incrível que encontrei esta semana. O curso da fast.ai para ML prático é gratuito e absolutamente fenomenal. Recomendo para todas que estão entrando em IA/ML. #datascience #machinelearning',
    tags: ['#datascience', '#machinelearning'],
    likes: 134,
    comments: 21,
    liked: false,
    link: { title: 'Practical Deep Learning — fast.ai', url: 'course.fast.ai' }
  },
  {
    id: 4,
    author: 'Mariana Lima',
    role: 'Product Manager',
    avatar: 'https://i.pravatar.cc/44?img=21',
    time: '3 horas atrás',
    text: 'Reflexão do dia: produto sem diversidade nas equipes é produto com pontos cegos. Precisamos de mais mulheres tomando decisões sobre o que construímos. Nossa perspectiva não é diferencial — é necessidade. #mulhereslíderes #product',
    tags: ['#mulhereslíderes', '#product'],
    likes: 203,
    comments: 37,
    liked: false
  }
];

const MOCK_LINKS = [
  { id: 1, title: 'Roadmap Desenvolvedor Full Stack 2024', url: 'https://roadmap.sh', desc: 'Guia visual com todas as habilidades necessárias para se tornar full stack.', categoria: 'Referência' },
  { id: 2, title: 'CSS Grid — Guia Completo', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', desc: 'O recurso mais completo sobre CSS Grid que você vai encontrar online.', categoria: 'Tutorial' },
  { id: 3, title: 'Figma — Design colaborativo', url: 'https://figma.com', desc: 'Ferramenta essencial para design de interfaces, gratuita para estudantes.', categoria: 'Ferramenta' },
  { id: 4, title: 'Women Who Code', url: 'https://womenwhocode.com', desc: 'Comunidade global que apoia mulheres em carreiras de tecnologia.', categoria: 'Referência' },
  { id: 5, title: 'JavaScript.info', url: 'https://javascript.info', desc: 'Tutorial moderno de JavaScript do zero ao avançado, em português.', categoria: 'Tutorial' },
  { id: 6, title: 'Vercel — Deploy instantâneo', url: 'https://vercel.com', desc: 'Plataforma de hospedagem gratuita para projetos front-end.', categoria: 'Ferramenta' }
];

const MOCK_MEMBERS = [
  { id: 1,  name: 'Carla Mendes',   role: 'Full Stack Dev',      avatar: 'https://i.pravatar.cc/60?img=5',  online: true,  skills: ['React', 'Node.js'] },
  { id: 2,  name: 'Bia Torres',     role: 'UX Designer',         avatar: 'https://i.pravatar.cc/60?img=9',  online: true,  skills: ['Figma', 'UX'] },
  { id: 3,  name: 'Julia Costa',    role: 'Data Scientist',       avatar: 'https://i.pravatar.cc/60?img=16', online: true,  skills: ['Python', 'ML'] },
  { id: 4,  name: 'Mariana Lima',   role: 'Product Manager',      avatar: 'https://i.pravatar.cc/60?img=21', online: false, skills: ['Product', 'Scrum'] },
  { id: 5,  name: 'Sofia Andrade',  role: 'DevOps Engineer',      avatar: 'https://i.pravatar.cc/60?img=25', online: false, skills: ['Docker', 'AWS'] },
  { id: 6,  name: 'Letícia Rocha',  role: 'Desenvolvedora iOS',   avatar: 'https://i.pravatar.cc/60?img=32', online: true,  skills: ['Swift', 'iOS'] },
  { id: 7,  name: 'Fernanda Cruz',  role: 'Back-end Developer',   avatar: 'https://i.pravatar.cc/60?img=44', online: false, skills: ['Java', 'Spring'] },
  { id: 8,  name: 'Priya Sharma',   role: 'Data Analyst',         avatar: 'https://i.pravatar.cc/60?img=48', online: true,  skills: ['SQL', 'Power BI'] },
  { id: 9,  name: 'Amanda Souza',   role: 'Desenvolvedora',       avatar: 'https://i.pravatar.cc/60?img=51', online: false, skills: ['Vue.js', 'Firebase'] },
  { id: 10, name: 'Tatiana Alves',  role: 'Designer de Produto',  avatar: 'https://i.pravatar.cc/60?img=56', online: false, skills: ['Figma', 'Motion'] },
  { id: 11, name: 'Renata Faria',   role: 'Full Stack Dev',       avatar: 'https://i.pravatar.cc/60?img=60', online: true,  skills: ['React', 'GraphQL'] },
  { id: 12, name: 'Camila Duarte',  role: 'Product Manager',      avatar: 'https://i.pravatar.cc/60?img=63', online: false, skills: ['Product', 'OKRs'] }
];

/* ─── ESTADO ──────────────────────────────── */

let currentTab    = 'feed';
let allLinks      = [...MOCK_LINKS];
let allMembers    = [...MOCK_MEMBERS];
let allPosts      = [...MOCK_POSTS];
let activePostId  = null;
let nextLinkId    = MOCK_LINKS.length + 1;
let nextPostId    = MOCK_POSTS.length + 1;

/* ─── INIT ────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Persistência da sidebar
  const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (collapsed) {
    document.body.classList.add('sidebar-collapsed');
  }

  // Personalização da saudação e limpeza da sidebar inferior
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    const firstName = user.nome_completo.split(' ')[0];
    const topName = document.getElementById('top-name');
    const welcomeName = document.getElementById('welcome-name');
    const sidebarUser = document.querySelector('.sidebar-user');
    
    if (topName) topName.innerText = `Olá, ${firstName}`;
    if (welcomeName) welcomeName.innerText = firstName;
    if (sidebarUser) sidebarUser.innerHTML = ''; // Remove Analuiza Desenvolvedora
  }

  renderFeed();
  renderLinks();
  renderMembers();
  initSearch();
  const notifDot = document.getElementById('notif-dot');
  if (notifDot) notifDot.style.display = 'block';
});

/* ─── TABS ────────────────────────────────── */

function switchTab(tab) {
  currentTab = tab;
  ['feed', 'links', 'members'].forEach(t => {
    const el = document.getElementById(`section-${t}`);
    const btn = document.getElementById(`tab-${t}`);
    el.style.display = t === tab ? '' : 'none';
    btn.classList.toggle('active', t === tab);
  });
}

/* ─── FEED ────────────────────────────────── */

function renderFeed(posts) {
  const list = document.getElementById('feed-list');
  const data = posts || allPosts;
  list.innerHTML = data.map(post => postHTML(post)).join('');
}

function postHTML(post) {
  const text = escapeHTML(post.text).replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
  return `
  <div class="post-card" id="post-${post.id}">
    <div class="post-header">
      <img src="${post.avatar}" alt="${post.author}" class="post-avatar" />
      <div class="post-meta">
        <div class="post-author">${post.author}</div>
        <div class="post-info">
          <span class="post-role-badge">${post.role}</span>
          · ${post.time}
        </div>
      </div>
      <button class="post-options" onclick="postMenu(${post.id})" title="Opções">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
    </div>

    <div class="post-text">${text}</div>

    ${post.image ? `<img src="${post.image}" class="post-image" alt="imagem do post" />` : ''}
    
    ${post.link ? `
    <a href="https://${post.link.url}" target="_blank" class="post-link-preview">
      <div class="post-link-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </div>
      <div>
        <div class="post-link-title">${post.link.title}</div>
        <div class="post-link-url">${post.link.url}</div>
      </div>
    </a>` : ''}

    <div class="post-footer">
      <button class="reaction-btn ${post.liked ? 'liked' : ''}" onclick="toggleLike(${post.id}, this)">
        <svg viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span id="likes-${post.id}">${post.likes}</span>
      </button>
      <button class="reaction-btn" onclick="openComments(${post.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>${post.comments}</span>
      </button>
      <button class="post-share" onclick="sharePost(${post.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Compartilhar
      </button>
    </div>
  </div>`;
}

function toggleLike(postId, btn) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
  btn.classList.toggle('liked', post.liked);
  const svg = btn.querySelector('svg');
  svg.setAttribute('fill', post.liked ? 'currentColor' : 'none');
  document.getElementById(`likes-${postId}`).textContent = post.likes;
}

function createPost() {
  const field = document.getElementById('composer-field');
  const text = field.innerText.trim();
  if (!text) { showToast('Escreva algo antes de publicar.', 'error'); return; }

  const imgEl = document.getElementById('preview-img');
  const hasImg = document.getElementById('media-preview').style.display !== 'none';

  const post = {
    id: nextPostId++,
    author: CURRENT_USER.name,
    role: CURRENT_USER.role,
    avatar: CURRENT_USER.avatar,
    time: 'Agora mesmo',
    text,
    tags: [],
    likes: 0,
    comments: 0,
    liked: false,
    image: hasImg ? imgEl.src : null
  };

  allPosts.unshift(post);
  field.innerText = '';
  clearMedia();
  renderFeed();
  showToast('Post publicado! 🎉', 'success');
}

/* ─── MEDIA ───────────────────────────────── */

function previewMedia(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('preview-img').src = ev.target.result;
    document.getElementById('media-preview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearMedia() {
  document.getElementById('media-preview').style.display = 'none';
  document.getElementById('preview-img').src = '';
  document.getElementById('post-file').value = '';
}

function expandComposer() {
  document.getElementById('composer-footer').style.display = 'flex';
}

function addLink() {
  const url = prompt('Cole a URL do link:');
  if (!url) return;
  const field = document.getElementById('composer-field');
  field.innerText += (field.innerText ? '\n' : '') + url;
}

function addEmoji() {
  const emojis = ['🚀', '💜', '✨', '🎉', '💡', '🔥', '👩‍💻', '🌟', '🤝', '🙌'];
  const e = emojis[Math.floor(Math.random() * emojis.length)];
  const field = document.getElementById('composer-field');
  field.innerText += e;
  field.focus();
}

/* ─── COMMENTS MODAL ──────────────────────── */

const MOCK_COMMENTS = {
  1: [
    { id: 1, author: 'Bia Torres', avatar: 'https://i.pravatar.cc/32?img=9', text: 'Uau! Parabéns, Carla! Vou dar uma olhada no repositório.', time: '3min' },
    { id: 2, author: 'Julia Costa', avatar: 'https://i.pravatar.cc/32?img=16', text: 'Que orgulho! Open source é a melhor escola 🚀', time: '7min' }
  ],
  2: [
    { id: 1, author: 'Carla Mendes', avatar: 'https://i.pravatar.cc/32?img=5', text: 'Tão importante essa dica! Já apliquei no meu projeto hoje.', time: '20min' }
  ],
  3: [],
  4: []
};

function openComments(postId) {
  activePostId = postId;
  const list = document.getElementById('comments-list');
  const comments = MOCK_COMMENTS[postId] || [];
  list.innerHTML = comments.length
    ? comments.map(c => commentHTML(c)).join('')
    : '<p style="color:var(--text-3); font-size:13px; text-align:center; padding:24px 0;">Nenhum comentário ainda. Seja a primeira! 💬</p>';
  openModal('comments-modal');
}

function commentHTML(c) {
  return `
  <div class="comment-item">
    <img src="${c.avatar}" alt="${c.author}" />
    <div class="comment-bubble">
      <strong>${c.author}</strong>
      <p>${escapeHTML(c.text)}</p>
      <div class="comment-time">${c.time}</div>
    </div>
  </div>`;
}

function submitComment() {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text) return;
  const comment = { id: Date.now(), author: CURRENT_USER.name, avatar: CURRENT_USER.avatar, text, time: 'Agora' };
  if (!MOCK_COMMENTS[activePostId]) MOCK_COMMENTS[activePostId] = [];
  MOCK_COMMENTS[activePostId].push(comment);
  const list = document.getElementById('comments-list');
  const p = list.querySelector('p');
  if (p) p.remove();
  list.insertAdjacentHTML('beforeend', commentHTML(comment));
  list.scrollTop = list.scrollHeight;
  input.value = '';

  const post = allPosts.find(p => p.id === activePostId);
  if (post) {
    post.comments++;
    const card = document.getElementById(`post-${activePostId}`);
    if (card) {
      const btns = card.querySelectorAll('.reaction-btn');
      btns.forEach(b => {
        const spans = b.querySelectorAll('span');
        if (spans.length && b.textContent.includes(post.comments - 1)) {
          spans[0].textContent = post.comments;
        }
      });
    }
  }
}

/* ─── LINKS ───────────────────────────────── */

let currentLinkFilter = 'todos';

function renderLinks(filter) {
  const grid = document.getElementById('links-grid');
  const data = filter && filter !== 'todos'
    ? allLinks.filter(l => l.categoria === filter)
    : allLinks;
  grid.innerHTML = data.map(l => linkCardHTML(l)).join('');
}

function linkCardHTML(link) {
  return `
  <div class="link-card" data-cat="${link.categoria}" id="link-${link.id}">
    <div class="link-card-top">
      <div class="link-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </div>
      <span class="link-cat-badge">${link.categoria}</span>
    </div>
    <div class="link-card-title">${escapeHTML(link.title)}</div>
    ${link.desc ? `<div class="link-card-desc">${escapeHTML(link.desc)}</div>` : ''}
    <div class="link-card-url">${link.url}</div>
    <div class="link-card-footer">
      <a href="${link.url}" target="_blank" class="link-open-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Abrir
      </a>
      <button class="link-del-btn" onclick="deleteLink(${link.id})" title="Remover">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  </div>`;
}

function filterLinks(cat, btn) {
  currentLinkFilter = cat;
  document.querySelectorAll('.links-filter .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderLinks(cat === 'todos' ? null : cat);
}

function saveLink(e) {
  e.preventDefault();
  const title = document.getElementById('link-titulo').value.trim();
  const url   = document.getElementById('link-url').value.trim();
  const desc  = document.getElementById('link-desc').value.trim();
  const cat   = document.getElementById('link-categoria').value;
  if (!title || !url) return;

  allLinks.unshift({ id: nextLinkId++, title, url, desc, categoria: cat });
  renderLinks(currentLinkFilter === 'todos' ? null : currentLinkFilter);
  closeModal('link-modal');
  document.getElementById('link-form').reset();
  showToast('Link salvo! 🔗', 'success');
}

function deleteLink(id) {
  if (!confirm('Remover este link?')) return;
  allLinks = allLinks.filter(l => l.id !== id);
  renderLinks(currentLinkFilter === 'todos' ? null : currentLinkFilter);
  showToast('Link removido.');
}

/* ─── MEMBERS ─────────────────────────────── */

let memberRoleFilter = 'todos';

function renderMembers(list) {
  const grid = document.getElementById('members-grid');
  const data = list || allMembers;
  grid.innerHTML = data.map(m => memberCardHTML(m)).join('');
}

function memberCardHTML(m) {
  return `
  <div class="member-card" id="member-${m.id}">
    <div class="member-avatar-wrap">
      <img src="${m.avatar}" alt="${m.name}" />
      ${m.online ? '<span class="online-indicator"></span>' : ''}
    </div>
    <div class="member-card-name">${m.name}</div>
    <div class="member-card-role">${m.role}</div>
    <div class="member-card-skills">
      ${m.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
    </div>
    <button class="member-card-follow" onclick="followMember(${m.id}, this)">Seguir</button>
  </div>`;
}

function filterMemberRole(role, btn) {
  memberRoleFilter = role;
  document.querySelectorAll('.members-filter .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const filtered = role === 'todos' ? allMembers : allMembers.filter(m => m.role.includes(role));
  renderMembers(filtered);
}

function filterMembers(query) {
  const q = query.toLowerCase();
  const filtered = !q
    ? (memberRoleFilter === 'todos' ? allMembers : allMembers.filter(m => m.role.includes(memberRoleFilter)))
    : allMembers.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.skills.some(s => s.toLowerCase().includes(q)));
  renderMembers(filtered);
}

function followMember(id, btn) {
  const following = btn.classList.toggle('following');
  btn.textContent = following ? 'Seguindo ✓' : 'Seguir';
  showToast(following ? 'Você começou a seguir! 💜' : 'Deixou de seguir.', following ? 'success' : '');
}

function followUser(btn) {
  const following = btn.classList.toggle('following');
  btn.textContent = following ? 'Seguindo' : 'Seguir';
}

function viewProfile(id) {
  showToast('Abrindo perfil…');
}

/* ─── SEARCH ──────────────────────────────── */

function initSearch() {
  const input = document.getElementById('community-search');
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (currentTab === 'feed') {
      if (!q) { renderFeed(); return; }
      renderFeed(allPosts.filter(p => p.text.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)));
    } else if (currentTab === 'links') {
      if (!q) { renderLinks(); return; }
      renderLinks(allLinks.filter(l => l.title.toLowerCase().includes(q) || l.url.includes(q)));
    } else if (currentTab === 'members') {
      filterMembers(q);
    }
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); input.focus(); }
  });
}

/* ─── MODALS ──────────────────────────────── */

function openModal(id) {
  const el = document.getElementById(id);
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

function closeOnOverlay(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

/* ─── NOTIFICATIONS ───────────────────────── */

function toggleNotifications() {
  const dd = document.getElementById('notif-dropdown');
  dd.classList.toggle('open');
  if (dd.classList.contains('open')) {
    document.getElementById('notif-dot').style.display = 'none';
    document.addEventListener('click', closeNotifOnOutside);
  }
}

function closeNotifOnOutside(e) {
  const dd = document.getElementById('notif-dropdown');
  const btn = document.getElementById('notif-btn');
  if (!dd.contains(e.target) && !btn.contains(e.target)) {
    dd.classList.remove('open');
    document.removeEventListener('click', closeNotifOnOutside);
  }
}

function markAllRead() {
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  showToast('Todas marcadas como lidas.', 'success');
}

/* ─── SIDEBAR ─────────────────────────────── */

function toggleSidebar() {
  // Se estiver em mobile (resolução baixa), o toggle controla a visibilidade (abrir/fechar)
  if (window.innerWidth <= 820) {
    document.getElementById('sidebar').classList.toggle('open');
  } else {
    // Em desktop, o toggle controla o estado encolhido (sidebar-collapsed)
    document.body.classList.toggle('sidebar-collapsed');
    const isCollapsed = document.body.classList.contains('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  }
}

/* ─── POST OPTIONS ────────────────────────── */

function postMenu(id) {
  const post = allPosts.find(p => p.id === id);
  const isOwn = post && post.author === CURRENT_USER.name;
  const action = isOwn
    ? confirm('Excluir este post?') && deletePost(id)
    : showToast('Post reportado. Obrigada!', 'success');
}

function deletePost(id) {
  allPosts = allPosts.filter(p => p.id !== id);
  renderFeed();
  showToast('Post removido.', 'success');
}

function sharePost(id) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href + '#post-' + id);
    showToast('Link copiado para a área de transferência! 🔗', 'success');
  } else {
    showToast('Compartilhamento não disponível neste ambiente.');
  }
}

/* ─── TOAST ───────────────────────────────── */

let toastTimer;
function showToast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ─── UTILS ───────────────────────────────── */

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}