import { api } from '../api.js';
import { setSession } from '../auth.js';
import { toast } from '../toast.js';
import { themeButtonMarkup } from '../theme.js';

export function renderRegister(root, { navigate }) {
  const state = {
    step: 1,
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    agree: false,
  };

  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-theme-corner">${themeButtonMarkup()}</div>
      <form class="auth-card auth-card-wide" id="register-form" novalidate>
        <div class="brand">
          <img src="/logo.png" alt="EcoGuard" />
          <h1>Qeydiyyat</h1>
          <p class="subtitle">Hesab yaradın və problemləri bildirin.</p>
        </div>

        <div class="wizard-progress">
          <div class="wizard-step active" data-step="1">
            <span class="dot">1</span>
            <span>Hesab</span>
          </div>
          <div class="wizard-line"></div>
          <div class="wizard-step" data-step="2">
            <span class="dot">2</span>
            <span>Əlaqə</span>
          </div>
          <div class="wizard-line"></div>
          <div class="wizard-step" data-step="3">
            <span class="dot">3</span>
            <span>Təsdiq</span>
          </div>
        </div>

        <div id="wizard-body" class="form-stack"></div>

        <p class="error-text" id="form-error" hidden></p>

        <div class="wizard-actions">
          <button type="button" class="btn btn-secondary" id="back-btn" hidden>Geri</button>
          <button type="button" class="btn" id="next-btn">Davam et</button>
          <button type="submit"  class="btn" id="submit-btn" hidden>Qeydiyyatı tamamla</button>
        </div>

        <p class="alt">Artıq hesabınız var? <a href="#/login">Daxil olun</a></p>
      </form>
    </div>
  `;

  const body = root.querySelector('#wizard-body');
  const backBtn = root.querySelector('#back-btn');
  const nextBtn = root.querySelector('#next-btn');
  const submitBtn = root.querySelector('#submit-btn');
  const errorEl = root.querySelector('#form-error');
  const form = root.querySelector('#register-form');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function hideError() {
    errorEl.hidden = true;
  }

  function renderStep() {
    hideError();
    root.querySelectorAll('.wizard-step').forEach((el) => {
      const s = Number(el.dataset.step);
      el.classList.toggle('active',    s === state.step);
      el.classList.toggle('completed', s <  state.step);
    });

    if (state.step === 1) {
      body.innerHTML = `
        <div>
          <label for="fullname">Ad, Soyad <span class="req">*</span></label>
          <input id="fullname" type="text" autocomplete="name" required value="${escapeAttr(state.fullname)}" placeholder="Məs: Əliyev Vəli" />
        </div>
        <div>
          <label for="email">E-poçt <span class="req">*</span></label>
          <input id="email" type="email" autocomplete="email" required value="${escapeAttr(state.email)}" placeholder="ad@example.com" />
        </div>
        <div class="form-row">
          <div>
            <label for="password">Şifrə <span class="req">*</span></label>
            <input id="password" type="password" autocomplete="new-password" minlength="6" required value="${escapeAttr(state.password)}" placeholder="Min 6 simvol" />
          </div>
          <div>
            <label for="confirm">Şifrə təkrarı <span class="req">*</span></label>
            <input id="confirm" type="password" autocomplete="new-password" required value="${escapeAttr(state.confirmPassword)}" placeholder="Şifrəni təkrarlayın" />
          </div>
        </div>
        <p class="hint muted">Şifrəniz minimum 6 simvol olmalıdır.</p>
      `;
      backBtn.hidden = true;
      nextBtn.hidden = false;
      submitBtn.hidden = true;
      nextBtn.textContent = 'Davam et';
      body.querySelector('#fullname').focus();
    }

    if (state.step === 2) {
      body.innerHTML = `
        <div>
          <label for="phone">Telefon nömrəsi</label>
          <input id="phone" type="tel" autocomplete="tel" value="${escapeAttr(state.phone)}" placeholder="+994 50 000 00 00" />
          <p class="hint muted">İstəyə bağlıdır — müraciətlərdə avtomatik istifadə olunacaq.</p>
        </div>
        <div>
          <label for="address">Yaşadığınız ünvan</label>
          <textarea id="address" rows="3" placeholder="Şəhər, rayon, küçə, mənzil">${escapeHtml(state.address)}</textarea>
          <p class="hint muted">İstəyə bağlıdır — sonradan profil səhifəsindən dəyişə bilərsiniz.</p>
        </div>
      `;
      backBtn.hidden = false;
      nextBtn.hidden = false;
      submitBtn.hidden = true;
      nextBtn.textContent = 'Davam et';
      body.querySelector('#phone').focus();
    }

    if (state.step === 3) {
      body.innerHTML = `
        <div class="review-card">
          <h3>Məlumatlarınızı yoxlayın</h3>
          <div class="meta-row"><span class="label">Ad, Soyad</span><span>${escapeHtml(state.fullname)}</span></div>
          <div class="meta-row"><span class="label">E-poçt</span><span>${escapeHtml(state.email)}</span></div>
          <div class="meta-row"><span class="label">Telefon</span><span>${state.phone ? escapeHtml(state.phone) : '<span class="muted">—</span>'}</span></div>
          <div class="meta-row"><span class="label">Ünvan</span><span>${state.address ? escapeHtml(state.address) : '<span class="muted">—</span>'}</span></div>
        </div>
        <label class="checkbox-row">
          <input type="checkbox" id="agree" ${state.agree ? 'checked' : ''} />
          <span>Şəxsi məlumatlarımın platforma daxilində emalına razıyam.</span>
        </label>
      `;
      backBtn.hidden = false;
      nextBtn.hidden = true;
      submitBtn.hidden = false;
      body.querySelector('#agree').addEventListener('change', (e) => {
        state.agree = e.target.checked;
      });
    }
  }

  function captureStep() {
    if (state.step === 1) {
      state.fullname        = body.querySelector('#fullname').value.trim();
      state.email           = body.querySelector('#email').value.trim();
      state.password        = body.querySelector('#password').value;
      state.confirmPassword = body.querySelector('#confirm').value;
    }
    if (state.step === 2) {
      state.phone   = body.querySelector('#phone').value.trim();
      state.address = body.querySelector('#address').value.trim();
    }
  }

  function validateStep() {
    if (state.step === 1) {
      if (!state.fullname || state.fullname.length < 2) return 'Adınızı daxil edin';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) return 'E-poçt formatı yanlışdır';
      if (state.password.length < 6) return 'Şifrə ən az 6 simvol olmalıdır';
      if (state.password !== state.confirmPassword) return 'Şifrələr uyğun gəlmir';
    }
    if (state.step === 2) {
      if (state.phone && !/^[+0-9()\-\s]{6,20}$/.test(state.phone)) return 'Telefon nömrəsi yanlışdır';
    }
    if (state.step === 3) {
      if (!state.agree) return 'Davam etmək üçün razılıq verin';
    }
    return null;
  }

  nextBtn.addEventListener('click', () => {
    captureStep();
    const err = validateStep();
    if (err) return showError(err);
    state.step++;
    renderStep();
  });

  backBtn.addEventListener('click', () => {
    captureStep();
    state.step--;
    renderStep();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    captureStep();
    const err = validateStep();
    if (err) return showError(err);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Yaradılır...';
    hideError();
    try {
      const { user, token } = await api.register({
        fullname: state.fullname,
        email: state.email,
        password: state.password,
        phone: state.phone || undefined,
        address: state.address || undefined,
      });
      setSession(user, token);
      toast('Qeydiyyat uğurla tamamlandı', 'success');
      navigate('/reports');
    } catch (err2) {
      showError(err2.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Qeydiyyatı tamamla';
    }
  });

  renderStep();
}

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
