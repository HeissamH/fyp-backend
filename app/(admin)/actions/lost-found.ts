'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://udsminfo.com") : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export interface GetLostFoundParams {
  page?: number;
  pageSize?: number;
  type?: 'LOST' | 'FOUND';
  status?: 'OPEN' | 'RESOLVED' | 'ALL';
  categoryId?: string;
}

export async function getLostFound({ page = 1, pageSize = 20, type, status, categoryId }: GetLostFoundParams = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  if (categoryId) params.set('categoryId', categoryId);

  const res = await fetch(`${BASE_URL}/lost-found?${params}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch lost and found items');
  return json;
}

export async function getLostFoundItem(id: string) {
  const res = await fetch(`${BASE_URL}/lost-found/${id}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch lost and found item');
  return json;
}

export async function updateLostFound(id: string, data: any) {
  const res = await fetch(`${BASE_URL}/lost-found/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update lost and found item');
  return json;
}

export async function resolveLostFound(id: string) {
  const res = await fetch(`${BASE_URL}/lost-found/${id}/resolve`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to resolve lost and found item');
  return json;
}

export async function deleteLostFound(id: string) {
  const res = await fetch(`${BASE_URL}/lost-found/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete lost and found item');
  return json;
}
