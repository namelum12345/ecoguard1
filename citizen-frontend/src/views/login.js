import { api } from '../api.js';
import { setSession } from '../auth.js';
import { toast } from '../toast.js';
import { themeButtonMarkup } from '../theme.js';

export function renderLogin(root, { navigate }) {
  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-theme-corner">${themeButtonMarkup()}</div>
      <form class="auth-card" id="login-form" novalidate>
        <div class="brand">
          <img src="/logo.png" alt="EcoGuard" />
          <h1>Vətəndaş Girişi</h1>
          <p class="subtitle">Hesabınıza daxil olun və müraciətlərinizi izləyin.</p>
        </div>

        <div class="form-stack">
          <div>
            <label for="email">E-poçt</label>
            <input id="email" name="email" type="email" autocomplete="email" required />
          </div>
          <div>
            <label for="password">Şifrə</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button type="submit" class="btn btn-block" id="submit-btn">Daxil ol</button>
          <p class="error-text" id="form-error" hidden></p>
        </div>

        <p class="alt">Hesabınız yoxdur? <a href="#/register">Qeydiyyatdan keçin</a></p>
      </form>
    </div>
  `;

  const form = root.querySelector('#login-form');
  const btn = root.querySelector('#submit-btn');
  const errorEl = root.querySelector('#form-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Yoxlanılır...';
    try {
      const email = form.email.value.trim();
      const password = form.password.value;
      const { user, token } = await api.login({ email, password });
      setSession(user, token);
      toast('Xoş gəlmisiniz!', 'success');
      navigate('/reports');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Daxil ol';
    }
  });
}
