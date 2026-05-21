import { isAuthenticated } from './auth.js';

const routes = [];

export function defineRoute(pattern, handler, { auth = true } = {}) {
  const keys = [];
  const regex = new RegExp('^' + pattern.replace(/:([^/]+)/g, (_, k) => {
    keys.push(k);
    return '([^/]+)';
  }) + '$');
  routes.push({ pattern, regex, keys, handler, auth });
}

export function navigate(path) {
  if (location.hash !== `#${path}`) location.hash = `#${path}`;
  else handleRoute();
}

export function startRouter(onRender) {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  function handleRoute() {
    const path = (location.hash || '#/').slice(1) || '/';
    const matched = match(path);
    if (!matched) {
      onRender({ handler: () => notFound(), params: {}, auth: false, path });
      return;
    }
    if (matched.auth && !isAuthenticated()) {
      navigate('/login');
      return;
    }
    onRender({ ...matched, path });
  }
}

function match(path) {
  for (const r of routes) {
    const m = r.regex.exec(path);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { handler: r.handler, params, auth: r.auth };
    }
  }
  return null;
}

function notFound() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <main style="padding:2rem;">
      <div class="card empty-state">
        <h2>404</h2>
        <p>Səhifə tapılmadı.</p>
        <a href="#/dashboard" class="btn">Dashboard-a qayıt</a>
      </div>
    </main>
  `;
}
