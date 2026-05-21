import { api } from '../api.js';

const STATUS_LABELS = {
  pending:   'Gözləmədə',
  accepted:  'Qəbul edildi',
  rejected:  'Rədd edildi',
  completed: 'Tamamlandı',
};

export async function renderMyReports(root) {
  root.innerHTML = `
    <div class="page-head">
      <h2>Müraciətlərim</h2>
      <a href="#/reports/new" class="btn">+ Yeni Müraciət</a>
    </div>
    <div id="reports-container" class="report-grid">
      <p class="muted">Yüklənir...</p>
    </div>
  `;
  const container = root.querySelector('#reports-container');

  try {
    const { reports } = await api.listMyReports();
    if (!reports.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Hələ ki müraciətiniz yoxdur.</p>
          <a href="#/reports/new" class="btn">İlk müraciəti yarat</a>
        </div>
      `;
      return;
    }
    container.innerHTML = reports.map(renderCard).join('');
  } catch (err) {
    container.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

function renderCard(r) {
  const status = STATUS_LABELS[r.status] || r.status;
  const created = formatDate(r.created_at);
  return `
    <a href="#/reports/${r.id}" class="report-card" style="text-decoration:none;color:inherit;">
      <div>
        <h3>${escapeHtml(r.title)}</h3>
        <p class="desc">${escapeHtml(truncate(r.description, 110))}</p>
        <p class="meta">${created}${r.reward_amount ? ` · Mükafat: ${r.reward_amount} AZN` : ''}</p>
      </div>
      <span class="status-badge status-${r.status}">${status}</span>
    </a>
  `;
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function formatDate(s) {
  if (!s) return '';
  try {
    return new Date(s.replace(' ', 'T') + 'Z').toLocaleString('az-AZ');
  } catch { return s; }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
