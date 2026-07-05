let user = null;

document.addEventListener('DOMContentLoaded', async () => {
  await State.ensureReady();
  user = await Layout.init({ active: 'dashboard', title: 'Notificações' });
  if (!user) return;
  await renderNotifs();
});

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Agora';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Recente';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffHr < 24) return `Há ${diffHr}h`;
  if (diffDay < 7) return `Há ${diffDay} dia${diffDay > 1 ? 's' : ''}`;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function detectNotifType(mensagem) {
  const text = (mensagem || '').toLowerCase();
  if (text.includes('request-actions') || text.includes('solicitou inscrição')) return 'project';
  if (text.includes('link') && (text.includes('salvo') || text.includes('salva'))) return 'link';
  if (text.includes('post') || text.includes('comentário') || text.includes('comentario')) return 'activity';
  return 'info';
}

function getNotifIcon(type) {
  const icons = {
    project: 'icon-folder-kanban',
    link: 'icon-link',
    activity: 'icon-message-square',
    info: 'icon-bell'
  };
  return icons[type] || icons.info;
}

function parseNotificationHtml(mensagem) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = mensagem || '';

  const actionsEl = wrapper.querySelector('.request-actions');
  const detailsEl = wrapper.querySelector('.notif-details')
    || wrapper.querySelector('[style*="margin: 10px 0"]');

  let actionsHtml = '';
  if (actionsEl) {
    actionsHtml = actionsEl.innerHTML;
    actionsEl.remove();
  }

  let detailsHtml = '';
  if (detailsEl) {
    detailsHtml = detailsEl.classList.contains('notif-details')
      ? detailsEl.outerHTML
      : `<div class="notif-details">${detailsEl.innerHTML}</div>`;
    detailsEl.remove();
  }

  wrapper.querySelectorAll('br').forEach((br) => br.replaceWith(' '));

  let messageHtml = wrapper.innerHTML.trim();
  messageHtml = messageHtml.replace(/^<p[^>]*>([\s\S]*)<\/p>$/i, '$1');

  if (!messageHtml.startsWith('<p')) {
    messageHtml = `<p class="notif-message">${messageHtml}</p>`;
  } else {
    messageHtml = messageHtml.replace(/<p(?![^>]*class)/gi, '<p class="notif-message"');
  }

  return { messageHtml, detailsHtml, actionsHtml };
}

function buildNotifCard(item) {
  const type = detectNotifType(item.mensagem);
  const { messageHtml, detailsHtml, actionsHtml } = parseNotificationHtml(item.mensagem);
  const timeLabel = formatRelativeTime(item.createdAt);
  const fullDate = item.createdAt
    ? new Date(item.createdAt).toLocaleString('pt-BR')
    : '';

  return `
    <article class="notif-card ${item.unread ? 'unread' : ''}" data-type="${type}">
      <div class="notif-icon notif-icon--${type === 'project' ? 'project' : type === 'link' ? 'link' : type === 'activity' ? 'activity' : 'info'}">
        <i class="${getNotifIcon(type)}"></i>
      </div>
      <div class="notif-content">
        ${messageHtml}
        ${detailsHtml}
        ${actionsHtml ? `<div class="notif-actions request-actions">${actionsHtml}</div>` : ''}
        <div class="notif-meta">
          <time datetime="${item.createdAt || ''}" title="${fullDate}">${timeLabel}</time>
        </div>
      </div>
      ${item.unread ? '<span class="notif-badge">Nova</span>' : ''}
    </article>
  `;
}

async function renderNotifs() {
  const container = document.getElementById('notif-container');
  const notifs = await State.getNotifications(user.email);
  const recentPosts = (await State.getPosts()).slice(0, 5);

  const sections = [];

  if (notifs.length) {
    sections.push({
      title: 'Notificações',
      count: notifs.filter((n) => !n.lida).length,
      items: notifs.map((n) => ({
        mensagem: n.mensagem,
        createdAt: n.createdAt || n.data,
        unread: !n.lida
      }))
    });
  }

  if (recentPosts.length) {
    sections.push({
      title: 'Atividades Recentes',
      count: 0,
      items: recentPosts.map((p) => ({
        mensagem: `<p class="notif-message"><strong>${escapeHtml(p.author || 'Usuária')}</strong> publicou na comunidade: ${escapeHtml((p.text || '').substring(0, 120))}${(p.text || '').length > 120 ? '…' : ''}</p>`,
        createdAt: p.time || p.createdAt,
        unread: false
      }))
    });
  }

  if (!sections.length) {
    container.innerHTML = `
      <div class="notif-empty">
        <div class="notif-empty-icon"><i class="icon-bell-off"></i></div>
        <h3>Nenhuma notificação</h3>
        <p>Suas atualizações e solicitações aparecerão aqui.</p>
      </div>`;
    return;
  }

  container.innerHTML = sections.map((sec) => `
    <section class="notif-section">
      <header class="notif-section-header">
        <h2 class="notif-section-title">${sec.title}</h2>
        ${sec.count > 0 ? `<span class="notif-section-count">${sec.count} nova${sec.count > 1 ? 's' : ''}</span>` : ''}
      </header>
      <div class="notif-list">
        ${sec.items.map((item) => buildNotifCard(item)).join('')}
      </div>
    </section>
  `).join('');
}

async function markRead() {
  await State.markAllNotificationsRead(user.email);
  await renderNotifs();
  Layout.initTopbar({ title: 'Notificações' });
  Layout.showToast('Notificações marcadas como lidas.');
}
