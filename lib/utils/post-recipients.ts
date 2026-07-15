import { db } from "@/lib/db";
import {
  users,
  roles,
  programmes,
  departments,
  userRoles,
  groupMemberships,
  postAudiences,
} from "@/lib/db/schema";
import { eq, and, isNull, type SQL } from "drizzle-orm";
import { filterByPreferences } from "@/lib/utils/filter-by-preferences";

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

    case "COLLEGE": {
      if (!row.collegeId) return [];
      // Match users.college_id OR college via programme → department (common for students).
      const direct = await activeUserIdsWhere([eq(users.collegeId, row.collegeId)]);
      const viaProgramme = await db
        .select({ id: users.id })
        .from(users)
        .innerJoin(programmes, eq(users.programmeId, programmes.id))
        .innerJoin(departments, eq(programmes.departmentId, departments.id))
        .where(
          and(
            eq(departments.collegeId, row.collegeId),
            eq(users.isActive, true),
            isNull(users.deletedAt),
          ),
        )
        .then((rows) => rows.map((r) => r.id));
      // Role-scoped college (DARUSO assignment) also counts.
      const viaRole = await db
        .select({ id: users.id })
        .from(userRoles)
        .innerJoin(users, eq(userRoles.userId, users.id))
        .where(
          and(
            eq(userRoles.collegeId, row.collegeId),
            isNull(userRoles.revokedAt),
            eq(users.isActive, true),
            isNull(users.deletedAt),
          ),
        )
        .then((rows) => rows.map((r) => r.id));
      return Array.from(new Set([...direct, ...viaProgramme, ...viaRole]));
    }

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

  return filterByPreferences(Array.from(idSet), "posts");
}
