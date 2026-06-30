const Layout = {
    init(options = {}) {
        const user = State.getCurrentUser();
        if (options.requireAuth !== false && !user) {
            window.location.href = 'login.html';
            return null;
        }

        this.bindSidebarCollapse();
        this.initTopbar(options);
        this.highlightActiveNav(options.active || '');
        
        // Só exibe o card inferior se for a página de configurações
        const sidebarFoot = document.querySelector('.sidebar-foot');
        if (sidebarFoot) sidebarFoot.innerHTML = '';
        
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
        const avatarUrl = user.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome_completo)}&background=ff3d8b&color=fff`;

        if (avatar) avatar.src = avatarUrl;
        const firstName = user.nome_completo.split(' ')[0];
        if (name) name.innerText = `Olá, ${firstName}`;
        if (welcomeName) welcomeName.innerText = firstName;

        const notifs = State.getNotifications(user.email).filter(n => !n.lida);
        const dot = document.getElementById('notif-dot');
        if (dot) dot.style.display = notifs.length > 0 ? 'block' : 'none';
    },

    highlightActiveNav(active) {
        if (!active) return;
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === active);
        });
    },

    showToast(msg) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};
