/**
 * Run migrations/schema.sql against the database in DATABASE_URL.
 * Usage: npx tsx scripts/run-schema.ts
 * Requires: .env with DATABASE_URL set to a PostgreSQL URL (e.g. Neon).
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";

const url = process.env.DATABASE_URL;
if (!url || url.startsWith("file:") || url.includes("dev.db")) {
  console.error("Set DATABASE_URL in .env to a PostgreSQL URL (e.g. Neon).");
  process.exit(1);
}

async function main() {
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  (neonConfig as { webSocketConstructor: unknown }).webSocketConstructor = ws;

  const pool = new Pool({ connectionString: url });
  const schemaPath = join(process.cwd(), "migrations", "schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  // Strip single-line comments and run as one script (Neon/Postgres accept multiple statements)
  const cleaned = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  try {
    await pool.query(cleaned);
    console.log("Schema applied successfully.");
  } catch (err) {
    console.error("Schema run failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
