import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { db } from './lib/db';
import { media } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import { supabase, STORAGE_BUCKET } from './lib/storage';

async function run() {
  console.log('Fetching media...');
  const items = await db.select().from(media);
  let updated = 0;
  let failed = 0;

  for (const item of items) {
    const match = item.url.match(/platform-media\/([^?]+)(\?.+)?$/);
    let path = null;
    
    if (match && match[1]) {
      path = match[1];
    } else {
      console.log(`Could not extract path from item ${item.id}`);
      failed++;
      continue;
    }

    const { data: signedData, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiry

    if (error || !signedData?.signedUrl) {
      console.error(`Failed to sign URL for ${path}:`, error);
      failed++;
      continue;
    }

    await db.update(media)
      .set({ url: signedData.signedUrl })
      .where(eq(media.id, item.id));

    updated++;
    console.log(`Updated ${item.id} -> ${path}`);
  }

  console.log(`Done! Updated: ${updated}, Failed: ${failed}`);
  process.exit(0);
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
