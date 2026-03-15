# Tasks: DB Layer Abstraction

**Input**: Design documents from `specs/009-db-layer-abstraction/`  
**Branch**: `009-db-layer-abstraction`  
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every task description

---

## Phase 1: Setup

**Purpose**: Create the repository directory so all US1 tasks can proceed

- [ ] T001 Create `src/db/repositories/index.ts` as an empty barrel file (placeholder for exports added in T013)

**Checkpoint**: `src/db/repositories/` directory and barrel exist. US1 tasks can begin.

---

## Phase 2: Foundational

No additional shared infrastructure needed — schema, `db` singleton, and all service types are pre-existing and unchanged. Proceed directly to User Story phases.

---

## Phase 3: User Story 1 — Repository Layer for All Domains (Priority: P1) 🎯 MVP

**Goal**: Five typed repository modules exist in `src/db/repositories/`, each owning all Drizzle logic for its domain. No business logic in any repository.

**Independent Test**: `grep -r "from \"drizzle-orm\"" src/db/repositories/` returns only the repository files themselves. `grep -r "from \"@/lib" src/db/repositories/` returns zero results (no upward imports). Each file compiles cleanly via `pnpm tsc --noEmit`.

### Implementation for User Story 1

- [ ] T002 [P] [US1] Create `src/db/repositories/user.repository.ts` — export `getVanitySlugByUserId(userId)` using a `db.select` on `users` filtered by `userId` and `isNull(deletedAt)`, returning `{ vanitySlug: string | null } | null`. Reference: `data-model.md` user repository section.

- [ ] T003 [P] [US1] Create `src/db/repositories/list.repository.ts` — export all six functions per `data-model.md` list repository section: `getListsByUser`, `insertList`, `updateList`, `softDeleteList`, `publishList`, `unpublishList`. Move Drizzle query bodies verbatim from `src/lib/list/service.ts`, removing all `ListServiceError` imports. Return raw typed rows only.

- [ ] T004 [P] [US1] Create `src/db/repositories/profile.repository.ts` — export all four functions per `data-model.md` profile repository section: `getSettingsProfile`, `updateUserName`, `getSlugConflict`, `updateUserSlug`. Move Drizzle query bodies verbatim from `src/lib/profile/service.ts`. No `ProfileServiceError` imports.

- [ ] T005 [P] [US1] Create `src/db/repositories/public.repository.ts` — export all four functions per `data-model.md` public repository section: `getPublicProfileBySlug`, `getPublicListsByUserId`, `getPublicListBySlug`, `getPublicPlacesByListId`. Move Drizzle query bodies verbatim from `src/lib/public/service.ts`. Re-use the existing types from `@/lib/public/service/types` as return types (upward type import is acceptable; service instance import is not). No `React.cache` in the repository.

- [ ] T006 [US1] Create `src/db/repositories/place.repository.ts` — export all functions per `data-model.md` place repository section. This is the most complex repository:
  - Simple queries: `getPlacesByList`, `getAvailablePlacesForList`, `getAllPlacesByUser`, `getPlaceByGoogleId`, `getListOwnership`, `getMaxPosition`, `getListPlaceRow`, `getPlaceInListByOwner`, `getPlaceByOwner`, `getActivePlaceInList`
  - Simple mutations: `restorePlace`, `insertPlace`, `restoreListPlace`, `insertListPlace`, `updatePlaceDescription`, `softDeleteListPlace`
  - **Transactional**: `createPlaceWithListAttachment` — wraps `db.transaction()` to atomically insert `places` + compute MAX+1 position + insert `listPlaces`. Returns `{ place: PlaceRow; listPlaceId: string }`.
  - **Transactional**: `deletePlaceWithCascade` — wraps `db.transaction()` to verify ownership, soft-delete `places`, cascade soft-delete to all active `listPlaces`. Returns `{ deletedListPlaceCount: number }`.
  - Move all Drizzle query bodies verbatim from `src/lib/place/service.ts`. No `PlaceServiceError` imports. (depends on T001)

- [ ] T013 [US1] Update `src/db/repositories/index.ts` — add named re-exports for all five repository modules created in T002–T006 so services can import from `@/db/repositories` if desired (depends on T002–T006)

**Checkpoint**: All five repository files exist and compile. `grep -r "from \"@/lib" src/db/repositories/` → zero matches (except acceptable public type imports in public.repository.ts). US2 can begin.

---

## Phase 4: User Story 2 — Services Delegate to Repositories, Business Logic Preserved (Priority: P1)

**Goal**: All four service files import from their repository module instead of `drizzle-orm` / `@/db`. Business logic (slug retry, ownership checks, error translation, `React.cache`) is fully intact. Unit test mocks updated to target repositories.

**Independent Test**: `grep -r "from \"drizzle-orm\"" src/lib/` → zero matches. `grep -r "from \"@/db\"" src/lib/` → zero matches. `pnpm test` → all tests pass.

### Implementation for User Story 2

- [ ] T007 [US2] Refactor `src/lib/list/service.ts` — remove all `drizzle-orm` and `@/db` imports. Replace every inline Drizzle query call with the corresponding repository function from `src/db/repositories/list.repository.ts` and `src/db/repositories/user.repository.ts`. Preserve slug-collision retry logic, error translation, and all `ListServiceError` throws unchanged. The function signatures and return types of all exported functions MUST remain identical. (depends on T003, T002)

- [ ] T008 [US2] Refactor `src/lib/profile/service.ts` — remove all `drizzle-orm` and `@/db` imports. Replace every inline Drizzle query call with the corresponding repository function from `src/db/repositories/profile.repository.ts`. Preserve two-tier slug uniqueness defence (pre-check + race-condition catch via `isUniqueViolation`), error translation, and all `ProfileServiceError` throws unchanged. (depends on T004)

- [ ] T009 [US2] Refactor `src/lib/public/service.ts` — remove all `drizzle-orm` and `@/db` imports. Replace every inline Drizzle query call with the corresponding repository function from `src/db/repositories/public.repository.ts`. The `React.cache()` wrappers MUST remain on each exported function in the service — they are NOT moved to the repository. (depends on T005)

- [ ] T010 [US2] Refactor `src/lib/place/service.ts` — remove all `drizzle-orm` and `@/db` imports. Replace inline queries with repository calls from `src/db/repositories/place.repository.ts`:
  - `createPlace`: the `db.transaction(...)` block for the new-place-with-list path is replaced by a single `placeRepository.createPlaceWithListAttachment(params)` call. Ownership check (`getListOwnership`) also delegates to repo.
  - `deletePlace`: the `db.transaction(...)` block is replaced by a single `placeRepository.deletePlaceWithCascade(params)` call.
  - All other inline query calls delegate to the matching repo function.
  - All business logic (ALREADY_IN_LIST guard, NOT_FOUND on empty row, immutable-field check, `PlaceServiceError` throws) MUST remain unchanged. (depends on T006)

- [ ] T011 [P] [US2] Update `tests/unit/lib/list-service.test.ts` — change the `vi.mock` target from `@/db` to `@/db/repositories/list.repository` and `@/db/repositories/user.repository`. Replace the fluent Drizzle chain stubs with simple `vi.fn()` mocks matching the new repository function signatures (`getListsByUser`, `insertList`, `updateList`, `softDeleteList`, `publishList`, `unpublishList`, `getVanitySlugByUserId`). All test assertions on service behaviour MUST pass unchanged. (depends on T007)

- [ ] T012 [P] [US2] Update `tests/unit/lib/place-service.test.ts` — change the `vi.mock` target from `@/db` to `@/db/repositories/place.repository`. Replace the fluent Drizzle chain stubs and `mockTransaction` with simple `vi.fn()` mocks matching the new repository function signatures. All test assertions on service behaviour MUST pass unchanged. (depends on T010)

- [ ] T014 [P] [US2] Update `tests/unit/lib/public-service.test.ts` — change the `vi.mock` target from `@/db` to `@/db/repositories/public.repository`. Replace fluent chain stubs with simple `vi.fn()` mocks. All test assertions MUST pass unchanged. (depends on T009)

**Checkpoint**: `pnpm test` passes. `grep -r "from \"drizzle-orm\"" src/lib/` → zero. `grep -r "from \"@/db\"" src/lib/` → zero. Proceed to verification.

---

## Phase 5: User Story 3 & 4 — Verification: Actions & Schema Unchanged (Priority: P2)

**Goal**: Confirm the action and schema layers are untouched and the full test suite (unit + E2E) passes.

**Independent Test**: Git diff on `src/actions/` and `src/db/schema/` shows zero changes. `pnpm test` and E2E suite green.

- [ ] T015 [P] [US3] Verify `git diff --name-only HEAD` shows zero changes under `src/actions/` — if any action file appears in the diff, this is a defect and must be reverted

- [ ] T016 [P] [US4] Verify `git diff --name-only HEAD` shows zero changes under `src/db/schema/` and `src/db/index.ts` — if any schema file appears in the diff, this is a defect and must be reverted

- [ ] T017 [US3] Run `pnpm test` (Vitest) and confirm all unit and integration tests pass with zero failures (depends on T011, T012, T014)

- [ ] T018 [US3] Run `pnpm tsc --noEmit` and confirm zero TypeScript errors across the whole project (depends on T007–T010)

**Checkpoint**: All success criteria SC-001 through SC-008 verifiably met.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T019 [P] Add JSDoc comment block to each repository file (`src/db/repositories/*.repository.ts`) documenting: module purpose, domain it serves, note that it contains no business logic, and reference to the corresponding service file. Mirror the existing documentation style in `src/lib/*/service.ts`.

- [ ] T020 Update `src/db/repositories/index.ts` with a module-level JSDoc comment and ensure all five repository namespaces are exported cleanly (e.g. `export * as listRepository from "./list.repository"`).

- [ ] T021 Amend `.specify/memory/constitution.md` — patch update to Technology Stack table, ORM row: change `direct DB calls in service layer only` → `direct DB calls in repository layer only (src/db/repositories/); services orchestrate business logic`. Bump version from `2.0.0` → `2.0.1` and update Sync Impact Report at top of file.

**Final Checkpoint**: All phases complete. Feature is ready for code review.

---

## Dependencies

```
T001
└── T002, T003, T004, T005 (US1 repos — parallel)
        └── T006 (place repo — depends on T001 for directory)
            └── T013 (barrel export)
                ├── T007 (list service refactor)
                │   └── T011 (list service tests)
                ├── T008 (profile service refactor)
                ├── T009 (public service refactor)
                │   └── T014 (public service tests)
                └── T010 (place service refactor)
                    └── T012 (place service tests)
                        └── T017, T018 (verification)
                            └── T015, T016 (git diff checks)
                                └── T019, T020, T021 (polish)
```

## Parallel Execution

**US1 repository files** (T002–T005) can all be authored simultaneously — different files, no shared dependencies.

**Service refactors** (T007–T010) can proceed in parallel once their respective repository file exists:
- T007 (list service) after T003 + T002
- T008 (profile service) after T004
- T009 (public service) after T005
- T010 (place service) after T006

**Test updates** (T011, T012, T014) can proceed in parallel once their service refactor is done.

**Verification tasks** (T015, T016) are independent of each other and can run in parallel.

## Implementation Strategy

**MVP scope**: Phase 3 (US1) alone delivers independently verifiable value — the repository layer exists and compiles, providing the new architecture boundary before any service migration begins.

**Recommended delivery order**:
1. T001 → T002–T005 (parallel) → T006 → T013 (create repo layer, ~1 session)
2. T007–T010 (parallel by domain) + T011, T012, T014 (parallel) (migrate services + fix tests, ~1 session)
3. T015–T018 (verification) → T019–T021 (polish + constitution amendment, ~1 session)

## Summary

| Metric | Count |
|---|---|
| Total tasks | 21 |
| Phase 1 (Setup) | 1 |
| Phase 2 (Foundational) | 0 |
| Phase 3 (US1 — repository layer) | 6 |
| Phase 4 (US2 — service delegation + tests) | 8 |
| Phase 5 (US3+4 — verification) | 4 |
| Phase 6 (Polish) | 3 |
| Parallelisable tasks [P] | 8 |
