'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export type AdminUserInfo = {
  fullName?: string | null;
  email?: string | null;
};

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AdminUserInfo;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Lock body scroll when drawer open on mobile
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const openMenu = useCallback(() => setMobileOpen(true), []);
  const closeMenu = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="admin-shell">
      {mobileOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}
      <Sidebar mobileOpen={mobileOpen} onNavigate={closeMenu} />
      <div className="admin-content">
        <Topbar user={user} onMenuClick={openMenu} />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
