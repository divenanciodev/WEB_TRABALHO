let user = null;
let isViewingOtherProfile = false;

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function formatMemberSince(value) {
    if (!value) return 'hoje';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'hoje';
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '').replace(' 202', ' 202');
}

async function loadProfileData() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    const currentUser = State.getCurrentUser();

    if (userId && userId !== currentUser?.id) {
        user = await State.getUserById(userId);
        isViewingOtherProfile = true;
        if (!user) {
            window.location.href = 'perfil.html';
            return;
        }
    } else {
        user = currentUser;
    }

    loadUserData();
}

function loadUserData() {
    setText('profile-name', user.nome_completo || 'Seu nome');
    setText('profile-user', user.nome_usuario ? `@${user.nome_usuario}` : '@seuusuario');

    const bio = user.biografia || user.bio || 'Adicione uma biografia para compartilhar sua história com a comunidade.';
    setText('profile-bio', bio);
    setText('profile-email', user.email || 'seuemail@shetech.com.br');

    const role = user.cargo || user.area || 'Membro SheTech';
    setText('profile-role-info', role);

    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.src = user.foto_perfil || 'assets/avatars/avatar.svg';

    const coverBg = document.getElementById('profile-cover-bg');
    if (coverBg && user.capa_perfil) {
        coverBg.style.backgroundImage = `url(${user.capa_perfil})`;
    }

    const aboutText = document.getElementById('profile-about-text');
    if (aboutText) {
        aboutText.textContent = user.sobre || 'Complete seu perfil para compartilhar mais detalhes sobre você.';
    }

    const skillsContainer = document.getElementById('skills-list');
    if (skillsContainer) {
        const skills = Array.isArray(user.habilidades) ? user.habilidades : [];
        skillsContainer.innerHTML = skills.length
            ? skills.map(s => `<span class="skill-tag">${s}</span>`).join('')
            : '<p style="color:var(--gray-500);font-size:14px;">Nenhuma habilidade adicionada ainda.</p>';
    }

    const socialContainer = document.getElementById('profile-social-links');
    if (socialContainer) {
        let html = '';
        if (user.github) html += `<a href="${user.github}" class="social-btn" target="_blank" title="GitHub"><i class="icon-github"></i></a>`;
        if (user.linkedin) html += `<a href="${user.linkedin}" class="social-btn" target="_blank" title="LinkedIn"><i class="icon-linkedin"></i></a>`;
        if (user.instagram) html += `<a href="https://instagram.com/${user.instagram.replace('@','')}" class="social-btn" target="_blank" title="Instagram"><i class="icon-instagram"></i></a>`;
        if (user.portfolio) html += `<a href="${user.portfolio}" class="social-btn" target="_blank" title="Portfólio"><i class="icon-globe"></i></a>`;
        socialContainer.innerHTML = html || '<p style="color:var(--gray-500);font-size:14px;">Nenhum link social adicionado.</p>';
    }

    loadProfileStats();
    setText('profile-date', formatMemberSince(user.createdAt || user.created_at || user.criado_em));
}

async function loadProfileStats() {
    const [projects, events] = await Promise.all([State.getProjects(), State.getEvents()]);
    const isOwnedByUser = (item) => [item?.proprietaria_id, item?.organizador_id, item?.criador_id, item?.author_email].includes(user.email);

    setText('stat-projetos', projects.filter(isOwnedByUser).length);
    setText('stat-eventos', events.filter(isOwnedByUser).length);
    setText('stat-conexoes', 0);
}

document.getElementById('share-btn')?.addEventListener('click', () => openShareModal());

function openShareModal() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Confira o perfil de ${user.nome_completo} no SheTech!`);

    document.body.insertAdjacentHTML('beforeend', `
        <div id="share-modal" class="modal modal-detail-overlay" style="display:flex;z-index:9999;">
            <div class="modal-content" style="max-width:450px;height:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h2 style="margin:0;font-size:18px;">Compartilhar Perfil</h2>
                    <button onclick="document.getElementById('share-modal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;">×</button>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <a href="https://twitter.com/intent/tweet?text=${text}&url=${url}" target="_blank" style="padding:12px;text-align:center;border-radius:8px;background:#1DA1F2;color:white;text-decoration:none;">Twitter</a>
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" style="padding:12px;text-align:center;border-radius:8px;background:#0A66C2;color:white;text-decoration:none;">LinkedIn</a>
                    <button onclick="copyToClipboard('${window.location.href}')" style="padding:12px;border-radius:8px;background:var(--pink);color:white;border:none;cursor:pointer;">Copiar Link</button>
                </div>
            </div>
        </div>`);

    document.getElementById('share-modal').addEventListener('click', (e) => {
        if (e.target.id === 'share-modal') e.target.remove();
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        Layout.showToast?.('Link copiado! 📋', 'success');
    });
}

document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    window.location.href = 'editar-perfil.html';
});

document.addEventListener('DOMContentLoaded', async () => {
    await State.ensureReady();
    if (!State.getCurrentUser()) {
        window.location.href = 'login.html';
        return;
    }

    if (typeof Layout !== 'undefined') {
        await Layout.init({ active: 'perfil' });
    }

    await loadProfileData();

    if (isViewingOtherProfile) {
        document.querySelector('.btn-edit-profile')?.style && (document.querySelector('.btn-edit-profile').style.display = 'none');
        document.querySelector('.btn-settings')?.style && (document.querySelector('.btn-settings').style.display = 'none');
    }
});
