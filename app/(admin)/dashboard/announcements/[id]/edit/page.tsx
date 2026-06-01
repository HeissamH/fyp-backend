'use client';

import { use } from 'react';
import { useAnnouncement } from '../../query';
import { AnnouncementForm } from '@/components/admin/announcements/AnnouncementForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useAnnouncement(id);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', padding: '24px' }}>
        <Loader2 size={18} className="spin" /> Loading announcement...
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div style={{ padding: '24px', color: 'var(--danger)' }}>
        Failed to load announcement. <Link href="/dashboard/announcements">Go back</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px' }}>
      <Link href="/dashboard/announcements" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to Announcements
      </Link>

      <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text)' }}>Edit Announcement</h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Update the details of an existing announcement.</p>

      <AnnouncementForm 
        mode="edit" 
        announcementId={id} 
        initialData={data.data} 
      />
    </div>
  );
}
