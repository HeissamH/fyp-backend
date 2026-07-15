import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comments, users, media, reactions } from "@/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/utils/api-response";
import { parsePagination } from "@/lib/utils/pagination";
import { createCommentSchema } from "@/lib/validators/comments";
import { logAction } from "@/lib/audit";

function isStaffOrAdmin(roleNames: string[]): boolean {
  return roleNames.some((n) => {
    const x = n.toLowerCase().replace(/_/g, " ");
    return x === "admin" || x === "super admin" || x === "staff";
  });
}

// ─── Helper: recursively build a nested comment tree ─────────────────────────
type RawComment = {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  imageUrl: string | null;
  likeCount: number;
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CommentNode = RawComment & { children: CommentNode[] };

function buildTree(flat: RawComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, children: [] });
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ─── GET /api/comments?targetId=X&targetType=Y
//     or /api/comments?recent=1 (staff/admin moderation queue) ────────────────
export const GET = withAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const targetId = url.searchParams.get("targetId");
  const targetType = url.searchParams.get("targetType");
  const recent = url.searchParams.get("recent");

  // Flat recent list for admin moderation (no tree)
  if (recent === "1") {
    if (!isStaffOrAdmin(ctx.user.roleNames)) {
      return errorResponse("Forbidden", 403);
    }
    const { page, pageSize, offset } = parsePagination(url.searchParams);
    const typeFilter = url.searchParams.get("targetType");

    const conditions = [isNull(comments.deletedAt)];
    if (typeFilter) conditions.push(eq(comments.targetType, typeFilter));
    const whereClause = and(...conditions);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(whereClause);
    const total = Number(totalResult[0].count);

    const list = await db
      .select({
        id: comments.id,
        parentId: comments.parentId,
        targetId: comments.targetId,
        targetType: comments.targetType,
        authorId: users.id,
        authorName: users.fullName,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(whereClause)
      .orderBy(desc(comments.createdAt))
      .limit(pageSize)
      .offset(offset);

    return paginatedResponse(list, total, page, pageSize);
  }

  if (!targetId || !targetType) {
    return errorResponse("targetId and targetType are required (or use recent=1)", 400);
  }

  const flat = await db
    .select({
      id: comments.id,
      parentId: comments.parentId,
      authorId: users.id,
      authorName: users.fullName,
      content: comments.content,
      imageUrl: media.url,
      likeCount: sql<number>`CAST((SELECT count(*) FROM ${reactions} WHERE ${reactions.targetId} = ${comments.id} AND ${reactions.targetType} = 'COMMENT') AS INT)`,
      isLiked: sql<boolean>`EXISTS(SELECT 1 FROM ${reactions} WHERE ${reactions.targetId} = ${comments.id} AND ${reactions.targetType} = 'COMMENT' AND ${reactions.userId} = ${ctx.user.userId})`,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .leftJoin(media, eq(comments.mediaId, media.id))
    .where(
      and(
        eq(comments.targetId, targetId),
        eq(comments.targetType, targetType),
        isNull(comments.deletedAt)
      )
    )
    .orderBy(desc(comments.createdAt));

  const tree = buildTree(flat as RawComment[]);
  return successResponse(tree);
});

// ─── POST /api/comments ───────────────────────────────────────────────────────
export const POST = withAuth(async (req, ctx) => {
  const body = await req.json();
  const validation = createCommentSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse("Validation failed", 400, validation.error.format());
  }

  const { targetId, targetType, content, parentId, mediaId } = validation.data;

  // If a parentId is given, ensure it belongs to the same target
  if (parentId) {
    const [parent] = await db
      .select({ id: comments.id, targetId: comments.targetId })
      .from(comments)
      .where(and(eq(comments.id, parentId), isNull(comments.deletedAt)))
      .limit(1);

    if (!parent) return errorResponse("Parent comment not found", 404);
    if (parent.targetId !== targetId) {
      return errorResponse("Parent comment belongs to a different target", 400);
    }
  }

  const [created] = await db
    .insert(comments)
    .values({
      authorId: ctx.user.userId,
      targetId,
      targetType,
      content,
      parentId: parentId ?? null,
      mediaId: mediaId ?? null,
    })
    .returning();

  await logAction({
    userId: ctx.user.userId,
    action: "CREATE_COMMENT",
    entity: "COMMENT",
    entityId: created.id,
    metadata: { targetType, targetId, isReply: !!parentId },
  });

  return successResponse(created, "Comment posted successfully", 201);
});
