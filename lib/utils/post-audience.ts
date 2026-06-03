import { db } from "@/lib/db";
import {
  users,
  roles,
  programmes,
  groupMemberships,
  postAudiences,
  userRoles,
} from "@/lib/db/schema";
import { eq, and, or, isNull, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

export type UserPostProfile = {
  roleNames: string[];
  collegeId: string | null;
  roleCollegeId: string | null;
  programmeId: string | null;
  departmentId: string | null;
  yearOfStudy: number | null;
};

export async function getUserPostProfile(userId: string): Promise<UserPostProfile | null> {
  const [row] = await db
    .select({
      collegeId: users.collegeId,
      programmeId: users.programmeId,
      departmentId: programmes.departmentId,
      yearOfStudy: users.yearOfStudy,
    })
    .from(users)
    .leftJoin(programmes, eq(users.programmeId, programmes.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return null;

  const rolesForUser = await db
    .select({ name: roles.name, collegeId: userRoles.collegeId })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt)));

  // If a user has a role mapped to a college, we extract it.
  const roleCollegeId = rolesForUser.find(r => r.collegeId !== null)?.collegeId ?? null;

  return {
    roleNames: rolesForUser.map((r) => r.name),
    collegeId: row.collegeId ?? null,
    roleCollegeId,
    programmeId: row.programmeId ?? null,
    departmentId: row.departmentId ?? null,
    yearOfStudy: row.yearOfStudy ?? null,
  };
}

/** Active group IDs for the user (leftAt is null). */
export async function getActiveGroupIdsForUser(userId: string): Promise<string[]> {
  const rows = await db
    .select({ groupId: groupMemberships.groupId })
    .from(groupMemberships)
    .where(and(eq(groupMemberships.userId, userId), isNull(groupMemberships.leftAt)));
  return rows.map((r) => r.groupId);
}

export function buildPostAudienceConditions(profile: UserPostProfile, groupIds: string[]): SQL[] {
  const audienceConditions: SQL[] = [eq(postAudiences.targetType, "ALL")];

  if (profile.roleNames.length > 0) {
    audienceConditions.push(
      and(eq(postAudiences.targetType, "ROLE"), inArray(postAudiences.roleTarget, profile.roleNames))!,
    );
  }
  if (profile.collegeId) {
    audienceConditions.push(and(eq(postAudiences.targetType, "COLLEGE"), eq(postAudiences.collegeId, profile.collegeId))!);
  }
  if (profile.departmentId) {
    audienceConditions.push(
      and(eq(postAudiences.targetType, "DEPARTMENT"), eq(postAudiences.departmentId, profile.departmentId))!,
    );
  }
  if (profile.programmeId) {
    audienceConditions.push(
      and(eq(postAudiences.targetType, "PROGRAMME"), eq(postAudiences.programmeId, profile.programmeId))!,
    );
    if (profile.yearOfStudy != null) {
      audienceConditions.push(
        and(
          eq(postAudiences.targetType, "PROGRAMME_YEAR"),
          eq(postAudiences.programmeId, profile.programmeId),
          eq(postAudiences.yearOfStudy, profile.yearOfStudy),
        )!,
      );
    }
  }
  if (groupIds.length > 0) {
    audienceConditions.push(and(eq(postAudiences.targetType, "GROUP"), inArray(postAudiences.groupId, groupIds))!);
  }

  return audienceConditions;
}

export function matchingPostIdsSubquery(audienceConditions: SQL[]) {
  return db
    .select({ id: postAudiences.postId })
    .from(postAudiences)
    .where(or(...audienceConditions));
}
