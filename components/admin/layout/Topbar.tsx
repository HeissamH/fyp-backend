'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/admin/ui/ThemeToggle';

export function Topbar() {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumb = segments
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '))
    .join(' / ');

  return (
    <header style={styles.topbar}>
      <div style={styles.breadcrumb}>{breadcrumb}</div>

      <div style={styles.actions}>
        <ThemeToggle />
        <div style={styles.avatar} title="Admin">
          A
        </div>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topbar: {
    height: '64px',
    backgroundColor: 'var(--topbar-blur)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'fixed',
    top: 0,
    right: 0,
    left: 'var(--sidebar-w)',
    zIndex: 10,
    transition: 'var(--transition-theme)',
  },
  breadcrumb: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: 'var(--text-inverse)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: 'var(--shadow-sm)',
  },
};
