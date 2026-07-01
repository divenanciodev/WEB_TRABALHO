const DEMO_PROJECT_TITLES = [
    'App de Gestão Financeira',
    'Dashboard de Dados de Saúde',
    'Portfólio Pessoal',
    'Design System SheTech',
    'EducaTech',
    'WaterMap',
    'API de Mentoria'
];

const DEMO_EVENT_TITLES = [
    'Meetup de UX Research',
    'Workshop de Figma Avançado',
    'Hackathon SheTech 2025',
    'Palestra: Mulheres no Open Source',
    'SheTech Summit 2025',
    'Workshop: Introdução ao TypeScript',
    'Hackathon ImpactoTech'
];

function clearSeededDemoData() {
    const cleanup = (key, sampleTitles) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;

            const isSeeded = parsed.some((item) => {
                const haystack = [
                    item.titulo,
                    item.title,
                    item.nome,
                    item.name,
                    item.descricao,
                    item.descricao || item.text,
                    item.conteudo,
                    item.text,
                    item.titulo || item.nome
                ].filter(Boolean).join(' ').toLowerCase();

                return sampleTitles.some((title) => haystack.includes(title.toLowerCase()));
            });

            if (isSeeded) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        } catch (error) {
            console.warn('Não foi possível limpar dados mockados de', key, error);
        }
    };

    cleanup('projects', DEMO_PROJECT_TITLES);
    cleanup('events', DEMO_EVENT_TITLES);
    cleanup('posts', DEMO_EVENT_TITLES);
    cleanup('shetech_projetos', DEMO_PROJECT_TITLES);
    cleanup('shetech_eventos', DEMO_EVENT_TITLES);
}

clearSeededDemoData();

const State = {
    getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    saveData(key, item) {
        const data = this.getData(key);
        if (item.id) {
            const idx = data.findIndex(i => i.id === item.id);
            if (idx !== -1) {
                data[idx] = { ...data[idx], ...item, updatedAt: new Date().toISOString() };
            } else {
                data.push({ ...item, id: Date.now(), createdAt: new Date().toISOString() });
            }
        } else {
            data.push({ ...item, id: Date.now(), createdAt: new Date().toISOString() });
        }
        localStorage.setItem(key, JSON.stringify(data));
    },

    deleteData(key, id) {
        const data = this.getData(key).filter(i => i.id !== id);
        localStorage.setItem(key, JSON.stringify(data));
    },

    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        const users = this.getData('users');
        const idx = users.findIndex(u => u.email === user.email);
        if (idx !== -1) {
            users[idx] = user;
            localStorage.setItem('users', JSON.stringify(users));
        }
    },

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    },

    getProjects() { return this.getData('projects'); },
    getEvents() { return this.getData('events'); },
    getPosts() { return this.getData('posts'); },
    getUsers() { return this.getData('users'); },
    setUsers(users) { localStorage.setItem('users', JSON.stringify(users)); },
    getLinks(email) { 
        return this.getData('links').filter(l => l.proprietaria_id === email); 
    },
    saveLink(link) { this.saveData('links', link); },
    deleteLink(id) { this.deleteData('links', id); },
    getFolders(email) {
        return this.getData('folders').filter(f => f.proprietaria_id === email);
    },
    saveFolder(folder) { this.saveData('folders', folder); },
    deleteFolder(id) { this.deleteData('folders', id); },
    addNotification(email, message) {
        const notif = {
            id: Date.now(),
            destinataria_id: email,
            mensagem: message,
            lida: false,
            createdAt: new Date().toISOString()
        };
        const notifs = this.getData('notifications');
        notifs.push(notif);
        localStorage.setItem('notifications', JSON.stringify(notifs));
    },
    getNotifications(email) {
        return this.getData('notifications').filter(n => n.destinataria_id === email);
    },
    markAllAsRead(email) {
        const notifs = this.getData('notifications');
        notifs.forEach(n => {
            if (n.destinataria_id === email) n.lida = true;
        });
        localStorage.setItem('notifications', JSON.stringify(notifs));
    }
};

const UI = {
    showModal(id) {
        const m = document.getElementById(id);
        if (m) m.style.display = 'flex';
    },
    closeModal(id) {
        const m = document.getElementById(id);
        if (m) m.style.display = 'none';
    },
    updateNotificationBadge() {
        const user = State.getCurrentUser();
        if (!user) return;
        const notifs = State.getNotifications(user.email).filter(n => !n.lida);
        const badge = document.querySelector('.icon-btn .dot');
        if (badge) {
            badge.style.display = notifs.length > 0 ? 'block' : 'none';
        }
    }
};

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
