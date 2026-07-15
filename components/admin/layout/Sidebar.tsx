'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Calendar,
  Box,
  MessageSquareReply,
  MessageSquare,
  Image,
  UsersRound,
  ShieldAlert,
  ScrollText,
  LogOut,
  Building2,
  BookOpen,
  GraduationCap,
  Newspaper,
  Layers,
} from 'lucide-react';
import { adminLogout } from '@/app/(admin)/actions/auth';

const NAV_ITEMS: Array<
  | { section: string; label?: never; href?: never; icon?: never }
  | { label: string; href: string; icon: typeof LayoutDashboard; section?: never }
> = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/dashboard/users', icon: Users },
  { label: 'Posts', href: '/dashboard/posts', icon: Newspaper },
  { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  { label: 'Events', href: '/dashboard/events', icon: Calendar },
  { label: 'Lost & Found', href: '/dashboard/lost-and-found', icon: Box },
  { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquareReply },
  { label: 'Comments', href: '/dashboard/comments', icon: MessageSquare },
  { label: 'Stories', href: '/dashboard/stories', icon: Image },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },

  { section: 'Platform' },
  { label: 'Colleges', href: '/dashboard/platform/colleges', icon: Building2 },
  { label: 'Departments', href: '/dashboard/platform/departments', icon: Layers },
  { label: 'Programmes', href: '/dashboard/platform/programmes', icon: BookOpen },
  { label: 'Academic Years', href: '/dashboard/platform/academic-years', icon: GraduationCap },

  { section: 'System' },
  { label: 'Roles & Perms', href: '/dashboard/roles', icon: ShieldAlert },
  { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: ScrollText },
];

export function Sidebar({
  mobileOpen = false,
  onNavigate,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className={`admin-sidebar${mobileOpen ? ' is-open' : ''}`}>
      <div className="admin-sidebar-logo">
        <span>UDSM Admin</span>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV_ITEMS.map((item, idx) => {
          if (item.section) {
            return (
              <div key={`s-${idx}`} className="admin-sidebar-section">
                {item.section}
              </div>
            );
          }

          const isActive =
            item.href === '/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href || '');

          const Icon = item.icon!;

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`admin-sidebar-link${isActive ? ' is-active' : ''}`}
              onClick={onNavigate}
            >
              <Icon size={18} className="admin-sidebar-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <button type="button" onClick={() => adminLogout()} className="admin-sidebar-logout">
          <LogOut size={18} className="admin-sidebar-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
