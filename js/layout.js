const UI = {
    showModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    },
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    },
    updateNotificationBadge() {
        const user = State.getCurrentUser();
        if (!user) return;
        State.getNotifications(user.email).then(items => {
            const unread = items.filter(n => !n.lida);
            const dot = document.getElementById('notif-dot');
            if (dot) dot.style.display = unread.length > 0 ? 'block' : 'none';
        }).catch(() => {});
    }
};
window.UI = UI;

const Layout = {
    async init(options = {}) {
        await State.ensureReady();
        const user = State.getCurrentUser();
        if (options.requireAuth !== false && !user) {
            window.location.href = 'login.html';
            return null;
        }

        this.initTopbar(options);
        this.highlightActiveNav(options.active || '');

        return user;
    },

    bindSidebarCollapse() {
        const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (collapsed) document.body.classList.add('sidebar-collapsed');

        const toggle = document.getElementById('sidebar-toggle');
        if (!toggle) return;

        const updateIcon = (isCollapsed) => {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', isCollapsed ? 'panel-left-open' : 'panel-left');
                if (window.lucide) lucide.createIcons();
            }
        };

        updateIcon(collapsed);

        toggle.onclick = () => {
            document.body.classList.toggle('sidebar-collapsed');
            const isCollapsed = document.body.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            updateIcon(isCollapsed);
            toggle.title = isCollapsed ? 'Expandir menu' : 'Recolher menu';
        };
    },

    updateSidebarCard(user) {
        // Card de membro e botão sair removidos conforme solicitação
    },

    initTopbar(options = {}) {
        const searchEl = document.getElementById('topbar-search');
        const topbar = document.querySelector('.topbar');
        if (searchEl) {
            searchEl.style.display = options.showSearch ? 'flex' : 'none';
            if (topbar) topbar.classList.toggle('has-search', !!options.showSearch);
        }

        const titleEl = document.getElementById('page-title');
        if (titleEl && options.title) {
            titleEl.textContent = options.title;
        }

        const user = State.getCurrentUser();
        if (!user) return;

        const avatar = document.getElementById('top-avatar');
        const name = document.getElementById('top-name');
        const welcomeName = document.getElementById('welcome-name');
        const avatarUrl = user.foto_perfil || 'assets/avatars/avatar.svg';

        if (avatar) avatar.src = avatarUrl;

        // CORREÇÃO: atualizar avatar do modal de comentários (se existir na página)
        const commentAvatar = document.getElementById('comment-avatar');
        if (commentAvatar) commentAvatar.src = avatarUrl;
        
        const firstName = (user.nome_completo || 'Usuário').split(' ')[0];
        if (name) name.innerText = `Olá, ${firstName}`;
        if (welcomeName) welcomeName.innerText = firstName;

        State.getNotifications(user.email).then(items => {
            const unread = items.filter(n => !n.lida);
            const dot = document.getElementById('notif-dot');
            if (dot) dot.style.display = unread.length > 0 ? 'block' : 'none';
        }).catch(() => {});
    },

    highlightActiveNav(active) {
        if (!active) return;
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === active);
        });
    },

    showSuccessModal(title, message, callback) {
        // Remover modal existente se houver
        const existing = document.getElementById('global-success-modal');
        if (existing) existing.remove();

        const modalHtml = `
            <div id="global-success-modal" class="modal" style="display: flex; background: rgba(14,14,16,0.7); backdrop-filter: blur(8px); z-index: 9999; position: fixed; inset: 0; justify-content: center; align-items: center;">
                <div class="modal-content" style="max-width: 400px; height: auto; border-radius: 24px; text-align: center; padding: 40px 32px; margin: auto; background: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.2); position: relative;">
                    <button id="close-success-modal-x" class="modal-close-x">&times;</button>
                    <div style="width: 80px; height: 80px; background: #e6fffa; color: #38b2ac; border-radius: 50%; display: grid; place-items: center; margin: 0 auto 24px;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <h2 style="font-size: 24px; margin-bottom: 12px; color: #1a1a1f; font-family: 'Sora', sans-serif;">${title}</h2>
                    <p style="color: #4a4a55; margin-bottom: 32px; line-height: 1.5; font-size: 15px;">${message}</p>
                    <button id="success-modal-btn" class="btn btn-primary" style="width: 100%; height: 48px; font-size: 16px; border-radius: 12px; background: linear-gradient(135deg,#ff3d8b 0%, #ff7ab0 60%); color: #fff; font-weight: 600;">Continuar</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('global-success-modal');
        const btn = document.getElementById('success-modal-btn');
        const closeX = document.getElementById('close-success-modal-x');

        const close = () => {
            modal.remove();
        };

        btn.onclick = () => {
            close();
            if (callback) callback();
        };

        closeX.onclick = close;
        modal.onclick = (e) => {
            if (e.target === modal) close();
        };
    },

    showToast(msg, type = 'success') {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        // Estilização dinâmica baseada no tipo
        toast.style.background = type === 'error' ? '#ff3d8b' : '#1a1a1f';
        toast.innerText = msg;
        toast.classList.add('show');
        
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};
