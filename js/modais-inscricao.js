/**
 * modais-inscricao.js
 * Gerencia a abertura e submissão dos modais de inscrição em projetos e participação em eventos.
 */

function showInscricaoFeedback(message, type = 'error') {
  if (typeof Layout !== 'undefined' && Layout.showToast) {
    Layout.showToast(message, type);
    return;
  }
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.className = 'toast' + (type ? ` toast--${type}` : '');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

// --- PROJETOS ---
window.openInscricaoProjetoModal = (projectId) => {
  const user = window.State?.getCurrentUser();
  document.getElementById('inscricao-projeto-id').value = projectId;

  if (user) {
    document.getElementById('proj-nome').value = user.nome_completo || '';
    document.getElementById('proj-email').value = user.email || '';
  }

  document.getElementById('modal-inscricao-projeto').classList.add('open');
};

window.closeInscricaoProjetoModal = () => {
  document.getElementById('modal-inscricao-projeto').classList.remove('open');
  document.getElementById('form-inscricao-projeto').reset();
};

// --- EVENTOS ---
window.openParticipacaoEventoModal = (eventId) => {
  const user = window.State?.getCurrentUser();
  document.getElementById('participacao-evento-id').value = eventId;

  if (user) {
    document.getElementById('ev-nome').value = user.nome_completo || '';
    document.getElementById('ev-email').value = user.email || '';
  }

  document.getElementById('modal-participacao-evento').classList.add('open');
};

window.closeParticipacaoEventoModal = () => {
  document.getElementById('modal-participacao-evento').classList.remove('open');
  document.getElementById('form-participacao-evento').reset();
};

function bindInscricaoForms() {
  const projetoForm = document.getElementById('form-inscricao-projeto');
  if (projetoForm && !projetoForm.dataset.bound) {
    projetoForm.dataset.bound = 'true';
    projetoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = projetoForm.querySelector('button[type="submit"]');
      if (submitBtn?.disabled) return;

      const projectId = document.getElementById('inscricao-projeto-id').value;
      const nome = document.getElementById('proj-nome').value.trim();
      const email = document.getElementById('proj-email').value.trim();
      const motivo = document.getElementById('proj-motivo').value.trim();
      const habilidades = document.getElementById('proj-habilidades').value.trim();

      if (!projectId || !nome || !email || !motivo) {
        showInscricaoFeedback('Preencha todos os campos obrigatórios.', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }

      try {
        if (window.State?.ensureReady) await window.State.ensureReady();

        const ok = await window.toggleProjectSubscription(projectId, {
          nome,
          email,
          motivo,
          habilidades
        });

        if (ok) {
          window.closeInscricaoProjetoModal();
        }
      } catch (error) {
        console.error('Erro ao inscrever:', error);
        showInscricaoFeedback('Erro ao enviar solicitação. Tente novamente.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar Inscrição';
        }
      }
    });
  }

  const eventoForm = document.getElementById('form-participacao-evento');
  if (eventoForm && !eventoForm.dataset.bound) {
    eventoForm.dataset.bound = 'true';
    eventoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = eventoForm.querySelector('button[type="submit"]');
      if (submitBtn?.disabled) return;

      const eventId = document.getElementById('participacao-evento-id').value;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }

      try {
        if (window.State?.ensureReady) await window.State.ensureReady();

        const ok = await window.toggleEventSubscription(eventId);
        if (ok) {
          window.closeParticipacaoEventoModal();
        }
      } catch (error) {
        console.error('Erro ao participar do evento:', error);
        showInscricaoFeedback('Erro ao confirmar presença. Tente novamente.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirmar Presença';
        }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindInscricaoForms);
} else {
  bindInscricaoForms();
}
