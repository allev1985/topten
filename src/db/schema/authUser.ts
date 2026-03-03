import { pgSchema, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");

/**
 * Read-only reference to Supabase's auth.users table (auth schema).
 *
 * This table is fully managed by Supabase Auth — never write to it via Drizzle.
 * Expose only the columns needed for JOIN queries so the application can read
 * auth-owned data (email, verification status, sign-in timestamps) alongside
 * the application profile in a single query.
 *
 * Usage:
 *   db.select().from(users).leftJoin(authUsers, eq(users.id, authUsers.id))
 */
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }),
  emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true }),
  lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
