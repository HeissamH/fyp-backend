'use server';

import { getAuthHeaders } from './auth';

const BASE_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api`;

export interface GetGroupsParams {
  type?: string;
  search?: string;
}

export async function getGroups({ type, search }: GetGroupsParams = {}) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (search) params.set('search', search);

  const res = await fetch(`${BASE_URL}/groups?${params}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch groups');
  return json;
}

export interface CreateGroupData {
  name: string;
  type: 'CLUB' | 'HOSTEL' | 'DEPARTMENT' | 'OTHER';
  parentId?: string;
  description?: string;
}

export async function createGroup(data: CreateGroupData) {
  const res = await fetch(`${BASE_URL}/groups`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create group');
  return json;
}

export async function getGroup(id: string) {
  const res = await fetch(`${BASE_URL}/groups/${id}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch group');
  return json;
}

export async function updateGroup(id: string, data: Partial<CreateGroupData>) {
  const res = await fetch(`${BASE_URL}/groups/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update group');
  return json;
}

export async function deleteGroup(id: string) {
  const res = await fetch(`${BASE_URL}/groups/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete group');
  return json;
}
