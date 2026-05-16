import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, roles, userRoles } from "@/lib/db/schema";
import { eq, ilike, or, and, desc, isNull, inArray, sql } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/api-response";
import { parsePagination } from "@/lib/utils/pagination";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }

    const hasPermission = await checkPermission(auth.user.roleIds, "user.read");
    if (!hasPermission) {
      return errorResponse("Forbidden. Missing required permission.", 403);
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const { page, pageSize, offset } = parsePagination(searchParams);
    const qsSearch = searchParams.get("search") || "";
    const roleFilterId = searchParams.get("roleId");

    const conditions: ReturnType<typeof and>[] = [isNull(users.deletedAt)];

    if (qsSearch) {
      const orCond = or(ilike(users.fullName, `%${qsSearch}%`), ilike(users.registrationNumber, `%${qsSearch}%`), ilike(users.email, `%${qsSearch}%`));
      if (orCond) conditions.push(orCond);
    }

    if (roleFilterId) {
      const userIdsHavingRoleSub = db
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .where(and(eq(userRoles.roleId, roleFilterId), isNull(userRoles.revokedAt)));
      conditions.push(inArray(users.id, userIdsHavingRoleSub));
    }

    const whereClause = and(...conditions);

    const totalRecordsResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);
    const totalRecords = Number(totalRecordsResult[0].count);

    const usersList = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        registrationNumber: users.registrationNumber,
        sex: users.sex,
        email: users.email,
        isActive: users.isActive,
        programmeId: users.programmeId,
        yearOfStudy: users.yearOfStudy,
        currentSemester: users.currentSemester,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(users.createdAt));

    const ids = usersList.map((u) => u.id);
    const roleRows =
      ids.length === 0
        ? []
        : await db
            .select({ userId: userRoles.userId, roleId: roles.id, roleName: roles.name })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(and(inArray(userRoles.userId, ids), isNull(userRoles.revokedAt)));

    const rolesByUser = new Map<string, { id: string; name: string }[]>();
    for (const r of roleRows) {
      const list = rolesByUser.get(r.userId) ?? [];
      list.push({ id: r.roleId, name: r.roleName });
      rolesByUser.set(r.userId, list);
    }

    const withRoles = usersList.map((u) => ({
      ...u,
      roles: rolesByUser.get(u.id) ?? [],
    }));

    return paginatedResponse(withRoles, totalRecords, page, pageSize);
  } catch (error) {
    console.error("Users list error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  return errorResponse("Use /api/auth/register for user creation", 400);
}
