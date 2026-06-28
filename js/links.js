const user = State.getCurrentUser();
        if (!user) window.location.href = 'login.html';

        function renderLinks() {
            const container = document.getElementById('links-container');
            const links = State.getLinks(user.email);
            
            if (links.length === 0) {
                container.innerHTML = '<div class="card"><p style="text-align: center; color: var(--gray);">Você ainda não salvou nenhum link.</p></div>';
                return;
            }

            container.innerHTML = links.map(link => `
                <div class="card link-card">
                    <div class="link-info">
                        <h4>${link.titulo}</h4>
                        <p>${link.descricao || 'Sem descrição'}</p>
                        <a href="${link.url}" target="_blank" style="color: var(--accent-color); font-size: 0.8rem;">${link.url}</a>
                        <br>
                        <span class="badge">${link.categoria || 'Geral'}</span>
                    </div>
                    <div class="link-actions">
                        <button onclick="toggleFav(${link.id})" class="btn btn-outline fav-btn ${link.favorito ? 'active' : ''}" title="Favoritar">★</button>
                        <button onclick="editLink(${link.id})" class="btn btn-outline" title="Editar">✎</button>
                        <button onclick="deleteLink(${link.id})" class="btn btn-outline" style="border-color: #ff4444; color: #ff4444;" title="Excluir">🗑</button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('link-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('link-id').value;
            const linkData = {
                id: id ? parseInt(id) : null,
                titulo: document.getElementById('link-titulo').value,
                url: document.getElementById('link-url').value,
                descricao: document.getElementById('link-descricao').value,
                categoria: document.getElementById('link-categoria').value,
                proprietaria_id: user.email,
                favorito: id ? State.getLinks(user.email).find(l => l.id == id).favorito : false
            };
            
            State.saveLink(linkData);
            UI.closeModal('link-modal');
            renderLinks();
            State.addNotification(user.email, `Link "${linkData.titulo}" salvo com sucesso!`);
            UI.updateNotificationBadge();
        });

        function deleteLink(id) {
            if (confirm('Tem certeza que deseja excluir este link?')) {
                State.deleteLink(id);
                renderLinks();
            }
        }

        function openAddModal() {
            document.getElementById('link-form').reset();
            document.getElementById('link-id').value = '';
            document.getElementById('modal-title').innerText = 'Novo Link';
            UI.showModal('link-modal');
        }

        function editLink(id) {
            const link = State.getLinks(user.email).find(l => l.id === id);
            if (!link) return;
            document.getElementById('link-id').value = link.id;
            document.getElementById('link-titulo').value = link.titulo;
            document.getElementById('link-url').value = link.url;
            document.getElementById('link-descricao').value = link.descricao || '';
            document.getElementById('link-categoria').value = link.categoria || '';
            document.getElementById('modal-title').innerText = 'Editar Link';
            UI.showModal('link-modal');
        }

        function toggleFav(id) {
            State.toggleFavoriteLink(id);
            renderLinks();
        }

        document.addEventListener('DOMContentLoaded', renderLinks);