# Tasks: Remove Category Entity

**Input**: Design documents from `/specs/001-remove-category/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Tests are NOT explicitly requested in the feature specification. Only verification tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Since this is a removal/simplification feature, all user stories are interconnected and should be implemented sequentially.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `specs/` at repository root
- Schema files: `src/db/schema/`
- Seed files: `src/db/seed/`
- Documentation: `specs/001-local-dev-setup/`

---

## Phase 1: Setup (Pre-Implementation Verification)

**Purpose**: Verify current state and prepare for changes

- [X] T001 Run `pnpm build` to verify current project builds successfully
- [X] T002 Run `pnpm lint` to verify current linting passes
- [X] T003 Run `pnpm test` to verify current tests pass (if any exist)

**Checkpoint**: Development environment is ready for changes

---

## Phase 2: Foundational (Schema File Deletions)

**Purpose**: Remove the Category entity and seed data files - MUST complete before modifying dependent files

**⚠️ CRITICAL**: These deletions must happen before modifying files that reference them

- [X] T004 [P] Delete Category schema file at `src/db/schema/category.ts`
- [X] T005 [P] Delete Category seed data file at `src/db/seed/categories.ts`

**Checkpoint**: Category source files removed - can now update dependent files

---

## Phase 3: User Story 1 - Lists Exist Without Categories (Priority: P1) 🎯 MVP

**Goal**: Lists function independently without category assignment

**Independent Test**: Create a list, save it, and retrieve it without any category association. The list displays correctly to both creators and visitors.

### Implementation for User Story 1

- [X] T006 [US1] Update `src/db/schema/list.ts` - Remove `import { categories } from "./category";` statement
- [X] T007 [US1] Update `src/db/schema/list.ts` - Remove `categoryId` field definition with its `.references(() => categories.id)` chain
- [X] T008 [US1] Update `src/db/schema/list.ts` - Remove `lists_category_published_idx` index from the table's indexes array
- [X] T009 [US1] Update `src/db/schema/index.ts` - Remove `export * from "./category";` statement

**Checkpoint**: User Story 1 complete - List schema no longer requires category_id

---

## Phase 4: User Story 2 - Simplified List URLs (Priority: P2)

**Goal**: URL structure is `/@{vanity_slug}/{list-slug}` without category-slug

**Independent Test**: Navigate to a list URL in the format `/@{vanity_slug}/{list-slug}` and verify the list loads correctly (after routing is implemented in future features).

### Implementation for User Story 2

- [X] T010 [US2] Update `src/db/seed/index.ts` - Remove `import { seedCategories } from "./categories";` statement
- [X] T011 [US2] Update `src/db/seed/index.ts` - Remove `await seedCategories();` call from main function

**Checkpoint**: User Story 2 complete - Seed process works without categories

---

## Phase 5: User Story 3 - Clean Creator Profile (Priority: P3)

**Goal**: Profile pages show lists without category grouping

**Independent Test**: Visit a creator profile page and verify all published lists appear in a single list without category sections (after UI is implemented in future features).

### Implementation for User Story 3

- [X] T012 [P] [US3] Update `specs/001-local-dev-setup/data-model.md` - Remove the entire "Category" entity section including code block
- [X] T013 [P] [US3] Update `specs/001-local-dev-setup/data-model.md` - Update List entity to remove `categoryId` field from code and fields table
- [X] T014 [P] [US3] Update `specs/001-local-dev-setup/data-model.md` - Remove `Category ||--o{ List : categorizes` from mermaid relationships diagram
- [X] T015 [P] [US3] Update `specs/001-local-dev-setup/data-model.md` - Remove category-related rows from Indexes Summary table
- [X] T016 [P] [US3] Update `specs/001-local-dev-setup/data-model.md` - Remove `export * from "./category";` from Schema Index File example
- [X] T017 [P] [US3] Update `specs/001-local-dev-setup/spec.md` - Remove "Category" from Key Entities section
- [X] T018 [P] [US3] Update `specs/001-local-dev-setup/spec.md` - Update FR-007 to remove Category from database schema entities list
- [X] T019 [P] [US3] Update `specs/001-local-dev-setup/spec.md` - Remove FR-009 requirement for Category seed data (8 predefined values)
- [X] T020 [P] [US3] Update `specs/001-local-dev-setup/spec.md` - Remove SC-004 success criterion for category seeding metric
- [X] T021 [P] [US3] Update `specs/001-local-dev-setup/spec.md` - Update User Story 2 acceptance scenario 2 to remove Category table reference

**Checkpoint**: User Story 3 complete - Documentation reflects simplified data model

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify all changes, ensure build passes, and validate completeness

- [X] T022 Run `pnpm build` to verify project builds after all changes
- [X] T023 Run `pnpm lint` to verify linting passes after all changes
- [X] T024 Run `pnpm test` to verify any existing tests still pass
- [ ] T025 Run `pnpm drizzle-kit generate` to generate migration (if database exists)
- [ ] T026 Review generated migration SQL to ensure it includes: DROP INDEX, ALTER TABLE DROP COLUMN, DROP TABLE
- [X] T027 Verify `src/db/schema/category.ts` no longer exists
- [X] T028 Verify `src/db/seed/categories.ts` no longer exists
- [X] T029 Verify `src/db/schema/list.ts` has no category references
- [X] T030 Verify `src/db/schema/index.ts` has no category export

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - DELETE files first
- **User Story 1 (Phase 3)**: Depends on Foundational - modify list.ts and index.ts after category.ts is deleted
- **User Story 2 (Phase 4)**: Depends on Foundational - modify seed/index.ts after categories.ts is deleted
- **User Story 3 (Phase 5)**: Can run in parallel with US1 and US2 (documentation only)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational phase (file deletions)
- **User Story 2 (P2)**: Depends on Foundational phase (file deletions)
- **User Story 3 (P3)**: Independent (documentation only) - can run in parallel with US1/US2

### Within Each User Story

- Schema modifications before index modifications
- Source code changes before documentation changes
- All changes verified with build/lint after completion

### Parallel Opportunities

- T004 and T005 can run in parallel (different files)
- T012-T021 can all run in parallel (documentation files, no code dependencies)
- User Story 3 (documentation) can run in parallel with US1 and US2 (code changes)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch both file deletions together:
Task T004: "Delete Category schema file at src/db/schema/category.ts"
Task T005: "Delete Category seed data file at src/db/seed/categories.ts"
```

## Parallel Example: User Story 3 (Documentation)

```bash
# Launch all documentation updates together:
Task T012: "Update specs/001-local-dev-setup/data-model.md - Remove Category entity section"
Task T013: "Update specs/001-local-dev-setup/data-model.md - Update List entity"
Task T014: "Update specs/001-local-dev-setup/data-model.md - Remove Category from diagram"
Task T015: "Update specs/001-local-dev-setup/data-model.md - Update indexes table"
Task T016: "Update specs/001-local-dev-setup/data-model.md - Update schema index example"
Task T017: "Update specs/001-local-dev-setup/spec.md - Update Key Entities"
Task T018: "Update specs/001-local-dev-setup/spec.md - Update FR-007"
Task T019: "Update specs/001-local-dev-setup/spec.md - Update FR-009"
Task T020: "Update specs/001-local-dev-setup/spec.md - Update SC-004"
Task T021: "Update specs/001-local-dev-setup/spec.md - Update User Story 2"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup (verify environment)
2. Complete Phase 2: Foundational (delete category files)
3. Complete Phase 3: User Story 1 (update list schema)
4. Complete Phase 4: User Story 2 (update seed process)
5. **STOP and VALIDATE**: Build and lint pass, no category references in code
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Files deleted
2. Add User Story 1 → Schema updated → Build passes (MVP!)
3. Add User Story 2 → Seed updated → Full code complete
4. Add User Story 3 → Documentation updated → Feature complete
5. Each story adds value without breaking previous stories

### Single Developer Strategy

Recommended execution order for a single developer:

1. T001-T003: Verify environment (sequential)
2. T004-T005: Delete files (parallel)
3. T006-T009: Update list schema and index (sequential, same file then different file)
4. T010-T011: Update seed index (sequential, same file)
5. T012-T021: Update documentation (can batch or do sequentially)
6. T022-T030: Verify and validate (sequential)

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 30 |
| **Phase 1 (Setup)** | 3 |
| **Phase 2 (Foundational)** | 2 |
| **Phase 3 (US1)** | 4 |
| **Phase 4 (US2)** | 2 |
| **Phase 5 (US3)** | 10 |
| **Phase 6 (Polish)** | 9 |
| **Parallel Opportunities** | 12 tasks marked [P] |
| **Files to DELETE** | 2 |
| **Files to MODIFY** | 4 |

### Independent Test Criteria

| User Story | Test Criteria |
|------------|---------------|
| US1 | List can be created/saved/retrieved without category association |
| US2 | List URL format `/@{vanity_slug}/{list-slug}` works (routing TBD) |
| US3 | Creator profile shows lists without category grouping (UI TBD) |

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 + Phase 4** (T001-T011)

This delivers:
- Category files removed
- List schema updated (no category_id)
- Seed process updated (no category seeding)
- Build and lint pass

Documentation updates (US3) can be deferred if needed but are recommended for completeness.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This is a pre-launch change - no production data migration required
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
