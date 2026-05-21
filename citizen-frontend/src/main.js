import './styles.css';
import { defineRoute, startRouter, navigate } from './router.js';
import { clearSession, getUser, isAuthenticated } from './auth.js';
import { initTheme, themeButtonMarkup, bindThemeButtons } from './theme.js';
import { renderLogin } from './views/login.js';
import { renderRegister } from './views/register.js';
import { renderProfile } from './views/profile.js';
import { renderCreateReport } from './views/create-report.js';
import { renderMyReports } from './views/my-reports.js';
import { renderReportDetails } from './views/report-details.js';

initTheme();

const app = document.getElementById('app');

defineRoute('/login',         renderLogin,         { auth: false });
defineRoute('/register',      renderRegister,      { auth: false });
defineRoute('/',              () => navigate('/reports'), { auth: false });
defineRoute('/reports',       renderMyReports);
defineRoute('/reports/new',   renderCreateReport);
defineRoute('/reports/:id',   renderReportDetails);
defineRoute('/profile',       renderProfile);

startRouter(({ handler, params, auth, path }) => {
  if (!auth) {
    handler(app, { navigate, params });
    bindThemeButtons(app);
    return;
  }

  const user = getUser();
  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <a href="#/reports" class="brand">
          <img src="/logo.png" alt="EcoGuard" />
          <span>EcoGuard</span>
        </a>
        <nav id="topnav">
          <a href="#/reports" data-path="/reports">Müraciətlərim</a>
          <a href="#/reports/new" data-path="/reports/new">Yeni Müraciət</a>
          <a href="#/profile" data-path="/profile">Profil</a>
        </nav>
        <div class="user-block">
          ${user ? `<span class="who">${escapeHtml(user.fullname)}</span>` : ''}
          ${themeButtonMarkup()}
          <button class="btn btn-secondary" id="logout-btn">Çıxış</button>
        </div>
      </header>
      <main id="view-root"></main>
    </div>
  `;

  document.querySelectorAll('#topnav a').forEach((a) => {
    if (path.startsWith(a.dataset.path)) a.classList.add('active');
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearSession();
    navigate('/login');
  });

  bindThemeButtons(app);

  const viewRoot = document.getElementById('view-root');
  handler(viewRoot, { navigate, params });
});

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

if (!isAuthenticated() && !['#/login', '#/register'].includes(location.hash)) {
  navigate('/login');
}
