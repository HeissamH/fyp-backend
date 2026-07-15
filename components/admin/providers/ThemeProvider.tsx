'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AdminTheme = 'light' | 'dark';

type ThemeContextValue = {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
  ready: boolean;
};

const STORAGE_KEY = 'udsm-admin-theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: AdminTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

function readStoredTheme(): AdminTheme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* ignore */
  }
  return null;
}

function systemTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readStoredTheme() ?? systemTheme();
    setThemeState(initial);
    applyTheme(initial);
    setReady(true);

    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onSystem = (e: MediaQueryListEvent) => {
      // Only follow system if user has not chosen explicitly
      if (readStoredTheme() == null) {
        const next = e.matches ? 'light' : 'dark';
        setThemeState(next);
        applyTheme(next);
      }
    };
    mq.addEventListener('change', onSystem);
    return () => mq.removeEventListener('change', onSystem);
  }, []);

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, ready }),
    [theme, setTheme, toggleTheme, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAdminTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAdminTheme must be used within ThemeProvider');
  }
  return ctx;
}

/** Inline script for layout — prevents flash of wrong theme before hydration. */
export const THEME_BOOT_SCRIPT = `
(function(){
  try {
    var k = 'udsm-admin-theme';
    var t = localStorage.getItem(k);
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
