import { requireAdminSession } from '@/lib/admin/session';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s · UDSM Admin',
  },
  description: 'UDSM Connect administration panel',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <AdminShell
      user={{
        fullName: session.fullName,
        email: session.email,
      }}
    >
      {children}
    </AdminShell>
  );
}
