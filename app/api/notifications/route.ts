import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { withAuth } from "@/lib/auth/middleware";
import { parsePagination } from "@/lib/utils/pagination";
import { NextResponse } from "next/server";

export const GET = withAuth(async (req, ctx) => {
  const { page, pageSize, offset } = parsePagination(new URL(req.url).searchParams);
  const userId = ctx.user.userId;

  const whereUser = eq(notifications.userId, userId);

  const [totalRow, unreadRow, list] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(notifications).where(whereUser),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(whereUser, eq(notifications.isRead, false))),
    db
      .select({
        id: notifications.id,
        title: notifications.title,
        body: notifications.body,
        type: notifications.type,
        targetId: notifications.targetId,
        targetType: notifications.targetType,
        isRead: notifications.isRead,
        sentAt: notifications.sentAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(whereUser)
      .orderBy(desc(notifications.sentAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(totalRow[0]?.count ?? 0);
  const unreadCount = Number(unreadRow[0]?.count ?? 0);

  return NextResponse.json({
    success: true,
    message: "Success",
    data: list,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      unreadCount,
    },
  });
});
