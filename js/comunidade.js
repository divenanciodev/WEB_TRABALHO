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
    bio:    user.bio    || user.biografia || '',
    // Adiciona campos completos do usuário para visualização de perfil
    fullUser: user
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
        createdat: currentUser.createdAt || new Date().toISOString(),
        updatedat: new Date().toISOString()
      };
      await client.from('users').upsert(profileToSync, { onConflict: 'id' });
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

  // Fallback: se não conseguir do Supabase, usa localStorage
  if (members.length === 0) {
    const localUsers = State.getUsers();
    if (localUsers && localUsers.length > 0) {
      members = localUsers.map((u, i) => mapUserToMember(u, i));
    }
  }

  // Garante que o usuário atual está na lista
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
    document.getElementById('emoji-picker-modal').remove();
}

/* ─── LINKS ───────────────────────────────── */

function renderLinks(links) {
  const list = document.getElementById('links-list');
  const data = links || allLinks;
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
      <button class="link-options" onclick="linkMenu(${link.id})" title="Opções">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
    </div>
    <div class="link-url">${link.url}</div>
    ${link.desc ? `<div class="link-desc">${link.desc}</div>` : ''}
    <div class="link-footer">
      <span class="link-category">${link.category || 'Geral'}</span>
      <button class="link-save" onclick="saveLinkToMyLinks(${link.id}, this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Salvar
      </button>
    </div>
  </div>`;
}

function saveLinkToMyLinks(id, btn) {
  const link = allLinks.find(l => l.id === id);
  if (!link) return;
  
  State.saveLink({
    ...link,
    proprietaria_id: State.getCurrentUser().email
  });
  
  btn.textContent = '✓ Salvo';
  btn.disabled = true;
  showToast('Link salvo na sua biblioteca! 📚', 'success');
}

function savePostLinkToMyLinks(title, url, event) {
  event.stopPropagation();
  
  const link = {
    id: Date.now(),
    title,
    url,
    desc: '',
    category: 'Compartilhado',
    proprietaria_id: State.getCurrentUser().email
  };
  
  State.saveLink(link);
  showToast('Link salvo na sua biblioteca! 📚', 'success');
}

/* ─── MEMBROS ───────────────────────────────── */

function renderMembers(members) {
  const grid = document.getElementById('members-grid');
  const data = members || allMembers;
  
  if (!data || data.length === 0) {
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
      <div class="member-skills">
        ${m.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
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

function followUser(btn) {
  const following = btn.classList.toggle('following');
  btn.textContent = following ? 'Seguindo' : 'Seguir';
}

/**
 * Função melhorada para visualizar perfil de outro usuário.
 * Agora busca o perfil completo do Supabase e salva todos os campos necessários.
 */
function viewProfile(id) {
    const member = allMembers.find(m => m.id === id);
    if (!member) {
        showToast('Perfil não encontrado.', 'error');
        return;
    }

    // Usa o objeto completo do usuário se disponível
    const fullUser = member.fullUser || member;
    
    // Salva o perfil completo em localStorage para visualização
    const visitingUserData = {
        id: fullUser.id || member.id,
        email: fullUser.email || member.email,
        nome_completo: fullUser.nome_completo || member.name,
        nome_usuario: fullUser.nome_usuario || member.name.toLowerCase().replace(/\s+/g, ''),
        foto_perfil: fullUser.foto_perfil || member.avatar,
        bio: fullUser.bio || member.bio,
        biografia: fullUser.biografia || fullUser.bio || member.bio,
        cargo: fullUser.cargo || member.role,
        area: fullUser.area || member.role,
        habilidades: fullUser.habilidades || member.skills || [],
        experiencia: fullUser.experiencia || [],
        github: fullUser.github || '',
        linkedin: fullUser.linkedin || '',
        instagram: fullUser.instagram || '',
        portfolio: fullUser.portfolio || '',
        sobre: fullUser.sobre || '',
        capa_perfil: fullUser.capa_perfil || '',
        createdAt: fullUser.createdAt || new Date().toISOString(),
        created_at: fullUser.created_at || fullUser.createdAt || new Date().toISOString(),
        is_member: true
    };
    
    localStorage.setItem('visitingUser', JSON.stringify(visitingUserData));
    window.location.href = 'perfil.html?user=' + encodeURIComponent(id);
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

/* ─── MODAIS ──────────────────────────────── */

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('show');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
}

function postMenu(id) {
  showToast('Menu de opções do post #' + id, '');
}

function linkMenu(id) {
  showToast('Menu de opções do link #' + id, '');
}

function openComments(id) {
  showToast('Comentários do post #' + id, '');
}

function sharePost(id) {
  showToast('Compartilhando post #' + id, 'success');
}

/* ─── UTILITÁRIOS ──────────────────────────── */

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = '') {
  if (typeof Layout !== 'undefined' && Layout.showToast) {
    Layout.showToast(message, type);
  } else {
    console.log(`[${type || 'info'}] ${message}`);
  }
}
