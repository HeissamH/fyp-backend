'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const APP_URL = process.env.NODE_ENV === "production" ? "https://www.udsminfo.com" : "http://localhost:3000";
const BASE_URL = `${APP_URL}/api`;

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  const json = await res.json();

  if (!res.ok) {
    return { success: false, message: json.message || 'Login failed' };
  }

  const token: string = json.data?.token;
  const user = json.data?.user;

  if (!token) return { success: false, message: 'No token returned' };

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };
  cookieStore.set('admin_token', token, cookieOpts);

  // Display name for topbar (httpOnly — read only in server components)
  if (user && typeof user === 'object') {
    cookieStore.set(
      'admin_profile',
      JSON.stringify({
        fullName: (user as { fullName?: string }).fullName ?? null,
        email: (user as { email?: string }).email ?? null,
      }),
      cookieOpts,
    );
  }

  return { success: true, user };
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  cookieStore.delete('admin_profile');
  redirect('/login');
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  return { token: token ?? null };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) return { success: false, message: json.message || 'Failed to change password' };
  return { success: true };
}

export async function changeEmailRequest(newEmail: string) {
  const res = await fetch(`${BASE_URL}/auth/change-email-request`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ newEmail }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) return { success: false, message: json.message || 'Failed to request email change' };
  return { success: true };
}

export async function changeEmailVerify(otp: string) {
  const res = await fetch(`${BASE_URL}/auth/change-email-verify`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ otp }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok) return { success: false, message: json.message || 'Failed to verify email change' };
  return { success: true };
}
