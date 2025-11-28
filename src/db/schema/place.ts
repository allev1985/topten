import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    googlePlaceId: varchar("google_place_id", { length: 255 })
      .notNull()
      .unique(),
    name: varchar("name", { length: 255 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("places_google_place_id_idx").on(table.googlePlaceId)]
);
