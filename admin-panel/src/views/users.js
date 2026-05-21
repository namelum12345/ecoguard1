import { api } from '../api.js';
import { getUser } from '../auth.js';
import { toast } from '../toast.js';
import { openModal, closeModal, confirmModal } from '../modal.js';

const ROLE_LABELS = { citizen: 'Vətəndaş', admin: 'Administrator' };

let filter = { role: '', q: '' };

export async function renderUsers(root) {
  root.innerHTML = `
    <div class="topbar">
      <h1>İstifadəçilər</h1>
      <div class="toolbar">
        <input id="search" type="search" placeholder="Ad və ya e-poçt..." style="min-width:220px;" value="${escapeAttr(filter.q)}" />
        <select id="role-filter" style="width:auto;min-width:160px;">
          <option value="">Bütün rollar</option>
          <option value="citizen">Vətəndaş</option>
          <option value="admin">Administrator</option>
        </select>
        <button type="button" class="btn" id="new-user-btn">+ Yeni istifadəçi</button>
      </div>
    </div>

    <div id="summary" class="stat-grid"></div>

    <div id="users-list" class="card mt-2"><p class="muted">Yüklənir...</p></div>
  `;

  const searchEl = root.querySelector('#search');
  const roleEl   = root.querySelector('#role-filter');
  roleEl.value = filter.role;

  let debounce;
  searchEl.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      filter.q = searchEl.value.trim();
      load();
    }, 250);
  });
  roleEl.addEventListener('change', () => {
    filter.role = roleEl.value;
    load();
  });

  root.querySelector('#new-user-btn').addEventListener('click', () => openUserModal(null, load));

  await Promise.all([loadSummary(), load()]);
}

async function loadSummary() {
  const el = document.getElementById('summary');
  if (!el) return;
  try {
    const { summary } = await api.usersSummary();
    el.innerHTML = `
      <div class="stat"><div class="label">Cəmi istifadəçi</div><div class="value" style="color:#38bdf8;">${summary.total}</div></div>
      <div class="stat"><div class="label">Vətəndaşlar</div><div class="value" style="color:#34d399;">${summary.citizens}</div></div>
      <div class="stat"><div class="label">Administratorlar</div><div class="value" style="color:#fbbf24;">${summary.admins}</div></div>
    `;
  } catch (err) {
    el.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

async function load() {
  const host = document.getElementById('users-list');
  if (!host) return;
  host.innerHTML = `<p class="muted">Yüklənir...</p>`;

  try {
    const { users } = await api.listUsers(filter);
    if (!users.length) {
      host.innerHTML = `<div class="empty-state">Heç bir istifadəçi tapılmadı.</div>`;
      return;
    }
    const me = getUser();
    host.innerHTML = `
      <div class="table-wrap">
        <table class="report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ad, Soyad</th>
              <th>E-poçt</th>
              <th>Rol</th>
              <th>Telefon</th>
              <th>Müraciət</th>
              <th>Qoşulma</th>
              <th style="text-align:right;">Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((u) => renderRow(u, me)).join('')}
          </tbody>
        </table>
      </div>
    `;
    host.querySelectorAll('[data-action="edit"]').forEach((b) => {
      b.addEventListener('click', async () => {
        const id = Number(b.dataset.id);
        try {
          const { user } = await api.getUser(id);
          openUserModal(user, load);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
    host.querySelectorAll('[data-action="delete"]').forEach((b) => {
      b.addEventListener('click', async () => {
        const id = Number(b.dataset.id);
        const name = b.dataset.name;
        const ok = await confirmModal(
          `<strong>${escapeHtml(name)}</strong> istifadəçisini silmək istədiyinizə əminsiniz?<br><span class="muted" style="font-size:0.85rem;">Bütün müraciətləri də silinəcək.</span>`,
          { confirmLabel: 'Sil' }
        );
        if (!ok) return;
        try {
          await api.deleteUser(id);
          toast('İstifadəçi silindi', 'success');
          await Promise.all([loadSummary(), load()]);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    host.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

function renderRow(u, me) {
  const isSelf = me && me.id === u.id;
  return `
    <tr>
      <td>#${u.id}${isSelf ? ' <span class="muted" style="font-size:0.75rem;">(siz)</span>' : ''}</td>
      <td><strong>${escapeHtml(u.fullname)}</strong>${u.address ? `<br><span class="muted" style="font-size:0.78rem;">${escapeHtml(truncate(u.address, 40))}</span>` : ''}</td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="status-badge ${u.role === 'admin' ? 'status-pending' : 'status-accepted'}">${ROLE_LABELS[u.role] || u.role}</span></td>
      <td>${u.phone ? escapeHtml(u.phone) : '<span class="muted">—</span>'}</td>
      <td>${u.reports_count ?? 0}</td>
      <td>${formatDate(u.created_at)}</td>
      <td style="text-align:right;">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${u.id}">Redaktə</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${u.id}" data-name="${escapeAttr(u.fullname)}" ${isSelf ? 'disabled title="Öz hesabınızı silə bilməzsiniz"' : ''}>Sil</button>
      </td>
    </tr>
  `;
}

function openUserModal(user, onSaved) {
  const isEdit = !!user;
  const me = getUser();
  const isSelf = isEdit && me && me.id === user.id;

  const node = document.createElement('form');
  node.id = 'user-form';
  node.className = 'form-stack';
  node.innerHTML = `
    <div class="form-row">
      <div>
        <label for="fullname">Ad, Soyad <span class="req">*</span></label>
        <input id="fullname" type="text" required value="${isEdit ? escapeAttr(user.fullname) : ''}" />
      </div>
      <div>
        <label for="email">E-poçt <span class="req">*</span></label>
        <input id="email" type="email" required ${isEdit ? 'readonly' : ''} value="${isEdit ? escapeAttr(user.email) : ''}" />
        ${isEdit ? '<p class="hint muted">E-poçt dəyişdirilə bilməz.</p>' : ''}
      </div>
    </div>
    <div class="form-row">
      <div>
        <label for="role">Rol</label>
        <select id="role" ${isSelf ? 'disabled' : ''}>
          <option value="citizen" ${isEdit && user.role === 'citizen' ? 'selected' : ''}>Vətəndaş</option>
          <option value="admin"   ${isEdit && user.role === 'admin'   ? 'selected' : ''}>Administrator</option>
        </select>
        ${isSelf ? '<p class="hint muted">Öz rolunuzu dəyişə bilməzsiniz.</p>' : ''}
      </div>
      <div>
        <label for="phone">Telefon</label>
        <input id="phone" type="tel" value="${isEdit ? escapeAttr(user.phone || '') : ''}" placeholder="+994 50 000 00 00" />
      </div>
    </div>
    <div>
      <label for="address">Ünvan</label>
      <textarea id="address" rows="2" placeholder="Şəhər, rayon, küçə">${isEdit ? escapeHtml(user.address || '') : ''}</textarea>
    </div>
    <div>
      <label for="password">${isEdit ? 'Yeni şifrə' : 'Şifrə'} ${isEdit ? '' : '<span class="req">*</span>'}</label>
      <input id="password" type="password" autocomplete="new-password" ${isEdit ? '' : 'required'} placeholder="${isEdit ? 'Dəyişdirmək istəmirsinizsə boş saxlayın' : 'Min 6 simvol'}" />
    </div>
    <p class="error-text" id="form-error" hidden></p>
  `;

  const footer = document.createElement('div');
  footer.style.cssText = 'display:flex;gap:0.5rem;justify-content:flex-end;';
  footer.innerHTML = `
    <button type="button" class="btn btn-secondary" id="cancel-btn">Ləğv et</button>
    <button type="submit" class="btn" id="save-btn" form="user-form">${isEdit ? 'Yadda saxla' : 'İstifadəçi yarat'}</button>
  `;

  openModal({
    title: isEdit ? `İstifadəçini redaktə et — #${user.id}` : 'Yeni istifadəçi',
    body: node,
    footer,
  });

  document.getElementById('cancel-btn').addEventListener('click', closeModal);

  const errorEl = node.querySelector('#form-error');
  const saveBtn = footer.querySelector('#save-btn');

  node.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    saveBtn.disabled = true;
    saveBtn.textContent = isEdit ? 'Yenilənir...' : 'Yaradılır...';

    const payload = {
      fullname: node.fullname.value.trim(),
      phone:    node.phone.value.trim() || null,
      address:  node.address.value.trim() || null,
      role:     node.role.value,
    };

    const pw = node.password.value;
    if (!isEdit) {
      payload.email = node.email.value.trim();
      payload.password = pw;
    } else if (pw) {
      payload.password = pw;
    }

    try {
      if (isEdit) await api.updateUser(user.id, payload);
      else        await api.createUser(payload);
      toast(isEdit ? 'İstifadəçi yeniləndi' : 'İstifadəçi yaradıldı', 'success');
      closeModal();
      if (onSaved) onSaved();
      await loadSummary();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? 'Yadda saxla' : 'İstifadəçi yarat';
    }
  });
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function formatDate(s) {
  if (!s) return '';
  try { return new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString('az-AZ'); }
  catch { return s; }
}
function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
