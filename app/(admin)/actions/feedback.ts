'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? "https://www.udsminfo.com" : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export interface GetFeedbackParams {
  page?: number;
  pageSize?: number;
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED';
}

export async function getAdminFeedback({ page = 1, pageSize = 20, status }: GetFeedbackParams = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set('status', status);

  const res = await fetch(`${BASE_URL}/admin/feedback?${params}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch feedback');
  return json;
}

export async function updateFeedbackStatus(id: string, status: 'PENDING' | 'REVIEWED' | 'RESOLVED', adminNotes?: string) {
  const res = await fetch(`${BASE_URL}/admin/feedback/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ status, adminNotes }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update feedback status');
  return json;
}

export async function getAdminFeedbackById(id: string) {
  const res = await fetch(`${BASE_URL}/admin/feedback/${id}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch feedback item');
  return json;
}

export async function saveAdminComment(id: string, adminNotes: string) {
  const res = await fetch(`${BASE_URL}/admin/feedback/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ adminNotes }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to save admin comment');
  return json;
}
