/**
 * Verify Neon DB connection and table counts.
 * Run from repo root after setting DATABASE_URL in .env:
 *   npx tsx scripts/verify-db.ts
 */

import "dotenv/config";

const url = process.env.DATABASE_URL;

if (!url || url.startsWith("file:") || url.includes("dev.db")) {
  console.error("❌ DATABASE_URL must be a PostgreSQL URL (e.g. postgresql://...).");
  console.error("   Set it in .env and run migrations/schema.sql against Neon first.");
  process.exit(1);
}

async function main() {
  const { pool } = await import("../server/db");
  try {
    const usersResult = await pool.query("SELECT COUNT(*)::int AS count FROM users");
    const tripsResult = await pool.query("SELECT COUNT(*)::int AS count FROM trips_summary");
    const usersCount = (usersResult as { rows: { count: number }[] }).rows[0]?.count ?? 0;
    const tripsCount = (tripsResult as { rows: { count: number }[] }).rows[0]?.count ?? 0;
    console.log("✅ Neon DB connected.");
    console.log(`   users: ${usersCount}`);
    console.log(`   trips_summary: ${tripsCount}`);
  } catch (err) {
    console.error("❌ DB query failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
