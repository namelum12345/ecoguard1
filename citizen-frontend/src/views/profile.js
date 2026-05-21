import { api } from '../api.js';
import { updateUser } from '../auth.js';
import { toast } from '../toast.js';

export async function renderProfile(root) {
  root.innerHTML = `
    <div class="page-head">
      <h2>Profilim</h2>
    </div>
    <div id="profile-root"><p class="muted">Yüklənir...</p></div>
  `;
  const host = root.querySelector('#profile-root');

  let user;
  try {
    const res = await api.me();
    user = res.user;
    updateUser(user);
  } catch (err) {
    host.innerHTML = `<p class="error-text">${err.message}</p>`;
    return;
  }

  paint(user);

  function paint(u) {
    const created = u.created_at
      ? new Date(u.created_at.replace(' ', 'T') + 'Z').toLocaleString('az-AZ')
      : '—';

    host.innerHTML = `
      <div class="profile-grid">
        <div class="card">
          <h3>Şəxsi məlumatlar</h3>
          <form id="info-form" class="form-stack">
            <div>
              <label for="fullname">Ad, Soyad</label>
              <input id="fullname" type="text" value="${escapeAttr(u.fullname)}" required />
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
            <div>
              <label for="address">Yaşadığınız ünvan</label>
              <textarea id="address" rows="3" placeholder="Şəhər, rayon, küçə, mənzil">${escapeHtml(u.address || '')}</textarea>
            </div>
            <button type="submit" class="btn" id="info-save">Yadda saxla</button>
            <p class="error-text" id="info-error" hidden></p>
          </form>
        </div>

        <div class="card">
          <h3>Hesab Məlumatları</h3>
          <div class="meta-row"><span class="label">Rol</span><span>${escapeHtml(u.role)}</span></div>
          <div class="meta-row"><span class="label">Qoşulma</span><span>${created}</span></div>
          <div class="meta-row"><span class="label">İstifadəçi ID</span><span>#${u.id}</span></div>
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
              <input id="new-pw" type="password" minlength="6" autocomplete="new-password" required />
            </div>
            <div>
              <label for="new-pw2">Yeni şifrə (təkrar)</label>
              <input id="new-pw2" type="password" minlength="6" autocomplete="new-password" required />
            </div>
            <button type="submit" class="btn btn-secondary" id="pw-save">Şifrəni yenilə</button>
            <p class="error-text" id="pw-error" hidden></p>
          </form>
        </div>
      </div>
    `;

    bind();
  }

  function bind() {
    const infoForm = host.querySelector('#info-form');
    const infoError = host.querySelector('#info-error');
    const infoBtn = host.querySelector('#info-save');

    infoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      infoError.hidden = true;
      infoBtn.disabled = true;
      infoBtn.textContent = 'Yenilənir...';
      try {
        const { user: updated } = await api.updateMe({
          fullname: host.querySelector('#fullname').value.trim(),
          phone:    host.querySelector('#phone').value.trim() || null,
          address:  host.querySelector('#address').value.trim() || null,
        });
        updateUser(updated);
        user = updated;
        toast('Profil yeniləndi', 'success');
        paint(updated);
      } catch (err) {
        infoError.textContent = err.message;
        infoError.hidden = false;
      } finally {
        infoBtn.disabled = false;
        infoBtn.textContent = 'Yadda saxla';
      }
    });

    const pwForm = host.querySelector('#pw-form');
    const pwError = host.querySelector('#pw-error');
    const pwBtn = host.querySelector('#pw-save');

    pwForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      pwError.hidden = true;
      const current = host.querySelector('#current-pw').value;
      const next    = host.querySelector('#new-pw').value;
      const next2   = host.querySelector('#new-pw2').value;
      if (next.length < 6)  { pwError.textContent = 'Yeni şifrə ən az 6 simvol olmalıdır'; pwError.hidden = false; return; }
      if (next !== next2)   { pwError.textContent = 'Yeni şifrələr uyğun gəlmir'; pwError.hidden = false; return; }

      pwBtn.disabled = true;
      pwBtn.textContent = 'Yenilənir...';
      try {
        await api.changePassword({ current_password: current, new_password: next });
        pwForm.reset();
        toast('Şifrə yeniləndi', 'success');
      } catch (err) {
        pwError.textContent = err.message;
        pwError.hidden = false;
      } finally {
        pwBtn.disabled = false;
        pwBtn.textContent = 'Şifrəni yenilə';
      }
    });
  }
}

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
