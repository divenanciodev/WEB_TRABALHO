const user = Layout.init({ active: 'perfil' });
if (!user) throw new Error('auth');

let currentAvatar = user.foto_perfil || '';
let currentCover = user.capa_perfil || '';
let skills = Array.isArray(user.habilidades) ? [...user.habilidades] : [];

/* ─── CARREGAR CAMPOS ─────────────────────────────────── */
function loadFields() {
    const fallbackAvatar = `assets/avatars/avatar.svg`;

    setVal('edit-name',      user.nome_completo || '');
    setVal('edit-username',  user.nome_usuario  || '');
    setVal('edit-bio',       user.biografia     || '');
    setVal('edit-about',     user.sobre         || '');
    setVal('edit-role',      user.cargo         || '');
    
    // Lógica de Área de Atuação
    const areaSelect = document.getElementById('edit-area');
    if (areaSelect) {
        const predefinedAreas = Array.from(areaSelect.options).map(opt => opt.value);
        if (user.area && !predefinedAreas.includes(user.area)) {
            const opt = document.createElement('option');
            opt.value = user.area;
            opt.text = user.area;
            areaSelect.add(opt, areaSelect.options[areaSelect.options.length - 1]);
            areaSelect.value = user.area;
        } else {
            areaSelect.value = user.area || '';
        }
    }

    setVal('edit-linkedin',  user.linkedin      || '');
    setVal('edit-github',    user.github        || '');
    setVal('edit-portfolio', user.portfolio     || '');
    setVal('edit-instagram', user.instagram     || '');

    const avatarSrc = currentAvatar || fallbackAvatar;
    setImg('edit-avatar-preview', avatarSrc);
    setImg('preview-avatar-img',  avatarSrc);

    if (currentCover) {
        const coverImg = document.getElementById('edit-cover-preview');
        if (coverImg) {
            coverImg.src = currentCover;
            coverImg.style.display = 'block';
        }
    }

    updateBioCount();
    updateAboutCount();
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

/* ─── UPLOADS ────────────────────────────────────────── */
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

document.getElementById('cover-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        Layout.showToast('Imagem muito grande. Máx. 2 MB.'); return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        currentCover = ev.target.result;
        const coverImg = document.getElementById('edit-cover-preview');
        if (coverImg) {
            coverImg.src = currentCover;
            coverImg.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
});

document.getElementById('btn-remove-avatar')?.addEventListener('click', () => {
    currentAvatar = '';
    const fallback = `assets/avatars/avatar.svg`;
    setImg('edit-avatar-preview', fallback);
    setImg('preview-avatar-img',  fallback);
    document.getElementById('avatar-upload').value = '';
});

/* ─── ÁREA DE ATUAÇÃO ────────────────────────────────── */
function toggleCustomArea(val) {
    if (val === 'Outra') {
        openCustomAreaModal();
    }
}

function openCustomAreaModal() {
    const modalHtml = `
        <div id="custom-area-modal" class="modal modal-detail-overlay" style="display: flex; z-index: 10002;">
            <div class="modal-content" style="max-width: 400px; height: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>Sua Atuação</h2>
                    <button onclick="document.getElementById('custom-area-modal').remove()" style="font-size: 24px;">&times;</button>
                </div>
                <div class="form-group">
                    <label>Digite sua área de atuação</label>
                    <input type="text" id="custom-area-input" class="form-control" placeholder="Ex: Desenvolvedora Web">
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="saveCustomArea()" class="btn btn-primary" style="flex: 1;">Confirmar</button>
                    <button onclick="document.getElementById('custom-area-modal').remove()" class="btn btn-outline" style="flex: 1;">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveCustomArea() {
    const val = document.getElementById('custom-area-input').value.trim();
    if (val) {
        const select = document.getElementById('edit-area');
        // Adicionar nova opção e selecionar
        const opt = document.createElement('option');
        opt.value = val;
        opt.text = val;
        select.add(opt, select.options[select.options.length - 1]);
        select.value = val;
    }
    document.getElementById('custom-area-modal').remove();
}

/* ─── CONTADORES ──────────────────────────────────────── */
function updateBioCount() {
    const bio   = document.getElementById('edit-bio');
    const count = document.getElementById('bio-count');
    if (bio && count) {
        count.textContent = bio.value.length;
    }
}
function updateAboutCount() {
    const about = document.getElementById('edit-about');
    const count = document.getElementById('about-count');
    if (about && count) {
        count.textContent = about.value.length;
    }
}

document.getElementById('edit-bio')?.addEventListener('input', () => {
    updateBioCount();
    updatePreview();
});
document.getElementById('edit-about')?.addEventListener('input', updateAboutCount);

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

    const areaSelect = document.getElementById('edit-area');
    const customAreaInput = document.getElementById('edit-area-custom');
    let finalArea = areaSelect?.value;
    if (finalArea === 'Outra' && customAreaInput?.value.trim()) {
        finalArea = customAreaInput.value.trim();
    }

    const updatedUser = {
        ...user,
        nome_completo: document.getElementById('edit-name')?.value.trim(),
        nome_usuario:  document.getElementById('edit-username')?.value.trim(),
        biografia:     document.getElementById('edit-bio')?.value.trim(),
        sobre:         document.getElementById('edit-about')?.value.trim(),
        cargo:         document.getElementById('edit-role')?.value.trim(),
        area:          finalArea,
        linkedin:      document.getElementById('edit-linkedin')?.value.trim(),
        github:        document.getElementById('edit-github')?.value.trim(),
        portfolio:     document.getElementById('edit-portfolio')?.value.trim(),
        instagram:     document.getElementById('edit-instagram')?.value.trim(),
        habilidades:   skills,
        foto_perfil:   currentAvatar,
        capa_perfil:   currentCover
    };

    State.setCurrentUser(updatedUser);
    
    // Salva no Supabase para visibilidade global
    if (window.SupabaseAuth?.client) {
      const profileToSync = {
        ...updatedUser,
        updatedAt: new Date().toISOString()
      };
      window.SupabaseAuth.client
        .from('users')
        .upsert(profileToSync, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('Erro ao sincronizar perfil com Supabase:', error);
        });
    }

    Layout.showToast('Perfil atualizado com sucesso! ✨');
    setTimeout(() => window.location.href = 'perfil.html', 1100);
});

/* ─── INIT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', loadFields);
