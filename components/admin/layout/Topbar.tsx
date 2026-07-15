'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/admin/ui/ThemeToggle';
import type { AdminUserInfo } from './AdminShell';

export function Topbar({
  user,
  onMenuClick,
}: {
  user: AdminUserInfo;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumb = segments
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '))
    .join(' / ');

  const displayName = user.fullName?.trim() || user.email || 'Admin';
  const initial = (displayName.charAt(0) || 'A').toUpperCase();

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="admin-breadcrumb">{breadcrumb || 'Dashboard'}</div>
      </div>

      <div className="admin-topbar-actions">
        <ThemeToggle />
        <div className="admin-user-chip" title={user.email || displayName}>
          <div className="admin-avatar">{initial}</div>
          <div className="admin-user-meta">
            <span className="admin-user-name">{displayName}</span>
            {user.email && user.fullName && (
              <span className="admin-user-email">{user.email}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
