/** Light / dark theme toggle, persisted per browser. Task TSK-UI-001. */

export type Theme = 'light' | 'dark';
const KEY = 'atomica-theme';

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
}

export function initThemeToggle(button: HTMLButtonElement): void {
  const label = () => {
    button.textContent = currentTheme() === 'dark' ? '☀ Light mode' : '☾ Dark mode';
  };
  label();
  button.addEventListener('click', () => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    label();
  });
}
