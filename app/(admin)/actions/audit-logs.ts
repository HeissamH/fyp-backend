'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://udsminfo.com") : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export interface GetAuditLogsParams {
  page?: number;
  pageSize?: number;
  action?: string;
  userId?: string;
  entity?: string;
}

export async function getAuditLogs({ page = 1, pageSize = 20, action, userId, entity }: GetAuditLogsParams = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (action) params.set('action', action);
  if (userId) params.set('userId', userId);
  if (entity) params.set('entity', entity);

  const res = await fetch(`${BASE_URL}/audit-logs?${params}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch audit logs');
  return json;
}
