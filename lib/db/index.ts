import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { config } from "dotenv";

config({ path: ".env.local" });


// Singleton connection for the application

const fallbackBuildConnectionString =
  "postgresql://build:build@127.0.0.1:65432/__next_build_placeholder__";

const connectionString =
  process.env.DATABASE_URL ??
  (process.env.NEXT_PHASE === "phase-production-build" ? fallbackBuildConnectionString : undefined);

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres connection (max 10 connections for serverless)
const client = postgres(connectionString, { max: 10 });

// Create drizzle instance with all schemas for relational queries
export const db = drizzle(client, { schema });
