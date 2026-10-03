import { useEffect, useState } from 'react';

export type WorkspaceTheme = 'dark' | 'light';
const storageKey = 'abangcolek-workspace-theme';

export function useWorkspaceTheme() {
  const [theme, setTheme] = useState<WorkspaceTheme>(() => {
    try {
      const saved = localStorage.getItem(storageKey) ?? localStorage.getItem('abangcolek-dashboard-theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    // The workspace owns appearance so route changes cannot reset the theme.
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem(storageKey, theme); } catch { /* Theme still works for this session. */ }
  }, [theme]);

  return { theme, toggleTheme: () => setTheme(current => current === 'dark' ? 'light' : 'dark') };
}
