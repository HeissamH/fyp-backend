'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/admin/ui/Badge';
import { Pin, Trash2, CheckCircle, XCircle, Pencil } from 'lucide-react';
import Link from 'next/link';
import { 
  useUpdateAnnouncement, 
  usePinAnnouncement, 
  useDeleteAnnouncement 
} from '@/app/(admin)/dashboard/announcements/query';
import { toast } from 'sonner';

export const announcementsColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      const isPinned = row.original.isPinned;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isPinned && <Pin size={14} color="var(--warning)" />}
          <span style={{ fontWeight: 500 }}>{row.original.title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'audience',
    header: 'Target Audience',
    cell: ({ row }) => {
      const type = row.original.targetType;
      return (
        <Badge variant={type === 'ALL' ? 'success' : 'info'}>
          {type}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'expiresAt',
    header: 'Expires',
    cell: ({ row }) => {
      const expires = row.original.expiresAt;
      if (!expires) return '-';
      const isExpired = new Date(expires) < new Date();
      return (
        <span style={{ color: isExpired ? 'var(--danger)' : 'var(--text-muted)' }}>
          {new Date(expires).toLocaleDateString()}
          {isExpired && ' (Expired)'}
        </span>
      );
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const s = row.original.status;
      return (
        <Badge variant={s === 'PUBLISHED' ? 'success' : 'default'}>
          {s || 'DRAFT'}
        </Badge>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <AnnouncementActions announcement={row.original} />;
    }
  }
];

function AnnouncementActions({ announcement }: { announcement: any }) {
  const { mutate: updateAnnouncement } = useUpdateAnnouncement();
  const { mutate: pinAnnouncement } = usePinAnnouncement();
  const { mutate: deleteAnnouncement } = useDeleteAnnouncement();

  const handleToggleActive = () => {
    const newStatus = announcement.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    updateAnnouncement(
      { id: announcement.id, data: { status: newStatus } },
      { onSuccess: () => toast.success(`Announcement ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}`) }
    );
  };

  const handlePin = () => {
    pinAnnouncement(announcement.id, {
      onSuccess: () => toast.success(announcement.isPinned ? 'Unpinned' : 'Pinned to top')
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncement(announcement.id, {
        onSuccess: () => toast.success('Deleted successfully')
      });
    }
  };

  return (
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
      <Link href={`/dashboard/announcements/${announcement.id}/edit`} style={{ ...styles.btn, color: 'var(--info)', display: 'flex', alignItems: 'center' }} title="Edit" onClick={(e) => e.stopPropagation()}>
        <Pencil size={15} />
      </Link>

      <button 
        style={styles.btn} 
        onClick={(e) => { e.stopPropagation(); handleToggleActive(); }} 
        title={announcement.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
      >
        {announcement.status === 'PUBLISHED' ? <XCircle size={16} color="var(--warning)" /> : <CheckCircle size={16} color="var(--success)" />}
      </button>

      <button style={styles.btn} onClick={(e) => { e.stopPropagation(); handlePin(); }} title="Toggle Pin">
        <Pin size={16} color={announcement.isPinned ? 'var(--warning)' : 'var(--text-muted)'} />
      </button>

      <button style={styles.btn} onClick={(e) => { e.stopPropagation(); handleDelete(); }} title="Delete">
        <Trash2 size={16} color="var(--danger)" />
      </button>
    </div>
  );
}

const styles = {
  btn: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '6px',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s'
  }
};
