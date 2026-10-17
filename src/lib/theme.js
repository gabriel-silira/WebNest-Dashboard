const THEME_KEY = 'webnest-dashboard-theme';

export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
}

export function saveTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try {
    localStorage.setItem(THEME_KEY, nextTheme);
    return true;
  } catch {
    return false;
  }
}
