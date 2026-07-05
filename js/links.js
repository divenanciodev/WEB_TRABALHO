let user = null;
let currentFolderId = null;
let cachedLinks = [];
let cachedFolders = [];

async function renderLinks() {
    const container = document.getElementById('links-container');
    const foldersContainer = document.getElementById('folders-container');
    cachedLinks = await State.getLinks(user.email);
    cachedFolders = await State.getFolders(user.email);

    // ── Vista aberta de uma pasta ──────────────────────────────
    if (currentFolderId !== null) {
        const folder = cachedFolders.find(f => f.id === currentFolderId);
        const folderLinks = cachedLinks.filter(l => l.folderId === currentFolderId);
        const isCommunity = folder && folder.nome === State.COMMUNITY_FOLDER_NAME;

        foldersContainer.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;grid-column:1/-1;">
                <button onclick="closeFolder()" class="btn btn-outline" style="display:flex;align-items:center;gap:6px;padding:8px 16px;">
                    <i class="icon-arrow-left" style="font-size:16px;"></i> Voltar
                </button>
                <div style="display:flex;align-items:center;gap:8px;">
                    <i class="${isCommunity ? 'icon-users' : 'icon-folder'}" style="font-size:24px;color:var(--pink);"></i>
                    <h2 style="margin:0;font-family:'Sora',sans-serif;font-size:1.25rem;">${folder ? folder.nome : 'Pasta'}</h2>
                    <span style="font-size:13px;color:var(--gray-500);">(${folderLinks.length} link${folderLinks.length !== 1 ? 's' : ''})</span>
                </div>
            </div>`;

        if (folderLinks.length === 0) {
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';
            container.style.minHeight = '250px';
            container.innerHTML = `
                <div class="card" style="max-width:400px;width:100%;text-align:center;">
                    <i class="${isCommunity ? 'icon-users' : 'icon-folder'}" style="font-size:48px;color:var(--gray-300);margin-bottom:1rem;display:block;"></i>
                    <p style="color:var(--gray-500);font-size:1rem;">Nenhum link nesta pasta ainda.</p>
                    ${isCommunity
                        ? '<p style="color:var(--gray-400);font-size:0.85rem;margin-top:8px;">Salve links na Comunidade e eles aparecerão aqui.</p>'
                        : `<button class="btn btn-primary" onclick="openAddModal()" style="margin-top:1rem;">Adicionar link</button>`}
                </div>`;
            return;
        }

        container.style.display = 'grid';
        container.innerHTML = renderLinkCards(folderLinks);
        return;
    }

    // ── Vista padrão: pastas + links soltos ────────────────────
    if (cachedFolders.length > 0) {
        foldersContainer.innerHTML = cachedFolders.map(folder => {
            const isCommunity = folder.nome === State.COMMUNITY_FOLDER_NAME;
            const linkCount = cachedLinks.filter(l => l.folderId === folder.id).length;
            const icon = isCommunity ? 'icon-users' : 'icon-folder';
            return `
            <div class="card folder-card" onclick="openFolder(${folder.id})" style="cursor:pointer;text-align:center;position:relative;border:1px solid var(--gray-200);background:#fff;transition:border-color .2s,box-shadow .2s;">
                <i class="${icon}" style="font-size:32px;color:var(--pink);display:block;margin:0 auto 8px;"></i>
                <h4 style="margin:0;">${folder.nome}</h4>
                <span style="font-size:11px;color:var(--gray-500);margin-top:4px;display:block;">${linkCount} link${linkCount !== 1 ? 's' : ''}</span>
                ${!isCommunity ? `<div style="position:absolute;top:10px;right:10px;display:flex;gap:5px;">
                    <button onclick="event.stopPropagation(); editFolder(${folder.id})" style="font-size:12px;color:var(--gray-500);">✎</button>
                    <button onclick="event.stopPropagation(); deleteFolder(${folder.id})" style="font-size:12px;color:#ff4444;">🗑</button>
                </div>` : ''}
            </div>`;
        }).join('');
    } else {
        foldersContainer.innerHTML = '';
    }

    // Links que não pertencem a nenhuma pasta
    const looseLinks = cachedLinks.filter(l => !l.folderId);

    if (cachedLinks.length === 0) {
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.minHeight = '300px';
        container.innerHTML = `
            <div class="card" style="max-width:400px;width:100%;text-align:center;">
                <i class="icon-link-2" style="font-size:48px;color:var(--gray-300);margin-bottom:1rem;display:block;"></i>
                <p style="color:var(--gray-500);font-size:1.1rem;">Você ainda não salvou nenhum link.</p>
                <button class="btn btn-primary" onclick="openAddModal()" style="margin-top:1.5rem;">Adicionar meu primeiro link</button>
            </div>`;
        return;
    }

    if (looseLinks.length > 0) {
        container.style.display = 'grid';
        container.innerHTML = renderLinkCards(looseLinks);
    } else {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

function renderLinkCards(links) {
    return links.map(link => `
        <div class="card link-card">
            <div class="link-info">
                <h4>${link.titulo}</h4>
                <p>${link.descricao || 'Sem descrição'}</p>
                <div style="margin:10px 0;">
                    <button onclick="copyLinkToClipboard('${link.url}')" style="color:var(--pink);font-size:0.85rem;font-weight:600;display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--pink-soft);border-radius:8px;">
                        <i class="icon-copy" style="font-size:14px;"></i> Copiar Link
                    </button>
                </div>
                <div style="margin-top:10px;display:flex;gap:5px;flex-wrap:wrap;">
                    ${link.categoria ? `<span class="badge" style="background:var(--pink-soft);color:var(--pink);padding:2px 8px;border-radius:10px;font-size:11px;">${link.categoria}</span>` : ''}
                    ${link.folderId ? `<span class="badge" style="background:var(--gray-100);color:var(--gray-700);padding:2px 8px;border-radius:10px;font-size:11px;">${cachedFolders.find(f => f.id === link.folderId)?.nome || 'Pasta'}</span>` : ''}
                </div>
            </div>
            <div class="link-actions" style="margin-top:15px;display:flex;gap:8px;">
                <a href="${link.url}" target="_blank" class="btn btn-outline" style="padding:5px 10px;"><i class="icon-external-link" style="font-size:14px;"></i></a>
                <button onclick="toggleFav(${link.id})" class="btn btn-outline fav-btn ${link.favorito ? 'active' : ''}" style="padding:5px 10px;">${link.favorito ? '★' : '☆'}</button>
                <button onclick="editLink(${link.id})" class="btn btn-outline" style="padding:5px 10px;">✎</button>
                <button onclick="deleteLink(${link.id})" class="btn btn-outline" style="border-color:#ff4444;color:#ff4444;padding:5px 10px;">🗑</button>
            </div>
        </div>`).join('');
}

function copyLinkToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => Layout.showToast?.('Link copiado com sucesso!'));
}

function openFolder(id) {
    currentFolderId = id;
    renderLinks();
}

function closeFolder() {
    currentFolderId = null;
    renderLinks();
}

async function updateFolderSelect() {
    const select = document.getElementById('link-folder');
    cachedFolders = await State.getFolders(user.email);
    select.innerHTML = '<option value="">Nenhuma pasta</option>' +
        cachedFolders.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');
}

document.getElementById('link-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('link-id').value;
    const folderId = document.getElementById('link-folder').value;
    const existing = id ? cachedLinks.find(l => l.id == id) : null;
    const linkData = {
        id: id ? parseInt(id) : Date.now(),
        titulo: document.getElementById('link-titulo').value,
        url: document.getElementById('link-url').value,
        descricao: document.getElementById('link-descricao').value,
        categoria: document.getElementById('link-categoria').value,
        folderId: folderId ? parseInt(folderId) : null,
        proprietaria_id: user.email,
        favorito: existing?.favorito || false
    };

    await State.saveLink(linkData);
    UI.closeModal('link-modal');
    await renderLinks();
    await State.addNotification(user.email, `Link "${linkData.titulo}" salvo com sucesso!`);
    UI.updateNotificationBadge?.();
});

document.getElementById('folder-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('folder-id').value;
    const folderData = {
        id: id ? parseInt(id) : Date.now(),
        nome: document.getElementById('folder-nome').value,
        proprietaria_id: user.email
    };

    await State.saveFolder(folderData);
    UI.closeModal('folder-modal');
    await renderLinks();
    await updateFolderSelect();
});

async function deleteLink(id) {
    if (!confirm('Deseja realmente excluir este link?')) return;
    await State.deleteLink(id);
    await renderLinks();
}

async function deleteFolder(id) {
    if (!confirm('Deseja excluir esta pasta?')) return;
    cachedLinks = await State.getLinks(user.email);
    for (const l of cachedLinks.filter(l => l.folderId === id)) {
        await State.saveLink({ ...l, folderId: null });
    }
    await State.deleteFolder(id);
    if (currentFolderId === id) currentFolderId = null;
    await renderLinks();
    await updateFolderSelect();
}

function openAddModal() {
    document.getElementById('link-form').reset();
    document.getElementById('link-id').value = '';
    document.getElementById('modal-title').innerText = 'Novo Link';
    updateFolderSelect();
    UI.showModal('link-modal');
}

function openFolderModal() {
    document.getElementById('folder-form').reset();
    document.getElementById('folder-id').value = '';
    document.getElementById('folder-modal-title').innerText = 'Nova Pasta';
    UI.showModal('folder-modal');
}

async function editLink(id) {
    cachedLinks = await State.getLinks(user.email);
    const link = cachedLinks.find(l => l.id === id);
    if (!link) return;
    document.getElementById('link-id').value = link.id;
    document.getElementById('link-titulo').value = link.titulo;
    document.getElementById('link-url').value = link.url;
    document.getElementById('link-descricao').value = link.descricao || '';
    document.getElementById('link-categoria').value = link.categoria || '';
    await updateFolderSelect();
    document.getElementById('link-folder').value = link.folderId || '';
    document.getElementById('modal-title').innerText = 'Editar Link';
    UI.showModal('link-modal');
}

async function editFolder(id) {
    cachedFolders = await State.getFolders(user.email);
    const folder = cachedFolders.find(f => f.id === id);
    if (!folder) return;
    document.getElementById('folder-id').value = folder.id;
    document.getElementById('folder-nome').value = folder.nome;
    document.getElementById('folder-modal-title').innerText = 'Editar Pasta';
    UI.showModal('folder-modal');
}

async function toggleFav(id) {
    cachedLinks = await State.getLinks(user.email);
    const link = cachedLinks.find(l => l.id === id);
    if (link) {
        await State.saveLink({ ...link, favorito: !link.favorito });
        await renderLinks();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await State.ensureReady();
    user = State.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    if (typeof Layout !== 'undefined') {
        await Layout.init({ active: 'links', requireAuth: true });
    }
    // Garantir que a pasta "Links da Comunidade" existe
    await State.ensureCommunityFolder(user.email);
    await renderLinks();
    await updateFolderSelect();
});
