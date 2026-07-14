import { db } from "@/lib/db";
import { posts, users, media } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export type PublicPost = {
  id: string;
  title: string | null;
  content: string;
  type: string;
  publishedAt: Date | null;
  authorName: string | null;
  imageUrl: string | null;
};

/** Published, non-deleted post for share links / Open Graph (no auth). */
export async function getPublicPost(id: string): Promise<PublicPost | null> {
  const [row] = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      publishedAt: posts.publishedAt,
      authorName: users.fullName,
      imageUrl: media.url,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(media, eq(posts.mediaId, media.id))
    .where(
      and(
        eq(posts.id, id),
        eq(posts.status, "PUBLISHED"),
        isNull(posts.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export function excerpt(text: string, max = 160): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1)}…`;
}

export function siteBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.udsminfo.com";
  return raw.replace(/\/$/, "");
}
