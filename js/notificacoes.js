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
    const recentPosts = (await State.getPosts()).slice(0, 5);
    // Combine notifications and recent activities
    const sections = [];
    if (notifs.length) {
        sections.push({ title: 'Notificações', items: notifs.map(n => ({
            mensagem: n.mensagem,
            createdAt: n.createdAt || n.data,
            unread: !n.lida
        })) });
    }
    if (recentPosts.length) {
        sections.push({ title: 'Atividades Recentes', items: recentPosts.map(p => ({
            mensagem: `${p.author}: ${p.text?.substring(0, 50)}...`,
            createdAt: p.time,
            unread: false
        })) });
    }
    if (!sections.length) {
        container.innerHTML = '<p style="padding:40px;text-align:center;color:var(--gray-500)">Você não tem notificações.</p>';
        return;
    }
    container.innerHTML = sections.map(sec => `
        <h3 class="notif-section-title" style="margin:16px 0 8px; font-size:1.1rem; color:var(--gray-700)">${sec.title}</h3>
        ${sec.items.map(item => `
            <div class="notif-item ${item.unread ? 'unread' : ''}">
                <div>
                    <p>${item.mensagem}</p>
                    <small>${new Date(item.createdAt).toLocaleString('pt-BR')}</small>
                </div>
                ${item.unread ? '<span class="tag-pill">Nova</span>' : ''}
            </div>
        `).join('')}
    `).join('');
}

async function markRead() {
    await State.markAllNotificationsRead(user.email);
    await renderNotifs();
    Layout.initTopbar({ title: 'Notificações' });
    Layout.showToast('Notificações marcadas como lidas.');
}
