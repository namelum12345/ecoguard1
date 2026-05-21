import { api } from '../api.js';
import { toast } from '../toast.js';

const STATUS_LABELS = {
  pending:   'Gözləmədə',
  accepted:  'Qəbul edildi',
  rejected:  'Rədd edildi',
  completed: 'Tamamlandı',
};

export async function renderReportDetails(root, { params }) {
  root.innerHTML = `
    <div class="page-head">
      <h2>Müraciət Detalı</h2>
      <a href="#/reports" class="btn btn-secondary">Geri</a>
    </div>
    <div id="report-body"><p class="muted">Yüklənir...</p></div>
  `;
  const body = root.querySelector('#report-body');

  try {
    const { report } = await api.getReport(params.id);
    renderReport(body, report);
  } catch (err) {
    body.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

function renderReport(body, report) {
  body.innerHTML = `
    <div class="detail-grid">
      <div class="card">
        <div class="flex between center" style="margin-bottom:0.5rem;">
          <h3 style="margin:0;">${escapeHtml(report.title)}</h3>
          <span class="status-badge status-${report.status}">${STATUS_LABELS[report.status] || report.status}</span>
        </div>
        <p style="white-space:pre-wrap;">${escapeHtml(report.description)}</p>
        ${report.image ? `<img class="detail-image mt-2" src="${api.asset(report.image)}" alt="" />` : ''}
      </div>

      <div class="card">
        <div class="meta-row"><span class="label">Tarix</span><span>${formatDate(report.created_at)}</span></div>
        <div class="meta-row"><span class="label">Status</span><span>${STATUS_LABELS[report.status] || report.status}</span></div>
        <div class="meta-row"><span class="label">Mükafat</span><span>${report.reward_amount ? `${report.reward_amount} AZN` : '—'}</span></div>
        ${report.latitude && report.longitude ? `
          <div class="meta-row"><span class="label">Konum</span><span>${Number(report.latitude).toFixed(5)}, ${Number(report.longitude).toFixed(5)}</span></div>
          <div id="detail-map" class="map-block mt-2"></div>
        ` : ''}
      </div>
    </div>

    <div class="card mt-2">
      <h4 style="margin-top:0;">Admin cavabı</h4>
      ${report.admin_response
        ? `<p style="white-space:pre-wrap;">${escapeHtml(report.admin_response)}</p>`
        : `<p class="muted">Hələ admin cavabı yoxdur.</p>`}
    </div>

    ${report.status === 'completed' ? renderRatingCard(report) : ''}
  `;

  if (report.latitude && report.longitude) {
    import('leaflet').then(({ default: L }) => {
      const mapEl = body.querySelector('#detail-map');
      if (!mapEl) return;
      const map = L.map(mapEl).setView([report.latitude, report.longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 19,
      }).addTo(map);
      L.marker([report.latitude, report.longitude]).addTo(map);
      setTimeout(() => map.invalidateSize(), 80);
    });
  }

  if (report.status === 'completed') {
    bindRatingCard(body, report);
  }
}

// ── Rating card HTML ─────────────────────────────────────────────────────────

function renderRatingCard(report) {
  if (report.rating) {
    return `
      <div class="card mt-2 rating-card rated">
        <div class="rating-header">
          <span class="rating-icon">⭐</span>
          <span class="rating-title">Qiymətləndirməniz</span>
        </div>
        <div class="stars-display">
          ${starsHtml(report.rating)}
        </div>
        <p class="rating-label">${ratingLabel(report.rating)}</p>
      </div>
    `;
  }

  return `
    <div class="card mt-2 rating-card">
      <div class="rating-header">
        <span class="rating-icon">⭐</span>
        <span class="rating-title">Xidməti qiymətləndirin</span>
      </div>
      <p class="muted" style="margin:0 0 0.75rem;">Müraciətinizin həlli sizi nə dərəcədə razı saldı?</p>
      <div class="stars-picker" id="stars-picker">
        ${[1,2,3,4,5].map(n => `
          <button class="star-btn" data-star="${n}" type="button" aria-label="${n} ulduz">★</button>
        `).join('')}
      </div>
      <p class="rating-label" id="rating-label">&nbsp;</p>
      <p class="error-text" id="rating-error" hidden></p>
    </div>
  `;
}

function starsHtml(rating) {
  return [1,2,3,4,5].map(n =>
    `<span class="star-static ${n <= rating ? 'filled' : ''}">★</span>`
  ).join('');
}

function ratingLabel(r) {
  return ['', 'Çox zəif', 'Zəif', 'Orta', 'Yaxşı', 'Əla!'][r] ?? '';
}

// ── Rating interactivity ─────────────────────────────────────────────────────

function bindRatingCard(root, report) {
  if (report.rating) return; // already rated

  const picker = root.querySelector('#stars-picker');
  const labelEl = root.querySelector('#rating-label');
  const errorEl = root.querySelector('#rating-error');
  if (!picker) return;

  const btns = picker.querySelectorAll('.star-btn');
  let selected = 0;

  function highlight(n) {
    btns.forEach((b) => {
      const s = Number(b.dataset.star);
      b.classList.toggle('active', s <= n);
    });
    labelEl.textContent = n ? ratingLabel(n) : ' ';
  }

  btns.forEach((btn) => {
    btn.addEventListener('mouseenter', () => !selected && highlight(Number(btn.dataset.star)));
    btn.addEventListener('mouseleave', () => !selected && highlight(0));
    btn.addEventListener('click', async () => {
      const star = Number(btn.dataset.star);
      if (selected) return;
      selected = star;
      highlight(star);
      btns.forEach((b) => (b.disabled = true));
      errorEl.hidden = true;
      try {
        const { report: updated } = await api.rateReport(report.id, star);
        toast('Qiymətləndirməniz qeydə alındı', 'success');
        // Re-render the rating card as static display
        const card = root.querySelector('.rating-card');
        if (card) {
          card.classList.add('rated');
          card.innerHTML = `
            <div class="rating-header">
              <span class="rating-icon">⭐</span>
              <span class="rating-title">Qiymətləndirməniz</span>
            </div>
            <div class="stars-display">${starsHtml(updated.rating)}</div>
            <p class="rating-label">${ratingLabel(updated.rating)}</p>
          `;
        }
      } catch (err) {
        selected = 0;
        btns.forEach((b) => (b.disabled = false));
        highlight(0);
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
