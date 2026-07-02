/* ============================================
   SheTech — Comunidade JS
   ============================================ */

/* ─── CONTEÚDO INICIAL ───────────────────── */

const CURRENT_USER = {
  id: 0,
  name: 'Você',
  role: 'Membro SheTech',
  avatar: 'assets/avatars/avatar.svg'
};

const commentsByPost = {};

/* ─── ESTADO ──────────────────────────────── */

let currentTab    = 'feed';
let allLinks      = [];
let allMembers    = [];
let allPosts      = [];
let activePostId  = null;
let nextLinkId    = 1;
let nextPostId    = 1;

/* ─── MAPEAMENTO DE USUÁRIOS PARA MEMBROS ─── */

/**
 * Converte um objeto de usuário (formato salvo em State/localStorage ou Supabase)
 * para o formato esperado pelos cards de membros da comunidade.
 */
function mapUserToMember(user, index) {
  return {
    id:     user.id     || (user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '') : index + 1),
    name:   user.nome_completo || user.nome_usuario || 'Membro SheTech',
    role:   user.cargo  || user.area || 'Membro SheTech',
    avatar: user.foto_perfil || 'assets/avatars/avatar.svg',
    skills: Array.isArray(user.habilidades) ? user.habilidades : [],
    online: true, // Simula online para todos na demo
    email:  user.email  || '',
    bio:    user.bio    || user.biografia || ''
  };
}

/**
 * Carrega os membros da comunidade.
 * Prioridade:
 *  1. Usuários registrados no Supabase (via listagem de usuários autenticados)
 *  2. Usuários salvos no localStorage (State.getUsers())
 * O usuário atual logado é incluído mas marcado visualmente.
 */
async function loadMembers() {
  const grid = document.getElementById('members-grid');
  if (grid) grid.innerHTML = '<p style="color:var(--gray-500);padding:20px;">Carregando membros...</p>';

  let members = [];

  // Garante que o usuário logado esteja na tabela 'users' do Supabase
  // para que outros usuários possam vê-lo na comunidade.
  const currentUser = State.getCurrentUser();
  const client = window.SupabaseAuth && window.SupabaseAuth.client;

  if (currentUser && client) {
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
     const { data, error } = await client
  .from('users')
  .upsert(profileToSync, {
    onConflict: 'id'
  });

console.log("UPSERT DATA:", data);
console.log("UPSERT ERROR:", error);
    } catch (syncErr) {
      console.warn('[Comunidade] Não foi possível sincronizar usuário atual:', syncErr);
    }
  }

  try {
    if (client) {
      const { data: users, error } = await client
        .from('users')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(200);

      if (!error && users && users.length > 0) {
        members = users.map((u, i) => mapUserToMember(u, i));
      }
    }
  } catch (err) {
    console.warn('[Comunidade] Não foi possível buscar membros do Supabase:', err);
  }

  if (members.length === 0) {
    const localUsers = State.getUsers ? State.getUsers() : [];
    members = localUsers.map((u, i) => mapUserToMember(u, i));
  }

  if (currentUser) {
    const alreadyIn = members.some(m => m.email === currentUser.email);
    if (!alreadyIn) members.unshift(mapUserToMember(currentUser, -1));
  }

  allMembers = members;
  renderMembers();

  const countEl = document.getElementById('members-count');
  if (countEl) countEl.textContent = allMembers.length > 0 ? `(${allMembers.length})` : '';
}

async function loadPosts() {
  if (typeof State !== 'undefined' && State.fetchGlobalData) {
    const globalPosts = await State.fetchGlobalData('posts');
    if (globalPosts && globalPosts.length > 0) {
      allPosts = globalPosts;
      renderFeed();
    }
  }
}

/* ─── INIT ────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa o layout compartilhado
  if (typeof Layout !== 'undefined') {
    Layout.init({ active: 'comunidade' });
  } else {
    // Fallback caso Layout não esteja disponível
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (collapsed) document.body.classList.add('sidebar-collapsed');

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const firstName = user.nome_completo.split(' ')[0];
        const topName = document.getElementById('top-name');
        if (topName) topName.innerText = `Olá, ${firstName}`;
    }
  }

  renderFeed();
  renderLinks();
  loadMembers();
  loadPosts();
  initSearch();
  document.querySelectorAll('.tabs .tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextTab = btn.id.replace('tab-', '');
      switchTab(nextTab);
    });
  });
  switchTab('feed');
  const notifDot = document.getElementById('notif-dot');
  if (notifDot) notifDot.style.display = 'block';
});

/* ─── TABS ────────────────────────────────── */

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
      <button class="post-link-save-btn" onclick="savePostLinkToMyLinks('${post.link.title}', '${post.link.url}', event)" title="Salvar link" style="background:var(--pink-soft);color:var(--pink);border:none;border-radius:8px;padding:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      </button>
    </div>` : ''}

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

  allPosts.unshift(post);
  field.innerText = '';
  clearMedia();
  renderFeed();
  
  if (typeof State !== 'undefined' && State.saveGlobalData) {
    await State.saveGlobalData('posts', post);
  }
  
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
  const field = document.getElementById('composer-field');
  const text = (field?.innerText || '').trim();
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);

  const titleInput = document.getElementById('link-titulo');
  const urlInput = document.getElementById('link-url');
  const descInput = document.getElementById('link-desc');
  const destaqueInput = document.getElementById('link-destaque');

  if (titleInput) titleInput.value = text.replace(/^https?:\/\/[^\s]+/i, '').trim().slice(0, 60) || 'Recurso compartilhado';
  if (urlInput) urlInput.value = urlMatch ? urlMatch[0] : '';
  if (descInput) descInput.value = '';
  if (destaqueInput) destaqueInput.checked = true;

  openModal('link-modal');
  field?.focus();
}

function addEmoji() {
    const emojis = ['🚀', '💜', '✨', '🎉', '💡', '🔥', '👩‍💻', '🌟', '🤝', '🙌', '💻', '🎨', '📚', '💪', '🌈', '⚡', '🎯', '📍', '✅', '❤️'];
    
    const existing = document.getElementById('emoji-picker-modal');
    if (existing) { existing.remove(); return; }

    const emojiBtn = event.target.closest('button');
    const rect = emojiBtn ? emojiBtn.getBoundingClientRect() : null;
    
    const top = rect ? (rect.top - 320) + 'px' : '50%';
    const left = rect ? (rect.left - 100) + 'px' : '50%';

    const modalHtml = `
        <div id="emoji-picker-modal" class="modal modal-detail-overlay" style="display: flex; z-index: 10001; background: transparent;">
            <div class="modal-content" style="max-width: 300px; height: auto; position: fixed; top: ${top}; left: ${left}; padding: 15px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); background: white;">
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
                    ${emojis.map(e => `<button onclick="insertEmoji('${e}')" style="font-size: 20px; padding: 5px; border-radius: 8px; transition: background 0.2s; border: none; background: transparent; cursor: pointer;" onmouseover="this.style.background='var(--pink-soft)'" onmouseout="this.style.background='transparent'">${e}</button>`).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Fechar ao clicar fora
    document.getElementById('emoji-picker-modal').onclick = (e) => {
        if (e.target.id === 'emoji-picker-modal') e.target.remove();
    };
}

function insertEmoji(emoji) {
    const field = document.getElementById('composer-field');
    field.innerText += emoji;
    field.focus();
    document.getElementById('emoji-picker-modal')?.remove();
}

function savePostLinkToMyLinks(title, url, event) {
    event.preventDefault();
    event.stopPropagation();
    
    const user = State.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const existing = document.getElementById('save-link-modal');
    if (existing) { existing.remove(); return; }

    const folders = State.getFolders(user.email);
    const btn = event.currentTarget;
    const rect = btn?.getBoundingClientRect();
    const top = rect ? `${rect.top - 220}px` : '50%';
    const left = rect ? `${rect.left - 100}px` : '50%';
    
    const modalHtml = `
        <div id="save-link-modal" class="modal modal-detail-overlay" style="display: flex; z-index: 10002; background: transparent;">
            <div class="modal-content" style="max-width: 320px; height: auto; position: fixed; top: ${top}; left: ${left}; padding: 14px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h2 style="font-size: 15px; margin: 0;">Salvar nos Meus Links</h2>
                    <button onclick="document.getElementById('save-link-modal').remove()" style="font-size: 20px; background: none; border: none; cursor: pointer;">&times;</button>
                </div>
                <p style="margin-bottom: 10px; font-size: 13px; color: var(--gray-700);">Escolha uma pasta para salvar: <strong>${title}</strong></p>
                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="font-size: 12px;">Pasta</label>
                    <select id="save-folder-select" class="form-control" style="width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--gray-300); font-size: 13px;">
                        <option value="">Nenhuma pasta (Geral)</option>
                        ${folders.map(f => `<option value="${f.id}">${f.nome}</option>`).join('')}
                    </select>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button onclick="confirmSavePostLink('${title}', '${url}')" class="btn btn-primary" style="flex: 1; padding: 8px 10px; font-size: 12px;">Salvar</button>
                    <button onclick="document.getElementById('save-link-modal').remove()" class="btn btn-outline" style="flex: 1; padding: 8px 10px; font-size: 12px;">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('save-link-modal').onclick = (e) => {
        if (e.target.id === 'save-link-modal') e.target.remove();
    };
}

function confirmSavePostLink(title, url) {
    const folderId = document.getElementById('save-folder-select').value;
    const user = State.getCurrentUser();
    
    const linkData = {
        titulo: title,
        url: url.startsWith('http') ? url : `https://${url}`,
        descricao: '',
        categoria: 'Comunidade',
        folderId: folderId ? parseInt(folderId) : null,
        proprietaria_id: user.email,
        favorito: false
    };
    
    State.saveLink(linkData);
    showToast(`Link "${title}" salvo em Meus Links!`, 'success');
    document.getElementById('save-link-modal').remove();
}

/* ─── COMMENTS MODAL ──────────────────────── */

function openComments(postId) {
  activePostId = postId;
  const list = document.getElementById('comments-list');
  const comments = commentsByPost[postId] || [];
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
  if (!commentsByPost[activePostId]) commentsByPost[activePostId] = [];
  commentsByPost[activePostId].push(comment);
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
  const sorted = [...data].sort((a, b) => Number(b.destaque) - Number(a.destaque));
  grid.innerHTML = sorted.map(l => linkCardHTML(l)).join('');
}

function linkCardHTML(link) {
  return `
  <div class="link-card ${link.destaque ? 'link-card--featured' : ''}" data-cat="${link.categoria}" id="link-${link.id}">
    <div class="link-card-top">
      <div class="link-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </div>
      <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end;">
        ${link.destaque ? '<span class="link-feature-badge">Destaque</span>' : ''}
        <span class="link-cat-badge">${link.categoria}</span>
      </div>
    </div>
    <div class="link-card-title">${escapeHTML(link.title)}</div>
    ${link.desc ? `<div class="link-card-desc">${escapeHTML(link.desc)}</div>` : ''}
    <div class="link-card-url">${link.url}</div>
    <div class="link-card-footer">
      <a href="${link.url}" target="_blank" class="link-open-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Abrir
      </a>
      <button class="link-save-btn" onclick="saveToMyLinks(${link.id})" title="Salvar nos Meus Links" style="background: var(--pink-soft); color: var(--pink); border-radius: 8px; padding: 6px; display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      </button>
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
    const destaque = document.getElementById('link-destaque')?.checked || false;
    const composerField = document.getElementById('composer-field');
    const composerText = (composerField?.innerText || '').trim();
    if (!title || !url) return;

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    allLinks.unshift({
      id: nextLinkId++,
      title,
      url: normalizedUrl,
      desc,
      categoria: cat,
      destaque,
      criadoPor: CURRENT_USER.name
    });

    allPosts.unshift({
      id: nextPostId++,
      author: CURRENT_USER.name,
      role: CURRENT_USER.role,
      avatar: CURRENT_USER.avatar,
      time: 'Agora mesmo',
      text: composerText || `Compartilhei um recurso útil para a comunidade: ${title}`,
      tags: [],
      likes: 0,
      comments: 0,
      liked: false,
      link: {
        title,
        url: normalizedUrl,
        desc,
        destaque,
        categoria: cat
      }
    });

    if (composerField) composerField.innerText = '';
    renderFeed();
    renderLinks(currentLinkFilter === 'todos' ? null : currentLinkFilter);
    closeModal('link-modal');
    document.getElementById('link-form').reset();
    showToast(destaque ? 'Link destacado e compartilhado na comunidade! ✨' : 'Link postado na comunidade! 🔗', 'success');
}

function saveToMyLinks(id) {
    const link = allLinks.find(l => l.id === id);
    if (!link) return;
    
    const user = State.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const folders = State.getFolders(user.email);
    
    const modalHtml = `
        <div id="save-link-modal" class="modal modal-detail-overlay" style="display: flex; z-index: 10000;">
            <div class="modal-content" style="max-width: 400px; height: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>Salvar nos Meus Links</h2>
                    <button onclick="document.getElementById('save-link-modal').remove()" style="font-size: 24px;">&times;</button>
                </div>
                <p style="margin-bottom: 15px; font-size: 14px; color: var(--gray-700);">Escolha uma pasta para salvar: <strong>${link.title}</strong></p>
                <div class="form-group">
                    <label>Pasta</label>
                    <select id="save-folder-select" class="form-control" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--gray-300);">
                        <option value="">Nenhuma pasta (Geral)</option>
                        ${folders.map(f => `<option value="${f.id}">${f.nome}</option>`).join('')}
                    </select>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="confirmSaveToMyLinks(${id})" class="btn btn-primary" style="flex: 1;">Salvar</button>
                    <button onclick="document.getElementById('save-link-modal').remove()" class="btn btn-outline" style="flex: 1;">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function confirmSaveToMyLinks(id) {
    const link = allLinks.find(l => l.id === id);
    const folderId = document.getElementById('save-folder-select').value;
    const user = State.getCurrentUser();
    
    const linkData = {
        titulo: link.title,
        url: link.url.startsWith('http') ? link.url : `https://${link.url}`,
        descricao: link.desc || '',
        categoria: link.categoria || 'Comunidade',
        folderId: folderId ? parseInt(folderId) : null,
        proprietaria_id: user.email,
        favorito: false
    };
    
    State.saveLink(linkData);
    showToast(`Link "${link.title}" salvo em Meus Links!`, 'success');
    document.getElementById('save-link-modal').remove();
    closeModal('link-detail-modal');
}

function deleteLink(id) {
  allLinks = allLinks.filter(l => l.id !== id);
  renderLinks();
  showToast('Link removido.', 'success');
}

/* ─── MEMBERS ─────────────────────────────── */

let memberRoleFilter = 'todos';

function renderMembers(list) {
  const grid = document.getElementById('members-grid');
  if (!grid) return;
  const data = list || allMembers;
  if (data.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--gray-500);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:12px;opacity:0.4;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <p style="font-size:15px;font-weight:600;margin-bottom:6px;">Nenhum membro encontrado</p>
        <p style="font-size:13px;">Convide colegas para se cadastrarem na plataforma!</p>
      </div>`;
    return;
  }
  grid.innerHTML = data.map(m => memberCardHTML(m)).join('');
  renderActiveMembers();
}

function renderActiveMembers() {
  const activeGrid = document.querySelector('.active-members');
  if (!activeGrid) return;
  
  const currentUser = State.getCurrentUser();
  // Exibe outros membros como "ativos" para dar vida à comunidade
  const otherMembers = allMembers.filter(m => m.email !== (currentUser ? currentUser.email : ''));
  
  // Adiciona o próprio usuário no topo se estiver logado
  let html = '';
  if (currentUser) {
    html += `
      <div class="active-member" onclick="window.location.href='perfil.html'">
        <div class="member-thumb-wrap">
          <img src="${currentUser.foto_perfil || 'assets/avatars/avatar.svg'}" alt="Você">
          <span class="online-indicator"></span>
        </div>
        <div>
          <span class="active-name">Você</span>
          <span class="active-role">${currentUser.cargo || 'Membro'}</span>
        </div>
        <span style="font-size:10px;color:var(--gray-400);margin-left:auto;">Online</span>
      </div>
    `;
  }

  if (otherMembers.length === 0 && !currentUser) {
    activeGrid.innerHTML = '<p style="font-size:12px;color:var(--gray-500);padding:10px;">Nenhum membro online.</p>';
    return;
  }

  html += otherMembers.slice(0, 5).map(m => `
    <div class="active-member" onclick="viewProfile('${m.id}')">
      <div class="member-thumb-wrap">
        <img src="${m.avatar}" alt="${m.name}">
        <span class="online-indicator"></span>
      </div>
      <div>
        <span class="active-name">${m.name}</span>
        <span class="active-role">${m.role}</span>
      </div>
      <button class="follow-mini-btn" onclick="event.stopPropagation(); followUser(this)">Seguir</button>
    </div>
  `).join('');

  activeGrid.innerHTML = html;
}

function followUser(btn) {
  const isFollowing = btn.classList.contains('following');
  if (isFollowing) {
    btn.classList.remove('following');
    btn.textContent = 'Seguir';
    btn.style.background = 'var(--pink-soft)';
    btn.style.color = 'var(--pink)';
  } else {
    btn.classList.add('following');
    btn.textContent = 'Seguindo';
    btn.style.background = 'var(--gray-100)';
    btn.style.color = 'var(--gray-500)';
  }
}

function memberCardHTML(m) {
  const currentUser = State.getCurrentUser();
  const isMe = currentUser && (m.email === currentUser.email || m.id === currentUser.id);
  
  return `
  <div class="member-card" id="member-${m.id}">
    <div class="member-avatar-wrap">
      <img src="${m.avatar}" alt="${m.name}" />
      ${m.online || isMe ? '<span class="online-indicator"></span>' : ''}
    </div>
    <div class="member-card-name">${m.name} ${isMe ? '<span style="font-size:10px;color:var(--pink);background:var(--pink-soft);padding:2px 6px;border-radius:10px;margin-left:4px;">Você</span>' : ''}</div>
    <div class="member-card-role">${m.role}</div>
    <div class="member-card-skills">
      ${m.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
    </div>
    ${isMe ? '' : `<button class="member-card-follow" onclick="followMember('${m.id}', this)">Seguir</button>`}
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
    const member = allMembers.find(m => m.id === id);
    if (member) {
        localStorage.setItem('visitingUser', JSON.stringify({
            email: member.email || `member${id}@example.com`,
            nome_completo: member.name,
            username: member.name.toLowerCase().replace(' ', ''),
            profissao: member.role,
            foto_perfil: member.avatar,
            bio: member.bio || 'Membro da comunidade SheTech.',
            is_member: true
        }));
        window.location.href = 'perfil.html?user=' + id;
    } else {
        showToast('Perfil não encontrado.', 'error');
    }
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
  if (!el) return;
  el.classList.add('open');
  if (id === 'comments-modal') {
    el.classList.add('modal-overlay--detail');
  }
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.classList.remove('modal-overlay--detail');
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
// A funcionalidade de sidebar agora é gerenciada pelo Layout.js compartilhado.
// O botão de toggle na topbar chama a função global toggleSidebar se necessário,
// mas o padrão do sistema é usar o botão dentro da sidebar injetado pelo Layout.js.

/* ─── POST OPTIONS ────────────────────────── */

function postMenu(id) {
  // Fechar qualquer dropdown aberto
  document.querySelectorAll('.post-dropdown-menu').forEach(m => m.remove());
  
  const btn = document.querySelector(`#post-${id} .post-options`);
  if (!btn) return;
  
  const post = allPosts.find(p => p.id === id);
  const isOwn = post && post.author === CURRENT_USER.name;

  const menu = document.createElement('div');
  menu.className = 'post-dropdown-menu';
  menu.innerHTML = `
    <button class="post-dropdown-item" onclick="editPost(${id})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Editar
    </button>
    <button class="post-dropdown-item post-dropdown-item--danger" onclick="deletePost(${id})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      Excluir
    </button>
  `;

  btn.parentElement.style.position = 'relative';
  btn.parentElement.appendChild(menu);

  // Fechar ao clicar fora
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 0);
}

function previewEditedImage(input) {
  const preview = document.getElementById('edit-post-image-preview');
  const removeFlag = document.getElementById('edit-post-image-remove');
  const file = input?.files?.[0];
  if (!preview) return;

  if (!file) {
    preview.style.display = 'none';
    preview.src = '';
    if (removeFlag) removeFlag.value = 'true';
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    preview.src = event.target.result;
    preview.style.display = 'block';
    if (removeFlag) removeFlag.value = 'false';
  };
  reader.readAsDataURL(file);
}

function clearEditedImage() {
  const preview = document.getElementById('edit-post-image-preview');
  const input = document.getElementById('edit-post-image-input');
  const removeFlag = document.getElementById('edit-post-image-remove');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if (input) input.value = '';
  if (removeFlag) removeFlag.value = 'true';
}

function clearEditedLink() {
  const removeFlag = document.getElementById('edit-post-link-remove');
  if (removeFlag) removeFlag.value = 'true';
  document.getElementById('edit-post-link-title').value = '';
  document.getElementById('edit-post-link-url').value = '';
  document.getElementById('edit-post-link-desc').value = '';
  document.getElementById('edit-post-link-destaque').checked = false;
}

function editPost(id) {
  document.querySelectorAll('.post-dropdown-menu').forEach(m => m.remove());
  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  const existing = document.getElementById('edit-post-modal');
  if (existing) existing.remove();

  const modalHtml = `
    <div id="edit-post-modal" class="modal-overlay" onclick="closeOnOverlay(event,'edit-post-modal')">
      <div class="modal-box" style="max-width: 600px;">
        <div class="modal-header">
          <h2>Editar Post</h2>
          <button class="modal-close" onclick="closeModal('edit-post-modal')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label>Texto do post</label>
          <textarea id="edit-post-text" rows="5" style="width:100%;padding:12px;border:1px solid var(--gray-200);border-radius:12px;font-family:inherit;font-size:14px;resize:vertical;">${escapeHTML(post.text || '')}</textarea>
        </div>

        <div class="form-group" style="margin-top:16px">
          <label>Mídia</label>
          <img id="edit-post-image-preview" src="${post.image || ''}" alt="Pré-visualização" style="display:${post.image ? 'block' : 'none'}; width:100%; max-height:220px; object-fit:cover; border-radius:12px; margin-bottom:8px;" />
          <input type="file" id="edit-post-image-input" accept="image/*" onchange="previewEditedImage(this)" />
          <input type="hidden" id="edit-post-image-remove" value="false" />
          <button type="button" class="btn-ghost" onclick="clearEditedImage()" style="margin-top:8px">Remover imagem</button>
        </div>

        <div class="form-group" style="margin-top:16px">
          <label>Link compartilhado</label>
          <input id="edit-post-link-title" type="text" value="${escapeHTML(post.link?.title || '')}" placeholder="Título do link" style="width:100%;padding:10px 12px;border:1px solid var(--gray-200);border-radius:10px;margin-bottom:8px;" />
          <input id="edit-post-link-url" type="text" value="${escapeHTML(post.link?.url || '')}" placeholder="https://exemplo.com" style="width:100%;padding:10px 12px;border:1px solid var(--gray-200);border-radius:10px;margin-bottom:8px;" />
          <textarea id="edit-post-link-desc" rows="3" placeholder="Descrição do link" style="width:100%;padding:10px 12px;border:1px solid var(--gray-200);border-radius:10px;resize:vertical;">${escapeHTML(post.link?.desc || '')}</textarea>
          <label style="display:flex; align-items:center; gap:8px; margin-top:8px; font-weight:600;">
            <input type="checkbox" id="edit-post-link-destaque" ${post.link?.destaque ? 'checked' : ''} style="width:auto; margin:0;" />
            <span>Destacar este link</span>
          </label>
          <input type="hidden" id="edit-post-link-remove" value="false" />
          <button type="button" class="btn-ghost" onclick="clearEditedLink()" style="margin-top:8px">Remover link</button>
        </div>

        <div class="modal-footer" style="margin-top:16px">
          <button type="button" class="btn-ghost" onclick="closeModal('edit-post-modal')">Cancelar</button>
          <button type="button" class="btn-primary" onclick="saveEditedPost(${id})">Salvar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  openModal('edit-post-modal');
}

async function saveEditedPost(id) {
  const text = document.getElementById('edit-post-text').value.trim();
  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  const imageInput = document.getElementById('edit-post-image-input');
  const imageRemove = document.getElementById('edit-post-image-remove')?.value === 'true';
  const linkTitle = document.getElementById('edit-post-link-title')?.value.trim() || '';
  const linkUrl = document.getElementById('edit-post-link-url')?.value.trim() || '';
  const linkDesc = document.getElementById('edit-post-link-desc')?.value.trim() || '';
  const linkDestaque = document.getElementById('edit-post-link-destaque')?.checked || false;
  const linkRemove = document.getElementById('edit-post-link-remove')?.value === 'true';

  if (!text && !post.image && !post.link && !imageInput?.files?.[0] && !linkTitle && !linkUrl && !linkDesc) {
    closeModal('edit-post-modal');
    document.getElementById('edit-post-modal')?.remove();
    return;
  }

  if (post) {
    post.text = text || '';

    if (imageRemove) {
      post.image = null;
    } else if (imageInput?.files?.[0]) {
      const file = imageInput.files[0];
      const reader = new FileReader();
      const result = await new Promise((resolve) => {
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
      });
      post.image = result;
    }

    if (linkRemove || (!linkTitle && !linkUrl && !linkDesc && !linkDestaque)) {
      post.link = null;
    } else if (linkTitle || linkUrl || linkDesc || linkDestaque) {
      post.link = {
        title: linkTitle || 'Recurso compartilhado',
        url: normalizeLinkUrl(linkUrl),
        desc: linkDesc,
        destaque: linkDestaque,
        categoria: post.link?.categoria || 'Comunidade'
      };
    }

    renderFeed();
    showToast('Post atualizado! ✏️', 'success');
  }
  closeModal('edit-post-modal');
  document.getElementById('edit-post-modal')?.remove();
}

function deletePost(id) {
  const existing = document.getElementById('delete-post-modal');
  if (existing) { existing.remove(); }

  const modalHtml = `
    <div id="delete-post-modal" class="modal modal-detail-overlay" style="display: flex; z-index: 10003; background: transparent; align-items: center; justify-content: center;">
      <div class="modal-content" style="max-width: 360px; width: min(90vw, 360px); height: auto; padding: 18px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); background: white;">
        <h2 style="font-size: 18px; margin: 0 0 8px;">Excluir post?</h2>
        <p style="margin: 0 0 16px; color: var(--gray-700); font-size: 14px;">Essa ação não pode ser desfeita.</p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn-ghost" onclick="document.getElementById('delete-post-modal').remove()">Cancelar</button>
          <button type="button" class="btn-primary" onclick="confirmDeletePost(${id})">Excluir</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  document.getElementById('delete-post-modal').onclick = (e) => {
    if (e.target.id === 'delete-post-modal') e.target.remove();
  };
}

function confirmDeletePost(id) {
  allPosts = allPosts.filter(p => p.id !== id);
  renderFeed();
  showToast('Post excluído.', 'success');
  document.getElementById('delete-post-modal')?.remove();
}

function sharePost(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;

    const existing = document.getElementById('share-modal');
    if (existing) { existing.remove(); return; }

    const url = window.location.href + '#post-' + id;
    const text = `Confira este post de ${post.author} na comunidade SheTech!`;
    const btn = document.querySelector(`#post-${id} .post-share`);
    const rect = btn?.getBoundingClientRect();
    const top = rect ? `${rect.top - 220}px` : '50%';
    const left = rect ? `${rect.left - 120}px` : '50%';

    const modalHtml = `
        <div id="share-modal" class="modal modal-detail-overlay" style="display: flex; z-index: 10001; background: transparent;">
            <div class="modal-content" style="max-width: 320px; height: auto; position: fixed; top: ${top}; left: ${left}; padding: 14px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h2 style="font-size: 15px; margin: 0;">Compartilhar</h2>
                    <button onclick="document.getElementById('share-modal').remove()" style="font-size: 20px; background: none; border: none; cursor: pointer;">&times;</button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                    <button type="button" onclick="shareToNetwork('whatsapp', '${text}', '${url}')" class="btn btn-outline" style="flex-direction: column; gap: 4px; padding: 10px 6px; font-size: 11px;">
                        <i class="icon-message-circle" style="font-size: 18px; color: #25D366;"></i>
                        <span>WhatsApp</span>
                    </button>
                    <button type="button" onclick="shareToNetwork('telegram', '${text}', '${url}')" class="btn btn-outline" style="flex-direction: column; gap: 4px; padding: 10px 6px; font-size: 11px;">
                        <i class="icon-send" style="font-size: 18px; color: #0088cc;"></i>
                        <span>Telegram</span>
                    </button>
                    <button type="button" onclick="shareToNetwork('facebook', '${text}', '${url}')" class="btn btn-outline" style="flex-direction: column; gap: 4px; padding: 10px 6px; font-size: 11px;">
                        <i class="icon-facebook" style="font-size: 18px; color: #1877F2;"></i>
                        <span>Facebook</span>
                    </button>
                    <button type="button" onclick="shareToNetwork('instagram', '${text}', '${url}')" class="btn btn-outline" style="flex-direction: column; gap: 4px; padding: 10px 6px; font-size: 11px;">
                        <i class="icon-instagram" style="font-size: 18px; color: #E4405F;"></i>
                        <span>Instagram</span>
                    </button>
                    <button type="button" onclick="shareToNetwork('discord', '${text}', '${url}')" class="btn btn-outline" style="flex-direction: column; gap: 4px; padding: 10px 6px; font-size: 11px;">
                        <i class="icon-message-square" style="font-size: 18px; color: #5865F2;"></i>
                        <span>Discord</span>
                    </button>
                    <button type="button" onclick="copyPostLink('${url}')" class="btn btn-outline" style="flex-direction: column; gap: 4px; padding: 10px 6px; font-size: 11px;">
                        <i class="icon-copy" style="font-size: 18px; color: var(--pink);"></i>
                        <span>Copiar</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('share-modal').onclick = (e) => {
        if (e.target.id === 'share-modal') e.target.remove();
    };
}

function shareToNetwork(network, text, url) {
    const shareText = `${text} ${url}`;
    const shareData = { title: 'SheTech', text: shareText, url };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {
            navigator.clipboard.writeText(shareText).then(() => {
                showToast('Link preparado para compartilhar!', 'success');
                document.getElementById('share-modal')?.remove();
            });
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Link preparado para compartilhar!', 'success');
            document.getElementById('share-modal')?.remove();
        });
    }

    document.getElementById('share-modal')?.remove();
}

function copyPostLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copiado!', 'success');
        document.getElementById('share-modal')?.remove();
    });
}

/* ─── TOAST ───────────────────────────────── */

function showToast(msg, type) {
  if (typeof Layout !== 'undefined' && Layout.showToast) {
    Layout.showToast(msg);
  } else {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(() => el.classList.remove('show'), 3200);
  }
}

/* ─── UTILS ───────────────────────────────── */

function normalizeLinkUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `https://${url}`;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}