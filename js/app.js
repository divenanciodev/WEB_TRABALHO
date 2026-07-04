const State = {
  _client() {
    return window.SupabaseAuth?.client || null;
  },

  async ensureReady() {
    if (window.SupabaseAuth?.ready) {
      await window.SupabaseAuth.ready;
    }
  },

  getCurrentUser() {
    return window.SupabaseAuth?.getCachedProfile?.() || null;
  },

  async requireUser() {
    await this.ensureReady();
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  },

  async setCurrentUser(user) {
    if (!user) return;

    const { error } = await window.SupabaseAuth.upsertProfile({
      id: user.id,
      email: user.email,
      nome_completo: user.nome_completo || '',
      nome_usuario: user.nome_usuario || '',
      foto_perfil: user.foto_perfil || '',
      bio: user.biografia || user.bio || '',
      biografia: user.biografia || user.bio || '',
      habilidades: user.habilidades || [],
      experiencia: user.experiencia || [],
      cargo: user.cargo || '',
      area: user.area || '',
      linkedin: user.linkedin || '',
      github: user.github || '',
      portfolio: user.portfolio || '',
      instagram: user.instagram || '',
      sobre: user.sobre || '',
      capa_perfil: user.capa_perfil || '',
      createdAt: user.createdAt || new Date().toISOString()
    });

    if (error) {
      console.error('[State] Erro ao salvar perfil:', error);
      // Exibe aviso ao usuário se o Layout estiver disponível
      if (typeof Layout !== 'undefined' && Layout.showToast) {
        Layout.showToast('Erro ao salvar perfil. Verifique sua conexão.', 'error');
      }
    }
  },

  async logout() {
    await window.SupabaseAuth?.signOut?.();
    window.location.href = 'login.html';
  },

  async fetchTable(table, orderColumn = 'createdAt') {
    const client = this._client();
    if (!client) return [];

    const { data, error } = await client
      .from(table)
      .select('*')
      .order(orderColumn, { ascending: false });

    if (error) {
      console.error(`[State] Erro ao buscar ${table}:`, error);
      return [];
    }

    return data || [];
  },

  async saveRow(table, item) {
    const client = this._client();
    if (!client) throw new Error('Supabase indisponível');

    const user = this.getCurrentUser();
    const payload = {
      ...item,
      author_id: user?.id || item.author_id || null,
      author_email: user?.email || item.author_email || null,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await client
      .from(table)
      .upsert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.error(`[State] Erro ao salvar em ${table}:`, error);
      throw error;
    }

    return data || payload;
  },

  async deleteRow(table, id) {
    const client = this._client();
    if (!client) throw new Error('Supabase indisponível');

    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[State] Erro ao excluir de ${table}:`, error);
      throw error;
    }
  },

  async getUserById(userId) {
    const client = this._client();
    if (!client || !userId) return null;

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[State] Erro ao buscar usuário:', error.message);
      return null;
    }

    return data;
  },

  async getProjects() {
    return this.fetchTable('shetech_projetos');
  },

  async getEvents() {
    return this.fetchTable('shetech_eventos');
  },

  async getPosts() {
    return this.fetchTable('posts');
  },

  async getUsers() {
    return this.fetchTable('users');
  },

  async getCommunityLinks() {
    return this.fetchTable('community_links');
  },

  async saveProject(project) {
    return this.saveRow('shetech_projetos', project);
  },

  async deleteProject(id) {
    return this.deleteRow('shetech_projetos', id);
  },

  async saveEvent(event) {
    return this.saveRow('shetech_eventos', event);
  },

  async deleteEvent(id) {
    return this.deleteRow('shetech_eventos', id);
  },

  async savePost(post) {
    return this.saveRow('posts', post);
  },

  async getComments(postId) {
    const client = this._client();
    if (!client) return [];

    const { data, error } = await client
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('[State] Erro ao buscar comentários:', error);
      return [];
    }

    return data || [];
  },

  async saveComment(comment) {
    return this.saveRow('comments', comment);
  },

  async deleteComment(id) {
    return this.deleteRow('comments', id);
  },

  async saveCommunityLink(link) {
    return this.saveRow('community_links', link);
  },

  async getLinks(email = null) {
    const client = this._client();
    if (!client) return [];

    let query = client.from('links').select('*').order('createdAt', { ascending: false });
    if (email) query = query.eq('proprietaria_id', email);

    const { data, error } = await query;
    if (error) {
      console.error('[State] Erro ao buscar links:', error);
      return [];
    }

    return data || [];
  },

  async saveLink(link) {
    return this.saveRow('links', link);
  },

  async deleteLink(id) {
    return this.deleteRow('links', id);
  },

  async getFolders(email = null) {
    const client = this._client();
    if (!client) return [];

    let query = client.from('folders').select('*').order('createdAt', { ascending: false });
    if (email) query = query.eq('proprietaria_id', email);

    const { data, error } = await query;
    if (error) {
      console.error('[State] Erro ao buscar pastas:', error);
      return [];
    }

    return data || [];
  },

  async saveFolder(folder) {
    return this.saveRow('folders', folder);
  },

  async deleteFolder(id) {
    return this.deleteRow('folders', id);
  },

  async getNotifications(email) {
    const client = this._client();
    if (!client || !email) return [];

    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('destinataria_id', email)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[State] Erro ao buscar notificações:', error);
      return [];
    }

    return data || [];
  },

  async addNotification(email, message) {
    return this.saveRow('notifications', {
      id: Date.now(),
      destinataria_id: email,
      mensagem: message,
      lida: false
    });
  },

  async getMembersCount() {
    const client = this._client();
    if (!client) return 0;

    const { count, error } = await client
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
  },

  async markAllNotificationsRead(email) {
    const client = this._client();
    if (!client || !email) return;

    const { error } = await client
      .from('notifications')
      .update({ lida: true })
      .eq('destinataria_id', email);

    if (error) console.error('[State] Erro ao marcar notificações:', error);
  },

  subscribe(table, callback) {
    return window.SupabaseAuth?.subscribeToTable?.(table, callback) || (() => {});
  }
};

window.State = State;
