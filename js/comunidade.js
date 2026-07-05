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

function isUserOnline(user) {
  // O usuário atual logado é sempre considerado online
  const currentUser = State.getCurrentUser();
  if (currentUser && (user.id === currentUser.id || user.email === currentUser.email)) return true;

  // Quem atualizou o perfil nas últimas 24h é considerado online
  const lastActivity = user.updatedAt || user.updated_at || user.createdAt || user.created_at;
  if (!lastActivity) return false;
  const diff = Date.now() - new Date(lastActivity).getTime();
  return diff < 24 * 60 * 60 * 1000; // 24 horas em ms
}

function mapUserToMember(user, index) {
  return {
    id: user.id || (user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '') : index + 1),
    name: user.nome_completo || user.nome_usuario || 'Membro SheTech',
    role: user.cargo || user.area || 'Membro SheTech',
    avatar: user.foto_perfil || 'assets/avatars/avatar.svg',
    skills: Array.isArray(user.habilidades) ? user.habilidades : [],
    online: isUserOnline(user),
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
  
  // CORREÇÃO: apenas atualiza os ícones visuais na página.
  // Removida a chamada a State.setCurrentUser(user) que sobrescrevia
  // foto_perfil e capa_perfil no banco com dados potencialmente incompletos
  // do cache local.
  updateAllProfileIcons(user);
}

function updateAllProfileIcons(user) {
  if (!user) return;
  const avatarUrl = user.foto_perfil || 'assets/avatars/avatar.svg';
  const userIdClass = `user-avatar-${user.id || user.email.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // 1. Avatar do composer
  const composerAvatar = document.querySelector('.composer-avatar');
  if (composerAvatar) composerAvatar.src = avatarUrl;
  
  // 2. Avatar na topbar
  const topAvatar = document.getElementById('top-avatar');
  if (topAvatar) topAvatar.src = avatarUrl;

  // 3. Avatar na sidebar
  const sidebarAvatar = document.querySelector('.sidebar-user img');
  if (sidebarAvatar) sidebarAvatar.src = avatarUrl;

  // 4. Avatares em posts e comentários (global por classe)
  document.querySelectorAll(`.${userIdClass}`).forEach(img => {
    img.src = avatarUrl;
  });

  // 5. CORREÇÃO: Avatar do modal de comentários
  const commentAvatar = document.getElementById('comment-avatar');
  if (commentAvatar) commentAvatar.src = avatarUrl;

  // 6. Atualizar o cache de membros
  if (allMembers && allMembers.length > 0) {
    const memberIndex = allMembers.findIndex(m => m.email === user.email);
    if (memberIndex !== -1) {
      allMembers[memberIndex].avatar = avatarUrl;
      if (currentTab === 'members') renderMembers();
    }
  }
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

  // Atualizar widget Membras Ativas após carregar membros
  updateSidebarWidgets();
}

async function loadPosts() {
  allPosts = await State.getPosts();
  allPosts = allPosts.map(p => ({ ...p, time: p.time || formatPostTime(p.createdAt) }));
  renderFeed();
  // Atualizar widget Trending após carregar posts
  updateSidebarWidgets();
}

async function loadCommunityLinks() {
  const links = await State.getCommunityLinks();
  const client = State._client();

  // URLs que já estão vinculadas a posts no feed não devem aparecer na aba Links.
  const postLinkUrls = new Set(
    allPosts
      .filter(p => p.link?.url)
      .map(p => p.link.url.trim().toLowerCase())
  );

  // Remove silenciosamente do banco os community_links que são cópias de links de posts.
  // Isso limpa entradas antigas que ficaram para trás.
  if (client && postLinkUrls.size > 0) {
    const orphans = links.filter(l => postLinkUrls.has((l.url || '').trim().toLowerCase()));
    if (orphans.length > 0) {
      const orphanIds = orphans.map(l => l.id);
      // Não aguarda — operação de limpeza em background
      client.from('community_links').delete().in('id', orphanIds).then(({ error }) => {
        if (error) console.warn('[loadCommunityLinks] Limpeza parcial:', error.message);
      });
    }
  }

  // Exibe apenas links que não são duplicatas de posts do feed
  allLinks = links
    .filter(l => !postLinkUrls.has((l.url || '').trim().toLowerCase()))
    .map(l => ({
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
    State.subscribe('users', async () => {
      await loadMembers();
      const user = State.getCurrentUser();
      if (user) updateAllProfileIcons(user);
    }),
    State.subscribe('comments', () => {
      if (currentCommentsPostId) {
        State.getComments(currentCommentsPostId).then(renderComments);
      }
    })
  );
}

document.addEventListener('DOMContentLoaded', async () => {
  await State.ensureReady();

  if (typeof Layout !== 'undefined') {
    await Layout.init({ active: 'comunidade' });
  }

  // Posts primeiro — loadCommunityLinks depende de allPosts para filtrar duplicatas
  await loadPosts();
  await Promise.all([loadCommunityLinks(), loadMembers()]);
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
  ['feed', 'members'].forEach(t => {
    const el = document.getElementById(`section-${t}`);
    const btn = document.getElementById(`tab-${t}`);
    const isActive = t === tab;
    if (el) el.style.display = isActive ? 'block' : 'none';
    if (btn) {
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    }
  });

  if (tab === 'feed') {
    updateSidebarWidgets();
  }
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
  const user = State.getCurrentUser();

  // Comparação robusta: normaliza para string e verifica id, email e nome
  // Cobre posts antigos sem author_id, variações de tipo e posts salvos antes do login
  const isOwner = user && (
    (post.author_id    && String(post.author_id)    === String(user.id))    ||
    (post.author_email && String(post.author_email) === String(user.email)) ||
    (post.author       && user.nome_completo && post.author === user.nome_completo)
  );
  const text = escapeHTML(post.text).replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
  return `
  <div class="post-card" id="post-${post.id}" data-author-email="${post.author_email}">
    <div class="post-header">
      <img src="${post.avatar}" alt="${post.author}" class="post-avatar user-avatar-${post.author_id || post.author_email.replace(/[^a-zA-Z0-9]/g, '')}" />
      <div class="post-meta">
        <div class="post-author">${post.author}</div>
        <div class="post-info">
          <span class="post-role-badge">${post.role}</span>
          · ${post.time}
        </div>
      </div>
      <div style="position:relative">
        <button class="post-options" onclick="togglePostMenu(${post.id}, event)" title="Opções" ${!isOwner ? 'style="display:none"' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
        <div class="post-dropdown-menu" id="post-menu-${post.id}" style="display:none">
          <button class="post-dropdown-item" onclick="openEditPost(${post.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button class="post-dropdown-item post-dropdown-item--danger" onclick="confirmDeletePost(${post.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Excluir
          </button>
        </div>
      </div>
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
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button class="post-link-save-btn" onclick="savePostLinkToMyLinks('${escapeHTML(post.link.title).replace(/'/g, "\\'")}', '${post.link.url}', event)" title="Salvar link" style="background:var(--pink-soft);color:var(--pink);border:none;border-radius:8px;padding:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        </button>
      </div>
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

let currentPostLink = null;

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
    author_id: user ? user.id : null,
    author_email: user ? user.email : null,
    time: 'Agora mesmo',
    text,
    tags: [],
    likes: 0,
    comments: 0,
    liked: false,
    image: hasImg ? imgEl.src : null,
    link: currentPostLink,
    createdAt: new Date().toISOString()
  };

  try {
    await State.savePost(post);

    field.innerText = '';
    clearMedia();
    currentPostLink = null;
    // Limpa a prévia do link no composer
    const preview = document.getElementById('composer-link-preview');
    if (preview) preview.style.display = 'none';

    // Recarrega o feed imediatamente — não depende do realtime
    await loadPosts();

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
  const list = document.getElementById('links-grid');
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
  <div class="link-card ${link.destaque ? 'link-card--featured' : ''}" id="link-${link.id}">
    <div class="link-card-top">
      <div class="link-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </div>
      <div style="flex:1;">
        <div class="link-card-title">${link.title}</div>
        ${link.destaque ? '<span class="link-feature-badge">✨ Destaque</span>' : ''}
      </div>
    </div>
    <div class="link-card-url" title="${link.url}">${link.url}</div>
    ${link.desc ? `<div class="link-card-desc">${link.desc}</div>` : ''}
    <div class="link-card-footer">
      <span class="link-cat-badge">${link.category || 'Geral'}</span>
      <div style="display:flex;gap:6px;">
        <button onclick="copyLinkToClipboard('${link.url}')" class="link-open-btn" title="Copiar link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          Copiar
        </button>
        <button onclick="saveLinkToMyLinks(${link.id}, this)" class="link-open-btn" title="Salvar link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Salvar
        </button>
      </div>
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
    desc: document.getElementById('link-desc').value.trim(),
    category: document.getElementById('link-categoria')?.value || 'Geral',
    destaque: document.getElementById('link-destaque')?.checked || false,
    author_email: user.email
  };

  if (!link.title || !link.url) {
    showToast('Preencha título e URL.', 'error');
    return;
  }

  try {
    if (currentTab === 'feed') {
      // Armazena o link e mostra a prévia no composer
      currentPostLink = link;
      showComposerLinkPreview(link);
      showToast('Link anexado ao post!', 'success');
    } else {
      await State.saveCommunityLink(link);
      showToast('Link compartilhado com a comunidade!', 'success');
    }
    closeModal('link-modal');
  } catch (err) {
    showToast('Erro ao salvar link.', 'error');
  }
}

function showComposerLinkPreview(link) {
  const preview = document.getElementById('composer-link-preview');
  if (!preview) return;
  document.getElementById('composer-link-title').textContent = link.title || link.url;
  document.getElementById('composer-link-url').textContent   = link.url;
  preview.style.display = 'flex';
}

function removeComposerLink() {
  currentPostLink = null;
  const preview = document.getElementById('composer-link-preview');
  if (preview) preview.style.display = 'none';
  showToast('Link removido.', '');
}

async function saveLinkToMyLinks(id, btn) {
  const link = allLinks.find(l => l.id === id);
  const user = State.getCurrentUser();
  if (!link || !user) return;

  try {
    const folder = await State.ensureCommunityFolder(user.email);

    await State.saveLink({
      id: Date.now(),
      titulo: link.title,
      url: link.url,
      descricao: link.desc || '',
      categoria: link.category || 'Compartilhado',
      folderId: folder ? folder.id : null,
      proprietaria_id: user.email
    });

    btn.textContent = '✓ Salvo';
    btn.disabled = true;
    showToast('Link salvo na pasta "Links da Comunidade"!', 'success');
  } catch (err) {
    console.error('[saveLinkToMyLinks] Erro:', err);
    showToast('Erro ao salvar link.', 'error');
  }
}

async function savePostLinkToMyLinks(title, url, event) {
  event.stopPropagation();
  const user = State.getCurrentUser();
  if (!user) return;

  try {
    const folder = await State.ensureCommunityFolder(user.email);

    await State.saveLink({
      id: Date.now(),
      titulo: title,
      url,
      descricao: '',
      categoria: 'Compartilhado',
      folderId: folder ? folder.id : null,
      proprietaria_id: user.email
    });
    showToast('Link salvo na pasta "Links da Comunidade"!', 'success');
  } catch (err) {
    console.error('[savePostLinkToMyLinks] Erro:', err);
    showToast('Erro ao salvar link.', 'error');
  }
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

let editingPostId = null;
let editingPostLink = null;

function togglePostMenu(id, event) {
  event.stopPropagation();
  const allMenus = document.querySelectorAll('.post-dropdown-menu');
  allMenus.forEach(menu => {
    if (menu.id !== `post-menu-${id}`) menu.style.display = 'none';
  });
  
  const menu = document.getElementById(`post-menu-${id}`);
  if (menu) {
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }
}

document.addEventListener('click', () => {
  document.querySelectorAll('.post-dropdown-menu').forEach(menu => menu.style.display = 'none');
});

function openEditPost(id) {
  const post = allPosts.find(p => p.id === id);
  if (!post) return;
  
  editingPostId = id;
  editingPostLink = post.link ? { ...post.link } : null;
  
  const modal = document.getElementById('edit-post-modal');
  const textArea = document.getElementById('edit-post-text');
  const mediaPreview = document.getElementById('edit-post-media-preview');
  const previewImg = document.getElementById('edit-preview-img');
  const linkInfo = document.getElementById('edit-post-link-info');
  const linkTitle = document.getElementById('edit-link-title');
  const linkUrl = document.getElementById('edit-link-url');
  
  textArea.value = post.text;
  
  if (post.image) {
    previewImg.src = post.image;
    mediaPreview.style.display = 'block';
    document.getElementById('remove-image-btn').style.display = 'block';
  } else {
    previewImg.src = '';
    mediaPreview.style.display = 'none';
    document.getElementById('remove-image-btn').style.display = 'none';
  }

  if (editingPostLink) {
    linkTitle.textContent = editingPostLink.title;
    linkUrl.textContent = editingPostLink.url;
    linkInfo.style.display = 'block';
    document.getElementById('remove-link-btn').style.display = 'block';
  } else {
    linkInfo.style.display = 'none';
    document.getElementById('remove-link-btn').style.display = 'none';
  }
  
  openModal('edit-post-modal');
}

function previewEditMedia(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('edit-preview-img').src = ev.target.result;
    document.getElementById('edit-post-media-preview').style.display = 'block';
    document.getElementById('remove-image-btn').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearEditMedia() {
  document.getElementById('edit-post-media-preview').style.display = 'none';
  document.getElementById('edit-preview-img').src = '';
  document.getElementById('edit-post-file').value = '';
  document.getElementById('remove-image-btn').style.display = 'none';
}

function removeEditLink() {
  editingPostLink = null;
  document.getElementById('edit-post-link-info').style.display = 'none';
  document.getElementById('remove-link-btn').style.display = 'none';
  showToast('Link removido do rascunho.', '');
}

function promptReplaceLink() {
  if (typeof Layout !== 'undefined' && Layout.showSuccessModal) {
    Layout.showSuccessModal('Substituir Link', 'Você deseja alterar o link desta postagem? Clique em continuar para abrir o formulário.', () => {
      // Abrir o novo modal personalizado
      document.getElementById('replace-link-title').value = editingPostLink ? editingPostLink.title : '';
      document.getElementById('replace-link-url').value = editingPostLink ? editingPostLink.url : '';
      openModal('replace-link-modal');
    });
  } else {
    // Fallback básico se o Layout falhar
    const url = prompt('URL:', editingPostLink ? editingPostLink.url : '');
    if (url) confirmReplaceLinkManual(url);
  }
}

function confirmReplaceLink(event) {
  event.preventDefault();
  const title = document.getElementById('replace-link-title').value.trim();
  const url = document.getElementById('replace-link-url').value.trim();
  
  if (!title || !url) return;

  editingPostLink = {
    title: title,
    url: url,
    desc: editingPostLink ? editingPostLink.desc : '',
    destaque: editingPostLink ? editingPostLink.destaque : true
  };

  const linkInfo = document.getElementById('edit-post-link-info');
  document.getElementById('edit-link-title').textContent = title;
  document.getElementById('edit-link-url').textContent = url;
  linkInfo.style.display = 'block';
  document.getElementById('remove-link-btn').style.display = 'block';
  
  closeModal('replace-link-modal');
  showToast('Link atualizado! ✨', 'success');
}

async function updatePost(event) {
  event.preventDefault();
  if (!editingPostId) return;
  
  const text = document.getElementById('edit-post-text').value.trim();
  if (!text) { showToast('O texto não pode estar vazio.', 'error'); return; }
  
  const post = allPosts.find(p => p.id === editingPostId);
  if (!post) return;
  
  const hasImg = document.getElementById('edit-post-media-preview').style.display !== 'none';
  const imgEl = document.getElementById('edit-preview-img');
  
  post.text = text;
  post.image = hasImg ? imgEl.src : null;
  post.link = editingPostLink;
  post.updatedAt = new Date().toISOString();
  
  try {
    await State.savePost(post);
    showToast('Postagem atualizada! ✨', 'success');
    closeModal('edit-post-modal');
    editingPostId = null;
    editingPostLink = null;
    loadPosts();
  } catch (err) {
    showToast('Erro ao atualizar postagem.', 'error');
  }
}

async function confirmDeletePost(id) {
  const modal = document.getElementById('confirm-delete-modal');
  const confirmBtn = document.getElementById('confirm-delete-btn');
  const title = modal.querySelector('h2');
  const text = modal.querySelector('p');
  
  title.textContent = 'Excluir postagem?';
  text.textContent = 'Essa ação não poderá ser desfeita. A postagem será removida permanentemente.';
  
  openModal('confirm-delete-modal');
  
  confirmBtn.onclick = async () => {
    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Excluindo...';

      // Antes de excluir o post, remove o link associado da aba pública (community_links),
      // mas NUNCA toca em "links" (tabela pessoal) — links salvos por usuárias são preservados.
      const post = allPosts.find(p => p.id === id);
      if (post?.link?.url) {
        const client = State._client();
        if (client) {
          // Busca todas as entradas de community_links com a mesma URL
          const { data: communityLinks } = await client
            .from('community_links')
            .select('id, url')
            .eq('url', post.link.url);

          if (communityLinks && communityLinks.length > 0) {
            // Exclui todas — a tabela pessoal (links) não é afetada
            const idsToDelete = communityLinks.map(l => l.id);
            await client
              .from('community_links')
              .delete()
              .in('id', idsToDelete);
          }
        }
      }

      await State.deleteRow('posts', id);
      showToast('Postagem excluída.', 'success');
      loadPosts();
      loadCommunityLinks(); // Atualiza a aba de links
      closeModal('confirm-delete-modal');
    } catch (err) {
      showToast('Erro ao excluir postagem.', 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Excluir';
    }
  };
}
function linkMenu(id) { showToast('Menu de opções do link #' + id, ''); }
let currentCommentsPostId = null;

async function openComments(postId) {
  currentCommentsPostId = postId;
  const modal = document.getElementById('comments-modal');
  const list = document.getElementById('comments-list');
  const input = document.getElementById('comment-input');
  
  if (!modal || !list) return;

  list.innerHTML = '<p style="text-align:center;padding:20px;color:var(--gray-500);">Carregando comentários...</p>';
  if (input) input.value = '';

  // CORREÇÃO: atualiza o avatar do modal de comentários com a foto do usuário logado
  const user = State.getCurrentUser();
  const commentAvatar = document.getElementById('comment-avatar');
  if (commentAvatar && user) {
    commentAvatar.src = user.foto_perfil || 'assets/avatars/avatar.svg';
  }
  
  openModal('comments-modal');

  try {
    const comments = await State.getComments(postId);
    renderComments(comments);
  } catch (err) {
    list.innerHTML = '<p style="text-align:center;padding:20px;color:var(--pink);">Erro ao carregar comentários.</p>';
  }
}

function renderComments(comments) {
  const list = document.getElementById('comments-list');
  if (!list) return;

  if (!comments || comments.length === 0) {
    list.innerHTML = '<p style="text-align:center;padding:40px 20px;color:var(--gray-400);font-size:14px;">Nenhum comentário ainda. Seja a primeira a comentar!</p>';
    return;
  }

  const currentUser = State.getCurrentUser();

  // Monta um mapa rápido de id/email → avatar atual a partir dos membros carregados
  const avatarMap = {};
  allMembers.forEach(m => {
    if (m.id)    avatarMap[String(m.id)]    = m.avatar;
    if (m.email) avatarMap[m.email]         = m.avatar;
  });
  // Garante que o avatar do usuário logado está sempre atualizado
  if (currentUser) {
    const meAvatar = currentUser.foto_perfil || 'assets/avatars/avatar.svg';
    if (currentUser.id)    avatarMap[String(currentUser.id)]    = meAvatar;
    if (currentUser.email) avatarMap[currentUser.email]         = meAvatar;
  }

  const resolveAvatar = (c) => {
    // 1. Tenta pelo id do autor
    if (c.author_id && avatarMap[String(c.author_id)]) return avatarMap[String(c.author_id)];
    // 2. Tenta pelo email do autor
    if (c.author_email && avatarMap[c.author_email]) return avatarMap[c.author_email];
    // 3. Usa o avatar salvo no comentário
    if (c.avatar) return c.avatar;
    // 4. Fallback
    return 'assets/avatars/avatar.svg';
  };

  const isOwner = (c) => currentUser &&
    (c.author_email === currentUser.email || c.author_id === currentUser.id);

  list.innerHTML = comments.map(c => {
    const avatar = resolveAvatar(c);
    const safeId = c.author_id || (c.author_email || '').replace(/[^a-zA-Z0-9]/g, '');
    return `
      <div class="comment-item" id="comment-${c.id}" data-author-email="${c.author_email || ''}">
        <img src="${avatar}"
             alt="${c.author || ''}"
             class="comment-avatar user-avatar-${safeId}"
             onerror="this.src='assets/avatars/avatar.svg'" />
        <div class="comment-content">
          <div class="comment-bubble">
            <div class="comment-author">${c.author || 'Membro SheTech'}</div>
            <div class="comment-text">${escapeHTML(c.text)}</div>
          </div>
          <div class="comment-footer">
            <span class="comment-time">${formatPostTime(c.createdAt)}</span>
            ${isOwner(c) ? `<button class="comment-delete-btn" onclick="confirmDeleteComment(${c.id}, ${c.post_id})">Excluir</button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  // Scroll para o final
  list.scrollTop = list.scrollHeight;
}

async function submitComment() {
  if (!currentCommentsPostId) return;
  
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  
  if (!text) return;

  const user = State.getCurrentUser();
  const comment = {
    id: Date.now(),
    post_id: currentCommentsPostId,
    author: user ? user.nome_completo : 'Membro SheTech',
    author_id: user ? user.id : null,
    author_email: user ? user.email : null,
    avatar: user ? (user.foto_perfil || 'assets/avatars/avatar.svg') : 'assets/avatars/avatar.svg',
    text: text,
    createdAt: new Date().toISOString()
  };

  try {
    input.value = '';
    await State.saveComment(comment);
    
    // Atualizar contador de comentários no post
    const post = allPosts.find(p => p.id === currentCommentsPostId);
    if (post) {
      post.comments = (post.comments || 0) + 1;
      await State.savePost(post);
      // Não precisa recarregar tudo, apenas atualizar a UI do post se visível
      const countEl = document.querySelector(`#post-${post.id} .reaction-btn:nth-child(2) span`);
      if (countEl) countEl.textContent = post.comments;
    }

    // Recarregar comentários
    const updatedComments = await State.getComments(currentCommentsPostId);
    renderComments(updatedComments);
    
  } catch (err) {
    showToast('Erro ao enviar comentário.', 'error');
  }
}

function confirmDeleteComment(commentId, postId) {
  const modal = document.getElementById('confirm-delete-modal');
  const confirmBtn = document.getElementById('confirm-delete-btn');
  const title = modal.querySelector('h2');
  const text = modal.querySelector('p');
  
  title.textContent = 'Excluir comentário?';
  text.textContent = 'Essa ação não poderá ser desfeita. O comentário será removido permanentemente.';
  
  openModal('confirm-delete-modal');
  
  confirmBtn.onclick = async () => {
    try {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Excluindo...';
      
      await State.deleteComment(commentId);
      
      // Atualizar contador
      const post = allPosts.find(p => p.id === postId);
      if (post) {
        post.comments = Math.max(0, (post.comments || 0) - 1);
        await State.savePost(post);
        const countEl = document.querySelector(`#post-${post.id} .reaction-btn:nth-child(2) span`);
        if (countEl) countEl.textContent = post.comments;
      }

      const updatedComments = await State.getComments(postId);
      renderComments(updatedComments);
      showToast('Comentário excluído.', 'success');
      closeModal('confirm-delete-modal');
    } catch (err) {
      showToast('Erro ao excluir comentário.', 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Excluir';
    }
  };
}
function sharePost(id) {
  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  const existing = document.getElementById('share-popover-container');
  if (existing) { existing.remove(); document.getElementById('share-popover-overlay')?.remove(); return; }

  const shareBtn = event.currentTarget;
  const rect = shareBtn.getBoundingClientRect();
  
  const shareUrl = window.location.origin + window.location.pathname + '?post=' + id;
  const shareText = `Confira esta postagem de ${post.author} na SheTech: ${post.text.substring(0, 100)}...`;

  // Posicionamento inteligente (acima do botão)
  let top = rect.top - 200; 
  let left = rect.left - 140;
  
  if (top < 10) top = rect.bottom + 10;
  if (left < 10) left = 10;
  if (left + 320 > window.innerWidth) left = window.innerWidth - 330;

  const overlay = `<div id="share-popover-overlay" class="share-popover-overlay"></div>`;
  const popover = `
    <div id="share-popover-container" class="share-popover-container" style="top:${top}px; left:${left}px;">
      <span class="share-popover-title">Compartilhar postagem</span>
      <div class="share-options-grid">
        <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}" class="share-option-item" target="_blank">
          <div class="share-icon-circle whatsapp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
          <span>WhatsApp</span>
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" class="share-option-item" target="_blank">
          <div class="share-icon-circle facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></div>
          <span>Facebook</span>
        </a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" class="share-option-item" target="_blank">
          <div class="share-icon-circle x-twitter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></div>
          <span>X</span>
        </a>
        <a href="mailto:?subject=${encodeURIComponent('Postagem interessante na SheTech')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}" class="share-option-item" target="_blank">
          <div class="share-icon-circle email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
          <span>E-mail</span>
        </a>
      </div>
      <div class="share-url-box">
        <input type="text" id="share-url-input" value="${shareUrl}" readonly>
        <button class="btn-copy-small" onclick="copyPostLinkFromInput()">Copiar</button>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', overlay + popover);

  const closePopover = () => {
    document.getElementById('share-popover-container')?.remove();
    document.getElementById('share-popover-overlay')?.remove();
  };

  document.getElementById('share-popover-overlay').onclick = closePopover;
}

function copyPostLinkFromInput() {
  const urlInput = document.getElementById('share-url-input');
  urlInput.select();
  urlInput.setSelectionRange(0, 99999);
  
  navigator.clipboard.writeText(urlInput.value).then(() => {
    showToast('Link copiado! 📋', 'success');
    // Fecha o popover após copiar
    document.getElementById('share-popover-container')?.remove();
    document.getElementById('share-popover-overlay')?.remove();
  }).catch(err => {
    showToast('Erro ao copiar link.', 'error');
  });
}

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

function copyLinkToClipboard(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copiado com sucesso! 📋', 'success');
  }).catch(err => {
    console.error('Erro ao copiar:', err);
    showToast('Erro ao copiar link.', 'error');
  });
}
/* ============================================
   WIDGETS DA SIDEBAR: Trending e Membras Ativas
   ============================================ */

/**
 * Renderiza o widget "Trending na SheTech" na sidebar do feed.
 * Extrai hashtags dos posts e mostra as mais populares.
 */
function renderTrendingWidget() {
  const container = document.getElementById('trending-widget-content');
  if (!container) return;

  // Extrair hashtags de todos os posts
  const hashtagMap = {};
  allPosts.forEach(post => {
    const text = post.text || '';
    const matches = text.match(/#(\w+)/g);
    if (matches) {
      matches.forEach(tag => {
        const cleaned = tag.toLowerCase();
        hashtagMap[cleaned] = { display: tag, count: (hashtagMap[cleaned]?.count || 0) + 1 };
      });
    }
  });

  // Ordenar por popularidade e pegar top 5
  const trending = Object.values(hashtagMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (trending.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px 8px; text-align: center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" stroke-width="2" style="width:28px;height:28px;margin-bottom:8px;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        <p style="color:var(--gray-500);font-size:13px;margin:0;">Nenhuma tendência ainda.<br>Compartilhe algo para começar!</p>
      </div>`;
    return;
  }

  container.innerHTML = trending.map((item, i) => `
    <div class="trending-item" style="display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:8px;cursor:pointer;transition:background 0.2s;">
      <span class="trending-rank" style="font-size:13px;font-weight:700;color:var(--pink);width:20px;text-align:center;">${i + 1}</span>
      <div style="flex:1;min-width:0;">
        <span class="trending-tag" style="font-size:13px;font-weight:600;color:var(--brand);">${item.display}</span>
        <div class="trending-count" style="font-size:11px;color:var(--gray-500);">${item.count} ${item.count === 1 ? 'post' : 'posts'}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Renderiza o widget "Membras Ativas" na sidebar do feed.
 * Mostra até 8 membras com status online/offline real.
 */
function renderActiveMembersWidget() {
  const container = document.getElementById('active-members-content');
  if (!container) return;

  if (!allMembers || allMembers.length === 0) {
    container.innerHTML = `
      <div class="active-members-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <p>Nenhuma membra encontrada.</p>
      </div>`;
    return;
  }

  const currentUser = State.getCurrentUser();

  // Ordena: online primeiro, depois offline — máximo 8
  const sorted = [...allMembers].sort((a, b) => {
    // Usuário atual sempre no topo
    const aIsMe = currentUser && (a.email === currentUser.email || a.id === currentUser.id);
    const bIsMe = currentUser && (b.email === currentUser.email || b.id === currentUser.id);
    if (aIsMe) return -1;
    if (bIsMe) return 1;
    // Online antes de offline
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    return 0;
  });

  const membersToShow = sorted.slice(0, 8);

  const onlineCount  = allMembers.filter(m => m.online).length;
  const offlineCount = allMembers.length - onlineCount;

  // Atualiza o contador no cabeçalho do widget, se existir
  const headerCount = document.getElementById('active-members-count');
  if (headerCount) {
    headerCount.textContent = `${onlineCount} online`;
  }

  container.innerHTML = membersToShow.map(m => {
    const isMe = currentUser && (m.email === currentUser.email || m.id === currentUser.id);
    const statusLabel = m.online ? 'Online' : 'Offline';
    const statusCls   = m.online ? 'am-status--online' : 'am-status--offline';
    const dotCls      = m.online ? 'am-dot--online'   : 'am-dot--offline';

    return `
    <div class="am-row" onclick="viewProfile('${m.id}')">
      <div class="am-avatar-wrap">
        <img
          src="${m.avatar || 'assets/avatars/avatar.svg'}"
          alt="${m.name}"
          class="am-avatar"
          onerror="this.src='assets/avatars/avatar.svg'"
        />
        <span class="am-dot ${dotCls}"></span>
      </div>
      <div class="am-info">
        <span class="am-name">${m.name}${isMe ? ' <span class="am-you-badge">Você</span>' : ''}</span>
        <span class="am-role">${m.role || 'Membro SheTech'}</span>
      </div>
      <div class="am-right">
        <span class="am-status ${statusCls}">${statusLabel}</span>
        ${isMe ? '' : `<button class="am-follow-btn" onclick="event.stopPropagation(); followMember('${m.id}', this)">Seguir</button>`}
      </div>
    </div>`;
  }).join('') + (allMembers.length > 8 ? `
    <div class="am-show-more">
      <button onclick="document.getElementById('tab-members')?.click()">
        Ver todas as ${allMembers.length} membras →
      </button>
    </div>` : '');
}

/**
 * Atualiza ambos os widgets da sidebar.
 * Chama-se após carregar posts e membros.
 */
function updateSidebarWidgets() {
  renderTrendingWidget();
  renderActiveMembersWidget();
}
