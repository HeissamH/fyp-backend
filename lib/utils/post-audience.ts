import { db } from "@/lib/db";
import {
  users,
  roles,
  programmes,
  departments,
  groupMemberships,
  postAudiences,
  userRoles,
} from "@/lib/db/schema";
import { eq, and, or, isNull, inArray } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

export type UserPostProfile = {
  roleNames: string[];
  /** Effective college: users.college_id, else programme→department college, else null. */
  collegeId: string | null;
  roleCollegeId: string | null;
  programmeId: string | null;
  departmentId: string | null;
  yearOfStudy: number | null;
};

/** Normalize role labels: "Daruso_leader" → "daruso leader". */
export function normalizeRoleName(name: string): string {
  return name.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function roleNamesInclude(roleNames: string[], ...needles: string[]): boolean {
  const set = roleNames.map(normalizeRoleName);
  return needles.some((n) => set.includes(normalizeRoleName(n)));
}

/** DARUSO / college rep / college leader (any casing or underscores). */
export function isCollegeScopedLeader(roleNames: string[]): boolean {
  return roleNames.some((n) => {
    const x = normalizeRoleName(n);
    return (
      x.includes("daruso") ||
      x.includes("college rep") ||
      x.includes("college leader") ||
      x === "college_rep" ||
      x === "college rep"
    );
  });
}

export function isClassRepresentative(roleNames: string[]): boolean {
  return roleNames.some((n) => {
    const x = normalizeRoleName(n);
    // Avoid matching "college representative" as a class CR.
    if (x.includes("college")) return false;
    return x.includes("class representative") || x === "class representative" || x.includes("class rep");
  });
}

/**
 * Lecturers / department staff — posts should stay within their department.
 * Excludes elevated admins (checked separately).
 */
export function isDepartmentScopedStaff(roleNames: string[]): boolean {
  return roleNames.some((n) => {
    const x = normalizeRoleName(n);
    if (x === "admin" || x === "super admin") return false;
    return (
      x === "lecturer" ||
      x.includes("lecturer") ||
      x === "staff" ||
      x.includes("department staff") ||
      x.includes("dept staff")
    );
  });
}

export async function getUserPostProfile(userId: string): Promise<UserPostProfile | null> {
  // Alias: department from programme vs direct staff department assignment
  const [row] = await db
    .select({
      collegeId: users.collegeId,
      userDepartmentId: users.departmentId,
      programmeId: users.programmeId,
      programmeDepartmentId: programmes.departmentId,
      programmeCollegeId: departments.collegeId,
      yearOfStudy: users.yearOfStudy,
    })
    .from(users)
    .leftJoin(programmes, eq(users.programmeId, programmes.id))
    .leftJoin(departments, eq(programmes.departmentId, departments.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return null;

  const rolesForUser = await db
    .select({ name: roles.name, collegeId: userRoles.collegeId })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt)));

  // If a user has a role mapped to a college, we extract it.
  const roleCollegeId = rolesForUser.find((r) => r.collegeId !== null)?.collegeId ?? null;

  // Direct department (staff) or via programme (students)
  const departmentId = row.userDepartmentId ?? row.programmeDepartmentId ?? null;

  // College: direct, role, programme→dept college, or staff department's college
  let collegeId = row.collegeId ?? row.programmeCollegeId ?? roleCollegeId ?? null;
  if (!collegeId && row.userDepartmentId) {
    const [dept] = await db
      .select({ collegeId: departments.collegeId })
      .from(departments)
      .where(eq(departments.id, row.userDepartmentId))
      .limit(1);
    collegeId = dept?.collegeId ?? null;
  }

  return {
    roleNames: rolesForUser.map((r) => r.name),
    collegeId,
    roleCollegeId,
    programmeId: row.programmeId ?? null,
    departmentId,
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
  if (profile.collegeId || profile.roleCollegeId) {
    const collegeIds = [profile.collegeId, profile.roleCollegeId].filter(Boolean) as string[];
    audienceConditions.push(and(eq(postAudiences.targetType, "COLLEGE"), inArray(postAudiences.collegeId, collegeIds))!);
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
