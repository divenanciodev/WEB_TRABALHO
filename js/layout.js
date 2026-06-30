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
        if (options.active === 'configuracoes') {
            this.updateSidebarCard(user);
        } else {
            const sidebarFoot = document.querySelector('.sidebar-foot');
            if (sidebarFoot) sidebarFoot.innerHTML = '';
        }
        
        return user;
    },

    bindSidebarCollapse() {
        const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        // Desativa transições temporariamente para evitar o "tremido" no carregamento
        document.body.style.transition = 'none';
        
        if (collapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
        
        // Força o reflow para aplicar a classe sem transição
        document.body.offsetHeight;
        
        // Restaura a transição definida no CSS após um pequeno delay para garantir que o estado inicial foi aplicado
        setTimeout(() => {
            document.body.style.transition = '';
        }, 50);

        let toggle = document.getElementById('sidebar-toggle');
        if (!toggle) {
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar) return;

            toggle = document.createElement('button');
            toggle.id = 'sidebar-toggle';
            toggle.type = 'button';
            toggle.className = 'sidebar-toggle';
            toggle.title = collapsed ? 'Expandir menu' : 'Recolher menu';
            // Usando o ícone correto da Lucide para recolher/expandir
            toggle.innerHTML = `<i class="${collapsed ? 'icon-panel-left-open' : 'icon-panel-left'}"></i>`;
            sidebar.insertBefore(toggle, sidebar.firstChild);
        } else {
            // Se o toggle já existe, atualiza o ícone e título baseado no estado inicial
            const icon = toggle.querySelector('i');
            if (icon) icon.className = collapsed ? 'icon-panel-left-open' : 'icon-panel-left';
            toggle.title = collapsed ? 'Expandir menu' : 'Recolher menu';
        }

        toggle.onclick = () => {
            document.body.classList.toggle('sidebar-collapsed');
            const isCollapsed = document.body.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            
            const icon = toggle.querySelector('i');
            if (icon) icon.className = isCollapsed ? 'icon-panel-left-open' : 'icon-panel-left';
            toggle.title = isCollapsed ? 'Expandir menu' : 'Recolher menu';
        };
    },

    updateSidebarCard(user) {
        if (!user) return;
        const sidebarFoot = document.querySelector('.sidebar-foot');
        if (sidebarFoot) {
            const year = user.data_cadastro ? new Date(user.data_cadastro).getFullYear() : new Date().getFullYear();
            sidebarFoot.innerHTML = `
                <div class="mini-card">
                    <div class="mini-title">Membro SheTech</div>
                    <div class="mini-sub">Desde ${year} · @${user.nome_usuario || 'membra'}</div>
                    <button onclick="State.logout()" class="nav-item" style="width:100%;text-align:left;background:rgba(255,61,139,0.1);border:none;margin-top:12px;padding:8px 12px;color:var(--pink)">
                        <i class="icon-log-out"></i> <span class="nav-label">Sair</span>
                    </button>
                </div>
            `;
        }
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
