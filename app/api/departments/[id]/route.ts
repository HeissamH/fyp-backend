import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateDepartmentSchema } from "@/lib/validators/departments";
import { logAction } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [dept] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);

    if (!dept) return errorResponse("Department not found", 404);
    return successResponse(dept);
  } catch (error) {
    console.error("GET /api/departments/[id] error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user)
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);

    const hasPerm = await checkPermission(auth.user.roleIds, "college.manage");
    if (!hasPerm) return errorResponse("Forbidden. Missing required permission.", 403);

    const { id } = await params;
    const body = await req.json();
    const validation = updateDepartmentSchema.safeParse(body);
    if (!validation.success)
      return errorResponse("Validation failed", 400, validation.error.format());

    if (validation.data.shortName && validation.data.collegeId) {
      const existing = await db
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.collegeId, validation.data.collegeId),
            eq(departments.shortName, validation.data.shortName),
            ne(departments.id, id)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        return errorResponse("A department with this abbreviation already exists in this college", 409);
      }
    }

    const [updated] = await db
      .update(departments)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();

    if (!updated) return errorResponse("Department not found", 404);

    await logAction({
      userId: auth.user.userId,
      action: "UPDATE_DEPARTMENT",
      entity: "DEPARTMENT",
      entityId: id,
    });

    return successResponse(updated, "Department updated successfully");
  } catch (error) {
    console.error("PATCH /api/departments/[id] error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user)
      return errorResponse(auth.error || "Unauthorized", auth.status || 401);

    const hasPerm = await checkPermission(auth.user.roleIds, "college.manage");
    if (!hasPerm) return errorResponse("Forbidden. Missing required permission.", 403);

    const { id } = await params;
    const [deleted] = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();

    if (!deleted) return errorResponse("Department not found", 404);

    await logAction({
      userId: auth.user.userId,
      action: "DELETE_DEPARTMENT",
      entity: "DEPARTMENT",
      entityId: id,
    });

    return successResponse(null, "Department deleted successfully");
  } catch (error) {
    console.error("DELETE /api/departments/[id] error:", error);
    return errorResponse("Internal server error", 500);
  }
}
