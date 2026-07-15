import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export type AdminSession = {
  userId: string;
  email?: string;
  fullName?: string | null;
  roleIds: string[];
};

function readAdminProfile(cookieStore: Awaited<ReturnType<typeof cookies>>): {
  fullName?: string | null;
  email?: string | null;
} {
  try {
    const raw = cookieStore.get("admin_profile")?.value;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { fullName?: string; email?: string };
    return {
      fullName: parsed.fullName ?? null,
      email: parsed.email ?? null,
    };
  } catch {
    return {};
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = jwt.decode(token) as {
    userId?: string;
    email?: string;
    roleIds?: string[];
    roleId?: string;
  };
  if (!payload || !payload.userId) {
    redirect("/login");
  }

  const roleIds = Array.isArray(payload.roleIds)
    ? payload.roleIds
    : payload.roleId
      ? [payload.roleId]
      : [];

  const profile = readAdminProfile(cookieStore);

  return {
    userId: payload.userId,
    email: profile.email || payload.email,
    fullName: profile.fullName ?? null,
    roleIds,
  };
}
