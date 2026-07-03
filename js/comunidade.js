/* ============================================
   SheTech — Comunidade JS (100% Supabase + Realtime)
   ============================================ */

let currentTab = 'feed';
let allLinks = [];
let allMembers = [];
let allPosts = [];
let activePostId = null;
let memberRoleFilter = 'todos';
let unsubscribeFns = [];

function mapUserToMember(user, index) {
  return {
    id: user.id || (user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '') : index + 1),
    name: user.nome_completo || user.nome_usuario || 'Membro SheTech',
    role: user.cargo || user.area || 'Membro SheTech',
    avatar: user.foto_perfil || 'assets/avatars/avatar.svg',
    skills: Array.isArray(user.habilidades) ? user.habilidades : [],
    online: true,
    email: user.email || '',
    bio: user.bio || user.biografia || '',
    fullUser: user
  };
}

function formatPostTime(createdAt) {
  if (!createdAt) return 'Agora mesmo';
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return new Date(createdAt).toLocaleDateString('pt-BR');
}

async function syncCurrentUserProfile() {
  const user = State.getCurrentUser();
  if (!user) return;
  await State.setCurrentUser(user);
}

async function loadMembers() {
  const grid = document.getElementById('members-grid');
  if (grid) grid.innerHTML = '<p style="color:var(--gray-500);padding:20px;">Carregando membros...</p>';

  await syncCurrentUserProfile();
  const users = await State.getUsers();
  allMembers = users.map((u, i) => mapUserToMember(u, i));

  const currentUser = State.getCurrentUser();
  if (currentUser) {
    const alreadyIn = allMembers.some(m => m.email === currentUser.email);
    if (!alreadyIn) allMembers.unshift(mapUserToMember(currentUser, -1));
  }

  renderMembers();
  const countEl = document.getElementById('members-count');
  if (countEl) countEl.textContent = allMembers.length > 0 ? `(${allMembers.length})` : '';
}

async function loadPosts() {
  allPosts = await State.getPosts();
  allPosts = allPosts.map(p => ({ ...p, time: p.time || formatPostTime(p.createdAt) }));
  renderFeed();
}

async function loadCommunityLinks() {
  const links = await State.getCommunityLinks();
  allLinks = links.map(l => ({
    id: l.id,
    title: l.title || l.titulo,
    url: l.url,
    desc: l.descricao || l.desc || '',
    category: l.category || l.categoria || 'Geral',
    destaque: l.destaque || false
  }));
  renderLinks();
}

function setupRealtime() {
  unsubscribeFns.forEach(fn => fn());
  unsubscribeFns = [];

  unsubscribeFns.push(
    State.subscribe('posts', () => loadPosts()),
    State.subscribe('community_links', () => loadCommunityLinks()),
    State.subscribe('users', () => loadMembers())
  );
}

document.addEventListener('DOMContentLoaded', async () => {
  await State.ensureReady();

  if (typeof Layout !== 'undefined') {
    await Layout.init({ active: 'comunidade' });
  }

  await Promise.all([loadPosts(), loadCommunityLinks(), loadMembers()]);
  setupRealtime();

  initSearch();
  document.querySelectorAll('.tabs .tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.id.replace('tab-', '')));
  });
  switchTab('feed');

  const notifDot = document.getElementById('notif-dot');
  if (notifDot) notifDot.style.display = 'block';
});

function switchTab(tab) {
  currentTab = tab;
  ['feed', 'links', 'members'].forEach(t => {
    const el = document.getElementById(`section-${t}`);
    const btn = document.getElementById(`tab-${t}`);
    const isActive = t === tab;
    if (el) el.style.display = isActive ? 'block' : 'none';
    if (btn) {
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    }
  });
}

function renderFeed(posts) {
  const list = document.getElementById('feed-list');
  if (!list) return;
  const data = posts || allPosts;
  if (data.length === 0) {
    list.innerHTML = '<p style="color:var(--gray-500);padding:20px;">Nenhum post ainda. Seja a primeira a publicar!</p>';
    return;
  }
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
    <div class="post-link-preview-wrap ${post.link.destaque ? 'post-link-preview-wrap--featured' : ''}">
      <a href="${post.link.url.startsWith('http') ? post.link.url : `https://${post.link.url}`}" target="_blank" class="post-link-preview ${post.link.destaque ? 'post-link-preview--featured' : ''}">
        <div class="post-link-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
            <div class="post-link-title">${post.link.title}</div>
            ${post.link.destaque ? '<span class="post-link-feature-badge">Destaque</span>' : ''}
          </div>
          <div class="post-link-url">${post.link.url}</div>
          ${post.link.desc ? `<div class="post-link-desc">${escapeHTML(post.link.desc)}</div>` : ''}
        </div>
      </a>
      <button class="post-link-save-btn" onclick="savePostLinkToMyLinks('${escapeHTML(post.link.title).replace(/'/g, "\\'")}', '${post.link.url}', event)" title="Salvar link" style="background:var(--pink-soft);color:var(--pink);border:none;border-radius:8px;padding:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      </button>
    </div>` : ''}
    <div class="post-footer">
      <button class="reaction-btn ${post.liked ? 'liked' : ''}" onclick="toggleLike(${post.id}, this)">
        <svg viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span id="likes-${post.id}">${post.likes || 0}</span>
      </button>
      <button class="reaction-btn" onclick="openComments(${post.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>${post.comments || 0}</span>
      </button>
      <button class="post-share" onclick="sharePost(${post.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Compartilhar
      </button>
    </div>
  </div>`;
}

async function toggleLike(postId, btn) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;
  post.liked = !post.liked;
  post.likes = (post.likes || 0) + (post.liked ? 1 : -1);
  btn.classList.toggle('liked', post.liked);
  btn.querySelector('svg').setAttribute('fill', post.liked ? 'currentColor' : 'none');
  document.getElementById(`likes-${postId}`).textContent = post.likes;
  try {
    await State.savePost(post);
  } catch (err) {
    console.error(err);
  }
}

async function createPost() {
  const field = document.getElementById('composer-field');
  const text = field.innerText.trim();
  if (!text) { showToast('Escreva algo antes de publicar.', 'error'); return; }

  const user = State.getCurrentUser();
  const imgEl = document.getElementById('preview-img');
  const hasImg = document.getElementById('media-preview').style.display !== 'none';

  const post = {
    id: Date.now(),
    author: user ? user.nome_completo : 'Membro SheTech',
    role: user ? (user.cargo || user.area || 'Membro') : 'Membro',
    avatar: user ? (user.foto_perfil || 'assets/avatars/avatar.svg') : 'assets/avatars/avatar.svg',
    time: 'Agora mesmo',
    text,
    tags: [],
    likes: 0,
    comments: 0,
    liked: false,
    image: hasImg ? imgEl.src : null,
    createdAt: new Date().toISOString()
  };

  try {
    await State.savePost(post);
    field.innerText = '';
    clearMedia();
    showToast('Post publicado! 🎉', 'success');
  } catch (err) {
    showToast('Erro ao publicar. Tente novamente.', 'error');
  }
}

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
  const field = document.getElementById('composer-field');
  const text = (field?.innerText || '').trim();
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  document.getElementById('link-titulo').value = text.replace(/^https?:\/\/[^\s]+/i, '').trim().slice(0, 60) || 'Recurso compartilhado';
  document.getElementById('link-url').value = urlMatch ? urlMatch[0] : '';
  document.getElementById('link-desc').value = '';
  document.getElementById('link-destaque').checked = true;
  openModal('link-modal');
  field?.focus();
}

function addEmoji() {
  const emojis = [
    '🚀', '💜', '✨', '🎉', '💡', '🔥', '👩‍💻', '🌟', '🤝', '🙌',
    '😍', '😂', '🤔', '😎', '👏', '💪', '🌈', '💻', '🎨', '📚',
    '🎯', '📢', '✅', '❌', '💖', '💎', '🌍', '⚡', '☕', '🍕'
  ];
  
  const existing = document.getElementById('emoji-picker-container');
  if (existing) { existing.remove(); document.getElementById('emoji-overlay')?.remove(); return; }
  
  const emojiBtn = event.currentTarget;
  const rect = emojiBtn.getBoundingClientRect();
  
  // Posicionamento inteligente: tenta abrir acima do botão
  let top = rect.top - 280; 
  let left = rect.left - 140;
  
  // Ajuste se sair da tela (topo)
  if (top < 10) top = rect.bottom + 10;
  // Ajuste se sair da tela (esquerda/direita)
  if (left < 10) left = 10;
  if (left + 320 > window.innerWidth) left = window.innerWidth - 330;

  const overlay = `<div id="emoji-overlay" class="emoji-picker-overlay"></div>`;
  const picker = `
    <div id="emoji-picker-container" class="emoji-picker-container" style="top:${top}px; left:${left}px;">
      <div class="emoji-picker-header">
        <span class="emoji-picker-title">Escolha um emoji</span>
      </div>
      <div class="emoji-grid">
        ${emojis.map(e => `<button class="emoji-item" onclick="insertEmoji('${e}')">${e}</button>`).join('')}
      </div>
    </div>`;
    
  document.body.insertAdjacentHTML('beforeend', overlay + picker);
  
  const closePicker = () => {
    document.getElementById('emoji-picker-container')?.remove();
    document.getElementById('emoji-overlay')?.remove();
  };
  
  document.getElementById('emoji-overlay').onclick = closePicker;
}

function insertEmoji(emoji) {
  const field = document.getElementById('composer-field');
  if (field) {
    field.innerText += emoji;
    // Move o cursor para o final
    field.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(field);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  document.getElementById('emoji-picker-container')?.remove();
  document.getElementById('emoji-overlay')?.remove();
}

function renderLinks(links) {
  const list = document.getElementById('links-list');
  if (!list) return;
  const data = links || allLinks;
  if (data.length === 0) {
    list.innerHTML = '<p style="color:var(--gray-500);padding:20px;">Nenhum link compartilhado ainda.</p>';
    return;
  }
  list.innerHTML = data.map(link => linkHTML(link)).join('');
}

function linkHTML(link) {
  return `
  <div class="link-card" id="link-${link.id}">
    <div class="link-header">
      <div class="link-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </div>
      <div class="link-title">${link.title}</div>
    </div>
    <div class="link-url">${link.url}</div>
    ${link.desc ? `<div class="link-desc">${link.desc}</div>` : ''}
    <div class="link-footer">
      <span class="link-category">${link.category || 'Geral'}</span>
      <button class="link-save" onclick="saveLinkToMyLinks(${link.id}, this)">Salvar</button>
    </div>
  </div>`;
}

async function saveLink(event) {
  event.preventDefault();
  const user = State.getCurrentUser();
  if (!user) return;

  const link = {
    id: Date.now(),
    title: document.getElementById('link-titulo').value.trim(),
    url: document.getElementById('link-url').value.trim(),
    descricao: document.getElementById('link-desc').value.trim(),
    category: document.getElementById('link-categoria')?.value || 'Geral',
    destaque: document.getElementById('link-destaque')?.checked || false,
    author_email: user.email
  };

  if (!link.title || !link.url) {
    showToast('Preencha título e URL.', 'error');
    return;
  }

  try {
    await State.saveCommunityLink(link);
    closeModal('link-modal');
    showToast('Link compartilhado com a comunidade!', 'success');
  } catch (err) {
    showToast('Erro ao salvar link.', 'error');
  }
}

async function saveLinkToMyLinks(id, btn) {
  const link = allLinks.find(l => l.id === id);
  const user = State.getCurrentUser();
  if (!link || !user) return;

  await State.saveLink({
    id: Date.now(),
    titulo: link.title,
    url: link.url,
    descricao: link.desc || '',
    categoria: link.category || 'Compartilhado',
    proprietaria_id: user.email
  });

  btn.textContent = '✓ Salvo';
  btn.disabled = true;
  showToast('Link salvo na sua biblioteca! 📚', 'success');
}

async function savePostLinkToMyLinks(title, url, event) {
  event.stopPropagation();
  const user = State.getCurrentUser();
  if (!user) return;

  await State.saveLink({
    id: Date.now(),
    titulo: title,
    url,
    descricao: '',
    categoria: 'Compartilhado',
    proprietaria_id: user.email
  });
  showToast('Link salvo na sua biblioteca! 📚', 'success');
}

function renderMembers(members) {
  const grid = document.getElementById('members-grid');
  const data = members || allMembers;
  if (!grid) return;
  if (!data.length) {
    grid.innerHTML = '<p style="color:var(--gray-500);padding:20px;">Nenhum membro encontrado.</p>';
    return;
  }
  grid.innerHTML = data.map(m => memberCardHTML(m)).join('');
}

function memberCardHTML(m) {
  const currentUser = State.getCurrentUser();
  const isMe = currentUser && (currentUser.email === m.email || currentUser.id === m.id);
  return `
  <div class="member-card" id="member-${m.id}">
    <div class="member-card-header">
      <img src="${m.avatar}" alt="${m.name}" class="member-avatar" onclick="viewProfile('${m.id}')" style="cursor:pointer;" />
      ${m.online ? '<span class="online-badge"></span>' : ''}
    </div>
    <div class="member-card-body">
      <div class="member-name" onclick="viewProfile('${m.id}')" style="cursor:pointer;">${m.name}</div>
      <div class="member-role">${m.role}</div>
      <div class="member-bio">${m.bio || 'Membro da comunidade'}</div>
      <div class="member-skills">${m.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
      ${isMe ? '' : `<button class="member-card-follow" onclick="followMember('${m.id}', this)">Seguir</button>`}
    </div>
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

async function viewProfile(id) {
  const member = allMembers.find(m => String(m.id) === String(id));
  let profile = member?.fullUser;

  if (!profile) {
    profile = await State.getUserById(id);
  }

  if (!profile) {
    showToast('Perfil não encontrado.', 'error');
    return;
  }

  window.location.href = 'perfil.html?user=' + encodeURIComponent(profile.id);
}

function initSearch() {
  const input = document.getElementById('community-search');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (currentTab === 'feed') {
      renderFeed(!q ? allPosts : allPosts.filter(p => p.text.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)));
    } else if (currentTab === 'links') {
      renderLinks(!q ? allLinks : allLinks.filter(l => l.title.toLowerCase().includes(q) || l.url.includes(q)));
    } else {
      filterMembers(q);
    }
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.style.display = 'flex'; modal.classList.add('show'); }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) { modal.style.display = 'none'; modal.classList.remove('show'); }
}

function postMenu(id) { showToast('Menu de opções do post #' + id, ''); }
function linkMenu(id) { showToast('Menu de opções do link #' + id, ''); }
function openComments(id) { showToast('Comentários do post #' + id, ''); }
function sharePost(id) { showToast('Compartilhando post #' + id, 'success'); }

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function showToast(message, type = '') {
  if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast(message, type);
  else console.log(`[${type || 'info'}] ${message}`);
}

window.addEventListener('beforeunload', () => {
  unsubscribeFns.forEach(fn => fn());
});
