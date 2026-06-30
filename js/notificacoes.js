const user = Layout.init({ active: 'dashboard', title: 'Notificações' });
    if (!user) throw new Error('auth');

    function renderNotifs() {
      const container = document.getElementById('notif-container');
      const notifs = State.getNotifications(user.email);
      if (!notifs.length) {
        container.innerHTML = '<p style="padding:40px;text-align:center;color:var(--gray-500)"><i class="icon-bell-off" style="font-size:24px;display:block;margin-bottom:8px"></i>Você não tem notificações.</p>';
        return;
      }
      container.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.lida ? '' : 'unread'}">
          <div><p>${n.mensagem}</p><small>${new Date(n.data).toLocaleString('pt-BR')}</small></div>
          ${n.lida ? '' : '<span class="tag-pill">Nova</span>'}
        </div>`).join('');
    }

    function markRead() {
      State.markAllAsRead(user.email);
      renderNotifs();
      Layout.initTopbar({ title: 'Notificações' });
      Layout.showToast('Notificações marcadas como lidas.');
    }

    renderNotifs();