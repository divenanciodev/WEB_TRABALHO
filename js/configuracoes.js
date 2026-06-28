const user = Layout.init({ active: 'configuracoes' });
if (!user) throw new Error('auth');

/* ── PREENCHE CAMPOS DE CONTA ── */
document.getElementById('settings-name').value  = user.nome_completo || user.nome || '';
document.getElementById('settings-email').value = user.email || '';
if (document.getElementById('settings-username')) {
    document.getElementById('settings-username').value = user.username || '';
}

/* ── SALVA CONTA ── */
document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = {
        ...user,
        nome_completo: document.getElementById('settings-name').value,
        username: document.getElementById('settings-username')?.value || user.username,
    };
    State.setCurrentUser(updated);
    Layout.showToast('Configurações salvas!');
    setTimeout(() => window.location.reload(), 1000);
});

/* ── NOTIFICAÇÕES ── */
function saveNotifSettings() {
    const prefs = {
        eventos:         document.getElementById('notif-eventos')?.checked,
        conexoes:        document.getElementById('notif-conexoes')?.checked,
        projetos:        document.getElementById('notif-projetos')?.checked,
        emailResumo:     document.getElementById('notif-email-resumo')?.checked,
        emailNovidades:  document.getElementById('notif-email-novidades')?.checked,
    };
    const updated = { ...user, notifPrefs: prefs };
    State.setCurrentUser(updated);
    Layout.showToast('Preferências de notificação salvas!');
}

/* ── PRIVACIDADE ── */
function savePrivSettings() {
    const prefs = {
        perfilPublico: document.getElementById('priv-perfil')?.checked,
        mostrarEmail:  document.getElementById('priv-email')?.checked,
        indexarBusca:  document.getElementById('priv-busca')?.checked,
    };
    const updated = { ...user, privPrefs: prefs };
    State.setCurrentUser(updated);
    Layout.showToast('Preferências de privacidade salvas!');
}

/* ── APARÊNCIA: TEMA ── */
function setTheme(theme) {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`theme-${theme}`)?.classList.add('active');
    document.body.setAttribute('data-theme', theme);
    const updated = { ...user, theme };
    State.setCurrentUser(updated);
    Layout.showToast(`Tema ${theme === 'dark' ? 'escuro' : 'claro'} ativado!`);
}

/* ── APARÊNCIA: COR DE DESTAQUE ── */
document.querySelectorAll('.swatch').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.dataset.color;
        document.body.setAttribute('data-accent', color);
        const updated = { ...user, accentColor: color };
        State.setCurrentUser(updated);
        Layout.showToast('Cor de destaque atualizada!');
    });
});

/* ── ZONA DE PERIGO ── */
function confirmDelete() {
    const ok = confirm(
        'Tem certeza que deseja excluir sua conta?\n\nEsta ação é PERMANENTE e não pode ser desfeita. Todos os seus dados serão removidos.'
    );
    if (ok) {
        alert('Funcionalidade de exclusão em breve. Sua conta está segura!');
    }
}

/* ── RESTAURA PREFERÊNCIAS SALVAS ── */
document.addEventListener('DOMContentLoaded', () => {
    // Tema
    const savedTheme = user.theme || 'light';
    setTheme(savedTheme);

    // Cor
    if (user.accentColor) {
        document.querySelectorAll('.swatch').forEach(b => {
            b.classList.toggle('active', b.dataset.color === user.accentColor);
        });
        document.body.setAttribute('data-accent', user.accentColor);
    }

    // Notificações salvas
    if (user.notifPrefs) {
        const p = user.notifPrefs;
        if (document.getElementById('notif-eventos'))        document.getElementById('notif-eventos').checked        = !!p.eventos;
        if (document.getElementById('notif-conexoes'))       document.getElementById('notif-conexoes').checked       = !!p.conexoes;
        if (document.getElementById('notif-projetos'))       document.getElementById('notif-projetos').checked       = !!p.projetos;
        if (document.getElementById('notif-email-resumo'))   document.getElementById('notif-email-resumo').checked   = !!p.emailResumo;
        if (document.getElementById('notif-email-novidades'))document.getElementById('notif-email-novidades').checked = !!p.emailNovidades;
    }

    // Privacidade salva
    if (user.privPrefs) {
        const p = user.privPrefs;
        if (document.getElementById('priv-perfil')) document.getElementById('priv-perfil').checked = !!p.perfilPublico;
        if (document.getElementById('priv-email'))  document.getElementById('priv-email').checked  = !!p.mostrarEmail;
        if (document.getElementById('priv-busca'))  document.getElementById('priv-busca').checked  = !!p.indexarBusca;
    }

    // Nav lateral: scroll suave entre seções
    document.querySelectorAll('.config-nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.config-nav-item').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const target = document.getElementById(link.dataset.section);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});