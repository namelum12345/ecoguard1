import { api } from '../api.js';

const STATUS_LABELS = {
  pending:   'Gözləmədə',
  accepted:  'Qəbul',
  rejected:  'Rədd',
  completed: 'Tamamlandı',
};

const STATUS_COLORS = {
  pending:   '#fbbf24',
  accepted:  '#38bdf8',
  completed: '#34d399',
  rejected:  '#f87171',
};

let chartInstances = [];

function disposeCharts() {
  chartInstances.forEach((c) => { try { c.destroy(); } catch {} });
  chartInstances = [];
}

export async function renderAnalytics(root) {
  disposeCharts();

  root.innerHTML = `
    <div class="topbar">
      <h1>Analitika</h1>
      <div class="toolbar">
        <label class="muted" style="margin:0;">Müddət:</label>
        <select id="range" style="width:auto;min-width:160px;">
          <option value="7">Son 7 gün</option>
          <option value="14">Son 14 gün</option>
          <option value="30" selected>Son 30 gün</option>
          <option value="90">Son 90 gün</option>
        </select>
      </div>
    </div>

    <div id="stats" class="stat-grid">
      <p class="muted">Yüklənir...</p>
    </div>

    <div class="analytics-grid mt-2">
      <div class="card">
        <h3>Status üzrə paylanma</h3>
        <div class="chart-box"><canvas id="status-chart"></canvas></div>
      </div>
      <div class="card">
        <h3>Müraciətlərin dinamikası</h3>
        <div class="chart-box"><canvas id="timeline-chart"></canvas></div>
      </div>
    </div>

    <div class="card mt-2">
      <h3>Ən aktiv vətəndaşlar</h3>
      <div id="top-citizens"><p class="muted">Yüklənir...</p></div>
    </div>
  `;

  const rangeSel = root.querySelector('#range');
  rangeSel.addEventListener('change', () => load(Number(rangeSel.value)));

  await load(Number(rangeSel.value));
}

async function load(days) {
  disposeCharts();
  const statsEl = document.querySelector('#stats');
  const topEl   = document.querySelector('#top-citizens');
  statsEl.innerHTML = `<p class="muted">Yüklənir...</p>`;
  topEl.innerHTML   = `<p class="muted">Yüklənir...</p>`;

  let analytics;
  try {
    const res = await api.analytics(days);
    analytics = res.analytics;
  } catch (err) {
    statsEl.innerHTML = `<p class="error-text">${err.message}</p>`;
    topEl.innerHTML = '';
    return;
  }

  statsEl.innerHTML = renderTopStats(analytics);
  topEl.innerHTML   = renderTopCitizens(analytics.topCitizens);

  const { Chart } = await import('chart.js/auto');
  drawStatusChart(Chart, analytics.statusCounts);
  drawTimelineChart(Chart, analytics.timeline);
}

function renderTopStats(a) {
  const r = a.reward || {};
  const items = [
    ['Cəmi müraciət',         a.total ?? 0,                  '#38bdf8'],
    ['Qəbul oranı',           (a.acceptanceRate ?? 0) + '%', '#38bdf8'],
    ['Tamamlanma oranı',      (a.completionRate ?? 0) + '%', '#34d399'],
    ['Mükafatlanmış müraciət', r.rewarded_count || 0,        '#fbbf24'],
    ['Ümumi mükafat',         formatAzn(r.total_reward),     '#fbbf24'],
    ['Orta mükafat',          formatAzn(r.avg_reward),       '#94a3b8'],
  ];
  return items.map(([label, value, color]) => `
    <div class="stat">
      <div class="label">${label}</div>
      <div class="value" style="color:${color};">${value}</div>
    </div>
  `).join('');
}

function renderTopCitizens(rows) {
  if (!rows || !rows.length) {
    return `<p class="muted">Hələ heç bir vətəndaş yoxdur.</p>`;
  }
  return `
    <div class="table-wrap">
      <table class="report-table">
        <thead>
          <tr>
            <th>Vətəndaş</th>
            <th>Müraciət sayı</th>
            <th>Tamamlanan</th>
            <th>Ümumi mükafat</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><strong>${escapeHtml(r.fullname)}</strong><br><span class="muted" style="font-size:0.8rem;">${escapeHtml(r.email)}</span></td>
              <td>${r.reports_count}</td>
              <td>${r.completed_count}</td>
              <td>${formatAzn(r.total_reward)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function drawStatusChart(Chart, counts) {
  const canvas = document.querySelector('#status-chart');
  if (!canvas) return;

  const labels = ['pending', 'accepted', 'completed', 'rejected'];
  const data   = labels.map((k) => counts[k] || 0);
  const colors = labels.map((k) => STATUS_COLORS[k]);
  const tickColor = getCssVar('--muted');
  const gridColor = getCssVar('--border');

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels.map((k) => STATUS_LABELS[k]),
      datasets: [{ data, backgroundColor: colors, borderColor: getCssVar('--surface'), borderWidth: 2 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: tickColor, padding: 12 } },
      },
      cutout: '62%',
    },
  });
  chartInstances.push(chart);
  void gridColor;
}

function drawTimelineChart(Chart, timeline) {
  const canvas = document.querySelector('#timeline-chart');
  if (!canvas) return;

  const labels = timeline.map((t) => t.day.slice(5));
  const tickColor = getCssVar('--muted');
  const gridColor = getCssVar('--border');

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Yeni müraciət',
          data: timeline.map((t) => t.total),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Tamamlandı',
          data: timeline.map((t) => t.completed),
          borderColor: '#34d399',
          backgroundColor: 'rgba(52,211,153,0.08)',
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Rədd',
          data: timeline.map((t) => t.rejected),
          borderColor: '#f87171',
          backgroundColor: 'rgba(248,113,113,0.08)',
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: tickColor, boxWidth: 12 } },
      },
      scales: {
        x: { ticks: { color: tickColor, maxTicksLimit: 12 }, grid: { color: gridColor, drawTicks: false } },
        y: { ticks: { color: tickColor, precision: 0 }, grid: { color: gridColor, drawTicks: false }, beginAtZero: true },
      },
    },
  });
  chartInstances.push(chart);
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

function formatAzn(v) {
  const n = Number(v) || 0;
  return n.toLocaleString('az-AZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' AZN';
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
