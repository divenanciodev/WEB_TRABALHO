/**
 * eventos.js — SheTech • Página de Eventos
 * Gerencia criação, edição, exclusão e renderização de eventos.
 * Persiste dados em localStorage.
 */

(function () {
  "use strict";

  /* ── Storage ───────────────────────────────────────────────── */
  const STORAGE_KEY = "shetech_eventos";

  function loadEvents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveEvents(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  /* ── Estado ────────────────────────────────────────────────── */
  let events = loadEvents();
  let filterActive = "todos";
  let searchQuery = "";
  let isListView = false;
  let editingId = null;

  /* ── Dados de exemplo (apenas na 1ª visita) ───────────────── */
  if (events.length === 0) {
    const hoje = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    const addDays = (n) => {
      const d = new Date(hoje);
      d.setDate(d.getDate() + n);
      return d;
    };

    events = [
      {
        id: uid(),
        titulo: "Meetup de UX Research",
        tipo: "online",
        link: "https://meet.google.com/abc-defg-hij",
        endereco: "",
        data: fmt(addDays(5)),
        horario: "19:00",
        categoria: "Meetup",
        descricao:
          "Vamos conversar sobre as melhores práticas de pesquisa com usuários e como aplicar no dia a dia de produto.",
      },
      {
        id: uid(),
        titulo: "Workshop de Figma Avançado",
        tipo: "online",
        link: "https://zoom.us/j/123456789",
        endereco: "",
        data: fmt(addDays(12)),
        horario: "14:00",
        categoria: "Workshop",
        descricao: "Componentes, auto layout e prototipagem de alta fidelidade.",
      },
      {
        id: uid(),
        titulo: "Hackathon SheTech 2025",
        tipo: "presencial",
        link: "",
        endereco: "Av. Paulista, 1374 – São Paulo, SP",
        data: fmt(addDays(20)),
        horario: "09:00",
        categoria: "Hackathon",
        descricao: "48 horas de inovação focadas em tecnologia para causas sociais.",
      },
      {
        id: uid(),
        titulo: "Palestra: Mulheres no Open Source",
        tipo: "online",
        link: "https://teams.microsoft.com/l/meetup-join/xpto",
        endereco: "",
        data: fmt(addDays(-3)),
        horario: "18:30",
        categoria: "Palestra",
        descricao: "Como contribuir com projetos open source e construir reputação na comunidade.",
      },
    ];
    saveEvents(events);
  }

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
    return events.filter((e) => {
      const matchFilter =
        filterActive === "todos" ||
        filterActive === e.tipo ||
        filterActive === e.categoria.toLowerCase();
      const matchSearch =
        !searchQuery ||
        e.titulo.toLowerCase().includes(searchQuery) ||
        (e.descricao || "").toLowerCase().includes(searchQuery);
      return matchFilter && matchSearch;
    });
  }

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

        <span class="date-pill ${cls}">
          <i class="icon-clock-4"></i> ${label}
        </span>
      </div>
    `;

    // Clique no card → detalhes
    card.addEventListener("click", (e) => {
      if (e.target.closest(".event-card-menu-btn") || e.target.closest(".card-dropdown")) return;
      openDetail(ev.id);
    });

    // Menu de opções
    const menuBtn = card.querySelector(".event-card-menu-btn");
    const dropdown = card.querySelector(".card-dropdown");

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

  /* ── Submit do form ──────────────────────────────────────────── */
  form.addEventListener("submit", (e) => {
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

    if (editingId) {
      const idx = events.findIndex((e) => e.id === editingId);
      if (idx !== -1) {
        events[idx] = { ...events[idx], titulo, tipo, link, endereco, data, horario, categoria, descricao };
        showToast("Evento atualizado com sucesso!", "success");
      }
    } else {
      events.push({ id: uid(), titulo, tipo, link, endereco, data, horario, categoria, descricao });
      showToast("Evento criado com sucesso!", "success");
    }

    saveEvents(events);
    closeModal();
    updateStats();
    renderEvents();
  });

  /* ── Modal de detalhes ───────────────────────────────────────── */
  const detailModal = document.getElementById("detail-modal");

  function openDetail(id) {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;

    document.getElementById("detail-title").textContent = ev.titulo;

    const isOnline = ev.tipo === "online";
    const locIcon = isOnline ? "icon-video" : "icon-map-pin";
    const locLabel = isOnline ? "Link da reunião" : "Endereço";
    const locValue = isOnline
      ? `<a href="${ev.link}" target="_blank" rel="noopener">${ev.link}</a>`
      : `<span>${ev.endereco}</span>`;

    document.getElementById("detail-body").innerHTML = `
      <div class="detail-section">
        <div class="detail-row">
          <div class="detail-row-icon"><i class="icon-calendar"></i></div>
          <div class="detail-row-content">
            <strong>Data e Horário</strong>
            <span>${formatDate(ev.data)}${ev.horario ? " às " + ev.horario : ""}</span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-row-icon" style="${isOnline ? "" : "background:#d4f7e8;color:#16a34a"}">
            <i class="${locIcon}"></i>
          </div>
          <div class="detail-row-content">
            <strong>${locLabel}</strong>
            ${locValue}
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-row-icon"><i class="icon-tag"></i></div>
          <div class="detail-row-content">
            <strong>Categoria</strong>
            <span>${ev.categoria} • ${isOnline ? "Online" : "Presencial"}</span>
          </div>
        </div>
        ${
          ev.descricao
            ? `<div class="detail-row">
                <div class="detail-row-icon"><i class="icon-align-left"></i></div>
                <div class="detail-row-content">
                  <strong>Descrição</strong>
                  <div class="detail-descricao">${ev.descricao}</div>
                </div>
              </div>`
            : ""
        }
      </div>
    `;

    document.getElementById("detail-edit-btn").onclick = () => {
      closeDetail();
      openModal(id);
    };

    document.getElementById("detail-delete-btn").onclick = () => {
      closeDetail();
      deleteEvent(id);
    };

    detailModal.classList.add("open");
  }

  function closeDetail() {
    detailModal.classList.remove("open");
  }

  document.getElementById("detail-close-btn").addEventListener("click", closeDetail);
  detailModal.addEventListener("click", (e) => { if (e.target === detailModal) closeDetail(); });

  /* ── Deletar ─────────────────────────────────────────────────── */
  function deleteEvent(id) {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;
    events = events.filter((e) => e.id !== id);
    saveEvents(events);
    updateStats();
    renderEvents();
    showToast("Evento excluído.", "success");
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

  /* ── Init ────────────────────────────────────────────────────── */
  if (typeof Layout !== 'undefined') {
    Layout.init({ active: 'eventos' });
  }
  updateStats();
  renderEvents();
})();