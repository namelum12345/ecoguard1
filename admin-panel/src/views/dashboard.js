import { api } from '../api.js';

export async function renderDashboard(root) {
  root.innerHTML = `
    <div class="topbar">
      <h1>Dashboard</h1>
      <a href="#/reports" class="btn">Bütün müraciətlər</a>
    </div>

    <div id="stats" class="stat-grid">
      <p class="muted">Yüklənir...</p>
    </div>

    <div class="card mt-2">
      <h3>Son müraciətlər</h3>
      <div id="recent"><p class="muted">Yüklənir...</p></div>
    </div>
  `;

  const statsEl = root.querySelector('#stats');
  const recentEl = root.querySelector('#recent');

  try {
    const [{ stats }, { reports }] = await Promise.all([
      api.stats(),
      api.listReports(),
    ]);
    statsEl.innerHTML = renderStats(stats);
    const latest = reports.slice(0, 5);
    recentEl.innerHTML = latest.length
      ? renderRecentTable(latest)
      : `<p class="muted">Müraciət yoxdur.</p>`;
  } catch (err) {
    statsEl.innerHTML = `<p class="error-text">${err.message}</p>`;
    recentEl.innerHTML = '';
  }
}

function renderStats(s) {
  const items = [
    ['Cəmi',        s.total,     '#38bdf8'],
    ['Gözləmədə',   s.pending,   '#fbbf24'],
    ['Qəbul',       s.accepted,  '#38bdf8'],
    ['Tamamlandı',  s.completed, '#34d399'],
    ['Rədd',        s.rejected,  '#f87171'],
  ];
  return items.map(([label, value, color]) => `
    <div class="stat">
      <div class="label">${label}</div>
      <div class="value" style="color:${color};">${value || 0}</div>
    </div>
  `).join('');
}

function renderRecentTable(reports) {
  const STATUS_LABELS = {
    pending: 'Gözləmədə', accepted: 'Qəbul', rejected: 'Rədd', completed: 'Tamamlandı',
  };
  return `
    <div class="table-wrap">
      <table class="report-table">
        <thead>
          <tr>
            <th>Başlıq</th>
            <th>Vətəndaş</th>
            <th>Tarix</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map(r => `
            <tr onclick="location.hash='#/reports/${r.id}'">
              <td>${escapeHtml(r.title)}</td>
              <td>${escapeHtml(r.citizen_name)}</td>
              <td>${formatDate(r.created_at)}</td>
              <td><span class="status-badge status-${r.status}">${STATUS_LABELS[r.status] || r.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
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
