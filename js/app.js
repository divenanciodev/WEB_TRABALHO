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
    getLinks(email) { 
        return this.getData('links').filter(l => l.proprietaria_id === email); 
    },
    saveLink(link) { this.saveData('links', link); },
    deleteLink(id) { this.deleteData('links', id); },
    getNotifications(email) {
        return this.getData('notifications').filter(n => n.destinataria_id === email);
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
    }
};

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
