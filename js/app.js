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
            // Atualiza o usuário existente na lista
            users[idx] = { ...users[idx], ...user };
        } else {
            // Adiciona o usuário à lista caso seja o primeiro login (veio do Supabase)
            users.push({ ...user, createdAt: user.createdAt || new Date().toISOString() });
        }
        localStorage.setItem('users', JSON.stringify(users));
    },

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    },

    // Métodos para o Supabase (Sincronização Global)
    async fetchGlobalData(table) {
        if (!window.SupabaseAuth || !window.SupabaseAuth.client) return [];
        const { data, error } = await window.SupabaseAuth.client
            .from(table)
            .select('*')
            .order('createdAt', { ascending: false });
        if (error) {
            console.error(`Erro ao buscar ${table}:`, error);
            return this.getData(table); // Fallback para local
        }
        return data || [];
    },

    async saveGlobalData(table, item) {
        // Salva localmente primeiro para garantir funcionamento offline/fallback
        this.saveData(table, item);

        if (!window.SupabaseAuth || !window.SupabaseAuth.client) return;
        
        const user = this.getCurrentUser();
        const dataToSave = {
            ...item,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author_id: user ? user.id : null,
            author_email: user ? user.email : null
        };

        // Remove campos que podem ser específicos do localStorage e não do DB se necessário
        // mas o upsert geralmente lida bem com isso se a tabela tiver as colunas.

        const { error } = await window.SupabaseAuth.client
            .from(table)
            .upsert(dataToSave);

        if (error) {
            console.error(`Erro ao salvar globalmente em ${table}:`, error);
        }
    },

    async loadGlobalData(table, localStorageKey) {
        if (!window.SupabaseAuth || !window.SupabaseAuth.client) {
            return this.getData(localStorageKey);
        }

        const { data, error } = await window.SupabaseAuth.client
            .from(table)
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error(`Erro ao carregar globalmente ${table}:`, error);
            return this.getData(localStorageKey);
        }

        if (data && data.length > 0) {
            localStorage.setItem(localStorageKey, JSON.stringify(data));
            return data;
        }

        return this.getData(localStorageKey);
    },

    getProjects() { return this.getData('shetech_projetos'); },
    getEvents() { return this.getData('shetech_eventos'); },
    getPosts() { return this.getData('posts'); },
    getUsers() { return this.getData('users'); },
    setUsers(users) { localStorage.setItem('users', JSON.stringify(users)); },
    
    // Links e Pastas - AGORA GLOBAIS (sem filtro por proprietária)
    getLinks(email = null) { 
        const allLinks = this.getData('links');
        // Se email for fornecido, retorna apenas links do usuário (para compatibilidade)
        // Se não, retorna todos os links (global)
        return email ? allLinks.filter(l => l.proprietaria_id === email) : allLinks;
    },
    saveLink(link) { this.saveData('links', link); },
    deleteLink(id) { this.deleteData('links', id); },
    
    getFolders(email = null) {
        const allFolders = this.getData('folders');
        // Se email for fornecido, retorna apenas pastas do usuário (para compatibilidade)
        // Se não, retorna todas as pastas (global)
        return email ? allFolders.filter(f => f.proprietaria_id === email) : allFolders;
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

    // Contagem de usuários online (simula com base em usuários cadastrados)
    getOnlineCount() {
        const users = this.getUsers();
        // Simula: 30-70% dos usuários estão online
        const onlinePercentage = Math.random() * 0.4 + 0.3;
        return Math.max(1, Math.ceil(users.length * onlinePercentage));
    },

    // Contagem total de membros
    getMembersCount() {
        return this.getUsers().length;
    }
};
