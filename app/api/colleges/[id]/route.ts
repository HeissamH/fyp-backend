import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { colleges } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateCollegeSchema } from "@/lib/validators/colleges";
import { logAction } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [college] = await db
      .select()
      .from(colleges)
      .where(eq(colleges.id, id))
      .limit(1);

    if (!college) return errorResponse("College not found", 404);
    return successResponse(college);
  } catch (error) {
    console.error("GET /api/colleges/[id] error:", error);
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
    const validation = updateCollegeSchema.safeParse(body);
    if (!validation.success)
      return errorResponse("Validation failed", 400, validation.error.format());

    if (validation.data.shortName) {
      const existing = await db
        .select({ id: colleges.id })
        .from(colleges)
        .where(
          and(
            eq(colleges.shortName, validation.data.shortName),
            ne(colleges.id, id)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        return errorResponse("A college with this abbreviation already exists", 409);
      }
    }

    const [updated] = await db
      .update(colleges)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(eq(colleges.id, id))
      .returning();

    if (!updated) return errorResponse("College not found", 404);

    await logAction({
      userId: auth.user.userId,
      action: "UPDATE_COLLEGE",
      entity: "COLLEGE",
      entityId: id,
    });

    return successResponse(updated, "College updated successfully");
  } catch (error) {
    console.error("PATCH /api/colleges/[id] error:", error);
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
      .delete(colleges)
      .where(eq(colleges.id, id))
      .returning();

    if (!deleted) return errorResponse("College not found", 404);

    await logAction({
      userId: auth.user.userId,
      action: "DELETE_COLLEGE",
      entity: "COLLEGE",
      entityId: id,
    });

    return successResponse(null, "College deleted successfully");
  } catch (error) {
    console.error("DELETE /api/colleges/[id] error:", error);
    return errorResponse("Internal server error", 500);
  }
}
