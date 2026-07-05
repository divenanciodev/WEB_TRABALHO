/**
 * eventos.js — SheTech • Página de Eventos
 * Gerencia criação, edição, exclusão e renderização de eventos.
 * Persiste dados em localStorage.
 */

(function () {
  "use strict";

  /* ── Storage (Supabase) ───────────────────────────────────── */
  let events = [];

  async function loadEvents() {
    try {
      const data = await State.getEvents();
      events = Array.isArray(data) ? data : [];
      if (events.length === 0) {
        console.warn('[Eventos] Nenhum evento retornado do banco.');
      }
    } catch (err) {
      console.error('[Eventos] Erro ao carregar eventos:', err);
      events = [];
      showToast('Erro ao carregar eventos. Verifique sua conexão.', 'error');
    }
  }

  async function persistEvent(event) {
    await State.saveEvent(event);
  }

  async function removeEvent(id) {
    await State.deleteEvent(id);
  }

  /* ── Estado ────────────────────────────────────────────────── */
  let filterActive = "todos";
  let searchQuery = "";
  let isListView = false;
  let editingId = null;

  /* ── Conteúdo inicial ───────────────────────────────── */

  /* ── Helpers ────────────────────────────────────────────────── */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function relativeDate(iso) {
    if (!iso) return { label: "Sem data", cls: "date-pill--past" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ev = new Date(iso + "T00:00:00");
    const diff = Math.round((ev - today) / 86400000);
    if (diff === 0) return { label: "Hoje", cls: "date-pill--today" };
    if (diff === 1) return { label: "Amanhã", cls: "date-pill--today" };
    if (diff > 0 && diff <= 7) return { label: `Em ${diff} dias`, cls: "date-pill--future" };
    if (diff > 7) return { label: formatDate(iso), cls: "date-pill--future" };
    return { label: `${formatDate(iso)} (passado)`, cls: "date-pill--past" };
  }

  function categoryClass(cat) {
    const map = {
      Workshop: "badge--workshop",
      Meetup: "badge--meetup",
      Palestra: "badge--palestra",
      Hackathon: "badge--hackathon",
      Social: "badge--social",
      Outro: "badge--outro",
    };
    return map[cat] || "badge--outro";
  }

  function platformLabel(url) {
    if (!url) return url;
    if (url.includes("meet.google")) return "Google Meet";
    if (url.includes("zoom.us")) return "Zoom";
    if (url.includes("teams.microsoft")) return "Microsoft Teams";
    if (url.includes("whereby")) return "Whereby";
    if (url.includes("discord")) return "Discord";
    return "Link da reunião";
  }

  /* ── Stats ──────────────────────────────────────────────────── */
  function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7 = new Date(today);
    in7.setDate(in7.getDate() + 7);

    document.getElementById("stat-total").textContent = events.length;
    document.getElementById("stat-online").textContent = events.filter((e) => e.tipo === "online").length;
    document.getElementById("stat-presencial").textContent = events.filter((e) => e.tipo === "presencial").length;
    document.getElementById("stat-proximos").textContent = events.filter((e) => {
      const d = new Date(e.data + "T00:00:00");
      return d >= today && d <= in7;
    }).length;
  }

  /* ── Renderização ────────────────────────────────────────────── */
  function filteredEvents() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const in7 = new Date(hoje);
    in7.setDate(in7.getDate() + 7);
    const currentUser = window.State?.getCurrentUser();

    return events.filter((e) => {
      let matchFilter = filterActive === "todos";
      if (filterActive === "online" || filterActive === "presencial") {
        matchFilter = e.tipo === filterActive;
      } else if (filterActive === "proximos") {
        const d = new Date(e.data + "T00:00:00");
        matchFilter = d >= hoje && d <= in7;
      } else if (filterActive === "inscritos") {
        matchFilter = currentUser &&
          Array.isArray(e.membros) &&
          e.membros.includes(currentUser.id);
      }

      const matchSearch =
        !searchQuery ||
        e.titulo.toLowerCase().includes(searchQuery) ||
        (e.descricao || "").toLowerCase().includes(searchQuery);
      return matchFilter && matchSearch;
    });
  }

  /* expõe para app.js rerenderizar após inscrição */
  window.renderEvents = function() {
    renderEvents();
  };
  window.reloadAndRenderEvents = async function() {
    await loadEvents();
    updateStats();
    renderEvents();
  };

  function renderEvents() {
    const container = document.getElementById("events-container");
    const emptyState = document.getElementById("empty-state");
    const list = filteredEvents();

    container.innerHTML = "";
    container.className = "events-grid" + (isListView ? " view-list" : "");

    if (list.length === 0) {
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";

    // Ordenar: futuros primeiro
    list.sort((a, b) => (a.data || "").localeCompare(b.data || ""));

    list.forEach((ev) => {
      const card = buildCard(ev);
      container.appendChild(card);
    });
  }

  function buildCard(ev) {
    const { label, cls } = relativeDate(ev.data);
    const isOnline = ev.tipo === "online";

    const card = document.createElement("article");
    card.className = "event-card";
    card.dataset.id = ev.id;

    const horarioStr = ev.horario ? ` às ${ev.horario}` : "";
    const locLabel = isOnline ? platformLabel(ev.link) : ev.endereco;
    const locIcon = isOnline ? "icon-video" : "icon-map-pin";

    card.innerHTML = `
      <div class="event-card-stripe ${isOnline ? "" : "event-card-stripe--presencial"}"></div>
      <div class="event-card-body">
        <div class="event-card-top">
          <div class="event-card-badges">
            <span class="badge ${isOnline ? "badge--online" : "badge--presencial"}">
              <i class="${locIcon}"></i> ${isOnline ? "Online" : "Presencial"}
            </span>
            <span class="badge ${categoryClass(ev.categoria)}">${ev.categoria}</span>
          </div>
          <div style="position:relative">
            <button class="event-card-menu-btn" aria-label="Opções" data-id="${ev.id}">
              <i class="icon-more-vertical">⋮</i>
            </button>
            <div class="card-dropdown" id="dd-${ev.id}">
              <button data-action="edit" data-id="${ev.id}"><i class="icon-pencil"></i> Editar</button>
              <button data-action="delete" data-id="${ev.id}" class="danger"><i class="icon-trash-2"></i> Excluir</button>
            </div>
          </div>
        </div>

        <h3 class="event-card-title">${ev.titulo}</h3>

        <div class="event-card-meta">
          <div class="meta-row">
            <i class="icon-calendar"></i>
            <span>${formatDate(ev.data)}${horarioStr}</span>
          </div>
          <div class="meta-row">
            <i class="${locIcon}"></i>
            ${
              isOnline && ev.link
                ? `<a href="${ev.link}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${locLabel}</a>`
                : `<span>${locLabel || "—"}</span>`
            }
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
          <span class="date-pill ${cls}">
            <i class="icon-clock-4"></i> ${label}
          </span>
          ${(() => {
            const currentUser = window.State?.getCurrentUser();
            if (currentUser && ev.author_id && ev.author_id !== currentUser.id) {
              const isSubscribed = Array.isArray(ev.membros) && ev.membros.includes(currentUser.id);
              if (isSubscribed) {
                return `<button class="btn-subscribe-evento btn-subscribe-evento--inscrito" onclick="event.stopPropagation(); window.toggleEventSubscription('${ev.id}')"><i class="icon-check"></i> Inscrita</button>`;
              }
              return `<button class="btn-subscribe-evento" onclick="event.stopPropagation(); window.openParticipacaoEventoModal('${ev.id}')"><span class="btn-subscribe-evento-shine"></span><i class="icon-user-plus"></i> Se inscrever</button>`;
            }
            return '';
          })()}
        </div>
      </div>
    `;

    // Clique no card → detalhes
    card.addEventListener("click", (e) => {
      if (e.target.closest(".event-card-menu-btn") || e.target.closest(".card-dropdown")) return;
      openDetail(ev.id);
    });

    // Menu de opções
    const user = State.getCurrentUser();
    const userEmail = user ? user.email : 'anonimo';
    const isOwner = ev.criador_id === userEmail || ev.organizador_id === userEmail;

    const menuBtn = card.querySelector(".event-card-menu-btn");
    const dropdown = card.querySelector(".card-dropdown");

    if (!isOwner) {
      menuBtn.style.display = 'none';
    }

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".card-dropdown.open").forEach((d) => {
        if (d !== dropdown) d.classList.remove("open");
      });
      dropdown.classList.toggle("open");
    });

    dropdown.querySelector("[data-action='edit']").addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.remove("open");
      openModal(ev.id);
    });

    dropdown.querySelector("[data-action='delete']").addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.remove("open");
      deleteEvent(ev.id);
    });

    return card;
  }

  /* ── Modal de criação / edição ──────────────────────────────── */
  const modal = document.getElementById("event-modal");
  const form = document.getElementById("event-form");

  function openModal(id = null) {
    editingId = id;
    form.reset();
    setTipo("online"); // default

    document.getElementById("modal-title").textContent = id ? "Editar Evento" : "Novo Evento";

    if (id) {
      const ev = events.find((e) => e.id === id);
      if (!ev) return;
      document.getElementById("event-titulo").value = ev.titulo;
      document.getElementById("event-link").value = ev.link || "";
      document.getElementById("event-endereco").value = ev.endereco || "";
      document.getElementById("event-data").value = ev.data;
      document.getElementById("event-horario").value = ev.horario || "";
      document.getElementById("event-categoria").value = ev.categoria;
      document.getElementById("event-descricao").value = ev.descricao || "";
      setTipo(ev.tipo);
    }

    modal.classList.add("open");
    document.getElementById("event-titulo").focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    editingId = null;
  }

  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  document.getElementById("modal-cancel-btn").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  /* ── Toggle tipo ─────────────────────────────────────────────── */
  function setTipo(tipo) {
    document.getElementById("event-tipo").value = tipo;
    document.querySelectorAll(".tipo-btn").forEach((btn) => {
      btn.classList.toggle("tipo-btn--active", btn.dataset.tipo === tipo);
    });
    document.getElementById("campo-online").style.display = tipo === "online" ? "block" : "none";
    document.getElementById("campo-presencial").style.display = tipo === "presencial" ? "block" : "none";
  }

  document.querySelectorAll(".tipo-btn").forEach((btn) => {
    btn.addEventListener("click", () => setTipo(btn.dataset.tipo));
  });

  /* ── Atalhos de plataforma ───────────────────────────────────── */
  document.querySelectorAll(".plat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById("event-link");
      input.value = btn.dataset.prefix;
      input.focus();
    });
  });

  /* ── Busca de CEP (ViaCEP) ──────────────────────────────────── */
  function montaEndereco() {
    const logradouro  = (document.getElementById("event-logradouro")?.value  || "").trim();
    const numero      = (document.getElementById("event-numero")?.value      || "").trim();
    const complemento = (document.getElementById("event-complemento")?.value || "").trim();
    const bairro      = (document.getElementById("event-bairro")?.value      || "").trim();
    const cidade      = (document.getElementById("event-cidade")?.value      || "").trim();
    const uf          = (document.getElementById("event-uf")?.value          || "").trim();
    const parts = [logradouro, numero, complemento, bairro, cidade ? `${cidade}${uf ? '/' + uf : ''}` : uf].filter(Boolean);
    const hidden = document.getElementById("event-endereco");
    if (hidden) hidden.value = parts.join(", ");
  }

  ["event-logradouro","event-numero","event-complemento","event-bairro","event-cidade","event-uf"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", montaEndereco);
  });

  async function buscarCEP() {
    const rawCep = (document.getElementById("event-cep")?.value || "").replace(/\D/g, "");
    const feedback = document.getElementById("cep-feedback");
    if (rawCep.length !== 8) {
      if (feedback) { feedback.textContent = "Digite um CEP com 8 dígitos."; feedback.style.display = "block"; feedback.style.color = "#dc2626"; }
      return;
    }
    if (feedback) { feedback.textContent = "Buscando..."; feedback.style.display = "block"; feedback.style.color = "var(--gray-500)"; }
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        if (feedback) { feedback.textContent = "CEP não encontrado."; feedback.style.color = "#dc2626"; }
        return;
      }
      if (document.getElementById("event-logradouro")) document.getElementById("event-logradouro").value = data.logradouro || "";
      if (document.getElementById("event-bairro"))     document.getElementById("event-bairro").value     = data.bairro     || "";
      if (document.getElementById("event-cidade"))     document.getElementById("event-cidade").value     = data.localidade || "";
      if (document.getElementById("event-uf"))         document.getElementById("event-uf").value         = data.uf         || "";
      if (feedback) { feedback.textContent = `${data.localidade}/${data.uf}`; feedback.style.color = "#16a34a"; }
      montaEndereco();
      document.getElementById("event-numero")?.focus();
    } catch (err) {
      if (feedback) { feedback.textContent = "Erro ao buscar CEP. Verifique sua conexão."; feedback.style.color = "#dc2626"; }
    }
  }

  document.getElementById("btn-buscar-cep")?.addEventListener("click", buscarCEP);
  document.getElementById("event-cep")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); buscarCEP(); }
    // Formata CEP enquanto digita: 99999-999
    setTimeout(() => {
      const el = document.getElementById("event-cep");
      if (!el) return;
      el.value = el.value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
    }, 0);
  });
  document.getElementById("event-cep")?.addEventListener("input", () => {
    setTimeout(() => {
      const el = document.getElementById("event-cep");
      if (!el) return;
      el.value = el.value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
    }, 0);
  });

  /* ── Submit do form ──────────────────────────────────────────── */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const tipo = document.getElementById("event-tipo").value;
    const titulo = document.getElementById("event-titulo").value.trim();
    const link = document.getElementById("event-link").value.trim();
    const endereco = document.getElementById("event-endereco").value.trim();
    const data = document.getElementById("event-data").value;
    const horario = document.getElementById("event-horario").value;
    const categoria = document.getElementById("event-categoria").value;
    const descricao = document.getElementById("event-descricao").value.trim();

    if (!titulo) { showToast("Informe o nome do evento.", "error"); return; }
    if (!data) { showToast("Informe a data do evento.", "error"); return; }
    if (tipo === "online" && !link) { showToast("Cole o link da reunião online.", "error"); return; }
    if (tipo === "presencial" && !endereco) { showToast("Informe o endereço do evento.", "error"); return; }

    const user = State.getCurrentUser();
    const userEmail = user ? user.email : 'anonimo';

    if (editingId) {
      const idx = events.findIndex((e) => e.id === editingId);
      if (idx !== -1) {
        // Apenas o criador pode editar
        if (events[idx].criador_id && events[idx].criador_id !== userEmail) {
          showToast("Você não tem permissão para editar este evento.", "error");
          return;
        }
        const updated = { ...events[idx], titulo, tipo, link, endereco, data, horario, categoria, descricao };
        try {
          await persistEvent(updated);
          events[idx] = updated;
          showToast("Evento atualizado com sucesso!", "success");
        } catch (err) {
          showToast("Erro ao salvar evento.", "error");
          return;
        }
      }
    } else {
      const newEvent = { 
        id: uid(), 
        titulo, 
        tipo, 
        link, 
        endereco, 
        data, 
        horario, 
        categoria, 
        descricao,
        criador_id: userEmail,
        organizador_id: userEmail
      };
      try {
        await persistEvent(newEvent);
        events.push(newEvent);
        showToast("Evento criado com sucesso!", "success");
      } catch (err) {
        showToast("Erro ao salvar evento.", "error");
        return;
      }
    }

    closeModal();
    updateStats();
    renderEvents();
  });

  /* ── Modal de detalhes ───────────────────────────────────────── */
  const detailModal = document.getElementById("detail-modal");

  function openDetail(id) {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;

    detailModal.classList.add("modal-detail-overlay");
    document.body.style.overflow = 'hidden';
    document.getElementById("detail-title").textContent = ev.titulo;
    document.getElementById("detail-body").innerHTML = '<p style="color:var(--gray-500);padding:12px 0;">Carregando detalhes...</p>';
    detailModal.classList.add("open");

    renderEventDetail(ev);
  }

  async function renderEventDetail(ev) {
    const isOnline = ev.tipo === "online";
    const locIcon  = isOnline ? "icon-video" : "icon-map-pin";

    const memberProfiles = await State.resolveMemberProfiles(ev.membros || []);
    const membrosHTML = memberProfiles.length > 0
      ? `<div class="ev-detail-section">
          <div class="ev-detail-section-title">
            <div class="detail-row-icon"><i class="icon-users"></i></div>
            <strong>Participantes (${memberProfiles.length})</strong>
          </div>
          <div class="ev-members-grid">
            ${memberProfiles.map((m) => `
              <a href="${m.id ? `perfil.html?user=${encodeURIComponent(m.id)}` : '#'}"
                 class="ev-member-card" onclick="event.stopPropagation()">
                <img src="${m.avatar}" alt="${m.name}" class="ev-member-avatar" />
                <div class="ev-member-info">
                  <span class="ev-member-name">${m.name}</span>
                  <span class="ev-member-role">${m.role}</span>
                </div>
              </a>`).join('')}
          </div>
        </div>`
      : '';

    document.getElementById("detail-body").innerHTML = `
      <div class="ev-detail-wrap">

        <!-- Cabeçalho colorido -->
        <div class="ev-detail-header ${isOnline ? '' : 'ev-detail-header--presencial'}">
          <div class="ev-detail-badges">
            <span class="badge ${isOnline ? 'badge--online' : 'badge--presencial'}">
              <i class="${locIcon}"></i> ${isOnline ? 'Online' : 'Presencial'}
            </span>
            <span class="badge ${categoryClass(ev.categoria)}">${ev.categoria}</span>
          </div>
          <div class="ev-detail-date-block">
            <i class="icon-calendar"></i>
            <span>${formatDate(ev.data)}${ev.horario ? ' às ' + ev.horario : ''}</span>
          </div>
        </div>

        <!-- Grid de informações -->
        <div class="ev-detail-grid">

          <!-- Localização / Link -->
          <div class="ev-detail-info-card">
            <div class="ev-detail-info-icon" style="${isOnline ? '' : 'background:#d4f7e8;color:#16a34a'}">
              <i class="${locIcon}"></i>
            </div>
            <div>
              <div class="ev-detail-info-label">${isOnline ? 'Link da Reunião' : 'Endereço'}</div>
              ${isOnline && ev.link
                ? `<a href="${ev.link}" target="_blank" rel="noopener" class="ev-detail-link">${platformLabel(ev.link) || ev.link}</a>`
                : `<span class="ev-detail-info-value">${ev.endereco || '—'}</span>`}
            </div>
          </div>

          <!-- Descrição -->
          ${ev.descricao ? `
          <div class="ev-detail-info-card ev-detail-info-card--full">
            <div class="ev-detail-info-icon">
              <i class="icon-align-left"></i>
            </div>
            <div>
              <div class="ev-detail-info-label">Descrição</div>
              <div class="ev-detail-descricao">${ev.descricao}</div>
            </div>
          </div>` : ''}

        </div>

        <!-- Participantes -->
        ${membrosHTML}

      </div>`;

    const user = State.getCurrentUser();
    const userEmail = user ? user.email : 'anonimo';
    const isOwner = ev.criador_id === userEmail || ev.organizador_id === userEmail;

    const editBtn   = document.getElementById("detail-edit-btn");
    const deleteBtn = document.getElementById("detail-delete-btn");

    if (isOwner) {
      editBtn.style.display   = 'flex';
      deleteBtn.style.display = 'flex';
      editBtn.onclick   = () => { closeDetail(); openModal(ev.id); };
      deleteBtn.onclick = () => { closeDetail(); deleteEvent(ev.id); };
    } else {
      editBtn.style.display   = 'none';
      deleteBtn.style.display = 'none';
    }
  }

  function closeDetail() {
    detailModal.classList.remove("open");
    detailModal.classList.remove("modal-detail-overlay");
    document.body.style.overflow = ''; // Restaurar scroll
  }

  document.getElementById("detail-close-btn").addEventListener("click", closeDetail);
  detailModal.addEventListener("click", (e) => { if (e.target === detailModal) closeDetail(); });

  /* ── Deletar ─────────────────────────────────────────────────── */
  async function deleteEvent(id) {
    if (!confirm('Deseja realmente excluir este evento?')) return;
    try {
      await removeEvent(id);
      events = events.filter((e) => e.id !== id);
      updateStats();
      renderEvents();
      showToast("Evento excluído com sucesso!", "success");
    } catch (err) {
      showToast("Erro ao excluir evento.", "error");
    }
  }

  /* ── Filtros ─────────────────────────────────────────────────── */
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      filterActive = chip.dataset.filter;
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");
      renderEvents();
    });
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderEvents();
  });

  /* ── Toggle de view ──────────────────────────────────────────── */
  document.getElementById("view-grid").addEventListener("click", () => {
    isListView = false;
    document.getElementById("view-grid").classList.add("view-btn--active");
    document.getElementById("view-list").classList.remove("view-btn--active");
    renderEvents();
  });

  document.getElementById("view-list").addEventListener("click", () => {
    isListView = true;
    document.getElementById("view-list").classList.add("view-btn--active");
    document.getElementById("view-grid").classList.remove("view-btn--active");
    renderEvents();
  });

  /* ── Botões de novo evento ───────────────────────────────────── */
  document.getElementById("btn-novo-evento").addEventListener("click", () => openModal());
  document.getElementById("btn-empty-novo").addEventListener("click", () => openModal());

  /* ── Fechar dropdowns ao clicar fora ─────────────────────────── */
  document.addEventListener("click", () => {
    document.querySelectorAll(".card-dropdown.open").forEach((d) => d.classList.remove("open"));
  });

  /* ── Tecla Esc fecha modais ──────────────────────────────────── */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeDetail(); }
  });

  /* ── Toast ───────────────────────────────────────────────────── */
  let toastTimer;
  function showToast(msg, type = "") {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.className = "toast" + (type ? ` toast--${type}` : "");
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await State.ensureReady();
    if (typeof Layout !== 'undefined') {
      await Layout.init({ active: 'eventos' });
    }
    await loadEvents();
    updateStats();
    renderEvents();

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    if (eventId) {
      setTimeout(() => openDetail(eventId), 300);
    }
  });
})();