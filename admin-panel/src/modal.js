let currentOverlay = null;

export function openModal({ title, body, footer }) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>${title || ''}</h3>
        <button type="button" class="modal-close" aria-label="Bağla">&times;</button>
      </div>
      <div class="modal-body"></div>
      ${footer ? '<div class="modal-foot"></div>' : ''}
    </div>
  `;
  const bodyEl = overlay.querySelector('.modal-body');
  if (body instanceof Node) bodyEl.appendChild(body);
  else bodyEl.innerHTML = body || '';
  if (footer) {
    const footEl = overlay.querySelector('.modal-foot');
    if (footer instanceof Node) footEl.appendChild(footer);
    else footEl.innerHTML = footer;
  }

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', escClose);

  document.body.appendChild(overlay);
  currentOverlay = overlay;
  return overlay;
}

export function closeModal() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
    document.removeEventListener('keydown', escClose);
  }
}

function escClose(e) {
  if (e.key === 'Escape') closeModal();
}

export function confirmModal(message, { confirmLabel = 'Təsdiqlə', confirmStyle = 'btn-danger' } = {}) {
  return new Promise((resolve) => {
    openModal({
      title: 'Təsdiq',
      body: `<p style="margin:0;">${message}</p>`,
      footer: `
        <button type="button" class="btn btn-secondary" data-action="cancel">Ləğv et</button>
        <button type="button" class="btn ${confirmStyle}" data-action="ok">${confirmLabel}</button>
      `,
    });
    currentOverlay.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      closeModal(); resolve(false);
    });
    currentOverlay.querySelector('[data-action="ok"]').addEventListener('click', () => {
      closeModal(); resolve(true);
    });
  });
}
