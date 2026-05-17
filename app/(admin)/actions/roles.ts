'use server';

import { getAuthHeaders } from './auth';

const BASE_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api`;

export async function getRoles() {
  const res = await fetch(`${BASE_URL}/roles`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch roles');
  return json;
}

export async function getRole(id: string) {
  const res = await fetch(`${BASE_URL}/roles/${id}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch role');
  return json;
}

export async function createRole(data: { name: string; description?: string; permissions?: string[] }) {
  const res = await fetch(`${BASE_URL}/roles`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create role');
  return json;
}

export async function updateRole(id: string, data: { name?: string; description?: string; permissions?: string[] }) {
  const res = await fetch(`${BASE_URL}/roles/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update role');
  return json;
}

export async function deleteRole(id: string) {
  const res = await fetch(`${BASE_URL}/roles/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete role');
  return json;
}

export async function getPermissions() {
  const res = await fetch(`${BASE_URL}/permissions`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch permissions');
  return json;
}
