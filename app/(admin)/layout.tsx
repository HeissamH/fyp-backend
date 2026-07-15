import type { Metadata } from 'next';
import { QueryProvider } from '@/components/admin/providers/QueryProvider';
import { ThemeProvider, THEME_BOOT_SCRIPT } from '@/components/admin/providers/ThemeProvider';
import { ThemeAwareToaster } from '@/components/admin/providers/ThemeAwareToaster';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s · UDSM Admin',
  },
  description: 'UDSM Connect administration',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      <QueryProvider>
        <ThemeProvider>
          {children}
          <ThemeAwareToaster />
        </ThemeProvider>
      </QueryProvider>
    </>
  );
}
