import {
  pgTable,
  uuid,
  varchar,
  decimal,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./user";

export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    googlePlaceId: varchar("google_place_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    description: text("description"),
    heroImageUrl: varchar("hero_image_url", { length: 2048 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("places_user_google_place_id_idx").on(
      table.userId,
      table.googlePlaceId
    ),
    index("places_user_id_idx").on(table.userId),
    index("places_deleted_at_idx").on(table.deletedAt),
  ]
);
