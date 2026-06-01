'use client';

import { useState } from 'react';
import { useAnnouncements } from './query';
import { DataTable } from '@/components/admin/ui/DataTable';
import { DataTableSkeleton } from '@/components/admin/ui/DataTableSkeleton';
import { announcementsColumns } from '@/components/admin/announcements/AnnouncementsColumns';
import { AnnouncementDetailModal } from '@/components/admin/ui/AnnouncementDetailModal';
import Link from 'next/link';

export default function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  
  const { data, isLoading, isError } = useAnnouncements({ page, pageSize: 20, search });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text)' }}>Announcements</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Create and manage global or targeted announcements.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Search titles..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              width: '240px',
              outline: 'none'
            }}
          />
          <Link href="/dashboard/announcements/create" style={styles.createBtn}>
            + Create New
          </Link>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton columns={6} rows={10} />
      ) : isError ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--danger)' }}>
          Failed to load announcements.
        </div>
      ) : (
        <DataTable
          columns={announcementsColumns()}
          data={data?.data || []}
          onRowClick={(row) => setSelectedAnnouncementId(row.id)}
          pagination={{
            page,
            total: data?.meta?.total || 0,
            pageSize: 20,
            onPageChange: setPage
          }}
        />
      )}

      {selectedAnnouncementId && (
        <AnnouncementDetailModal
          announcementId={selectedAnnouncementId}
          onClose={() => setSelectedAnnouncementId(null)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  createBtn: {
    padding: '10px 16px',
    backgroundColor: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    display: 'inline-block',
  }
};
