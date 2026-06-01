'use client';

import { useFeedback, useUpdateFeedbackStatus } from './query';
import { DataTable } from '@/components/admin/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/admin/ui/Badge';
import { CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackPage() {
  const { data, isLoading } = useFeedback();
  const { mutate: updateStatus } = useUpdateFeedbackStatus();

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'categoryName', header: 'Category' },
    { accessorKey: 'subject', header: 'Subject' },
    {
      accessorKey: 'description',
      header: 'Feedback',
      cell: ({ row }) => (
        <div style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {row.original.description}
        </div>
      ),
    },
    { accessorKey: 'userName', header: 'Submitted by' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
       const s = row.original.status;
       return <Badge variant={s === 'PENDING' ? 'warning' : s === 'REVIEWED' ? 'info' : 'success'}>{s}</Badge>;
    } },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
             {item.status !== 'RESOLVED' && (
               <button 
                  onClick={() => updateStatus({ id: item.id, status: 'RESOLVED' })}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--success)' }}
                  title="Mark Resolved"
                >
                  <CheckSquare size={16} />
                </button>
             )}
          </div>
        )
      }
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 8px 0', color: 'var(--text)' }}>User Feedback</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Review bug reports and system feedback.</p>
      </div>

      <DataTable columns={columns} data={data?.data || []} />
    </div>
  );
}
