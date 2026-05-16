import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { colleges } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { createCollegeSchema } from "@/lib/validators/colleges";
import { logAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    // Public endpoint: Any user (even unauthenticated) can list colleges (needed for registration)
    const collegesList = await db.select().from(colleges).orderBy(asc(colleges.shortName));
    return successResponse(collegesList);
  } catch (error) {
    console.error("GET /api/colleges error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    
    // Only admins can create colleges
    const hasPerm = await checkPermission(auth.user.roleIds, "college.manage");
    if (!hasPerm) {
        // Fallback: check if role name is admin (if permissions are not yet seeded)
        // However, better to seed them.
        return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validation = createCollegeSchema.safeParse(body);
    if (!validation.success) return errorResponse("Validation failed", 400, validation.error.format());

    const { name, shortName } = validation.data;

    // Check if shortName already exists
    const existing = await db.select().from(colleges).where(eq(colleges.shortName, shortName)).limit(1);
    if (existing.length > 0) return errorResponse("College with this short name already exists", 409);

    const [newCollege] = await db.insert(colleges)
      .values({ name, shortName })
      .returning();

    await logAction({
      userId: auth.user.userId,
      action: "CREATE_COLLEGE",
      entity: "COLLEGE",
      entityId: newCollege.id,
      ipAddress: req.headers.get("x-real-ip") || "Unknown"
    });

    return successResponse(newCollege, "College created successfully", 201);
  } catch (error) {
    console.error("POST /api/colleges error:", error);
    return errorResponse("Internal server error", 500);
  }
}
