'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? "https://www.udsminfo.com" : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
}

export async function getUsers({ page = 1, pageSize = 20, search = '', roleId }: GetUsersParams = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set('search', search);
  if (roleId) params.set('roleId', roleId);

  const res = await fetch(`${BASE_URL}/users?${params}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch users');
  return json; // { success, data: User[], meta: { total, page, pageSize, totalPages } }
}

export async function getUser(id: string) {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch user');
  return json;
}

export async function getCurrentUser() {
  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch current user');
  return json;
}

export async function updateUser(
  id: string,
  data: { fullName?: string; isActive?: boolean; email?: string; programmeId?: string; collegeId?: string },
) {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update user');
  return json;
}

export async function assignUserRole(userId: string, roleId: string) {
  const res = await fetch(`${BASE_URL}/users/${userId}/roles`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ roleId }),
    cache: 'no-store',
  });
  const json = await res.json();
  console.log('[assignUserRole] status:', res.status, 'response:', JSON.stringify(json));
  if (!res.ok) throw new Error(json.message || 'Failed to assign role');
  return json;
}

export async function revokeUserRole(userId: string, roleId: string) {
  const res = await fetch(`${BASE_URL}/users/${userId}/roles`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ roleId }),
    cache: 'no-store',
  });
  const json = await res.json();
  console.log('[revokeUserRole] status:', res.status, 'response:', JSON.stringify(json));
  if (!res.ok) throw new Error(json.message || 'Failed to revoke role');
  return json;
}

export async function deleteUser(id: string) {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete user');
  return json;
}

export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  roleIds?: string[];
  collegeId?: string;
  programmeId?: string;
  yearOfStudy?: number;
  registrationNumber?: string;
}

export async function createUser(data: CreateUserData) {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create user');
  return json;
}
