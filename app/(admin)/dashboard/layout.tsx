import { requireAdminSession } from '@/lib/admin/session';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { Topbar } from '@/components/admin/layout/Topbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure the user is authenticated and is an admin before rendering ANY dashboard page
  await requireAdminSession();

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        transition: 'var(--transition-theme)',
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          paddingLeft: 'var(--sidebar-w)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Topbar />
        <main style={{ flex: 1, padding: '24px', marginTop: '64px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
