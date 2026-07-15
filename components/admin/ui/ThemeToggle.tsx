'use client';

import { Moon, Sun } from 'lucide-react';
import { useAdminTheme } from '@/components/admin/providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme, ready } = useAdminTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      disabled={!ready}
    >
      <span className="theme-toggle__icons" aria-hidden>
        <Sun className="icon-sun" />
        <Moon className="icon-moon" />
      </span>
      <span className="theme-toggle__thumb" aria-hidden>
        {theme === 'dark' ? <Moon size={13} strokeWidth={2.25} /> : <Sun size={13} strokeWidth={2.25} />}
      </span>
    </button>
  );
}
