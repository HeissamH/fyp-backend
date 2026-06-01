'use client';

import { useState } from 'react';
import { useFeedback, useUpdateFeedbackStatus } from './query';
import { DataTable } from '@/components/admin/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/admin/ui/Badge';
import { FeedbackDetailModal } from '@/components/admin/ui/FeedbackDetailModal';

export default function FeedbackPage() {
  const { data, isLoading } = useFeedback();
  const { mutate: updateStatus, isPending } = useUpdateFeedbackStatus();
  const [selected, setSelected] = useState<any | null>(null);

  const handleUpdateStatus = (
    id: string,
    status: 'PENDING' | 'REVIEWED' | 'RESOLVED',
    adminNotes?: string
  ) => {
    updateStatus(
      { id, status, adminNotes },
      { onSuccess: () => setSelected(null) }
    );
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'categoryName',
      header: 'Category',
      cell: ({ row }) => (
        <span style={{ color: row.original.categoryName ? 'var(--text)' : 'var(--text-muted)' }}>
          {row.original.categoryName || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <span style={{ fontWeight: 500, color: 'var(--text)' }}>
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Message preview',
      cell: ({ row }) => (
        <span style={{
          display: 'block',
          maxWidth: '320px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}>
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'userName',
      header: 'Submitted by',
      cell: ({ row }) => (
        <span style={{ color: row.original.userName ? 'var(--text)' : 'var(--text-muted)' }}>
          {row.original.userName || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <Badge variant={s === 'PENDING' ? 'warning' : s === 'REVIEWED' ? 'info' : 'success'}>
            {s}
          </Badge>
        );
      },
    },
    {
      id: 'open',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text)',
          }}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text)' }}>User Feedback</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Review bug reports and system feedback. Click any row or &quot;View&quot; to read the full message.
        </p>
      </div>

      {/* Clickable rows */}
      <div style={{ cursor: 'pointer' }}>
        <DataTable
          columns={columns}
          data={data?.data || []}
          onRowClick={(row: any) => setSelected(row)}
        />
      </div>

      {selected && (
        <FeedbackDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
          isPending={isPending}
        />
      )}
    </div>
  );
}
