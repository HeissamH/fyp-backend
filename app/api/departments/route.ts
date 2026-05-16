import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { departments, colleges } from "@/lib/db/schema";
import { eq, asc, sql, and } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { createDepartmentSchema } from "@/lib/validators/departments";
import { logAction } from "@/lib/audit";

/** Public list (e.g. registration); filter by college via ?collegeId= */
export async function GET(req: NextRequest) {
  try {
    const qsCollegeId = new URL(req.url).searchParams.get("collegeId");

    const rows = await db
      .select({
        id: departments.id,
        collegeId: departments.collegeId,
        name: departments.name,
        shortName: departments.shortName,
        collegeName: colleges.name,
        collegeShortName: colleges.shortName,
        createdAt: departments.createdAt,
      })
      .from(departments)
      .innerJoin(colleges, eq(departments.collegeId, colleges.id))
      .where(qsCollegeId ? eq(departments.collegeId, qsCollegeId) : sql`true`)
      .orderBy(asc(colleges.shortName), asc(departments.name));

    return successResponse(rows);
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) {
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    }

    const hasPerm = await checkPermission(auth.user.roleIds, "college.manage");
    if (!hasPerm) {
      return errorResponse("Forbidden. Missing required permission.", 403);
    }

    const body = await req.json();
    const validation = createDepartmentSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Validation failed", 400, validation.error.format());
    }

    const collegeExists = await db
      .select({ id: colleges.id })
      .from(colleges)
      .where(eq(colleges.id, validation.data.collegeId))
      .limit(1);
    if (collegeExists.length === 0) {
      return errorResponse("College not found", 404);
    }

    const deptExists = await db
      .select({ id: departments.id })
      .from(departments)
      .where(
        and(
          eq(departments.collegeId, validation.data.collegeId),
          eq(departments.shortName, validation.data.shortName)
        )
      )
      .limit(1);
      
    if (deptExists.length > 0) {
      return errorResponse("A department with this abbreviation already exists in this college", 409);
    }

    const [created] = await db.insert(departments).values(validation.data).returning();

    await logAction({
      userId: auth.user.userId,
      action: "CREATE_DEPARTMENT",
      entity: "DEPARTMENT",
      entityId: created.id,
    });

    return successResponse(created, "Department created successfully", 201);
  } catch (error) {
    console.error("POST /api/departments error:", error);
    return errorResponse("Internal server error", 500);
  }
}
