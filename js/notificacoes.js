let user = null;

document.addEventListener('DOMContentLoaded', async () => {
    await State.ensureReady();
    user = await Layout.init({ active: 'dashboard', title: 'Notificações' });
    if (!user) return;
    await renderNotifs();
});

async function renderNotifs() {
    const container = document.getElementById('notif-container');
    const notifs = await State.getNotifications(user.email);
    if (!notifs.length) {
        container.innerHTML = '<p style="padding:40px;text-align:center;color:var(--gray-500)">Você não tem notificações.</p>';
        return;
    }
    container.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.lida ? '' : 'unread'}">
            <div><p>${n.mensagem}</p><small>${new Date(n.createdAt || n.data).toLocaleString('pt-BR')}</small></div>
            ${n.lida ? '' : '<span class="tag-pill">Nova</span>'}
        </div>`).join('');
}

async function markRead() {
    await State.markAllNotificationsRead(user.email);
    await renderNotifs();
    Layout.initTopbar({ title: 'Notificações' });
    Layout.showToast('Notificações marcadas como lidas.');
}
