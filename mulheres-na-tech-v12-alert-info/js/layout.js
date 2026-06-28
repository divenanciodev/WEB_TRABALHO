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
        return user;
    },

    bindSidebarCollapse() {
        const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (collapsed) document.body.classList.add('sidebar-collapsed');

        let toggle = document.getElementById('sidebar-toggle');
        if (!toggle) {
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar) return;

            toggle = document.createElement('button');
            toggle.id = 'sidebar-toggle';
            toggle.type = 'button';
            toggle.className = 'sidebar-toggle';
            toggle.title = 'Recolher menu';
            toggle.innerHTML = `<i class="${collapsed ? 'lucide-panel-left-open' : 'lucide-panel-left'}"></i>`;
            sidebar.insertBefore(toggle, sidebar.firstChild);
        }

        toggle.onclick = () => {
            document.body.classList.toggle('sidebar-collapsed');
            const isCollapsed = document.body.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            toggle.querySelector('i').className = isCollapsed ? 'lucide-panel-left-open' : 'lucide-panel-left';
            toggle.title = isCollapsed ? 'Expandir menu' : 'Recolher menu';
        };
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
        const avatarUrl = user.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome_completo)}&background=ff3d8b&color=fff`;

        if (avatar) avatar.src = avatarUrl;
        if (name) name.innerText = `Olá, ${user.nome_completo.split(' ')[0]}`;

        const notifs = State.getNotifications(user.email).filter(n => !n.lida);
        const dot = document.getElementById('notif-dot');
        if (dot) dot.style.display = notifs.length > 0 ? 'block' : 'none';

        const memberSince = document.getElementById('sidebar-member-since');
        if (memberSince) {
            const year = user.data_cadastro ? new Date(user.data_cadastro).getFullYear() : new Date().getFullYear();
            memberSince.innerText = `Desde ${year} · @${user.nome_usuario || 'membra'}`;
        }
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
