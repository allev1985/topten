# Data Model: Remove Category Entity

**Feature**: 001-remove-category | **Date**: 2025-11-28

## Overview

This document defines the updated database schema after removing the Category entity. The schema now includes four core entities: User, List, Place, and ListPlace. This aligns with the architecture defined in `docs/decisions/high-level.md`.

## Entity Changes Summary

| Entity | Action | Notes |
|--------|--------|-------|
| Category | **DELETE** | Remove entire table and schema |
| List | **MODIFY** | Remove `category_id` field and related index |
| User | UNCHANGED | No modifications |
| Place | UNCHANGED | No modifications |
| ListPlace | UNCHANGED | No modifications |

---

## Entity Definitions

### User (UNCHANGED)

Represents a creator profile with authentication and customization capabilities.

```typescript
// src/db/schema/user.ts - NO CHANGES REQUIRED
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
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
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| name | VARCHAR(255) | NOT NULL | Display name |
| bio | TEXT | NULLABLE | Profile biography |
| avatarUrl | VARCHAR(2048) | NULLABLE | Profile image URL |
| vanitySlug | VARCHAR(50) | NOT NULL, UNIQUE | Custom URL slug (e.g., `@alex`) |
| createdAt | TIMESTAMP | NOT NULL, default NOW | Record creation time |
| updatedAt | TIMESTAMP | NOT NULL, default NOW | Last update time |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete timestamp |

---

### List (MODIFIED)

User-curated collection of places. **Category reference removed.**

```typescript
// src/db/schema/list.ts - MODIFIED: Remove category_id and related index
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./user";

export const lists = pgTable(
  "lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    // REMOVED: categoryId - no longer required
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    isPublished: boolean("is_published").default(false).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("lists_user_slug_idx").on(table.userId, table.slug),
    index("lists_user_deleted_at_idx").on(table.userId, table.deletedAt),
    // REMOVED: lists_category_published_idx - no longer applicable
  ]
);
```

**Fields** (Updated):
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| userId | UUID | FK → users.id, NOT NULL | Owning user |
| ~~categoryId~~ | ~~UUID~~ | ~~FK → categories.id~~ | **REMOVED** |
| title | VARCHAR(255) | NOT NULL | List title |
| slug | VARCHAR(255) | NOT NULL, unique per user | URL-friendly identifier |
| description | TEXT | NULLABLE | List description |
| isPublished | BOOLEAN | NOT NULL, default FALSE | Publication status |
| publishedAt | TIMESTAMP | NULLABLE | First publication time |
| createdAt | TIMESTAMP | NOT NULL, default NOW | Record creation time |
| updatedAt | TIMESTAMP | NOT NULL, default NOW | Last update time |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete timestamp |

**State Transitions** (Unchanged):
- **Draft → Published**: Set `isPublished = true`, set `publishedAt` if null
- **Published → Draft**: Set `isPublished = false`, retain `publishedAt`
- **Any → Deleted**: Set `deletedAt` to current timestamp

---

### Place (UNCHANGED)

Cached location data from Google Places API.

```typescript
// src/db/schema/place.ts - NO CHANGES REQUIRED
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
  (table) => [
    uniqueIndex("places_google_place_id_idx").on(table.googlePlaceId),
  ]
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| googlePlaceId | VARCHAR(255) | NOT NULL, UNIQUE | Google Places API ID |
| name | VARCHAR(255) | NOT NULL | Place name |
| address | VARCHAR(500) | NOT NULL | Formatted address |
| latitude | DECIMAL(10,7) | NOT NULL | Geographic latitude |
| longitude | DECIMAL(10,7) | NOT NULL | Geographic longitude |
| createdAt | TIMESTAMP | NOT NULL, default NOW | Record creation time |
| updatedAt | TIMESTAMP | NOT NULL, default NOW | Last refresh time |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete timestamp |

---

### ListPlace (UNCHANGED)

Junction table for list-place relationships with ordering.

```typescript
// src/db/schema/listPlace.ts - NO CHANGES REQUIRED
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
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| listId | UUID | FK → lists.id, NOT NULL | Parent list |
| placeId | UUID | FK → places.id, NOT NULL | Referenced place |
| position | INTEGER | NOT NULL | Sort order (1-based) |
| heroImageUrl | VARCHAR(2048) | NULLABLE | Selected image from Google Places |
| createdAt | TIMESTAMP | NOT NULL, default NOW | Record creation time |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete timestamp |

---

## Relationships

```mermaid
erDiagram
    User ||--o{ List : creates
    List ||--o{ ListPlace : contains
    Place ||--o{ ListPlace : appears_in

    User {
        uuid id PK
        varchar email UK
        varchar name
        text bio
        varchar avatar_url
        varchar vanity_slug UK
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    List {
        uuid id PK
        uuid user_id FK
        varchar title
        varchar slug
        text description
        boolean is_published
        timestamp published_at
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    Place {
        uuid id PK
        varchar google_place_id UK
        varchar name
        varchar address
        decimal latitude
        decimal longitude
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    ListPlace {
        uuid id PK
        uuid list_id FK
        uuid place_id FK
        integer position
        varchar hero_image_url
        timestamp created_at
        timestamp deleted_at
    }
```

---

## Indexes Summary (Updated)

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | vanity_slug | UNIQUE | Profile URL lookup |
| users | deleted_at | B-TREE | Exclude soft-deleted users |
| ~~categories~~ | ~~slug~~ | ~~UNIQUE~~ | **REMOVED** |
| lists | (user_id, slug) | UNIQUE | List URL lookup |
| lists | (user_id, deleted_at) | B-TREE | Creator's lists query |
| ~~lists~~ | ~~(category_id, is_published, deleted_at)~~ | ~~B-TREE~~ | **REMOVED** |
| places | google_place_id | UNIQUE | Deduplication |
| list_places | (list_id, position) | B-TREE | Ordered place retrieval |
| list_places | (list_id, place_id) | UNIQUE | Prevent duplicates |

---

## Schema Index File (Updated)

```typescript
// src/db/schema/index.ts - MODIFIED: Remove Category export
export * from "./user";
// REMOVED: export * from "./category";
export * from "./list";
export * from "./place";
export * from "./listPlace";
```

---

## Seed Data (Updated)

```typescript
// src/db/seed/index.ts - MODIFIED: Remove seedCategories
async function main() {
  console.log("Starting database seed...");

  try {
    // REMOVED: await seedCategories();
    // Future seed operations can be added here
    console.log("Database seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Database seed failed:", error);
    process.exit(1);
  }
}

main();
```

**Note**: The `categories.ts` seed file should be deleted entirely.

---

## Migration Strategy

1. **Pre-migration**: Ensure no existing data depends on categories (pre-launch assumption)
2. **Generate migration**: `pnpm drizzle-kit generate`
3. **Review migration**: Verify it contains:
   - `DROP INDEX lists_category_published_idx`
   - `ALTER TABLE lists DROP COLUMN category_id`
   - `DROP TABLE categories`
4. **Apply migration**: `pnpm drizzle-kit push` (development)
5. **Production**: Use versioned SQL files from `src/db/migrations/`

---

## Soft Delete Convention (Unchanged)

All queries MUST filter by `deleted_at IS NULL` to exclude soft-deleted records. Example:

```typescript
// Correct: Excludes soft-deleted records
const activeUsers = await db
  .select()
  .from(users)
  .where(isNull(users.deletedAt));

// Soft delete a record
await db
  .update(users)
  .set({ deletedAt: new Date() })
  .where(eq(users.id, userId));
```
