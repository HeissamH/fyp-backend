'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? "https://www.udsminfo.com" : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export interface GetAnnouncementsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  categoryId?: string;
  status?: string;
  isForYou?: boolean;
}

export async function getAnnouncements({
  page = 1,
  pageSize = 20,
  search = '',
  type,
  categoryId,
  status,
  isForYou,
}: GetAnnouncementsParams = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);
  if (type) params.set('type', type);
  if (categoryId) params.set('categoryId', categoryId);
  if (status) params.set('status', status);
  if (isForYou !== undefined) params.set('isForYou', String(isForYou));

  const res = await fetch(`${BASE_URL}/announcements?${params}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch announcements');
  return json;
}

export async function getAnnouncement(id: string) {
  const res = await fetch(`${BASE_URL}/announcements/${id}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch announcement');
  return json;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  excerpt?: string;
  type: string;
  status: 'DRAFT' | 'PUBLISHED';
  categoryId?: string;
  coverImageId?: string;
  academicYearId?: string;
  mediaIds?: string[];
  audiences: Array<{
    targetType: string;
    collegeId?: string;
    programmeId?: string;
    yearOfStudy?: number;
    semester?: number;
    roleTarget?: string;
  }>;
}

export async function createAnnouncement(data: CreateAnnouncementData) {
  const res = await fetch(`${BASE_URL}/announcements`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create announcement');
  return json;
}

export async function updateAnnouncement(id: string, data: Partial<CreateAnnouncementData>) {
  const res = await fetch(`${BASE_URL}/announcements/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update announcement');
  return json;
}

export async function deleteAnnouncement(id: string) {
  const res = await fetch(`${BASE_URL}/announcements/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete announcement');
  return json;
}

export async function pinAnnouncement(id: string) {
  const res = await fetch(`${BASE_URL}/announcements/${id}/pin`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to pin announcement');
  return json;
}

export async function getCategories() {
  const res = await fetch(`${BASE_URL}/categories`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch categories');
  return json;
}

export async function getColleges() {
  const res = await fetch(`${BASE_URL}/colleges`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch colleges');
  return json;
}

export async function getProgrammes() {
  const res = await fetch(`${BASE_URL}/programmes`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch programmes');
  return json;
}

export async function uploadMedia(formData: FormData) {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/media/upload`, {
    method: 'POST',
    headers,
    body: formData,
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to upload media');
  return json;
}
