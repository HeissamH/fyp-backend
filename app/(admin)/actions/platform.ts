'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? "https://www.udsminfo.com" : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

// COLLEGES
export async function getColleges() {
  const res = await fetch(`${BASE_URL}/colleges`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch colleges');
  return json;
}

export async function createCollege(data: { name: string; shortName: string }) {
  const res = await fetch(`${BASE_URL}/colleges`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) return { error: json.message || 'Failed to create college' };
  return json;
}

export async function updateCollege(id: string, data: any) {
  const res = await fetch(`${BASE_URL}/colleges/${id}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) return { error: json.message || 'Failed to update college' };
  return json;
}

export async function deleteCollege(id: string) {
  const res = await fetch(`${BASE_URL}/colleges/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete college');
  return json;
}

// DEPARTMENTS
export async function getDepartments(collegeId?: string) {
  const url = collegeId
    ? `${BASE_URL}/departments?collegeId=${collegeId}`
    : `${BASE_URL}/departments`;
  const res = await fetch(url, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch departments');
  return json;
}

export async function createDepartment(data: { name: string; shortName: string; collegeId: string }) {
  const res = await fetch(`${BASE_URL}/departments`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) return { error: json.message || 'Failed to create department' };
  return json;
}

export async function updateDepartment(id: string, data: any) {
  const res = await fetch(`${BASE_URL}/departments/${id}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) return { error: json.message || 'Failed to update department' };
  return json;
}

export async function deleteDepartment(id: string) {
  const res = await fetch(`${BASE_URL}/departments/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete department');
  return json;
}
// PROGRAMMES
export async function getProgrammes(collegeId?: string) {
  const url = collegeId ? `${BASE_URL}/programmes?collegeId=${collegeId}` : `${BASE_URL}/programmes`;
  const res = await fetch(url, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch programmes');
  return json;
}

export async function createProgramme(data: { name: string; code: string; departmentId: string; durationYears: number }) {
  const res = await fetch(`${BASE_URL}/programmes`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) return { error: json.message || 'Failed to create programme' };
  return json;
}

export async function updateProgramme(id: string, data: any) {
  const res = await fetch(`${BASE_URL}/programmes/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) return { error: json.message || 'Failed to update programme' };
  return json;
}

export async function deleteProgramme(id: string) {
  const res = await fetch(`${BASE_URL}/programmes/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete programme');
  return json;
}

// ACADEMIC YEARS
export async function getAcademicYears() {
  const res = await fetch(`${BASE_URL}/academic-years`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch academic years');
  return json;
}

export async function createAcademicYear(data: {
  year?: string;
  label?: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}) {
  // API expects `label`; admin UI historically sent `year`.
  const label = (data.label || data.year || '').trim();
  const res = await fetch(`${BASE_URL}/academic-years`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      label,
      startDate: data.startDate,
      endDate: data.endDate,
    }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create academic year');

  // Optionally mark current after create
  if (data.isCurrent && json?.data?.id) {
    try {
      await setCurrentAcademicYear(json.data.id);
    } catch {
      // year created; current flag is best-effort
    }
  }
  return json;
}

export async function setCurrentAcademicYear(id: string) {
  const res = await fetch(`${BASE_URL}/academic-years/${id}/set-current`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to set current academic year');
  return json;
}
