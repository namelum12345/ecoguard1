import { api } from '../api.js';
import { setSession, getUser, clearSession } from '../auth.js';
import { toast } from '../toast.js';

export async function renderProfile(root, { navigate }) {
  root.innerHTML = `
    <div class="topbar"><h1>Admin Profili</h1></div>
    <div id="profile-root"><p class="muted">Yüklənir...</p></div>
  `;
  const host = root.querySelector('#profile-root');

  let user;
  try {
    const res = await api.me();
    user = res.user;
    const token = localStorage.getItem('aq-admin-token');
    if (token) setSession(user, token);
  } catch (err) {
    host.innerHTML = `<p class="error-text">${err.message}</p>`;
    return;
  }

  let stats = { pending: 0, accepted: 0, rejected: 0, completed: 0, total: 0 };
  try {
    const s = await api.stats();
    stats = s.stats;
  } catch { /* non-blocking */ }

  paint(user, stats);

  function paint(u, st) {
    const created = u.created_at
      ? new Date(u.created_at.replace(' ', 'T') + 'Z').toLocaleString('az-AZ')
      : '—';

    host.innerHTML = `
      <div class="profile-grid">
        <div class="card profile-summary">
          <div class="avatar">${initials(u.fullname)}</div>
          <div>
            <h3 style="margin:0;">${escapeHtml(u.fullname)}</h3>
            <p class="muted" style="margin:0.25rem 0 0;">${escapeHtml(u.email)}</p>
            <p class="muted" style="margin:0.5rem 0 0;">
              <span class="status-badge status-accepted" style="text-transform:uppercase;">${escapeHtml(u.role)}</span>
            </p>
          </div>
        </div>

        <div class="card">
          <h3>Hesab məlumatları</h3>
          <div class="meta-row"><span class="label">İstifadəçi ID</span><span>#${u.id}</span></div>
          <div class="meta-row"><span class="label">Qoşulma</span><span>${created}</span></div>
          <div class="meta-row"><span class="label">Telefon</span><span>${u.phone ? escapeHtml(u.phone) : '<span class="muted">—</span>'}</span></div>
        </div>

        <div class="card">
          <h3>Sistem statistikası</h3>
          <div class="meta-row"><span class="label">Cəmi müraciət</span><span>${st.total}</span></div>
          <div class="meta-row"><span class="label">Gözləmədə</span><span style="color:#fbbf24;">${st.pending}</span></div>
          <div class="meta-row"><span class="label">Qəbul edilmiş</span><span style="color:#38bdf8;">${st.accepted}</span></div>
          <div class="meta-row"><span class="label">Tamamlanmış</span><span style="color:#34d399;">${st.completed}</span></div>
          <div class="meta-row"><span class="label">Rədd edilmiş</span><span style="color:#f87171;">${st.rejected}</span></div>
        </div>

        <div class="card">
          <h3>Profili redaktə et</h3>
          <form id="info-form" class="form-stack">
            <div>
              <label for="fullname">Ad, Soyad</label>
              <input id="fullname" type="text" required value="${escapeAttr(u.fullname)}" />
            </div>
            <div>
              <label>E-poçt</label>
              <input type="email" value="${escapeAttr(u.email)}" readonly />
              <p class="hint muted">E-poçt ünvanı dəyişdirilə bilməz.</p>
            </div>
            <div>
              <label for="phone">Telefon</label>
              <input id="phone" type="tel" value="${escapeAttr(u.phone || '')}" placeholder="+994 50 000 00 00" />
            </div>
            <button type="submit" class="btn" id="info-save">Yadda saxla</button>
            <p class="error-text" id="info-error" hidden></p>
          </form>
        </div>

        <div class="card">
          <h3>Şifrəni dəyiş</h3>
          <form id="pw-form" class="form-stack">
            <div>
              <label for="current-pw">Mövcud şifrə</label>
              <input id="current-pw" type="password" autocomplete="current-password" required />
            </div>
            <div>
              <label for="new-pw">Yeni şifrə</label>
              <input id="new-pw" type="password" autocomplete="new-password" minlength="6" required />
            </div>
            <div>
              <label for="new-pw2">Yeni şifrə (təkrar)</label>
              <input id="new-pw2" type="password" autocomplete="new-password" minlength="6" required />
            </div>
            <button type="submit" class="btn btn-secondary" id="pw-save">Şifrəni yenilə</button>
            <p class="error-text" id="pw-error" hidden></p>
          </form>
        </div>

        <div class="card danger-zone">
          <h3>Sessiya</h3>
          <p class="muted" style="margin-top:0;">Cihazdan çıxış edin və hesabınızı qoruyun.</p>
          <button type="button" class="btn btn-danger" id="logout-btn-profile">Çıxış et</button>
        </div>
      </div>
    `;

    bind();
  }

  function bind() {
    host.querySelector('#info-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = host.querySelector('#info-error');
      const btn   = host.querySelector('#info-save');
      errEl.hidden = true;
      btn.disabled = true;
      btn.textContent = 'Yenilənir...';
      try {
        const { user: updated } = await api.updateMe({
          fullname: host.querySelector('#fullname').value.trim(),
          phone:    host.querySelector('#phone').value.trim() || null,
        });
        const token = localStorage.getItem('aq-admin-token');
        if (token) setSession(updated, token);
        toast('Profil yeniləndi', 'success');
        paint(updated, await api.stats().then(r => r.stats).catch(() => ({ pending:0, accepted:0, rejected:0, completed:0, total:0 })));
      } catch (err) {
        errEl.textContent = err.message;
        errEl.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Yadda saxla';
      }
    });

    host.querySelector('#pw-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = host.querySelector('#pw-error');
      const btn   = host.querySelector('#pw-save');
      errEl.hidden = true;
      const current = host.querySelector('#current-pw').value;
      const next    = host.querySelector('#new-pw').value;
      const next2   = host.querySelector('#new-pw2').value;
      if (next.length < 6) { errEl.textContent = 'Yeni şifrə ən az 6 simvol olmalıdır'; errEl.hidden = false; return; }
      if (next !== next2)  { errEl.textContent = 'Yeni şifrələr uyğun gəlmir'; errEl.hidden = false; return; }

      btn.disabled = true;
      btn.textContent = 'Yenilənir...';
      try {
        await api.changePassword({ current_password: current, new_password: next });
        host.querySelector('#pw-form').reset();
        toast('Şifrə yeniləndi', 'success');
      } catch (err) {
        errEl.textContent = err.message;
        errEl.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Şifrəni yenilə';
      }
    });

    host.querySelector('#logout-btn-profile').addEventListener('click', () => {
      clearSession();
      navigate('/login');
    });
  }
}

function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2)
    .map((s) => s[0].toUpperCase()).join('') || '?';
}

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
