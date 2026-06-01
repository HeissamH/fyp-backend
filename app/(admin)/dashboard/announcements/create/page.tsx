'use client';

import { AnnouncementForm } from '@/components/admin/announcements/AnnouncementForm';

export default function CreateAnnouncementPage() {
  return (
    <div style={{ maxWidth: '1200px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text)' }}>Create Announcement</h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Draft and publish a new announcement.</p>
      
      <AnnouncementForm mode="create" />
    </div>
  );
}
