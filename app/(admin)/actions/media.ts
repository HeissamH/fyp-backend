'use server';

import { getAuthHeaders } from './auth';

const APP_URL = process.env.NODE_ENV === "production" ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://udsminfo.com") : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export async function uploadMedia(formData: FormData) {
  const headers = await getAuthHeaders();
  // Remove Content-Type so browser sets it automatically with the boundary
  delete headers['Content-Type'];

  const res = await fetch(`${BASE_URL}/media/upload`, {
    method: 'POST',
    headers,
    body: formData,
    cache: 'no-store',
  });
  
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to upload media');
  return json; // returns `{ success: true, data: { id, url } }`
}
