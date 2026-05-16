import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export async function requireAdminSession() {
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

  return {
    userId: payload.userId,
    email: payload.email,
    roleIds,
  };
}
