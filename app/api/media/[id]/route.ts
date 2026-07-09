import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { supabase, STORAGE_BUCKET } from "@/lib/storage";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  if (!id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const [record] = await db
      .select({ storagePath: media.storagePath, url: media.url })
      .from(media)
      .where(eq(media.id, id))
      .limit(1);

    if (!record) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (!record.storagePath) {
      // Fallback for older records without a storagePath
      return NextResponse.redirect(record.url);
    }

    // Bucket is Public — use the direct permanent public URL.
    // This avoids signed URL generation failures and is simpler/faster.
    const { data: publicData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(record.storagePath);

    if (!publicData?.publicUrl) {
      console.error(`Could not get public URL for media ${id}`);
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    // Redirect to the stable public URL (301 since it never changes)
    return NextResponse.redirect(publicData.publicUrl, { status: 301 });
  } catch (error) {
    console.error("Media fetch error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
