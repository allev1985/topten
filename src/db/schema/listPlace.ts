import {
  pgTable,
  uuid,
  integer,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { lists } from "./list";
import { places } from "./place";

export const listPlaces = pgTable(
  "list_places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id),
    position: integer("position").notNull(),
    heroImageUrl: varchar("hero_image_url", { length: 2048 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("list_places_list_position_idx").on(table.listId, table.position),
    uniqueIndex("list_places_list_place_idx").on(table.listId, table.placeId),
  ]
);
