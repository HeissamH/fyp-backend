import { db } from "@/lib/db";
import {
  users,
  roles,
  programmes,
  userRoles,
  groupMemberships,
  postAudiences,
  userNotificationPreferences,
} from "@/lib/db/schema";
import { eq, and, isNull, inArray, type SQL } from "drizzle-orm";

type AudienceRow = typeof postAudiences.$inferSelect;

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

    case "DEPARTMENT":
      if (!row.departmentId) return [];
      return db
        .select({ id: users.id })
        .from(users)
        .innerJoin(programmes, eq(users.programmeId, programmes.id))
        .where(
          and(
            eq(programmes.departmentId, row.departmentId),
            eq(users.isActive, true),
            isNull(users.deletedAt),
          ),
        )
        .then((rows) => rows.map((r) => r.id));

    case "PROGRAMME":
      if (!row.programmeId) return [];
      return activeUserIdsWhere([eq(users.programmeId, row.programmeId)]);

    case "PROGRAMME_YEAR":
      if (!row.programmeId || row.yearOfStudy == null) return [];
      return activeUserIdsWhere([
        eq(users.programmeId, row.programmeId),
        eq(users.yearOfStudy, row.yearOfStudy),
      ]);

    case "GROUP":
      if (!row.groupId) return [];
      return db
        .select({ id: users.id })
        .from(groupMemberships)
        .innerJoin(users, eq(groupMemberships.userId, users.id))
        .where(
          and(
            eq(groupMemberships.groupId, row.groupId),
            isNull(groupMemberships.leftAt),
            eq(users.isActive, true),
            isNull(users.deletedAt),
          ),
        )
        .then((rows) => rows.map((r) => r.id));

    default:
      return [];
  }
}

/** Users who should receive a notification for this post (inverse of feed audience logic). */
export async function resolveRecipientUserIds(
  postId: string,
  options?: { excludeUserId?: string },
): Promise<string[]> {
  const audiences = await db
    .select()
    .from(postAudiences)
    .where(eq(postAudiences.postId, postId));

  const idSet = new Set<string>();
  for (const row of audiences) {
    const ids = await usersForAudienceRow(row);
    ids.forEach((id) => idSet.add(id));
  }

  if (options?.excludeUserId) {
    idSet.delete(options.excludeUserId);
  }

  if (idSet.size === 0) return [];

  const userIdList = Array.from(idSet);
  const optedOut = await db
    .select({ userId: userNotificationPreferences.userId })
    .from(userNotificationPreferences)
    .where(
      and(
        inArray(userNotificationPreferences.userId, userIdList),
        eq(userNotificationPreferences.posts, false),
      ),
    );

  const optedOutSet = new Set(optedOut.map((r) => r.userId));
  return userIdList.filter((id) => !optedOutSet.has(id));
}
