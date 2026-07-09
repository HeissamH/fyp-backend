import { db } from "../lib/db";
import { media } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Starting media migration...");
  const items = await db.select().from(media);
  let updated = 0;
  let failed = 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const item of items) {
    if (item.storagePath) {
      console.log(`Skipping ${item.id} - already has storagePath: ${item.storagePath}`);
      continue;
    }

    // Pattern matches something like: /object/sign/platform-media/uploads/user_id/12345-file.ext?token=xyz
    const match = item.url.match(/platform-media\/([^?]+)(\?.+)?$/);
    let path = null;

    if (match && match[1]) {
      path = match[1];
    } else {
      console.log(`Could not extract path from item ${item.id}\nURL: ${item.url}`);
      failed++;
      continue;
    }

    const finalUrl = `${appUrl}/api/media/${item.id}`;

    // Update the database record with the new URL and storagePath
    await db.update(media)
      .set({ 
        url: finalUrl,
        storagePath: path,
      })
      .where(eq(media.id, item.id));

    updated++;
    console.log(`Migrated ${item.id} -> path: ${path}`);
  }

  console.log(`Done! Migrated: ${updated}, Failed: ${failed}`);
  process.exit(0);
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
