const user = Layout.init({ active: 'perfil' });
if (!user) throw new Error('auth');

let currentAvatar = user.foto_perfil || '';
let skills = Array.isArray(user.habilidades) ? [...user.habilidades] : [];

/* ─── CARREGAR CAMPOS ─────────────────────────────────── */
function loadFields() {
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome_completo || 'U')}&background=ff3d8b&color=fff`;

    setVal('edit-name',      user.nome_completo || '');
    setVal('edit-username',  user.nome_usuario  || '');
    setVal('edit-bio',       user.biografia     || '');
    setVal('edit-role',      user.cargo         || '');
    setVal('edit-area',      user.area          || '');
    setVal('edit-linkedin',  user.linkedin      || '');
    setVal('edit-github',    user.github        || '');
    setVal('edit-portfolio', user.portfolio     || '');
    setVal('edit-instagram', user.instagram     || '');

    const avatarSrc = currentAvatar || fallbackAvatar;
    setImg('edit-avatar-preview', avatarSrc);
    setImg('preview-avatar-img',  avatarSrc);

    updateBioCount();
    renderSkills();
    updatePreview();
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}
function setImg(id, src) {
    const el = document.getElementById(id);
    if (el) el.src = src;
}

/* ─── AVATAR ──────────────────────────────────────────── */
document.getElementById('avatar-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        Layout.showToast('Imagem muito grande. Máx. 2 MB.'); return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        currentAvatar = ev.target.result;
        setImg('edit-avatar-preview', currentAvatar);
        setImg('preview-avatar-img',  currentAvatar);
    };
    reader.readAsDataURL(file);
});

document.getElementById('btn-remove-avatar')?.addEventListener('click', () => {
    currentAvatar = '';
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome_completo || 'U')}&background=ff3d8b&color=fff`;
    setImg('edit-avatar-preview', fallback);
    setImg('preview-avatar-img',  fallback);
    document.getElementById('avatar-upload').value = '';
});

/* ─── CONTADOR DE BIO ─────────────────────────────────── */
function updateBioCount() {
    const bio   = document.getElementById('edit-bio');
    const count = document.getElementById('bio-count');
    if (bio && count) {
        count.textContent = bio.value.length;
        count.style.color = bio.value.length >= 280 ? 'var(--pink)' : '';
    }
}
document.getElementById('edit-bio')?.addEventListener('input', () => {
    updateBioCount();
    updatePreview();
});

/* ─── PRÉVIA EM TEMPO REAL ────────────────────────────── */
function updatePreview() {
    const name = document.getElementById('edit-name')?.value   || 'Seu Nome';
    const role = document.getElementById('edit-role')?.value   || 'Cargo';
    const bio  = document.getElementById('edit-bio')?.value    || 'Sua bio aparecerá aqui.';

    setText('preview-name', name);
    setText('preview-role', role || 'Cargo');
    setText('preview-bio',  bio  || 'Sua bio aparecerá aqui.');
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

['edit-name', 'edit-role'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePreview);
});

/* ─── HABILIDADES ─────────────────────────────────────── */
function renderSkills() {
    const container = document.getElementById('skills-tags');
    const preview   = document.getElementById('preview-skills');
    if (!container) return;

    container.innerHTML = skills.map((s, i) => `
        <span class="skill-tag">
            ${s}
            <button type="button" class="skill-remove" data-i="${i}" title="Remover">×</button>
        </span>
    `).join('');

    if (preview) {
        preview.innerHTML = skills.slice(0, 5).map(s =>
            `<span class="preview-skill-tag">${s}</span>`
        ).join('');
    }

    container.querySelectorAll('.skill-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            skills.splice(Number(btn.dataset.i), 1);
            renderSkills();
        });
    });
}

function addSkill() {
    const input = document.getElementById('skill-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    if (skills.length >= 15) { Layout.showToast('Máx. 15 habilidades.'); return; }
    if (skills.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
        Layout.showToast('Habilidade já adicionada.'); return;
    }
    skills.push(val);
    input.value = '';
    renderSkills();
}

document.getElementById('btn-add-skill')?.addEventListener('click', addSkill);
document.getElementById('skill-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
});

/* ─── VALIDAÇÃO ───────────────────────────────────────── */
function validate() {
    let ok = true;

    const name = document.getElementById('edit-name')?.value.trim();
    const errName = document.getElementById('err-name');
    if (!name) {
        if (errName) errName.textContent = 'Nome é obrigatório.';
        ok = false;
    } else if (errName) errName.textContent = '';

    const username = document.getElementById('edit-username')?.value.trim();
    const errUser  = document.getElementById('err-username');
    if (!username) {
        if (errUser) errUser.textContent = 'Nome de usuária é obrigatório.';
        ok = false;
    } else if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
        if (errUser) errUser.textContent = 'Use apenas letras, números, _ ou .';
        ok = false;
    } else if (errUser) errUser.textContent = '';

    return ok;
}

/* ─── SALVAR ──────────────────────────────────────────── */
document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    const updatedUser = {
        ...user,
        nome_completo: document.getElementById('edit-name')?.value.trim(),
        nome_usuario:  document.getElementById('edit-username')?.value.trim(),
        biografia:     document.getElementById('edit-bio')?.value.trim(),
        cargo:         document.getElementById('edit-role')?.value.trim(),
        area:          document.getElementById('edit-area')?.value,
        linkedin:      document.getElementById('edit-linkedin')?.value.trim(),
        github:        document.getElementById('edit-github')?.value.trim(),
        portfolio:     document.getElementById('edit-portfolio')?.value.trim(),
        instagram:     document.getElementById('edit-instagram')?.value.trim(),
        habilidades:   skills,
        foto_perfil:   currentAvatar,
    };

    State.setCurrentUser(updatedUser);
    Layout.showToast('Perfil atualizado com sucesso! ✨');
    setTimeout(() => window.location.href = 'perfil.html', 1100);
});

/* ─── INIT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', loadFields);