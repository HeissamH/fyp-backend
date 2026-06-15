import { db } from "@/lib/db";
import {
  users,
  roles,
  userRoles,
  announcementAudiences,
} from "@/lib/db/schema";
import { eq, and, isNull, inArray, type SQL } from "drizzle-orm";
import { filterByPreferences } from "@/lib/utils/filter-by-preferences";

type AudienceRow = typeof announcementAudiences.$inferSelect;

async function activeUserIdsWhere(extra: SQL[] = []): Promise<string[]> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(...extra, eq(users.isActive, true), isNull(users.deletedAt)));
  return rows.map((r) => r.id);
}

async function usersForAudienceRow(row: AudienceRow): Promise<string[]> {
  switch (row.targetType) {
    case "ALL":
      return activeUserIdsWhere([]);

    case "ROLE":
      if (!row.roleTarget) return [];
      return db
        .select({ id: users.id })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(users, eq(userRoles.userId, users.id))
        .where(
          and(
            eq(roles.name, row.roleTarget),
            isNull(userRoles.revokedAt),
            eq(users.isActive, true),
            isNull(users.deletedAt),
          ),
        )
        .then((rows) => rows.map((r) => r.id));

    case "COLLEGE":
      if (!row.collegeId) return [];
      return activeUserIdsWhere([eq(users.collegeId, row.collegeId)]);

    case "PROGRAMME":
      if (!row.programmeId) return [];
      return activeUserIdsWhere([eq(users.programmeId, row.programmeId)]);

    case "PROGRAMME_YEAR":
      if (!row.programmeId || row.yearOfStudy == null) return [];
      return activeUserIdsWhere([
        eq(users.programmeId, row.programmeId),
        eq(users.yearOfStudy, row.yearOfStudy),
      ]);

    default:
      return [];
  }
}

/** Users who should receive a notification for this announcement. */
export async function resolveAnnouncementRecipientUserIds(
  announcementId: string,
  options?: { excludeUserId?: string },
): Promise<string[]> {
  const audiences = await db
    .select()
    .from(announcementAudiences)
    .where(eq(announcementAudiences.announcementId, announcementId));

  const idSet = new Set<string>();
  for (const row of audiences) {
    const ids = await usersForAudienceRow(row);
    ids.forEach((id) => idSet.add(id));
  }

  if (options?.excludeUserId) {
    idSet.delete(options.excludeUserId);
  }

  if (idSet.size === 0) return [];

  return filterByPreferences(Array.from(idSet), "announcements");
}