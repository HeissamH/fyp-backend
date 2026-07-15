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
  Settings,
  LogOut,
  Building2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { adminLogout } from '@/app/(admin)/actions/auth';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/dashboard/users', icon: Users },
  { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  { label: 'Events', href: '/dashboard/events', icon: Calendar },
  { label: 'Lost & Found', href: '/dashboard/lost-and-found', icon: Box },
  { label: 'Feedback', href: '/dashboard/feedback', icon: MessageSquareReply },
  { label: 'Comments', href: '/dashboard/comments', icon: MessageSquare },
  { label: 'Stories', href: '/dashboard/stories', icon: Image },
  { label: 'Groups', href: '/dashboard/groups', icon: UsersRound },

  { section: 'Platform' },
  { label: 'Colleges', href: '/dashboard/platform/colleges', icon: Building2 },
  { label: 'Departments', href: '/dashboard/platform/departments', icon: LayoutDashboard },
  { label: 'Programmes', href: '/dashboard/platform/programmes', icon: BookOpen },
  { label: 'Academic Years', href: '/dashboard/platform/academic-years', icon: GraduationCap },
  
  { section: 'System' },
  { label: 'Roles & Perms', href: '/dashboard/roles', icon: ShieldAlert },
  { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <span>UDSM Admin</span>
      </div>
      
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item, idx) => {
          if (item.section) {
            return <div key={idx} style={styles.sectionTitle}>{item.section}</div>;
          }
          
          const isActive = item.href === '/dashboard' 
            ? pathname === item.href 
            : pathname.startsWith(item.href || '');
            
          const Icon = item.icon!;
          
          return (
            <Link 
              key={idx} 
              href={item.href!} 
              style={{
                ...styles.link,
                ...(isActive ? styles.linkActive : {})
              }}
            >
              <Icon size={18} style={styles.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <button onClick={() => adminLogout()} style={styles.logoutBtn}>
          <LogOut size={18} style={styles.icon} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-w)',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    backgroundColor: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'var(--transition-theme)',
    boxShadow: 'var(--shadow-sm)',
    zIndex: 20,
  },
  logo: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    borderBottom: '1px solid var(--border)',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'var(--primary-h)',
    letterSpacing: '-0.02em',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    padding: '16px 12px 8px 12px',
    letterSpacing: '0.06em',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.15s, color 0.15s',
  },
  linkActive: {
    backgroundColor: 'var(--primary-soft)',
    color: 'var(--primary-h)',
    fontWeight: 600,
  },
  icon: {
    marginRight: '12px',
    flexShrink: 0,
  },
  footer: {
    padding: '16px 12px',
    borderTop: '1px solid var(--border)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    textAlign: 'left',
  },
};
