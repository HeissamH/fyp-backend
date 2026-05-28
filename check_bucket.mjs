import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log("Missing ENV: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

const STORAGE_BUCKET = "platform-media";

async function main() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
    process.exit(1);
  }

  const exists = buckets.find(b => b.name === STORAGE_BUCKET);
  if (!exists) {
    console.log(`Creating bucket ${STORAGE_BUCKET}...`);
    const { data, error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: false,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "application/pdf"],
      fileSizeLimit: 10 * 1024 * 1024,
    });
    if (createError) {
      console.error("Failed to create bucket:", createError);
      process.exit(1);
    }
    console.log("Bucket created successfully.");
  } else {
    console.log("Bucket already exists.");
  }
}

main();
