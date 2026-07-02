const currentUser = State.getCurrentUser();
if (!currentUser) throw new Error('auth');

// Verificar se estamos visitando outro perfil
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user');
let user = currentUser;
let isViewingOtherProfile = false;

if (userId) {
    const visiting = localStorage.getItem('visitingUser');
    if (visiting) {
        user = JSON.parse(visiting);
        isViewingOtherProfile = true;
        // Ajustar UI para perfil de terceiro (esconder botões de edição)
        document.addEventListener('DOMContentLoaded', () => {
            const editBtn = document.querySelector('.btn-edit-profile');
            if (editBtn) editBtn.style.display = 'none';
            const settingsBtn = document.querySelector('.btn-settings');
            if (settingsBtn) settingsBtn.style.display = 'none';
        });
    }
}

function loadUserData() {
    // Identidade
    setText('profile-name', user.nome_completo || 'Seu nome');
    setText('profile-user', user.nome_usuario ? `@${user.nome_usuario}` : '@seuusuario');
    
    // Bio - tenta múltiplos campos
    const bio = user.biografia || user.bio || 'Adicione uma biografia para compartilhar sua história com a comunidade.';
    setText('profile-bio', bio);
    setText('profile-email', user.email || 'seuemail@shetech.com.br');
    
    // Role/Cargo - tenta múltiplos campos
    const role = user.cargo || user.area || 'Membro SheTech';
    setText('profile-role-info', role);
    
    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.src = user.foto_perfil || 'assets/avatars/avatar.svg';

    // Capa
    const coverBg = document.getElementById('profile-cover-bg');
    if (coverBg && user.capa_perfil) {
        coverBg.style.backgroundImage = `url(${user.capa_perfil})`;
    }

    // Sobre
    const aboutText = document.getElementById('profile-about-text');
    if (aboutText) {
        const aboutContent = user.sobre || 'Complete seu perfil para compartilhar mais detalhes sobre você.';
        aboutText.textContent = aboutContent;
    }

    // Skills
    const skillsContainer = document.getElementById('skills-list');
    if (skillsContainer) {
        const skills = Array.isArray(user.habilidades) ? user.habilidades : [];
        if (skills.length > 0) {
            skillsContainer.innerHTML = skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
        } else {
            skillsContainer.innerHTML = '<p style="color:var(--gray-500);font-size:14px;">Nenhuma habilidade adicionada ainda.</p>';
        }
    }

    // Links Sociais
    const socialContainer = document.getElementById('profile-social-links');
    if (socialContainer) {
        let html = '';
        if (user.github) html += `<a href="${user.github}" class="social-btn" target="_blank" title="GitHub"><i class="icon-github"></i></a>`;
        if (user.linkedin) html += `<a href="${user.linkedin}" class="social-btn" target="_blank" title="LinkedIn"><i class="icon-linkedin"></i></a>`;
        if (user.instagram) html += `<a href="https://instagram.com/${user.instagram.replace('@','')}" class="social-btn" target="_blank" title="Instagram"><i class="icon-instagram"></i></a>`;
        if (user.portfolio) html += `<a href="${user.portfolio}" class="social-btn" target="_blank" title="Portfólio"><i class="icon-globe"></i></a>`;
        if (html) {
            socialContainer.innerHTML = html;
        } else {
            socialContainer.innerHTML = '<p style="color:var(--gray-500);font-size:14px;">Nenhum link social adicionado.</p>';
        }
    }

    // Stats - Se for perfil de terceiro, busca dados do Supabase se disponível
    if (isViewingOtherProfile) {
        // Para perfil de terceiro, mostra estatísticas básicas
        const isOwnedByUser = (item) => [item?.proprietaria_id, item?.organizador_id, item?.criador_id].includes(user.email);
        const projetos = State.getProjects().filter(isOwnedByUser);
        const eventos = State.getEvents().filter(isOwnedByUser);

        setText('stat-projetos', projetos.length);
        setText('stat-eventos', eventos.length);
        setText('stat-conexoes', 0); // Conexões não são visíveis para terceiros nesta versão
    } else {
        // Para perfil próprio
        const isOwnedByUser = (item) => [item?.proprietaria_id, item?.organizador_id, item?.criador_id].includes(user.email);
        const projetos = State.getProjects().filter(isOwnedByUser);
        const eventos = State.getEvents().filter(isOwnedByUser);

        setText('stat-projetos', projetos.length);
        setText('stat-eventos', eventos.length);
        setText('stat-conexoes', 0);
    }
    
    setText('profile-date', formatMemberSince(user.createdAt || user.created_at || user.criado_em));
}

function formatMemberSince(value) {
    if (!value) return 'hoje';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'hoje';

    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '').replace(' 202', ' 202');
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// Compartilhamento
document.getElementById('share-btn')?.addEventListener('click', () => {
    openShareModal();
});

function openShareModal() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Confira o perfil de ${user.nome_completo} no SheTech!`);
    
    const modalHtml = `
        <div id="share-modal" class="modal modal-detail-overlay" style="display: flex; z-index: 9999;">
            <div class="modal-content" style="max-width: 450px; height: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 18px;">Compartilhar Perfil</h2>
                    <button onclick="document.getElementById('share-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <a href="https://twitter.com/intent/tweet?text=${text}&url=${url}" target="_blank" class="share-btn" style="padding: 12px; text-align: center; border-radius: 8px; background: #1DA1F2; color: white; text-decoration: none; font-weight: 500;">Twitter</a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" class="share-btn" style="padding: 12px; text-align: center; border-radius: 8px; background: #0A66C2; color: white; text-decoration: none; font-weight: 500;">LinkedIn</a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" class="share-btn" style="padding: 12px; text-align: center; border-radius: 8px; background: #1877F2; color: white; text-decoration: none; font-weight: 500;">Facebook</a>
                    <button onclick="copyToClipboard('${window.location.href}')" class="share-btn" style="padding: 12px; text-align: center; border-radius: 8px; background: var(--pink); color: white; border: none; cursor: pointer; font-weight: 500;">Copiar Link</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('share-modal').addEventListener('click', (e) => {
        if (e.target.id === 'share-modal') e.target.remove();
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        if (typeof Layout !== 'undefined' && Layout.showToast) {
            Layout.showToast('Link copiado! 📋', 'success');
        } else {
            alert('Link copiado!');
        }
    });
}

// Editar perfil
document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    window.location.href = 'editar-perfil.html';
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Layout !== 'undefined') {
        Layout.init({ active: 'perfil' });
    }
    
    loadUserData();
    
    // Se for perfil de terceiro, mostrar botão de seguir
    if (isViewingOtherProfile) {
        const followBtn = document.querySelector('.btn-follow');
        if (followBtn) {
            followBtn.style.display = 'inline-block';
            followBtn.addEventListener('click', () => {
                const isFollowing = followBtn.classList.toggle('following');
                followBtn.textContent = isFollowing ? 'Seguindo ✓' : 'Seguir';
                if (typeof Layout !== 'undefined' && Layout.showToast) {
                    Layout.showToast(isFollowing ? 'Você começou a seguir! 💜' : 'Deixou de seguir.', isFollowing ? 'success' : '');
                }
            });
        }
    }
});
