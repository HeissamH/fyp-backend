'use client';

import { useMemo, useState } from 'react';
import { useDeletePost, usePosts } from './query';
import { DataTable } from '@/components/admin/ui/DataTable';
import { DataTableSkeleton } from '@/components/admin/ui/DataTableSkeleton';
import { ConfirmModal } from '@/components/admin/ui/ConfirmModal';
import { Badge } from '@/components/admin/ui/Badge';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function PostsAdminPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const { data, isLoading, isError } = usePosts(query);
  const { mutate: remove, isPending } = useDeletePost();

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title / content',
        cell: ({ row }) => {
          const title = row.original.title?.trim();
          const content = (row.original.content || '').replace(/\s+/g, ' ').trim();
          return (
            <div style={{ maxWidth: 360 }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>
                {title || content.slice(0, 60) || 'Untitled'}
              </div>
              {title && content && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {content.slice(0, 100)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'author',
        header: 'Author',
        cell: ({ row }) => (
          <span style={{ fontSize: 13 }}>{row.original.author?.fullName || '—'}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.original.type || 'POST'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = row.original.status || 'PUBLISHED';
          const variant = s === 'PUBLISHED' ? 'success' : s === 'DRAFT' ? 'warning' : 'default';
          return <Badge variant={variant as any}>{s}</Badge>;
        },
      },
      {
        accessorKey: 'likeCount',
        header: 'Likes',
        cell: ({ row }) => row.original.likeCount ?? 0,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) =>
          row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleString()
            : '—',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            title="Delete post"
            onClick={() => setDeleteTarget(row.original)}
            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 6 }}
          >
            <Trash2 size={16} />
          </button>
        ),
      },
    ],
    [],
  );

  const rows = data?.data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text)' }}>Posts</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Moderate mobile feed posts. Soft-delete removes them from the app.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title…"
              style={{
                padding: '8px 12px 8px 32px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: 13,
                minWidth: 200,
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        {data?.meta?.total != null ? `${data.meta.total} total` : null}
      </div>

      {isLoading ? (
        <DataTableSkeleton columns={6} rows={8} />
      ) : isError ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--danger)' }}>
          Failed to load posts.
        </div>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete post"
          message={`Soft-delete “${deleteTarget.title || 'this post'}”? It will disappear from the mobile feed.`}
          confirmLabel="Delete"
          isPending={isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            remove(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Post deleted');
                setDeleteTarget(null);
              },
              onError: (err: any) => toast.error(err.message || 'Delete failed'),
            });
          }}
        />
      )}
    </div>
  );
}
