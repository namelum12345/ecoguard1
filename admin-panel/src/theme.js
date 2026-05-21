const STORAGE_KEY = 'aq-admin-theme';

const SUN_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
  </svg>`;

const MOON_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>`;

export function getTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // admin panel defaults to dark
  return 'dark';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
  document.querySelectorAll('[data-theme-toggle]').forEach(refreshButton);
}

export function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  applyTheme(getTheme());
}

export function themeButtonMarkup() {
  return `
    <button type="button" class="theme-toggle" data-theme-toggle aria-label="Rejimi dəyiş" title="Rejimi dəyiş">
      ${getTheme() === 'dark' ? SUN_ICON : MOON_ICON}
    </button>
  `;
}

export function bindThemeButtons(root = document) {
  root.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', toggleTheme);
    refreshButton(btn);
  });
}

function refreshButton(btn) {
  const theme = getTheme();
  btn.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
  btn.setAttribute('title', theme === 'dark' ? 'İşıqlı rejim' : 'Qaranlıq rejim');
}
