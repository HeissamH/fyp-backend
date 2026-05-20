'use client';

import { useState } from 'react';
import { useComments } from '@/components/admin/comments/query';
import { CommentThread } from '@/components/admin/comments/CommentThread';
import { CommentTargetType } from '@/app/(admin)/actions/comments';

const TARGET_TYPES: CommentTargetType[] = ['ANNOUNCEMENT', 'EVENT', 'LOST_FOUND', 'POST'];

export default function CommentsAdminPage() {
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState<CommentTargetType>('ANNOUNCEMENT');
  const [queried, setQueried] = useState<{ id: string; type: CommentTargetType } | null>(null);

  const { data, isLoading } = useComments(
    queried?.id ?? '',
    queried?.type ?? 'ANNOUNCEMENT'
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, margin: '0 0 6px 0', color: 'var(--text)' }}>Comments</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          View and moderate threaded comments on any item across the platform.
        </p>
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
            Item ID (UUID)
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
          Load Comments
        </button>
      </div>

      {/* Thread panel */}
      {queried && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
          }}
        >
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
