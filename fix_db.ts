import { sql } from "drizzle-orm";
import { db } from "./lib/db/index";

async function main() {
  console.log("Running raw SQL fix...");
  try {
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;`);
  } catch(e) { console.log(e.message); }
  
  try {
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" varchar(20);`);
  } catch(e) { console.log(e.message); }
  
  console.log("Database altered directly successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
