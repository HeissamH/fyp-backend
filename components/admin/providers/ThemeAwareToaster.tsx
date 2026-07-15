'use client';

import { Toaster } from 'sonner';
import { useAdminTheme } from '@/components/admin/providers/ThemeProvider';

export function ThemeAwareToaster() {
  const { theme } = useAdminTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      theme={theme}
      toastOptions={{
        style: {
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          boxShadow: 'var(--shadow)',
        },
      }}
    />
  );
}
