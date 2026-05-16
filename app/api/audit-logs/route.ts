import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { desc, and, eq, gte, lte, sql } from "drizzle-orm";
import { authenticateRequest, checkPermission } from "@/lib/auth/middleware";
import { errorResponse, paginatedResponse } from "@/lib/utils/api-response";
import { parsePagination } from "@/lib/utils/pagination";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth.error || !auth.user) return errorResponse(auth.error || "Unauthorized", auth.status || 401);
    
    // Only admins with 'audit.read' should view logs
    const hasPerm = await checkPermission(auth.user.roleIds, "audit.read"); 
    if (!hasPerm) return errorResponse("Forbidden. Missing required permission.", 403);
    
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const { page, pageSize, offset } = parsePagination(searchParams);
    
    // Filters
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const entity = searchParams.get("entity");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    const conditions = [];
    
    if (action) conditions.push(eq(auditLogs.action, action));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (entity) conditions.push(eq(auditLogs.entity, entity));
    
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) conditions.push(gte(auditLogs.createdAt, start));
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) conditions.push(lte(auditLogs.createdAt, end));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const query = db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
      userFullName: users.fullName,
      userEmail: users.email
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(whereClause);

    const totalRecordsResult = await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(whereClause);
    const totalRecords = Number(totalRecordsResult[0].count);

    const logsList = await query.limit(pageSize).offset(offset).orderBy(desc(auditLogs.createdAt));

    return paginatedResponse(logsList, totalRecords, page, pageSize);
  } catch (error) {
    console.error("Audit logs API error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// Audit logs shouldn't be manipulated via standard CRUD APIs.
export async function POST() { return errorResponse("Audit logs are write-only internally.", 403); }
export async function PUT() { return errorResponse("Audit logs are immutable.", 403); }
export async function DELETE() { return errorResponse("Audit logs cannot be deleted.", 403); }
