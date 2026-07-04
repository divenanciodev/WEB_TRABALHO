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

  // ======== ANALYTICS DATA FETCHERS ========
  // 1. Tecnologias mais utilizadas (contagem de habilidades nos perfis)
  async getUserTechnologies() {
    const client = this._client();
    if (!client) return {};
    try {
      const { data, error } = await client.from('users').select('habilidades').order('createdAt', { ascending: false });
      if (error) throw error;
      // habilidades é um array JSONB, pode ser [] ou null
      const counts = {};
      data.forEach(u => {
        const arr = u.habilidades || [];
        arr.forEach(tech => {
          const key = tech || 'Outros';
          counts[key] = (counts[key] || 0) + 1;
        });
      });
      // fallback mock if empty
      if (Object.keys(counts).length === 0) {
        return { JavaScript: 0, Python: 0, Java: 0, React: 0, "HTML/CSS": 0, SQL: 0, "C#": 0, PHP: 0, Flutter: 0, Outros: 0 };
      }
      return counts;
    } catch (e) {
      console.warn('[State] getUserTechnologies fallback', e);
      // mock data
      return { JavaScript: 45, Python: 30, Java: 20, React: 35, "HTML/CSS": 50, SQL: 25, "C#": 15, PHP: 10, Flutter: 12, Outros: 8 };
    }
  },

  // 2. Projetos por categoria
  async getProjectCategories() {
    const client = this._client();
    if (!client) return {};
    try {
      const { data, error } = await client.from('shetech_projetos').select('categoria').order('createdAt', { ascending: false });
      if (error) throw error;
      const counts = {};
      data.forEach(p => {
        const cat = p.categoria || 'Outros';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      if (Object.keys(counts).length === 0) {
        return { "Desenvolvimento Web": 0, "Inteligência Artificial": 0, Mobile: 0, "Banco de Dados": 0, "UX/UI": 0, "Ciência de Dados": 0, Jogos: 0, Automação: 0 };
      }
      return counts;
    } catch (e) {
      console.warn('[State] getProjectCategories fallback', e);
      return { "Desenvolvimento Web": 40, "Inteligência Artificial": 12, Mobile: 20, "Banco de Dados": 15, "UX/UI": 18, "Ciência de Dados": 9, Jogos: 7, Automação: 5 };
    }
  },

  // 3. Participação em eventos (contagem de participantes)
  async getEventParticipation() {
    const client = this._client();
    if (!client) return {};
    try {
      const { data, error } = await client.from('shetech_eventos').select('title, participantes').order('createdAt', { ascending: false });
      if (error) throw error;
      const counts = {};
      data.forEach(ev => {
        const title = ev.title || ev.nome || 'Evento';
        const part = ev.participantes ? ev.participantes.length : 0;
        counts[title] = part;
      });
      if (Object.keys(counts).length === 0) {
        return { "Workshop HTML": 0, Hackathon: 0, "Python para Iniciantes": 0, "Introdução à IA": 0, "Git e GitHub": 0 };
      }
      return counts;
    } catch (e) {
      console.warn('[State] getEventParticipation fallback', e);
      return { "Workshop HTML": 35, Hackathon: 28, "Python para Iniciantes": 22, "Introdução à IA": 18, "Git e GitHub": 30 };
    }
  },

  // 4. Áreas de interesse das usuárias
  async getInterestAreas() {
    const client = this._client();
    if (!client) return {};
    try {
      const { data, error } = await client.from('users').select('area').order('createdAt', { ascending: false });
      if (error) throw error;
      const counts = {};
      data.forEach(u => {
        const area = u.area || 'Outros';
        counts[area] = (counts[area] || 0) + 1;
      });
      if (Object.keys(counts).length === 0) {
        return { "Front-end": 0, "Back-end": 0, "UX/UI": 0, Mobile: 0, IA: 0, Dados: 0, Segurança: 0, Cloud: 0, DevOps: 0, Outros: 0 };
      }
      return counts;
    } catch (e) {
      console.warn('[State] getInterestAreas fallback', e);
      return { "Front-end": 55, "Back-end": 45, "UX/UI": 30, Mobile: 25, IA: 20, Dados: 22, Segurança: 12, Cloud: 15, DevOps: 10, Outros: 5 };
    }
  },

  // 5. Status dos projetos
  async getProjectStatusCounts() {
    const client = this._client();
    if (!client) return {};
    try {
      const { data, error } = await client.from('shetech_projetos').select('status').order('createdAt', { ascending: false });
      if (error) throw error;
      const counts = {};
      data.forEach(p => {
        const st = p.status || 'Outros';
        counts[st] = (counts[st] || 0) + 1;
      });
      if (Object.keys(counts).length === 0) {
        return { "Em andamento": 0, Concluído: 0, "Buscando integrantes": 0, Pausado: 0 };
      }
      return counts;
    } catch (e) {
      console.warn('[State] getProjectStatusCounts fallback', e);
      return { "Em andamento": 40, Concluído: 30, "Buscando integrantes": 12, Pausado: 8 };
    }
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

window.toggleProjectSubscription = async (projectId) => {
  const user = State.getCurrentUser();
  if (!user) {
    if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast('Você precisa estar logada para se inscrever.', 'error');
    return false;
  }
  const client = State._client();
  if (!client) return false;

  const { data: project, error: fetchError } = await client.from('shetech_projetos').select('membros, author_id, author_email, titulo').eq('id', projectId).single();
  if (fetchError || !project) {
    if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast('Erro ao buscar projeto.', 'error');
    return false;
  }
  if (project.author_id === user.id) {
    if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast('Você não pode se inscrever no próprio projeto.', 'error');
    return false;
  }

  let membros = Array.isArray(project.membros) ? project.membros : [];
  if (membros.includes(user.id)) {
    membros = membros.filter(m => m !== user.id);
    const { error: updateError } = await client.from('shetech_projetos').update({ membros }).eq('id', projectId);
    if (updateError) {
      if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast('Erro ao cancelar inscrição.', 'error');
      return false;
    }
    if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast('Inscrição cancelada.', 'success');
  } else {
    // Send request via notification
    const reqMsg = `A usuária <strong>${user.nome_completo || user.nome_usuario || user.email}</strong> solicitou inscrição no seu projeto <strong>${project.titulo || 'Projeto'}</strong>.<br><br><div style="display:flex;gap:8px;" class="request-actions"><button class="btn btn-primary" style="padding:6px 12px;font-size:12px;border-radius:6px;cursor:pointer;border:none;color:#fff;" onclick="window.acceptProjectRequest('${projectId}', '${user.id}', this)">Aceitar</button><button class="btn" style="padding:6px 12px;font-size:12px;border-radius:6px;border:1px solid var(--gray-300);background:transparent;cursor:pointer;" onclick="window.denyProjectRequest(this)">Negar</button></div>`;
    
    await State.addNotification(project.author_email, reqMsg);
    
    if (typeof Layout !== 'undefined' && Layout.showSuccessModal) {
      Layout.showSuccessModal('Solicitação Enviada!', 'O criador do projeto receberá uma notificação para aprovar a sua participação.');
    }
  }

  if (typeof window.renderProjects === 'function') window.renderProjects();
  if (typeof window.renderFeaturedProjects === 'function') window.renderFeaturedProjects();
  if (typeof window.renderCreatorStats === 'function') window.renderCreatorStats();
  return true;
};

window.acceptProjectRequest = async (projectId, userId, btnEl) => {
  const client = State._client();
  if (!client) return;

  const { data: project } = await client.from('shetech_projetos').select('membros').eq('id', projectId).single();
  if (project) {
    let membros = Array.isArray(project.membros) ? project.membros : [];
    if (!membros.includes(userId)) {
      membros.push(userId);
      await client.from('shetech_projetos').update({ membros }).eq('id', projectId);
    }
  }

  const actionsDiv = btnEl.closest('.request-actions');
  if (actionsDiv) {
    actionsDiv.innerHTML = '<span style="color:var(--success);font-weight:500;"><i class="icon-check-circle"></i> Solicitação Aceita</span>';
  }
};

window.denyProjectRequest = (btnEl) => {
  const actionsDiv = btnEl.closest('.request-actions');
  if (actionsDiv) {
    actionsDiv.innerHTML = '<span style="color:var(--danger);font-weight:500;"><i class="icon-x-circle"></i> Solicitação Recusada</span>';
  }
};

window.toggleEventSubscription = async (eventId) => {
  const user = State.getCurrentUser();
  if (!user) {
    if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast('Você precisa estar logada para se inscrever.', 'error');
    return false;
  }
  const client = State._client();
  if (!client) return false;

  const { data: evento, error: fetchError } = await client.from('shetech_eventos').select('membros, author_id').eq('id', eventId).single();
  if (fetchError || !evento) {
    if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast('Erro ao buscar evento.', 'error');
    return false;
  }
  if (evento.author_id === user.id) {
    if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast('Você não pode se inscrever no próprio evento.', 'error');
    return false;
  }

  let membros = Array.isArray(evento.membros) ? evento.membros : [];
  let isSubscribed = false;
  if (membros.includes(user.id)) {
    membros = membros.filter(m => m !== user.id);
  } else {
    membros.push(user.id);
    isSubscribed = true;
  }

  const { error: updateError } = await client.from('shetech_eventos').update({ membros }).eq('id', eventId);
  if (updateError) {
    if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast('Erro ao atualizar inscrição.', 'error');
    return false;
  }

  if (typeof Layout !== 'undefined' && Layout.showToast) Layout.showToast(isSubscribed ? 'Inscrição realizada!' : 'Inscrição cancelada.', 'success');
  
  if (typeof window.renderEvents === 'function') window.renderEvents();
  if (typeof window.renderUpcomingEvents === 'function') window.renderUpcomingEvents();
  if (typeof window.renderCreatorStats === 'function') window.renderCreatorStats();
  return true;
};
