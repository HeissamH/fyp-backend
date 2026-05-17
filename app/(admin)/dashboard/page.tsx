import { requireAdminSession } from '@/lib/admin/session';
import { cookies } from 'next/headers';

const APP_URL = process.env.NODE_ENV === "production" ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://udsminfo.com") : "http://localhost:3000";
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

export default async function DashboardOverview() {
  await requireAdminSession();
  const headers = await getStatsHeaders();

  // Fetch all stats in parallel
  const [usersRes, announcementsRes, eventsRes, feedbackRes] = await Promise.all([
    fetchStat('/users?pageSize=1', headers),
    fetchStat('/announcements?pageSize=1', headers),
    fetchStat('/events?status=UPCOMING&pageSize=1', headers),
    fetchStat('/feedback?status=PENDING&pageSize=1', headers),
  ]);

  const stats = [
    {
      title: 'Total Users',
      value: usersRes?.meta?.total ?? '—',
      sub: 'Registered students & staff',
      color: '#388bfd',
    },
    {
      title: 'Announcements',
      value: announcementsRes?.meta?.total ?? '—',
      sub: 'All platform announcements',
      color: '#3fb950',
    },
    {
      title: 'Upcoming Events',
      value: eventsRes?.meta?.total ?? '—',
      sub: 'Scheduled events ahead',
      color: '#e3b341',
    },
    {
      title: 'Pending Feedback',
      value: feedbackRes?.meta?.total ?? '—',
      sub: 'Awaiting admin review',
      color: '#ff7b72',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'var(--text)', fontWeight: 600 }}>
          Overview
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
          Platform summary at a glance.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {stats.map((s) => (
          <div
            key={s.title}
            style={{
              backgroundColor: 'var(--surface)',
              padding: '24px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${s.color}`,
            }}
          >
            <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.title}
            </h3>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text)' }}>Quick Links</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: '+ New Announcement', href: '/dashboard/announcements/create', color: 'var(--primary)' },
            { label: 'Manage Users', href: '/dashboard/users', color: 'var(--surface-2)' },
            { label: 'View Audit Logs', href: '/dashboard/audit-logs', color: 'var(--surface-2)' },
            { label: 'Review Feedback', href: '/dashboard/feedback', color: 'var(--surface-2)' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: '8px 16px',
                backgroundColor: link.color,
                borderRadius: 'var(--radius-sm)',
                color: link.color === 'var(--primary)' ? '#fff' : 'var(--text)',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                border: '1px solid var(--border)',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
