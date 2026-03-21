import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

declare global {
  // eslint-disable-next-line no-var
  var __db: PostgresJsDatabase<typeof schema> | undefined;
}

/**
 * Process-scoped singleton — stored on `globalThis` so it survives Next.js
 * hot-module reloads in development without spawning duplicate connections.
 */
export const db: PostgresJsDatabase<typeof schema> =
  globalThis.__db ??
  (globalThis.__db = drizzle(postgres(connectionString), { schema }));
