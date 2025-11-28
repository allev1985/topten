# Quickstart: Remove Category Entity

**Feature**: 001-remove-category | **Date**: 2025-11-28

## Overview

This guide provides a quick reference for implementing the Category entity removal. The changes are localized to the database schema, seed data, and documentation.

---

## Implementation Checklist

### Phase 1: Schema Changes

- [ ] Delete `src/db/schema/category.ts`
- [ ] Update `src/db/schema/list.ts`:
  - [ ] Remove `import { categories } from "./category";`
  - [ ] Remove `categoryId` field definition
  - [ ] Remove `lists_category_published_idx` index
- [ ] Update `src/db/schema/index.ts`:
  - [ ] Remove `export * from "./category";`

### Phase 2: Seed Data Changes

- [ ] Delete `src/db/seed/categories.ts`
- [ ] Update `src/db/seed/index.ts`:
  - [ ] Remove `import { seedCategories } from "./categories";`
  - [ ] Remove `await seedCategories();` call

### Phase 3: Database Migration

- [ ] Run `pnpm drizzle-kit generate` to generate migration
- [ ] Review generated migration SQL
- [ ] Run `pnpm drizzle-kit push` to apply migration (development)

### Phase 4: Documentation Updates

- [ ] Update `specs/001-local-dev-setup/data-model.md`:
  - [ ] Remove Category entity section
  - [ ] Remove Category from relationships diagram
  - [ ] Update List entity (remove categoryId)
  - [ ] Update indexes table
  - [ ] Update schema index file example
- [ ] Update `specs/001-local-dev-setup/spec.md`:
  - [ ] Update Key Entities section (remove Category)
  - [ ] Update acceptance criteria mentioning categories

### Phase 5: Verification

- [ ] Run `pnpm build` - should pass
- [ ] Run `pnpm lint` - should pass
- [ ] Run `pnpm test` - should pass
- [ ] Verify database has no `categories` table
- [ ] Verify `lists` table has no `category_id` column

---

## File Changes Summary

### Files to DELETE

| File | Reason |
|------|--------|
| `src/db/schema/category.ts` | Category entity removed from model |
| `src/db/seed/categories.ts` | No categories to seed |

### Files to MODIFY

| File | Changes |
|------|---------|
| `src/db/schema/list.ts` | Remove category import, field, and index |
| `src/db/schema/index.ts` | Remove category export |
| `src/db/seed/index.ts` | Remove seedCategories import and call |
| `specs/001-local-dev-setup/data-model.md` | Remove all Category references |
| `specs/001-local-dev-setup/spec.md` | Remove Category from key entities |

---

## Code Snippets

### Updated list.ts

```typescript
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
  ]
);
```

### Updated schema/index.ts

```typescript
export * from "./user";
export * from "./list";
export * from "./place";
export * from "./listPlace";
```

### Updated seed/index.ts

```typescript
async function main() {
  console.log("Starting database seed...");

  try {
    console.log("Database seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Database seed failed:", error);
    process.exit(1);
  }
}

main();
```

---

## Testing Commands

```bash
# Build the project
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm tsc --noEmit

# Run tests
pnpm test

# Generate and apply migration (development)
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

---

## Rollback Plan

If issues are discovered after deployment:

1. Restore deleted files from git:
   ```bash
   git checkout HEAD~1 -- src/db/schema/category.ts src/db/seed/categories.ts
   ```

2. Revert schema changes:
   ```bash
   git checkout HEAD~1 -- src/db/schema/list.ts src/db/schema/index.ts src/db/seed/index.ts
   ```

3. Generate rollback migration:
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit push
   ```

**Note**: This is a pre-launch change; rollback complexity is minimal since there is no production data.
