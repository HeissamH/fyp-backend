import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * Drizzle Kit introspects many Postgres catalogs (`push`, `migrate`, `studio`).
 * Supabase **Transaction pooler** (often port **6543**) is slow here and feels "stuck".
 * Prefer **`DRIZZLE_DATABASE_URL`** = Dashboard → Database → Connection string → **Direct** (port **5432**),
 * while keeping `DATABASE_URL` as pooler for the app if you prefer.
 */
const rawDrizzleDbUrl =
  process.env.DRIZZLE_DATABASE_URL?.trim() ||
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL;

if (!rawDrizzleDbUrl) {
  throw new Error("Set DATABASE_URL (or DRIZZLE_DATABASE_URL) in .env.local for Drizzle CLI");
}

/** Supabase Postgres requires TLS; drizzle-kit builds `postgres(url, { max: 1 })` — no ssl options unless encoded in the URL */
function ensureSupabasePostgresTls(url: string): string {
  if (!/^postgres(ql)?:\/\//i.test(url.trim())) return url;

  try {
    const normalized = url.replace(/^postgres(ql)?:\/\//i, "http://");
    const parsed = new URL(normalized);
    const hostOk =
      parsed.hostname.endsWith(".supabase.co") || parsed.hostname.endsWith(".pooler.supabase.com");

    if (!hostOk) return url;

    const q = parsed.search.slice(1);
    const hasSsl = /(^|&)sslmode=/i.test(q) || /(^|&)ssl=/i.test(q);
    if (hasSsl) return url;

    return url.includes("?") ? `${url}&sslmode=require` : `${url}?sslmode=require`;
  } catch {
    return url;
  }
}

const drizzleDbUrl = ensureSupabasePostgresTls(rawDrizzleDbUrl.trim());

/** Any Supabase pooler host (transaction 6543 or session 5432) is a poor fit for Drizzle introspection; use Direct (db.*.supabase.co:5432). */
function isSupabasePoolerHost(url: string): boolean {
  try {
    const normalized = url.replace(/^postgres(ql)?:\/\//i, "https://");
    const u = new URL(normalized);
    return u.hostname.includes("pooler.supabase.com");
  } catch {
    return false;
  }
}

if (
  isSupabasePoolerHost(drizzleDbUrl) &&
  !process.env.DRIZZLE_DATABASE_URL?.trim() &&
  !process.env.DIRECT_URL?.trim()
) {
  throw new Error(
    [
      "Drizzle Kit should not use Supabase pooler host (pooler.supabase.com); `push` often hangs on “Pulling schema”.",
      "",
      "Add to .env.local (from Supabase → Database → Connection string → Direct connection, port 5432):",
      "  DRIZZLE_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres",
      "",
      "Keep DATABASE_URL as your pooler URL for the Next.js app if you want; Drizzle CLI will use DRIZZLE_DATABASE_URL only.",
    ].join("\n"),
  );
}

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: drizzleDbUrl,
  },
});
