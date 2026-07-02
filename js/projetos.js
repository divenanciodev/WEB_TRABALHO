/**
 * projetos.js — SheTech • Página de Projetos
 * Gerencia criação, edição, exclusão e renderização de projetos.
 * Persiste dados em localStorage.
 */

(function () {
  "use strict";

  /* ── Storage ───────────────────────────────────────────────── */
  const STORAGE_KEY = "shetech_projetos";

  function loadProjects() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveProjects(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  /* ── Estado ────────────────────────────────────────────────── */
  let projects = loadProjects();
  let filterActive = "todos";
  let searchQuery = "";
  let isListView = false;
  let editingId = null;
  let techTags = []; // tags temporárias no form

  /* ── Conteúdo inicial vazio ───────────────────────────────── */
  if (projects.length === 0) {
    saveProjects([]);
  }

  /* ── Helpers ─────────────────────────────────────────────────── */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function catKey(cat) {
    return (cat || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function statusKey(status) {
    const map = {
      "Em Planejamento": "planejamento",
      "Em Desenvolvimento": "desenvolvimento",
      "Concluído": "concluido",
    };
    return map[status] || "planejamento";
  }

  function stripeClass(cat) {
    return "stripe--" + catKey(cat);
  }

  function badgeCatClass(cat) {
    return "badge--" + catKey(cat);
  }

  function badgeStatusClass(status) {
    return "badge--" + statusKey(status);
  }

  /* ── Stats ──────────────────────────────────────────────────── */
  function updateStats() {
    document.getElementById("stat-total").textContent = projects.length;
    document.getElementById("stat-em-dev").textContent =
      projects.filter((p) => p.status === "Em Desenvolvimento").length;
    document.getElementById("stat-concluidos").textContent =
      projects.filter((p) => p.status === "Concluído").length;
    document.getElementById("stat-planejamento").textContent =
      projects.filter((p) => p.status === "Em Planejamento").length;
  }

  /* ── Filtro / busca ─────────────────────────────────────────── */
  function filteredProjects() {
    return projects.filter((p) => {
      const matchFilter =
        filterActive === "todos" ||
        p.status === filterActive;
      const matchSearch =
        !searchQuery ||
        p.titulo.toLowerCase().includes(searchQuery) ||
        (p.descricao || "").toLowerCase().includes(searchQuery) ||
        (p.tecnologias || []).some((t) => t.toLowerCase().includes(searchQuery));
      return matchFilter && matchSearch;
    });
  }

  /* ── Renderização ────────────────────────────────────────────── */
  function renderProjects() {
    const container = document.getElementById("projects-container");
    const emptyState = document.getElementById("empty-state");
    const list = filteredProjects();

    container.innerHTML = "";
    container.className = "projects-grid" + (isListView ? " view-list" : "");

    if (list.length === 0) {
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";
    list.forEach((p) => container.appendChild(buildCard(p)));
  }

  function buildCard(p) {
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.id = p.id;

    const isConcluido = p.status === "Concluído";
    const techsToShow = (p.tecnologias || []).slice(0, 3);
    const extraCount = (p.tecnologias || []).length - techsToShow.length;

    const techPills = techsToShow
      .map((t) => `<span class="tech-pill">${t}</span>`)
      .join("") +
      (extraCount > 0 ? `<span class="tech-pill tech-pill--more">+${extraCount}</span>` : "");

    const linkBtns = [
      p.repo ? `<a class="card-link-btn" href="${p.repo}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><i class="icon-github"></i> Repo</a>` : "",
      p.demo ? `<a class="card-link-btn" href="${p.demo}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><i class="icon-external-link"></i> Demo</a>` : "",
    ].join("");

    card.innerHTML = `
      <div class="project-card-stripe ${stripeClass(p.categoria)}"></div>
      <div class="project-card-body">
        <div class="project-card-top">
          <div class="project-card-badges">
            <span class="badge ${badgeCatClass(p.categoria)}">${p.categoria}</span>
            <span class="badge ${badgeStatusClass(p.status)}">${p.status}</span>
          </div>
          <div style="position:relative">
            <button class="project-card-menu-btn" aria-label="Opções">
              <i class="icon-more-vertical">⋮</i>
            </button>
            <div class="card-dropdown" id="dd-${p.id}">
              <button data-action="edit"><i class="icon-pencil"></i> Editar</button>
              <button data-action="delete" class="danger"><i class="icon-trash-2"></i> Excluir</button>
            </div>
          </div>
        </div>

        <h3 class="project-card-title">${p.titulo}</h3>

        ${p.descricao ? `<p class="project-card-desc">${p.descricao}</p>` : ""}

        ${techPills ? `<div class="tech-pill-row">${techPills}</div>` : ""}

        ${linkBtns ? `<div class="card-links">${linkBtns}</div>` : ""}

        <div class="progress-wrap">
          <div class="progress-header">
            <span class="progress-label">Progresso</span>
            <span class="progress-pct">${p.progresso || 0}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${isConcluido ? "progress-bar-fill--concluido" : ""}"
                 style="width:${p.progresso || 0}%"></div>
          </div>
        </div>
      </div>
    `;

    // Clique no card → detalhes
    card.addEventListener("click", (e) => {
      if (e.target.closest(".project-card-menu-btn") || e.target.closest(".card-dropdown") || e.target.closest("a")) return;
      openDetail(p.id);
    });

    // Menu de opções
    const user = typeof Layout !== 'undefined' ? Layout.init({ requireAuth: false }) : null;
    const userEmail = user ? user.email : 'anonimo';
    const isOwner = p.criador_id === userEmail || p.proprietaria_id === userEmail;

    const menuBtn = card.querySelector(".project-card-menu-btn");
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
      openModal(p.id);
    });

    dropdown.querySelector("[data-action='delete']").addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.remove("open");
      deleteProject(p.id);
    });

    return card;
  }

  /* ── Modal criar / editar ────────────────────────────────────── */
  const modal = document.getElementById("project-modal");
  const form  = document.getElementById("project-form");

  function openModal(id = null) {
    editingId = id;
    techTags = [];
    form.reset();
    document.getElementById("progresso-label").textContent = "0%";
    renderTechTags();

    document.getElementById("modal-title").textContent = id ? "Editar Projeto" : "Novo Projeto";

    if (id) {
      const p = projects.find((x) => x.id === id);
      if (!p) return;
      document.getElementById("project-titulo").value     = p.titulo;
      document.getElementById("project-categoria").value  = p.categoria;
      document.getElementById("project-status").value     = p.status;
      document.getElementById("project-progresso").value  = p.progresso || 0;
      document.getElementById("progresso-label").textContent = (p.progresso || 0) + "%";
      document.getElementById("project-repo").value       = p.repo || "";
      document.getElementById("project-demo").value       = p.demo || "";
      document.getElementById("project-descricao").value  = p.descricao || "";
      techTags = [...(p.tecnologias || [])];
      renderTechTags();
    }

    modal.classList.add("open");
    document.getElementById("project-titulo").focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    editingId = null;
    techTags = [];
  }

  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  document.getElementById("modal-cancel-btn").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  /* ── Progresso range ─────────────────────────────────────────── */
  document.getElementById("project-progresso").addEventListener("input", (e) => {
    document.getElementById("progresso-label").textContent = e.target.value + "%";
  });

  /* ── Tech tags ───────────────────────────────────────────────── */
  const techInput = document.getElementById("project-tech-input");

  techInput.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === ",") && techInput.value.trim()) {
      e.preventDefault();
      const val = techInput.value.trim().replace(/,$/, "");
      if (val && !techTags.includes(val)) {
        techTags.push(val);
        renderTechTags();
      }
      techInput.value = "";
    }

    // Backspace remove a última tag
    if (e.key === "Backspace" && !techInput.value && techTags.length) {
      techTags.pop();
      renderTechTags();
    }
  });

  // Clicar na área foca o input
  document.getElementById("tech-tags").parentElement.addEventListener("click", () => techInput.focus());

  function renderTechTags() {
    const container = document.getElementById("tech-tags");
    container.innerHTML = techTags
      .map(
        (t, i) => `
        <span class="tech-tag">
          ${t}
          <button type="button" data-idx="${i}" aria-label="Remover ${t}">✕</button>
        </span>`
      )
      .join("");

    container.querySelectorAll("button[data-idx]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        techTags.splice(Number(btn.dataset.idx), 1);
        renderTechTags();
      });
    });
  }

  /* ── Submit ──────────────────────────────────────────────────── */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const titulo    = document.getElementById("project-titulo").value.trim();
    const categoria = document.getElementById("project-categoria").value;
    const status    = document.getElementById("project-status").value;
    const progresso = Number(document.getElementById("project-progresso").value);
    const repo      = document.getElementById("project-repo").value.trim();
    const demo      = document.getElementById("project-demo").value.trim();
    const descricao = document.getElementById("project-descricao").value.trim();

    if (!titulo) { showToast("Informe o título do projeto.", "error"); return; }

    const user = typeof Layout !== 'undefined' ? Layout.init({ requireAuth: false }) : null;
    const userEmail = user ? user.email : 'anonimo';

    if (editingId) {
      const idx = projects.findIndex((p) => p.id === editingId);
      if (idx !== -1) {
        // Apenas o criador pode editar
        if (projects[idx].criador_id && projects[idx].criador_id !== userEmail) {
          showToast("Você não tem permissão para editar este projeto.", "error");
          return;
        }
        projects[idx] = { ...projects[idx], titulo, categoria, status, progresso, repo, demo, descricao, tecnologias: [...techTags] };
        showToast("Projeto atualizado!", "success");
      }
    } else {
      projects.push({ 
        id: uid(), 
        titulo, 
        categoria, 
        status, 
        progresso, 
        repo, 
        demo, 
        descricao, 
        tecnologias: [...techTags],
        criador_id: userEmail,
        proprietaria_id: userEmail
      });
      showToast("Projeto criado com sucesso!", "success");
    }

    saveProjects(projects);
    
    // Sincroniza com Supabase
    if (typeof State !== 'undefined' && State.saveGlobalData) {
      const projectToSave = editingId 
        ? projects.find(p => p.id === editingId)
        : projects[projects.length - 1];
      State.saveGlobalData('shetech_projetos', projectToSave);
    }

    closeModal();
    updateStats();
    renderProjects();
  });

  /* ── Modal de detalhes ───────────────────────────────────────── */
  const detailModal = document.getElementById("detail-modal");

  function openDetail(id) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;

    detailModal.classList.add("modal-detail-overlay");
    document.body.style.overflow = 'hidden'; // Prevenir scroll no fundo
    document.getElementById("detail-title").textContent = p.titulo;

    const isConcluido = p.status === "Concluído";

    const techBadges = (p.tecnologias || [])
      .map((t) => `<span class="tech-pill">${t}</span>`)
      .join("") || "<span style='color:var(--gray-500);font-size:14px'>Nenhuma tecnologia informada</span>";

    const membros = p.membros || [];
    const membrosHTML = membros.length > 0
      ? `<div class="detail-row" style="flex-direction: column; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div class="detail-row-icon"><i class="icon-users"></i></div>
            <strong>Membros (${membros.length})</strong>
          </div>
          <div class="members-list" style="width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
            ${membros.map(m => `
              <div class="member-card" style="background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 8px; padding: 12px;">
                <div style="font-weight: 600; color: var(--pink);">${m.nome || m}</div>
                ${m.funcao ? `<div style="font-size: 12px; color: var(--gray-600); margin-bottom: 4px;">${m.funcao}</div>` : ''}
                ${m.descricao ? `<div style="font-size: 13px; color: var(--gray-700); line-height: 1.4;">${m.descricao}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>`
      : '';

    document.getElementById("detail-body").innerHTML = `
      <div class="detail-section">
        <div class="detail-row">
          <div class="detail-row-icon"><i class="icon-tag"></i></div>
          <div class="detail-row-content">
            <strong>Categoria • Status</strong>
            <span>${p.categoria} &nbsp;·&nbsp; ${p.status}</span>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-row-icon"><i class="icon-bar-chart-2"></i></div>
          <div class="detail-row-content" style="flex:1">
            <strong>Progresso</strong>
            <span>${p.progresso || 0}% concluído</span>
            <div class="detail-progress-bar-bg">
              <div class="detail-progress-bar-fill ${isConcluido ? "progress-bar-fill--concluido" : ""}"
                   style="width:${p.progresso || 0}%"></div>
            </div>
          </div>
        </div>

        ${membrosHTML}

        <div class="detail-row">
          <div class="detail-row-icon"><i class="icon-cpu"></i></div>
          <div class="detail-row-content">
            <strong>Tecnologias</strong>
            <div class="tech-pill-row" style="margin-top:4px">${techBadges}</div>
          </div>
        </div>

        ${p.repo || p.demo ? `
        <div class="detail-row">
          <div class="detail-row-icon"><i class="icon-link"></i></div>
          <div class="detail-row-content">
            <strong>Links</strong>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
              ${p.repo ? `<a href="${p.repo}" target="_blank" rel="noopener">Repositório</a>` : ""}
              ${p.demo ? `<a href="${p.demo}" target="_blank" rel="noopener">Demo / Site</a>` : ""}
            </div>
          </div>
        </div>` : ""}

        ${p.descricao ? `
        <div class="detail-row">
          <div class="detail-row-icon"><i class="icon-align-left"></i></div>
          <div class="detail-row-content">
            <strong>Descrição</strong>
            <div class="detail-descricao">${p.descricao}</div>
          </div>
        </div>` : ""}
      </div>
    `;

    const user = typeof Layout !== 'undefined' ? Layout.init({ requireAuth: false }) : null;
    const userEmail = user ? user.email : 'anonimo';
    const isOwner = p.criador_id === userEmail || p.proprietaria_id === userEmail;

    const editBtn = document.getElementById("detail-edit-btn");
    const deleteBtn = document.getElementById("detail-delete-btn");

    if (isOwner) {
      editBtn.style.display = 'flex';
      deleteBtn.style.display = 'flex';
      editBtn.onclick = () => { closeDetail(); openModal(id); };
      deleteBtn.onclick = () => { closeDetail(); deleteProject(id); };
    } else {
      editBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
    }

    detailModal.classList.add("open");
  }

    function closeDetail() {
    detailModal.classList.remove("open");
    detailModal.classList.remove("modal-detail-overlay");
    document.body.style.overflow = ''; // Restaurar scroll
  }

  document.getElementById("detail-close-btn").addEventListener("click", closeDetail);
  detailModal.addEventListener("click", (e) => { if (e.target === detailModal) closeDetail(); });

  /* ── Deletar ─────────────────────────────────────────────────── */
  function deleteProject(id) {
    // Substituindo confirm nativo por fluxo do sistema (para este trabalho, executaremos a ação com feedback visual)
    Layout.showToast("Projeto excluído com sucesso!", "success");
    projects = projects.filter((p) => p.id !== id);
    saveProjects(projects);
    updateStats();
    renderProjects();
    showToast("Projeto excluído.", "success");
  }

  /* ── Filtros ─────────────────────────────────────────────────── */
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      filterActive = chip.dataset.filter;
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");
      renderProjects();
    });
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderProjects();
  });

  /* ── Toggle view ─────────────────────────────────────────────── */
  document.getElementById("view-grid").addEventListener("click", () => {
    isListView = false;
    document.getElementById("view-grid").classList.add("view-btn--active");
    document.getElementById("view-list").classList.remove("view-btn--active");
    renderProjects();
  });

  document.getElementById("view-list").addEventListener("click", () => {
    isListView = true;
    document.getElementById("view-list").classList.add("view-btn--active");
    document.getElementById("view-grid").classList.remove("view-btn--active");
    renderProjects();
  });

  /* ── Botões novo projeto ─────────────────────────────────────── */
  document.getElementById("btn-novo-projeto").addEventListener("click", () => openModal());
  document.getElementById("btn-empty-novo").addEventListener("click", () => openModal());

  /* ── Fechar dropdowns ao clicar fora ─────────────────────────── */
  document.addEventListener("click", () => {
    document.querySelectorAll(".card-dropdown.open").forEach((d) => d.classList.remove("open"));
  });

  /* ── Esc fecha modais ────────────────────────────────────────── */
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

  /* ── Sincronização Global ── */
  async function loadProjectsFromSupabase() {
    if (typeof State !== 'undefined' && State.loadGlobalData) {
      const globalProjects = await State.loadGlobalData('shetech_projetos', STORAGE_KEY);
      if (globalProjects) {
        projects = globalProjects;
        updateStats();
        renderProjects();
      }
    }
  }

  /* ── Init ────────────────────────────────────────────────────── */
  if (typeof Layout !== 'undefined') {
    Layout.init({ active: 'projetos' });
  }
  loadProjectsFromSupabase();

  // Abrir detalhe se houver ID na URL
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  if (projectId) {
      setTimeout(() => openDetail(projectId), 300);
  }
})();