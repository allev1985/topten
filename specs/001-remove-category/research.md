# Research: Remove Category Entity

**Feature**: 001-remove-category | **Date**: 2025-11-28

## Overview

This document consolidates research findings for the Category entity removal feature. The research addresses technical decisions, best practices, and potential impacts of the schema simplification.

---

## Research Tasks

### 1. Drizzle ORM Schema Modification Best Practices

**Question**: How should we safely remove a table and foreign key relationships using Drizzle ORM?

**Finding**: Drizzle ORM supports declarative schema changes. To remove a table:
1. Delete the schema file (`category.ts`)
2. Remove all references to the deleted table from other schema files
3. Remove exports from `index.ts`
4. Run `drizzle-kit generate` to create a migration
5. Run `drizzle-kit push` or execute migration SQL

**Decision**: Delete schema file and references, then generate migration
**Rationale**: Drizzle's declarative approach ensures the migration is generated correctly based on schema differences
**Alternatives Considered**:
- Manual SQL migration: Rejected because Drizzle can generate the migration automatically

---

### 2. Foreign Key Removal Impact

**Question**: What is the safest way to remove the `category_id` foreign key from the `lists` table?

**Finding**: Since this is a pre-launch change with no production data:
1. Simply remove the `categoryId` field from the `lists` schema
2. Remove the `import { categories }` statement
3. Remove any indexes that reference `categoryId`
4. Drizzle will generate the appropriate `ALTER TABLE` statements

**Decision**: Direct removal of the field and references
**Rationale**: No data migration is needed for pre-launch; clean schema removal is sufficient
**Alternatives Considered**:
- Soft deprecation with nullable field: Rejected because there's no production data to preserve
- Two-phase migration (nullable, then drop): Rejected for same reason

---

### 3. Index Cleanup

**Question**: Which indexes need to be removed along with the Category entity?

**Finding**: The following indexes are impacted:
1. `categories_slug_idx` (on `categories` table) - Will be removed with table
2. `lists_category_published_idx` (on `lists` table) - Must be explicitly removed

**Decision**: Remove `lists_category_published_idx` index from the `lists` schema
**Rationale**: The index references `categoryId` which no longer exists
**Alternatives Considered**:
- Keep a modified index on `is_published, deleted_at` only: Deferred to future optimization if needed

---

### 4. Seed Data Impact

**Question**: What changes are needed to the database seeding process?

**Finding**: 
1. `src/db/seed/categories.ts` contains category seed data - can be deleted
2. `src/db/seed/index.ts` imports and calls `seedCategories()` - must be updated
3. The seed process should work without any category data

**Decision**: Delete `categories.ts` and update `index.ts` to remove the import and call
**Rationale**: Categories are no longer part of the data model; seeding them would be dead code
**Alternatives Considered**:
- Keep seed file as commented reference: Rejected because it adds confusion and maintenance burden

---

### 5. Documentation Updates

**Question**: What documentation needs to be updated to reflect the category removal?

**Finding**: The following files reference Category:
1. `specs/001-local-dev-setup/data-model.md` - Contains Category entity definition
2. `specs/001-local-dev-setup/spec.md` - References Category in key entities and acceptance criteria
3. `docs/decisions/high-level.md` - Already updated (no Category in data model)

**Decision**: Update `data-model.md` and `spec.md` in `001-local-dev-setup` to remove Category references
**Rationale**: Documentation must reflect the actual implementation
**Alternatives Considered**:
- Archive with historical note: Rejected because it adds confusion for new developers

---

### 6. URL Structure Impact

**Question**: How does removing Category affect URL routing?

**Finding**: Per the high-level architecture:
- **Before**: `/@{vanity_slug}/{category-slug}/{list-slug}`
- **After**: `/@{vanity_slug}/{list-slug}`

No routing code exists yet (pre-MVP), so no code changes are needed. The spec already documents this change.

**Decision**: No routing code changes required; document URL structure in data model
**Rationale**: URL structure change is already captured in the specification
**Alternatives Considered**: N/A - this is purely documentation at this stage

---

## Summary of Decisions

| Decision | Chosen Approach | Rationale |
|----------|----------------|-----------|
| Schema removal | Delete files, generate migration | Drizzle handles declaratively |
| FK removal | Direct field deletion | Pre-launch, no data to migrate |
| Index cleanup | Remove `lists_category_published_idx` | References removed field |
| Seed cleanup | Delete `categories.ts`, update `index.ts` | Dead code removal |
| Documentation | Update `001-local-dev-setup` specs | Consistency with implementation |
| URL routing | No code changes | Pre-MVP, no routing exists |

---

## Outstanding Clarifications

**None** - All technical questions have been resolved.

---

## Next Steps

1. ✅ Complete research phase
2. → Proceed to Phase 1: Design & Contracts
3. Generate `data-model.md` with updated schema
4. Create `quickstart.md` for implementation guide
5. Update `001-local-dev-setup` documentation
