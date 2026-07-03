let user = null;

document.addEventListener('DOMContentLoaded', async () => {
    await State.ensureReady();
    user = await Layout.init({ active: 'configuracoes' });
    if (!user) return;

    document.getElementById('settings-name').value = user.nome_completo || user.nome || '';
    document.getElementById('settings-email').value = user.email || '';
    if (document.getElementById('settings-username')) {
        document.getElementById('settings-username').value = user.nome_usuario || user.username || '';
    }

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

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!user) return;
    const updated = {
        ...user,
        nome_completo: document.getElementById('settings-name').value,
        nome_usuario: document.getElementById('settings-username')?.value || user.nome_usuario,
    };
    await State.setCurrentUser(updated);
    user = State.getCurrentUser();
    Layout.showToast('Configurações salvas!');
    setTimeout(() => window.location.reload(), 1000);
});

function saveNotifSettings() {
    Layout.showToast('Preferências de notificação salvas!');
}

function savePrivSettings() {
    Layout.showToast('Preferências de privacidade salvas!');
}

function openPasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function closePasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.getElementById('password-form').reset();
}

document.getElementById('password-modal').addEventListener('click', (e) => {
    if (e.target.id === 'password-modal') closePasswordModal();
});

document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-new-password').value;

    if (newPass !== confirm) {
        Layout.showToast('As novas senhas não coincidem!', 'error');
        return;
    }

    const client = window.SupabaseAuth?.client;
    if (!client) {
        Layout.showToast('Supabase indisponível.', 'error');
        return;
    }

    const { error } = await client.auth.updateUser({ password: newPass });
    if (error) {
        Layout.showToast(error.message || 'Erro ao alterar senha.', 'error');
        return;
    }

    Layout.showToast('Senha alterada com sucesso!');
    closePasswordModal();
});

function deactivateAccount() {
    Layout.showSuccessModal(
        'Desativar Conta?',
        'Você será desconectada. Para voltar, faça login novamente.',
        () => State.logout()
    );
}

function deleteAccount() {
    Layout.showToast('Para excluir permanentemente, use o painel do Supabase ou entre em contato com o suporte.', 'error');
}
