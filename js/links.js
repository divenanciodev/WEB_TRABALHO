const user = State.getCurrentUser();
if (!user) window.location.href = 'login.html';

let currentFolderId = null;

function renderLinks() {
    const container = document.getElementById('links-container');
    const foldersContainer = document.getElementById('folders-container');
    const links = State.getLinks(user.email);
    const folders = State.getFolders(user.email);
    
    // Render Folders
    if (folders.length > 0) {
        foldersContainer.innerHTML = `
            <div class="card folder-card ${!currentFolderId ? 'active' : ''}" onclick="filterByFolder(null)" style="cursor: pointer; text-align: center; border: ${!currentFolderId ? '2px solid var(--pink)' : '1px solid var(--gray-200)'}; background: ${!currentFolderId ? 'var(--pink-soft)' : '#fff'}">
                <i class="icon-folder" style="font-size: 32px; color: var(--pink); display: block; margin: 0 auto 8px;"></i>
                <h4 style="margin: 0;">Todos</h4>
            </div>
        ` + folders.map(folder => `
            <div class="card folder-card ${currentFolderId === folder.id ? 'active' : ''}" onclick="filterByFolder(${folder.id})" style="cursor: pointer; text-align: center; position: relative; border: ${currentFolderId === folder.id ? '2px solid var(--pink)' : '1px solid var(--gray-200)'}; background: ${currentFolderId === folder.id ? 'var(--pink-soft)' : '#fff'}">
                <i class="icon-folder" style="font-size: 32px; color: var(--pink); display: block; margin: 0 auto 8px;"></i>
                <h4 style="margin: 0;">${folder.nome}</h4>
                <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;">
                    <button onclick="event.stopPropagation(); editFolder(${folder.id})" style="font-size: 12px; color: var(--gray-500);">✎</button>
                    <button onclick="event.stopPropagation(); deleteFolder(${folder.id})" style="font-size: 12px; color: #ff4444;">🗑</button>
                </div>
            </div>
        `).join('');
    } else {
        foldersContainer.innerHTML = '';
    }

    // Filter links by folder if selected
    const filteredLinks = currentFolderId 
        ? links.filter(l => l.folderId === currentFolderId)
        : links;

    if (links.length === 0) {
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.minHeight = '300px';
        container.innerHTML = `
            <div class="card" style="max-width: 400px; width: 100%; text-align: center;">
                <i class="icon-link-2" style="font-size: 48px; color: var(--gray-300); margin-bottom: 1rem; display: block;"></i>
                <p style="color: var(--gray-500); font-size: 1.1rem;">Você ainda não salvou nenhum link.</p>
                <button class="btn btn-primary" onclick="openAddModal()" style="margin-top: 1.5rem;">Adicionar meu primeiro link</button>
            </div>`;
        return;
    } else {
        container.style.display = 'grid';
    }

    if (filteredLinks.length === 0 && currentFolderId) {
        container.innerHTML = '<div class="card" style="grid-column: 1/-1; text-align: center;"><p style="color: var(--gray-500);">Nenhum link nesta pasta.</p></div>';
        return;
    }

    container.innerHTML = filteredLinks.map(link => `
        <div class="card link-card">
            <div class="link-info">
                <h4>${link.titulo}</h4>
                <p>${link.descricao || 'Sem descrição'}</p>
                <div style="margin: 10px 0;">
                    <button onclick="copyLinkToClipboard('${link.url}')" style="color: var(--pink); font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--pink-soft); border-radius: 8px;">
                        <i class="icon-copy" style="font-size: 14px;"></i> Copiar Link
                    </button>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
                    ${link.categoria ? `<span class="badge" style="background: var(--pink-soft); color: var(--pink); padding: 2px 8px; border-radius: 10px; font-size: 11px;">${link.categoria}</span>` : ''}
                    ${link.folderId ? `<span class="badge" style="background: var(--gray-100); color: var(--gray-700); padding: 2px 8px; border-radius: 10px; font-size: 11px;"><i class="icon-folder" style="font-size: 10px;"></i> ${folders.find(f => f.id === link.folderId)?.nome || 'Pasta'}</span>` : ''}
                </div>
            </div>
            <div class="link-actions" style="margin-top: 15px; display: flex; gap: 8px;">
                <a href="${link.url}" target="_blank" class="btn btn-outline" title="Abrir" style="padding: 5px 10px;"><i class="icon-external-link" style="font-size: 14px;"></i></a>
                <button onclick="toggleFav(${link.id})" class="btn btn-outline fav-btn ${link.favorito ? 'active' : ''}" title="Favoritar" style="padding: 5px 10px;">${link.favorito ? '★' : '☆'}</button>
                <button onclick="editLink(${link.id})" class="btn btn-outline" title="Editar" style="padding: 5px 10px;">✎</button>
                <button onclick="deleteLink(${link.id})" class="btn btn-outline" style="border-color: #ff4444; color: #ff4444; padding: 5px 10px;" title="Excluir">🗑</button>
            </div>
        </div>
    `).join('');
}

function copyLinkToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        if (typeof Layout !== 'undefined' && Layout.showToast) {
            Layout.showToast('Link copiado com sucesso!');
        } else {
            alert('Link copiado!');
        }
    });
}

function filterByFolder(id) {
    if (currentFolderId === id) {
        currentFolderId = null;
    } else {
        currentFolderId = id;
    }
    renderLinks();
}

function updateFolderSelect() {
    const select = document.getElementById('link-folder');
    const folders = State.getFolders(user.email);
    select.innerHTML = '<option value="">Nenhuma pasta</option>' + 
        folders.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');
}

document.getElementById('link-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('link-id').value;
    const folderId = document.getElementById('link-folder').value;
    const linkData = {
        id: id ? parseInt(id) : null,
        titulo: document.getElementById('link-titulo').value,
        url: document.getElementById('link-url').value,
        descricao: document.getElementById('link-descricao').value,
        categoria: document.getElementById('link-categoria').value,
        folderId: folderId ? parseInt(folderId) : null,
        proprietaria_id: user.email,
        favorito: id ? State.getLinks(user.email).find(l => l.id == id).favorito : false
    };
    
    State.saveLink(linkData);
    
    // Sincroniza com Supabase
    if (typeof State !== 'undefined' && State.saveGlobalData) {
        State.saveGlobalData('links', linkData);
    }

    UI.closeModal('link-modal');
    renderLinks();
    State.addNotification(user.email, `Link "${linkData.titulo}" salvo com sucesso!`);
    UI.updateNotificationBadge();
});

document.getElementById('folder-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('folder-id').value;
    const folderData = {
        id: id ? parseInt(id) : null,
        nome: document.getElementById('folder-nome').value,
        proprietaria_id: user.email
    };
    
    State.saveFolder(folderData);
    
    // Sincroniza com Supabase
    if (typeof State !== 'undefined' && State.saveGlobalData) {
        State.saveGlobalData('folders', folderData);
    }

    UI.closeModal('folder-modal');
    renderLinks();
    updateFolderSelect();
});

function deleteLink(id) {
    if (confirm('Deseja realmente excluir este link?')) {
        State.deleteLink(id);
        renderLinks();
    }
}

function deleteFolder(id) {
    if (confirm('Deseja excluir esta pasta? Os links nela contidos não serão excluídos, apenas ficarão sem pasta.')) {
        // Update links in this folder
        const links = State.getLinks(user.email);
        links.forEach(l => {
            if (l.folderId === id) {
                l.folderId = null;
                State.saveLink(l);
            }
        });
        State.deleteFolder(id);
        if (currentFolderId === id) currentFolderId = null;
        renderLinks();
        updateFolderSelect();
    }
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

function editLink(id) {
    const link = State.getLinks(user.email).find(l => l.id === id);
    if (!link) return;
    document.getElementById('link-id').value = link.id;
    document.getElementById('link-titulo').value = link.titulo;
    document.getElementById('link-url').value = link.url;
    document.getElementById('link-descricao').value = link.descricao || '';
    document.getElementById('link-categoria').value = link.categoria || '';
    updateFolderSelect();
    document.getElementById('link-folder').value = link.folderId || '';
    document.getElementById('modal-title').innerText = 'Editar Link';
    UI.showModal('link-modal');
}

function editFolder(id) {
    const folder = State.getFolders(user.email).find(f => f.id === id);
    if (!folder) return;
    document.getElementById('folder-id').value = folder.id;
    document.getElementById('folder-nome').value = folder.nome;
    document.getElementById('folder-modal-title').innerText = 'Editar Pasta';
    UI.showModal('folder-modal');
}

function toggleFav(id) {
    const links = State.getLinks(user.email);
    const link = links.find(l => l.id === id);
    if (link) {
        link.favorito = !link.favorito;
        State.saveLink(link);
        renderLinks();
    }
}

async function loadGlobalLinks() {
    if (typeof State !== 'undefined' && State.loadGlobalData) {
        await State.loadGlobalData('links', 'links');
        await State.loadGlobalData('folders', 'folders');
        renderLinks();
        updateFolderSelect();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Layout !== 'undefined') {
        Layout.init({ active: 'links', requireAuth: true });
    }
    renderLinks();
    updateFolderSelect();
    loadGlobalLinks();
});
