'use client';

import React, { useState } from 'react';
import { CommentNode, CommentTargetType } from '@/app/(admin)/actions/comments';
import { usePostComment, useEditComment, useDeleteComment } from './query';
import { MessageSquare, Reply, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Single comment node (renders itself + its children recursively) ──────────
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
  const maxDepth = 5; // visual indent cap

  function handleReply() {
    if (!replyContent.trim()) return;
    post({ content: replyContent.trim(), parentId: comment.id }, {
      onSuccess: () => { setReplyContent(''); setReplying(false); }
    });
  }

  function handleEdit() {
    if (!editContent.trim()) return;
    edit({ id: comment.id, content: editContent.trim() }, {
      onSuccess: () => setEditing(false)
    });
  }

  const indent = Math.min(depth, maxDepth) * 20;

  return (
    <div style={{ marginLeft: `${indent}px` }} className="mt-3">
      {/* Thread line for replies */}
      <div className={`relative ${depth > 0 ? 'pl-4 border-l-2 border-zinc-700' : ''}`}>

        {/* Comment bubble */}
        <div className="bg-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {comment.authorName?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm font-semibold text-zinc-100">{comment.authorName?.split('@')[0].trim() ?? 'Unknown'}</span>
              <span className="text-xs text-zinc-500">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-zinc-600 italic">(edited)</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReplying(r => !r)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-blue-400 transition-colors"
                title="Reply"
              >
                <Reply size={13} /> Reply
              </button>
              {isOwner && (
                <>
                  <button
                    onClick={() => setEditing(e => !e)}
                    className="text-zinc-400 hover:text-yellow-400 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this comment?')) remove(comment.id); }}
                    className="text-zinc-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
              {hasReplies && (
                <button
                  onClick={() => setCollapsed(c => !c)}
                  className="text-zinc-500 hover:text-zinc-200 transition-colors"
                  title={collapsed ? 'Expand replies' : 'Collapse replies'}
                >
                  {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Content or edit form */}
          {editing ? (
            <div className="mt-1 flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={2}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={saving}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditContent(comment.content); }}
                  className="px-3 py-1 text-xs bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>

        {/* Inline reply box */}
         {replying && (
          <div className="mt-2 ml-4 flex flex-col gap-2">
            <textarea
              placeholder={`Replying to ${comment.authorName?.split('@')[0].trim()}…`}
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReply}
                disabled={posting}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {posting ? 'Posting…' : 'Post Reply'}
              </button>
              <button
                onClick={() => { setReplying(false); setReplyContent(''); }}
                className="px-3 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Recursive children */}
        {!collapsed && hasReplies && (
          <div className="mt-1">
            {comment.children.map(child => (
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

// ─── Top-level: the full thread panel ────────────────────────────────────────
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
    post({ content: newComment.trim() }, {
      onSuccess: () => setNewComment(''),
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-zinc-300">
        <MessageSquare size={16} />
        <h3 className="text-sm font-semibold uppercase tracking-wide">
          Comments {!isLoading && `(${comments.length})`}
        </h3>
      </div>

      {/* New top-level comment */}
      <div className="flex flex-col gap-2">
        <textarea
          placeholder="Write a comment…"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end">
          <button
            onClick={handlePost}
            disabled={posting || !newComment.trim()}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {posting ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </div>

      {/* Thread */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-zinc-500 text-sm py-4 text-center">No comments yet. Be the first!</p>
      ) : (
        <div>
          {comments.map(comment => (
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
