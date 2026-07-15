'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? "https://www.udsminfo.com" : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export async function getPosts(params?: { page?: number; pageSize?: number; search?: string }) {
  const sp = new URLSearchParams();
  sp.set('page', String(params?.page ?? 1));
  sp.set('pageSize', String(params?.pageSize ?? 20));
  if (params?.search) sp.set('search', params.search);

  const res = await fetch(`${BASE_URL}/posts?${sp}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch posts');
  return json;
}

export async function deletePost(id: string) {
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete post');
  return json;
}
