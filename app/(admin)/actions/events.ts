'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? "https://www.udsminfo.com" : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export interface GetEventsParams {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  status?: string;
  upcoming?: boolean;
}

export async function getEvents({ page = 1, pageSize = 20, categoryId, status, upcoming }: GetEventsParams = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (categoryId) params.set('categoryId', categoryId);
  if (status) params.set('status', status);
  if (upcoming) params.set('upcoming', 'true');

  const res = await fetch(`${BASE_URL}/events?${params}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch events');
  return json;
}

export async function getEvent(id: string) {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch event');
  return json;
}

export interface CreateEventData {
  title: string;
  description: string;
  categoryId?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  location?: string;
  locationUrl?: string;
  startDateTime: string;
  endDateTime: string;
  maxAttendees?: number;
  coverImageId?: string;
  academicYearId?: string;
}

export async function createEvent(data: CreateEventData) {
  const res = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create event');
  return json;
}

export async function updateEvent(id: string, data: Partial<CreateEventData>) {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update event');
  return json;
}

export async function deleteEvent(id: string) {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete event');
  return json;
}

export async function getEventAttendees(id: string, page = 1, pageSize = 20) {
  const res = await fetch(`${BASE_URL}/events/${id}/attendees?page=${page}&pageSize=${pageSize}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch attendees');
  return json;
}

export async function getEventCategories() {
  const res = await fetch(`${BASE_URL}/event-categories`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch event categories');
  return json;
}
