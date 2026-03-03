import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { authUsers } from "./authUser";

/**
 * Application profile table — extends auth.users (Supabase Auth).
 *
 * id is a foreign key to auth.users.id, not self-generated. The record is
 * created after the Supabase Auth user is created (e.g. on first sign-in or
 * email verification) and is RESTRICT on delete — hard deletes of auth users
 * are blocked at the DB level; deletion is via soft delete (deleted_at) only.
 *
 * Auth-owned fields (email, password, email_confirmed_at, last_sign_in_at)
 * live in auth.users and are accessed via JOIN using the authUsers reference.
 * See: src/db/schema/authUser.ts
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    bio: text("bio"),
    avatarUrl: varchar("avatar_url", { length: 2048 }),
    vanitySlug: varchar("vanity_slug", { length: 50 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_vanity_slug_idx").on(table.vanitySlug),
    index("users_deleted_at_idx").on(table.deletedAt),
  ]
);
