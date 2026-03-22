import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./user";
import { lists } from "./list";
import { places } from "./place";

/**
 * Shared tag vocabulary.
 *
 * System tags (is_system = true, user_id = null) are seeded from the
 * Google Places type taxonomy. Custom tags are created on the fly by
 * users and carry the creating user's id for attribution.
 *
 * @see docs/decisions/tags.md
 */
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    label: varchar("label", { length: 64 }).notNull(),
    isSystem: boolean("is_system").notNull().default(false),
    userId: text("user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("tags_slug_idx").on(table.slug),
    index("tags_is_system_idx").on(table.isSystem),
    index("tags_user_id_idx").on(table.userId),
  ]
);

/**
 * Junction: tags attached to a list.
 * Unique on (list_id, tag_id) so re-adding a removed tag restores the row.
 */
export const listTags = pgTable(
  "list_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("list_tags_list_tag_idx").on(table.listId, table.tagId),
    index("list_tags_tag_id_idx").on(table.tagId),
  ]
);

/**
 * Junction: tags attached to a place.
 * Unique on (place_id, tag_id) so re-adding a removed tag restores the row.
 */
export const placeTags = pgTable(
  "place_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("place_tags_place_tag_idx").on(table.placeId, table.tagId),
    index("place_tags_tag_id_idx").on(table.tagId),
  ]
);
