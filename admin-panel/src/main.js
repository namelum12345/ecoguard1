import './styles.css';
import { defineRoute, startRouter, navigate } from './router.js';
import { clearSession, getUser, isAuthenticated } from './auth.js';
import { initTheme, themeButtonMarkup, bindThemeButtons } from './theme.js';
import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderReportList } from './views/report-list.js';
import { renderReportDetails } from './views/report-details.js';
import { renderAnalytics } from './views/analytics.js';
import { renderProfile } from './views/profile.js';
import { renderUsers } from './views/users.js';

initTheme();

const app = document.getElementById('app');

defineRoute('/login',         renderLogin,        { auth: false });
defineRoute('/',              () => navigate('/dashboard'), { auth: false });
defineRoute('/dashboard',     renderDashboard);
defineRoute('/reports',       renderReportList);
defineRoute('/reports/:id',   renderReportDetails);
defineRoute('/analytics',     renderAnalytics);
defineRoute('/users',         renderUsers);
defineRoute('/profile',       renderProfile);

startRouter(({ handler, params, auth, path }) => {
  if (!auth) {
    handler(app, { navigate, params });
    bindThemeButtons(app);
    return;
  }

  const user = getUser();
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <a href="#/dashboard" class="brand">
          <img src="/logo.png" alt="EcoGuard" />
          <span class="title">Admin</span>
        </a>
        <nav id="sidenav">
          <a href="#/dashboard" data-path="/dashboard">Dashboard</a>
          <a href="#/reports"   data-path="/reports">Müraciətlər</a>
          <a href="#/analytics" data-path="/analytics">Analitika</a>
          <a href="#/users"     data-path="/users">İstifadəçilər</a>
          <a href="#/profile"   data-path="/profile">Profil</a>
        </nav>
        <div class="spacer"></div>
        <div class="theme-row">${themeButtonMarkup()}<span class="theme-row-label muted">Rejim</span></div>
        <div class="user-info">
          <strong>${escapeHtml(user?.fullname || 'Admin')}</strong>
          <span>${escapeHtml(user?.email || '')}</span>
          <button class="btn btn-secondary btn-block mt-1" id="logout-btn">Çıxış</button>
        </div>
      </aside>
      <section class="content">
        <div id="view-root"></div>
      </section>
    </div>
  `;

  document.querySelectorAll('#sidenav a').forEach((a) => {
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

if (!isAuthenticated() && location.hash !== '#/login') {
  navigate('/login');
}
