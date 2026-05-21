import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comments, users, media, reactions } from "@/lib/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { createCommentSchema } from "@/lib/validators/comments";
import { logAction } from "@/lib/audit";

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

// ─── GET /api/comments?targetId=X&targetType=Y ───────────────────────────────
export const GET = withAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const targetId = url.searchParams.get("targetId");
  const targetType = url.searchParams.get("targetType");

  if (!targetId || !targetType) {
    return errorResponse("targetId and targetType are required", 400);
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
