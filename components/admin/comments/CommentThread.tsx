'use client';

import React, { useState } from 'react';
import { CommentNode, CommentTargetType } from '@/app/(admin)/actions/comments';
import { usePostComment, useEditComment, useDeleteComment } from './query';
import { MessageSquare, Reply, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

// Theme-aware tokens (work in light + dark via globals.css variables)
const s = {
  bubble: {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 16,
  } as React.CSSProperties,
  name: { fontSize: 14, fontWeight: 600, color: 'var(--text)' } as React.CSSProperties,
  muted: { fontSize: 12, color: 'var(--text-muted)' } as React.CSSProperties,
  body: { fontSize: 14, color: 'var(--text)', marginTop: 4, whiteSpace: 'pre-wrap' as const },
  textarea: {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    color: 'var(--text)',
    resize: 'none' as const,
    outline: 'none',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  btnPrimary: {
    padding: '6px 12px',
    fontSize: 12,
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  } as React.CSSProperties,
  btnGhost: {
    padding: '6px 12px',
    fontSize: 12,
    background: 'var(--surface-2)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    cursor: 'pointer',
  } as React.CSSProperties,
  linkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
  } as React.CSSProperties,
};

// ─── Single comment node ─────────────────────────────────────────────────────
function CommentItem({
  comment,
  depth,
  targetId,
  targetType,
  currentUserId,
}: {
  comment: CommentNode;
  depth: number;
  targetId: string;
  targetType: CommentTargetType;
  currentUserId?: string;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const { mutate: post, isPending: posting } = usePostComment(targetId, targetType);
  const { mutate: edit, isPending: saving } = useEditComment(targetId, targetType);
  const { mutate: remove } = useDeleteComment(targetId, targetType);

  const isOwner = currentUserId === comment.authorId;
  const hasReplies = comment.children.length > 0;
  const maxDepth = 5;
  const indent = Math.min(depth, maxDepth) * 20;

  function handleReply() {
    if (!replyContent.trim()) return;
    post(
      { content: replyContent.trim(), parentId: comment.id },
      { onSuccess: () => { setReplyContent(''); setReplying(false); } },
    );
  }

  function handleEdit() {
    if (!editContent.trim()) return;
    edit(
      { id: comment.id, content: editContent.trim() },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <div style={{ marginLeft: indent, marginTop: 12 }}>
      <div
        style={
          depth > 0
            ? { paddingLeft: 16, borderLeft: '2px solid var(--border)' }
            : undefined
        }
      >
        <div style={s.bubble}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={s.avatar}>
                {comment.authorName?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span style={s.name}>
                {comment.authorName?.split('@')[0].trim() ?? 'Unknown'}
              </span>
              <span style={s.muted}>
                {new Date(comment.createdAt).toLocaleString()}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span style={{ ...s.muted, fontStyle: 'italic' }}>(edited)</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => setReplying((r) => !r)} style={s.linkBtn} title="Reply">
                <Reply size={13} /> Reply
              </button>
              {isOwner && (
                <>
                  <button type="button" onClick={() => setEditing((e) => !e)} style={s.linkBtn} title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this comment?')) remove(comment.id);
                    }}
                    style={{ ...s.linkBtn, color: 'var(--danger)' }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
              {hasReplies && (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => !c)}
                  style={s.linkBtn}
                  title={collapsed ? 'Expand replies' : 'Collapse replies'}
                >
                  {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              )}
            </div>
          </div>

          {editing ? (
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                style={s.textarea}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={handleEdit} disabled={saving} style={s.btnPrimary}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setEditContent(comment.content);
                  }}
                  style={s.btnGhost}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p style={s.body}>{comment.content}</p>
          )}
        </div>

        {replying && (
          <div style={{ marginTop: 8, marginLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              placeholder={`Replying to ${comment.authorName?.split('@')[0].trim()}…`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              style={s.textarea}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={handleReply} disabled={posting} style={s.btnPrimary}>
                {posting ? 'Posting…' : 'Post Reply'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplying(false);
                  setReplyContent('');
                }}
                style={s.btnGhost}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!collapsed && hasReplies && (
          <div style={{ marginTop: 4 }}>
            {comment.children.map((child) => (
              <CommentItem
                key={child.id}
                comment={child}
                depth={depth + 1}
                targetId={targetId}
                targetType={targetType}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Thread root ─────────────────────────────────────────────────────────────
export function CommentThread({
  targetId,
  targetType,
  comments,
  currentUserId,
  isLoading,
}: {
  targetId: string;
  targetType: CommentTargetType;
  comments: CommentNode[];
  currentUserId?: string;
  isLoading?: boolean;
}) {
  const [newComment, setNewComment] = useState('');
  const { mutate: post, isPending: posting } = usePostComment(targetId, targetType);

  function handlePost() {
    if (!newComment.trim()) return;
    post(
      { content: newComment.trim() },
      { onSuccess: () => setNewComment('') },
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
        <MessageSquare size={16} />
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Comments {!isLoading && `(${comments.length})`}
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          placeholder="Write a comment…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          style={{ ...s.textarea, borderRadius: 12, padding: '12px 16px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handlePost}
            disabled={posting || !newComment.trim()}
            style={{ ...s.btnPrimary, padding: '8px 16px', fontSize: 13, opacity: posting || !newComment.trim() ? 0.5 : 1 }}
          >
            {posting ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '16px 0' }}>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '16px 0', textAlign: 'center' }}>
          No comments yet. Be the first!
        </p>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              targetId={targetId}
              targetType={targetType}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
