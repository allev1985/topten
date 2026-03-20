import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Application user table — managed by BetterAuth.
 *
 * Core identity fields (id, name, email, emailVerified, image, createdAt,
 * updatedAt) are owned by BetterAuth. App-specific fields (vanitySlug, bio,
 * deletedAt) are added as additionalFields in the BetterAuth config.
 *
 * vanitySlug is auto-generated from the user's display name during signup via
 * BetterAuth's databaseHooks.user.create.before callback.
 */
export const users = pgTable(
  "users",
  {
    // BetterAuth-owned fields
    id: text("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: varchar("image", { length: 2048 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),

    // App-specific fields
    vanitySlug: varchar("vanity_slug", { length: 50 }).notNull().unique(),
    bio: text("bio"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_vanity_slug_idx").on(table.vanitySlug),
    index("users_deleted_at_idx").on(table.deletedAt),
    uniqueIndex("users_email_idx").on(table.email),
  ]
);
