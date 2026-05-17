'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://udsminfo.com") : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export async function getStories() {
  const res = await fetch(`${BASE_URL}/stories`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch stories');
  return json;
}

export interface CreateStoryData {
  mediaId: string;
  collegeId?: string;
  caption?: string;
  backgroundColor?: string;
  linkUrl?: string;
  linkText?: string;
}

export async function createStory(data: CreateStoryData) {
  const res = await fetch(`${BASE_URL}/stories`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create story');
  return json;
}

export async function deleteStory(id: string) {
  const res = await fetch(`${BASE_URL}/stories/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to delete story');
  return json;
}
