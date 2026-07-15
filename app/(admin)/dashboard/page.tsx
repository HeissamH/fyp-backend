import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin/session';
import { cookies } from 'next/headers';

const APP_URL = process.env.NODE_ENV === "production" ? "https://www.udsminfo.com" : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

async function getStatsHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchStat(endpoint: string, headers: Record<string, string>) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { headers, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function totalOf(res: any): number | string {
  if (res?.meta?.total != null) return res.meta.total;
  if (Array.isArray(res?.data)) return res.data.length;
  return '—';
}

export default async function DashboardOverview() {
  await requireAdminSession();
  const headers = await getStatsHeaders();

  const [usersRes, postsRes, announcementsRes, eventsRes, feedbackRes, storiesRes, lostFoundRes] =
    await Promise.all([
      fetchStat('/users?pageSize=1', headers),
      fetchStat('/posts?pageSize=1', headers),
      fetchStat('/announcements?pageSize=1', headers),
      fetchStat('/events?status=UPCOMING&pageSize=1', headers),
      // Admin list (paginated meta) — not the user-scoped /feedback endpoint
      fetchStat('/admin/feedback?status=PENDING&pageSize=1', headers),
      fetchStat('/stories', headers),
      fetchStat('/lost-found?status=OPEN&pageSize=1', headers),
    ]);

  const stats = [
    {
      title: 'Total Users',
      value: totalOf(usersRes),
      sub: 'Registered students & staff',
      color: '#388bfd',
      href: '/dashboard/users',
    },
    {
      title: 'Posts',
      value: totalOf(postsRes),
      sub: 'Mobile feed posts',
      color: '#a371f7',
      href: '/dashboard/posts',
    },
    {
      title: 'Announcements',
      value: totalOf(announcementsRes),
      sub: 'Official announcements',
      color: '#3fb950',
      href: '/dashboard/announcements',
    },
    {
      title: 'Upcoming Events',
      value: totalOf(eventsRes),
      sub: 'Scheduled events ahead',
      color: '#e3b341',
      href: '/dashboard/events',
    },
    {
      title: 'Pending Feedback',
      value: totalOf(feedbackRes),
      sub: 'Awaiting admin review',
      color: '#ff7b72',
      href: '/dashboard/feedback',
    },
    {
      title: 'Active Stories',
      value: totalOf(storiesRes),
      sub: 'Not yet expired',
      color: '#f778ba',
      href: '/dashboard/stories',
    },
    {
      title: 'Open Lost & Found',
      value: totalOf(lostFoundRes),
      sub: 'Unresolved items',
      color: '#79c0ff',
      href: '/dashboard/lost-and-found',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'var(--text)', fontWeight: 600 }}>
          Overview
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
          Platform summary at a glance. Click a card to open that section.
        </p>
      </div>

      <div
        className="admin-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {stats.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            style={{
              backgroundColor: 'var(--surface)',
              padding: '20px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${s.color}`,
              textDecoration: 'none',
              color: 'inherit',
              transition: 'box-shadow 0.15s, transform 0.15s',
            }}
          >
            <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.title}
            </h3>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {s.sub}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text)' }}>Quick Links</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: '+ New Announcement', href: '/dashboard/announcements/create', color: 'var(--primary)', primary: true },
            { label: 'Moderate Posts', href: '/dashboard/posts', color: 'var(--surface-2)', primary: false },
            { label: 'Manage Users', href: '/dashboard/users', color: 'var(--surface-2)', primary: false },
            { label: 'Review Feedback', href: '/dashboard/feedback', color: 'var(--surface-2)', primary: false },
            { label: 'Recent Comments', href: '/dashboard/comments', color: 'var(--surface-2)', primary: false },
            { label: 'Audit Logs', href: '/dashboard/audit-logs', color: 'var(--surface-2)', primary: false },
          ].map(link => (
            <Link
              key={link.href + link.label}
              href={link.href}
              style={{
                padding: '8px 16px',
                backgroundColor: link.color,
                borderRadius: 'var(--radius-sm)',
                color: link.primary ? '#fff' : 'var(--text)',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                border: '1px solid var(--border)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
