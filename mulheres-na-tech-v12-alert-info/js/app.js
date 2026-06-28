// State Management with localStorage
const State = {
    // Users
    getUsers: () => JSON.parse(localStorage.getItem('users')) || [],
    setUsers: (users) => localStorage.setItem('users', JSON.stringify(users)),
    getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser')) || null,
    setCurrentUser: (user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Also update in the main users list
        const users = State.getUsers();
        const idx = users.findIndex(u => u.email === user.email);
        if (idx !== -1) {
            users[idx] = user;
            State.setUsers(users);
        }
    },
    logout: () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    },

    // Generic CRUD Helper
    getData: (key) => JSON.parse(localStorage.getItem(key)) || [],
    saveData: (key, item) => {
        const data = State.getData(key);
        if (item.id) {
            const index = data.findIndex(i => i.id === item.id);
            if (index !== -1) {
                data[index] = { ...data[index], ...item };
            }
        } else {
            item.id = Date.now();
            item.createdAt = new Date().toISOString();
            data.push(item);
        }
        localStorage.setItem(key, JSON.stringify(data));
        return item;
    },
    deleteData: (key, id) => {
        let data = State.getData(key);
        data = data.filter(i => i.id !== id);
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Projects
    getProjects: () => State.getData('projects'),
    
    // Events
    getEvents: () => State.getData('events'),

    // Posts (Community)
    getPosts: () => State.getData('posts'),
    
    // Links
    getLinks: (userId) => {
        const links = State.getData('links');
        return links.filter(l => l.proprietaria_id === userId);
    },
    saveLink: (link) => {
        return State.saveData('links', link);
    },
    deleteLink: (linkId) => {
        State.deleteData('links', linkId);
    },
    toggleFavoriteLink: (linkId) => {
        const links = State.getData('links');
        const index = links.findIndex(l => l.id === linkId);
        if (index !== -1) {
            links[index].favorito = !links[index].favorito;
            localStorage.setItem('links', JSON.stringify(links));
        }
    },

    // Notifications
    getNotifications: (userId) => {
        const notifs = State.getData('notifications');
        return notifs.filter(n => n.usuario_id === userId).reverse();
    },
    addNotification: (userId, msg) => {
        State.saveData('notifications', { 
            usuario_id: userId, 
            mensagem: msg, 
            lida: false,
            data: new Date().toISOString() 
        });
    },
    markAllAsRead: (userId) => {
        const notifs = State.getData('notifications');
        notifs.forEach(n => {
            if (n.usuario_id === userId) n.lida = true;
        });
        localStorage.setItem('notifications', JSON.stringify(notifs));
    }
};

// UI Helpers
const UI = {
    updateAuthLinks: () => {
        const authLinks = document.getElementById('auth-links');
        if (!authLinks) return;

        const user = State.getCurrentUser();
        if (user) {
            authLinks.innerHTML = `
                <span>Olá, ${user.nome_usuario}</span>
                <a href="dashboard.html" class="btn btn-primary">Dashboard</a>
                <button onclick="State.logout()" class="btn btn-outline">Sair</button>
            `;
        } else {
            authLinks.innerHTML = `
                <a href="login.html" class="btn btn-outline">Login</a>
                <a href="cadastro.html" class="btn btn-primary">Cadastrar</a>
            `;
        }
    },
    
    showModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    },
    
    closeModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    },

    updateNotificationBadge: () => {
        const user = State.getCurrentUser();
        if (!user) return;
        const unread = State.getNotifications(user.email).filter(n => !n.lida).length;
        const badges = document.querySelectorAll('.notif-badge');
        badges.forEach(b => {
            b.innerText = unread;
            b.style.display = unread > 0 ? 'inline-block' : 'none';
        });
    }
};

// Global Close Modal on Click Outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.updateAuthLinks();
    UI.updateNotificationBadge();
});
