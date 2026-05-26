import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlClient: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL belum dikonfigurasi di dalam variable lingkungan (.env)."
    );
  }

  // Lazy initialize client connection
  sqlClient = postgres(databaseUrl, { max: 10 });
  dbInstance = drizzle(sqlClient, { schema });
  return dbInstance;
}

export function isDbConfigured(): boolean {
  return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;
}
