import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { filterByPreferences } from "@/lib/utils/filter-by-preferences";

/** Notify active users in the reporter's college (excluding reporter). */
export async function resolveLostFoundRecipientUserIds(
  reporterId: string,
  options?: { excludeUserId?: string },
): Promise<string[]> {
  const [reporter] = await db
    .select({ collegeId: users.collegeId })
    .from(users)
    .where(and(eq(users.id, reporterId), isNull(users.deletedAt)))
    .limit(1);

  if (!reporter?.collegeId) return [];

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.collegeId, reporter.collegeId),
        eq(users.isActive, true),
        isNull(users.deletedAt),
      ),
    );

  const excludeId = options?.excludeUserId ?? reporterId;
  const userIds = rows.map((r) => r.id).filter((id) => id !== excludeId);
  if (userIds.length === 0) return [];

  return filterByPreferences(userIds, "lostFound");
}