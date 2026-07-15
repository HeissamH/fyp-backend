#!/usr/bin/env node
/**
 * Prints a single-line base64 of the Firebase service account for Vercel.
 * Usage (from fyp-backend): node scripts/print-firebase-sa-base64.mjs
 *
 * Then in Vercel → Settings → Environment Variables → Production:
 *   Name:  FIREBASE_SERVICE_ACCOUNT_BASE64
 *   Value: <paste the printed line>
 * Redeploy production.
 */
import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY in .env.local");
  process.exit(1);
}

// Normalize PEM for embedding in JSON
privateKey = privateKey.replace(/\\n/g, "\n");

const sa = {
  type: "service_account",
  project_id: projectId,
  private_key: privateKey,
  client_email: clientEmail,
  token_uri: "https://oauth2.googleapis.com/token",
};

const b64 = Buffer.from(JSON.stringify(sa)).toString("base64");
console.log("\n=== Copy EVERYTHING below into Vercel FIREBASE_SERVICE_ACCOUNT_BASE64 ===\n");
console.log(b64);
console.log("\n=== end ===\n");
console.log("Then: Vercel → Project → Settings → Env → Production → Add → Redeploy");
console.log("Verify: GET https://www.udsminfo.com/api/health/fcm  → { ok: true }\n");
