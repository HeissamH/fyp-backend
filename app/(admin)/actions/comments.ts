'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? "https://www.udsminfo.com" : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export type CommentTargetType = "ANNOUNCEMENT" | "EVENT" | "LOST_FOUND" | "POST";

export interface CommentNode {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  children: CommentNode[];
}

// ── GET comments tree for a given target ─────────────────────────────────────
export async function getComments(targetId: string, targetType: CommentTargetType): Promise<{ data: CommentNode[] }> {
  const params = new URLSearchParams({ targetId, targetType });
  const res = await fetch(`${BASE_URL}/comments?${params}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch comments');
  return json;
}

// ── POST a new comment (or reply) ─────────────────────────────────────────────
export async function postComment(data: {
  targetId: string;
  targetType: CommentTargetType;
  content: string;
  parentId?: string;
}) {
  const res = await fetch(`${BASE_URL}/comments`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to post comment');
  return json;
}

// ── PATCH (edit) a comment ────────────────────────────────────────────────────
export async function editComment(id: string, content: string) {
  const res = await fetch(`${BASE_URL}/comments/${id}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ content }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to edit comment');
  return json;
}

// ── DELETE a comment ──────────────────────────────────────────────────────────
export async function deleteComment(id: string) {
  const res = await fetch(`${BASE_URL}/comments/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete comment');
  return json;
}
