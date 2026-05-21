import { api } from '../api.js';

const STATUS_LABELS = {
  pending: 'Gözləmədə', accepted: 'Qəbul', rejected: 'Rədd', completed: 'Tamamlandı',
};

export async function renderReportList(root) {
  const initialStatus = new URLSearchParams(location.hash.split('?')[1] || '').get('status') || '';

  root.innerHTML = `
    <div class="topbar">
      <h1>Müraciətlər</h1>
      <div class="toolbar">
        <label class="muted" style="margin:0;">Filtr:</label>
        <select id="status-filter" style="width:auto;min-width:160px;">
          <option value="">Hamısı</option>
          <option value="pending">Gözləmədə</option>
          <option value="accepted">Qəbul</option>
          <option value="completed">Tamamlandı</option>
          <option value="rejected">Rədd</option>
        </select>
      </div>
    </div>
    <div id="list"><p class="muted">Yüklənir...</p></div>
  `;

  const list = root.querySelector('#list');
  const filter = root.querySelector('#status-filter');
  filter.value = initialStatus;

  async function load() {
    list.innerHTML = `<p class="muted">Yüklənir...</p>`;
    try {
      const { reports } = await api.listReports(filter.value || undefined);
      if (!reports.length) {
        list.innerHTML = `<div class="empty-state">Müraciət tapılmadı.</div>`;
        return;
      }
      list.innerHTML = `
        <div class="table-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>Başlıq</th>
                <th>Vətəndaş</th>
                <th>Tarix</th>
                <th>Mükafat</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reports.map(r => `
                <tr onclick="location.hash='#/reports/${r.id}'">
                  <td><strong>${escapeHtml(r.title)}</strong><br><span class="muted" style="font-size:0.8rem;">${escapeHtml(truncate(r.description, 60))}</span></td>
                  <td>${escapeHtml(r.citizen_name)}<br><span class="muted" style="font-size:0.8rem;">${escapeHtml(r.citizen_email)}</span></td>
                  <td>${formatDate(r.created_at)}</td>
                  <td>${r.reward_amount ? `${r.reward_amount} AZN` : '—'}</td>
                  <td><span class="status-badge status-${r.status}">${STATUS_LABELS[r.status] || r.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      list.innerHTML = `<p class="error-text">${err.message}</p>`;
    }
  }

  filter.addEventListener('change', () => {
    const params = filter.value ? `?status=${encodeURIComponent(filter.value)}` : '';
    history.replaceState(null, '', `#/reports${params}`);
    load();
  });

  load();
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function formatDate(s) {
  if (!s) return '';
  try { return new Date(s.replace(' ', 'T') + 'Z').toLocaleString('az-AZ'); }
  catch { return s; }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
