import { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

function resolveMediaUrl(row: any): string | null {
  return (
    row?.mediaUrl ||
    row?.media?.url ||
    row?.imageUrl ||
    null
  );
}

export const storiesColumns = ({ onDelete }: { onDelete: (id: string) => void }): ColumnDef<any>[] => [
  {
    id: 'preview',
    header: 'Preview',
    cell: ({ row }) => {
      const url = resolveMediaUrl(row.original);
      return (
        <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--surface-hover)' }}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Story Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 10 }}>
              No IMG
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'caption',
    header: 'Caption',
    cell: ({ row }) => {
      const caption = row.original.caption?.trim();
      return (
        <span style={{ color: caption ? 'var(--text)' : 'var(--text-muted)', fontSize: 13, maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {caption || '—'}
        </span>
      );
    },
  },
  {
    id: 'author',
    header: 'Author',
    cell: ({ row }) => (
      <span style={{ fontSize: 13, color: 'var(--text)' }}>
        {row.original.author?.fullName || row.original.authorName || '—'}
      </span>
    ),
  },
  {
    id: 'college',
    header: 'College',
    cell: ({ row }) => {
      const c = row.original.college;
      const label = c?.shortName || c?.name || row.original.collegeName || '—';
      return <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>;
    },
  },
  {
    accessorKey: 'viewCount',
    header: 'Views',
    cell: ({ row }) => (
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {row.original.viewCount ?? 0}
      </span>
    ),
  },
  {
    accessorKey: 'expiresAt',
    header: 'Expires At',
    cell: ({ row }) => {
      const expires = row.original.expiresAt;
      if (!expires) return '-';
      const date = new Date(expires);
      const isExpired = date < new Date();
      return (
        <span style={{ color: isExpired ? 'var(--danger)' : 'var(--text)', fontSize: 13 }}>
          {date.toLocaleString()}
          {isExpired && ' (Expired)'}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Uploaded On',
    cell: ({ row }) =>
      row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleDateString()
        : '—',
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onDelete(row.original.id)}
          style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
          title="Delete Story"
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
    ),
  },
];
