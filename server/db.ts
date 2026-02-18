import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Require Neon PostgreSQL; reject SQLite (file:) to avoid production failures
const url = process.env.DATABASE_URL;
if (url.startsWith("file:") || url.includes("dev.db")) {
  throw new Error(
    "DATABASE_URL must be a PostgreSQL connection string (e.g. postgresql://user:pass@host/db). SQLite is not supported. Use Neon or another PostgreSQL provider.",
  );
}

export const pool = new Pool({ connectionString: url });
export const db = drizzle({ client: pool, schema });