import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const tagSourceEnum = pgEnum("tag_source", ["system", "custom"]);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull(),
    source: tagSourceEnum("source").notNull().default("custom"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("tags_name_idx").on(table.name)]
);
