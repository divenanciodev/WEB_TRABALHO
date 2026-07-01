const currentUser = Layout.init({ active: 'perfil' });
if (!currentUser) throw new Error('auth');

// Verificar se estamos visitando outro perfil
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user');
let user = currentUser;

if (userId) {
    const visiting = localStorage.getItem('visitingUser');
    if (visiting) {
        user = JSON.parse(visiting);
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
    setText('profile-bio', user.biografia || 'Adicione uma biografia para compartilhar sua história com a comunidade.');
    setText('profile-email', user.email || 'seuemail@shetech.com.br');
    setText('profile-role-info', user.cargo || user.area || 'Membro SheTech');
    
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
        aboutText.textContent = user.sobre || 'Complete seu perfil para compartilhar mais detalhes sobre você.';
    }

    // Skills
    const skillsContainer = document.getElementById('skills-list');
    if (skillsContainer && Array.isArray(user.habilidades)) {
        skillsContainer.innerHTML = user.habilidades.map(s => `<span class="skill-tag">${s}</span>`).join('');
    }

    // Links Sociais
    const socialContainer = document.getElementById('profile-social-links');
    if (socialContainer) {
        let html = '';
        if (user.github) html += `<a href="${user.github}" class="social-btn" target="_blank" title="GitHub"><i class="icon-github"></i></a>`;
        if (user.linkedin) html += `<a href="${user.linkedin}" class="social-btn" target="_blank" title="LinkedIn"><i class="icon-linkedin"></i></a>`;
        if (user.instagram) html += `<a href="https://instagram.com/${user.instagram.replace('@','')}" class="social-btn" target="_blank" title="Instagram"><i class="icon-instagram"></i></a>`;
        if (user.portfolio) html += `<a href="${user.portfolio}" class="social-btn" target="_blank" title="Portfólio"><i class="icon-globe"></i></a>`;
        socialContainer.innerHTML = html;
    }

    // Stats (do State)
    const isOwnedByUser = (item) => [item?.proprietaria_id, item?.organizador_id, item?.criador_id].includes(user.email);
    const projetos = State.getProjects().filter(isOwnedByUser);
    const eventos = State.getEvents().filter(isOwnedByUser);

    setText('stat-projetos', projetos.length);
    setText('stat-eventos', eventos.length);
    setText('stat-conexoes', 0);
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
                    <h2>Compartilhar Perfil</h2>
                    <button onclick="document.getElementById('share-modal').remove()" style="font-size: 24px;">&times;</button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                    <a href="https://api.whatsapp.com/send?text=${text}%20${url}" target="_blank" class="btn btn-outline" style="flex-direction: column; gap: 5px; padding: 15px; font-size: 12px;">
                        <i class="icon-message-circle" style="font-size: 20px; color: #25D366;"></i>
                        <span>WhatsApp</span>
                    </a>
                    <a href="https://t.me/share/url?url=${url}&text=${text}" target="_blank" class="btn btn-outline" style="flex-direction: column; gap: 5px; padding: 15px; font-size: 12px;">
                        <i class="icon-send" style="font-size: 20px; color: #0088cc;"></i>
                        <span>Telegram</span>
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" class="btn btn-outline" style="flex-direction: column; gap: 5px; padding: 15px; font-size: 12px;">
                        <i class="icon-facebook" style="font-size: 20px; color: #1877F2;"></i>
                        <span>Facebook</span>
                    </a>
                    <a href="https://www.instagram.com/" target="_blank" class="btn btn-outline" style="flex-direction: column; gap: 5px; padding: 15px; font-size: 12px;">
                        <i class="icon-instagram" style="font-size: 20px; color: #E4405F;"></i>
                        <span>Instagram</span>
                    </a>
                    <a href="https://discord.com/channels/@me" target="_blank" class="btn btn-outline" style="flex-direction: column; gap: 5px; padding: 15px; font-size: 12px;">
                        <i class="icon-message-square" style="font-size: 20px; color: #5865F2;"></i>
                        <span>Discord</span>
                    </a>
                    <button onclick="copyToClipboard()" class="btn btn-outline" style="flex-direction: column; gap: 5px; padding: 15px; font-size: 12px;">
                        <i class="icon-copy" style="font-size: 20px; color: var(--pink);"></i>
                        <span>Copiar</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function copyToClipboard() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        if (typeof Layout !== 'undefined' && Layout.showToast) {
            Layout.showToast('Link copiado!');
        } else {
            alert('Link copiado!');
        }
        document.getElementById('share-modal')?.remove();
    });
}

function viewProject(id) {
    window.location.href = 'projetos.html?id=' + id;
}

// Tabs
document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`tab-${target}`)?.classList.add('active');
    });
});

document.addEventListener('DOMContentLoaded', loadUserData);
