import { api } from '../api.js';
import { toast } from '../toast.js';

const STATUS_LABELS = {
  pending: 'Gözləmədə', accepted: 'Qəbul edildi', rejected: 'Rədd edildi', completed: 'Tamamlandı',
};

export async function renderReportDetails(root, { params }) {
  root.innerHTML = `
    <div class="topbar">
      <h1>Müraciət Detalı</h1>
      <a href="#/reports" class="btn btn-secondary">Geri</a>
    </div>
    <div id="body"><p class="muted">Yüklənir...</p></div>
  `;
  const body = root.querySelector('#body');

  let current = null;
  try {
    const res = await api.getReport(params.id);
    current = res.report;
  } catch (err) {
    body.innerHTML = `<p class="error-text">${err.message}</p>`;
    return;
  }

  function paint(report) {
    body.innerHTML = `
      <div class="detail-grid">
        <div>
          <div class="card">
            <div class="flex between center" style="margin-bottom:0.5rem;">
              <h3 style="margin:0;">${escapeHtml(report.title)}</h3>
              <span class="status-badge status-${report.status}">${STATUS_LABELS[report.status] || report.status}</span>
            </div>
            <p style="white-space:pre-wrap;">${escapeHtml(report.description)}</p>
            ${report.image ? `<img class="detail-image mt-2" src="${api.asset(report.image)}" alt="" />` : ''}
          </div>

          <div class="card mt-2">
            <h3>Admin Hərəkətləri</h3>
            <form id="action-form" class="form-stack">
              <div class="form-row">
                <div>
                  <label for="status">Status</label>
                  <select id="status" name="status">
                    <option value="pending"${report.status==='pending'?' selected':''}>Gözləmədə</option>
                    <option value="accepted"${report.status==='accepted'?' selected':''}>Qəbul edildi</option>
                    <option value="completed"${report.status==='completed'?' selected':''}>Tamamlandı</option>
                    <option value="rejected"${report.status==='rejected'?' selected':''}>Rədd edildi</option>
                  </select>
                </div>
                <div>
                  <label for="reward">Mükafat (AZN)</label>
                  <input id="reward" name="reward_amount" type="number" min="0" step="0.01" value="${report.reward_amount || 0}" />
                </div>
                <div>
                  <label for="points">Xal (İstifadəçiyə)</label>
                  <input id="points" name="points" type="number" min="0" max="5" step="1" value="${report.points || 0}" />
                </div>
              </div>
              <div>
                <label for="response">Vətəndaşa cavab</label>
                <textarea id="response" name="admin_response" placeholder="Vətəndaşa göndəriləcək cavab">${escapeHtml(report.admin_response || '')}</textarea>
              </div>
              <div class="toolbar">
                <button type="submit" class="btn">Yenilə</button>
                <button type="button" class="btn btn-success" data-quick="accepted">Qəbul et</button>
                <button type="button" class="btn btn-success" data-quick="completed">Tamamla</button>
                <button type="button" class="btn btn-danger"  data-quick="rejected">Rədd et</button>
              </div>
              <p class="error-text" id="action-error" hidden></p>
            </form>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="meta-row"><span class="label">Vətəndaş</span><span>${escapeHtml(report.citizen_name)}</span></div>
            <div class="meta-row"><span class="label">E-poçt</span><span>${escapeHtml(report.citizen_email)}</span></div>
            <div class="meta-row"><span class="label">Telefon</span><span>${report.citizen_phone ? escapeHtml(report.citizen_phone) : '<span class="muted">—</span>'}</span></div>
            <div class="meta-row"><span class="label">Ünvan</span><span>${report.citizen_address ? escapeHtml(report.citizen_address) : '<span class="muted">—</span>'}</span></div>
            <div class="meta-row"><span class="label">Tarix</span><span>${formatDate(report.created_at)}</span></div>
            <div class="meta-row"><span class="label">Mükafat</span><span>${report.reward_amount ? `${report.reward_amount} AZN` : '—'}</span></div>
            <div class="meta-row"><span class="label">Verilmiş Xal</span><span>${report.points ? `${report.points} xal` : '—'}</span></div>
            ${report.latitude && report.longitude ? `
              <div class="meta-row"><span class="label">GPS</span><span>${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}</span></div>
              <div id="report-map" class="map-block mt-2"></div>
            ` : `<div class="meta-row"><span class="label">Konum</span><span class="muted">Konum verilməyib</span></div>`}
          </div>
        </div>
      </div>
    `;

    if (report.latitude && report.longitude) {
      import('leaflet').then(({ default: L }) => {
        const mapEl = root.querySelector('#report-map');
        const map = L.map(mapEl).setView([report.latitude, report.longitude], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap', maxZoom: 19,
        }).addTo(map);
        L.marker([report.latitude, report.longitude]).addTo(map);
        setTimeout(() => map.invalidateSize(), 80);
      });
    }

    bindActions();
  }

  function bindActions() {
    const form = body.querySelector('#action-form');
    const errorEl = body.querySelector('#action-error');

    async function apply(patch) {
      errorEl.hidden = true;
      try {
        const { report } = await api.updateReport(params.id, patch);
        current = report;
        toast('Müraciət yeniləndi', 'success');
        paint(report);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
        toast(err.message, 'error');
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = form.status.value;
      const reward = Number(form.reward_amount.value || 0);
      const pts = Number(form.points.value || 0);
      const response = form.admin_response.value;
      apply({
        status,
        reward_amount: Number.isNaN(reward) ? 0 : reward,
        points: Number.isNaN(pts) ? 0 : Math.min(5, Math.max(0, Math.round(pts))),
        admin_response: response,
      });
    });

    form.querySelectorAll('[data-quick]').forEach((btn) => {
      btn.addEventListener('click', () => apply({ status: btn.dataset.quick }));
    });
  }

  paint(current);
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
