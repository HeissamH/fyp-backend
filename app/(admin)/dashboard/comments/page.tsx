'use client';

import { useState } from 'react';
import { useComments, useDeleteComment, useRecentComments } from '@/components/admin/comments/query';
import { CommentThread } from '@/components/admin/comments/CommentThread';
import { CommentTargetType } from '@/app/(admin)/actions/comments';
import { Badge } from '@/components/admin/ui/Badge';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TARGET_TYPES: CommentTargetType[] = ['ANNOUNCEMENT', 'EVENT', 'LOST_FOUND', 'POST'];

export default function CommentsAdminPage() {
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState<CommentTargetType>('POST');
  const [queried, setQueried] = useState<{ id: string; type: CommentTargetType } | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data: recentData, isLoading: recentLoading, isError: recentError, refetch } =
    useRecentComments(typeFilter || undefined);
  const { data, isLoading } = useComments(
    queried?.id ?? '',
    queried?.type ?? 'POST',
  );
  const { mutate: remove, isPending: deleting } = useDeleteComment(
    queried?.id ?? '',
    queried?.type ?? 'POST',
  );

  const recent = recentData?.data ?? [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, margin: '0 0 6px 0', color: 'var(--text)' }}>Comments</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Review recent comments across the platform, or load a full thread by item ID.
        </p>
      </div>

      {/* Recent moderation queue */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>
            Recent comments
            {recentData?.meta?.total != null && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                ({recentData.meta.total} total)
              </span>
            )}
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 10px',
                color: 'var(--text)',
                fontSize: 13,
              }}
            >
              <option value="">All types</option>
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {recentLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
          </div>
        ) : recentError ? (
          <div style={{ padding: 16, color: 'var(--danger)', fontSize: 14 }}>
            Failed to load recent comments.
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 14 }}>
            No comments yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                      {c.authorName || 'Unknown'}
                    </span>
                    <Badge variant="info">{c.targetType}</Badge>
                    {c.parentId && <Badge variant="default">reply</Badge>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text)', lineHeight: 1.45 }}>
                    {c.content}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetId(c.targetId);
                      setTargetType(c.targetType as CommentTargetType);
                      setQueried({ id: c.targetId, type: c.targetType as CommentTargetType });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-h)',
                      fontSize: 12,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    Open thread · {c.targetId.slice(0, 8)}…
                  </button>
                </div>
                <button
                  type="button"
                  title="Delete comment"
                  disabled={deleting}
                  onClick={() => {
                    if (!confirm('Delete this comment?')) return;
                    remove(c.id, {
                      onSuccess: () => {
                        toast.success('Comment deleted');
                        refetch();
                      },
                      onError: (err: any) => toast.error(err.message || 'Delete failed'),
                    });
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    padding: 4,
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lookup form */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 28,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            Target Type
          </label>
          <select
            value={targetType}
            onChange={e => setTargetType(e.target.value as CommentTargetType)}
            style={{
              width: '100%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 12px',
              color: 'var(--text)',
              fontSize: 13,
            }}
          >
            {TARGET_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 2, minWidth: 280 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            Item ID (UUID) — advanced
          </label>
          <input
            type="text"
            placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 12px',
              color: 'var(--text)',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setQueried({ id: targetId.trim(), type: targetType })}
          disabled={!targetId.trim()}
          style={{
            padding: '9px 22px',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            opacity: !targetId.trim() ? 0.5 : 1,
          }}
        >
          Load Thread
        </button>
      </div>

      {queried && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            Thread for <strong style={{ color: 'var(--text)' }}>{queried.type}</strong>{' '}
            <code style={{ fontSize: 11 }}>{queried.id}</code>
          </div>
          <CommentThread
            targetId={queried.id}
            targetType={queried.type}
            comments={data?.data ?? []}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
