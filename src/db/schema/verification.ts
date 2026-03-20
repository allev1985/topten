import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * BetterAuth verification table.
 * Stores email verification and password reset tokens.
 * Managed entirely by BetterAuth — do not write to this table directly.
 */
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
