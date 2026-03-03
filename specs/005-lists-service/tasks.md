# Tasks: Lists Service

**Input**: Design documents from `/specs/005-lists-service/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Tests**: Included — SC-003 requires ≥ 90% unit test coverage; SC-005 requires an integration test.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5 map to spec.md)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Confirm no migration is needed; verify test infrastructure is ready.

- [ ] T001 Confirm `lists` table exists and matches schema in `src/db/schema/list.ts` — run `pnpm db:studio` or inspect local Supabase; no migration file should be generated
- [ ] T002 [P] Create empty placeholder files to establish the module tree: `src/lib/list/service.ts`, `src/lib/list/service/errors.ts`, `src/lib/list/service/types.ts`, `src/schemas/list.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Full service layer — all business logic and DB access — plus shared types and Zod schemas. Nothing in US1–US5 can be implemented until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Implement `ListServiceError` class and error factory functions (`notFoundError`, `slugCollisionError`, `listServiceError`) mirroring `src/lib/profile/service/errors.ts` pattern — write to `src/lib/list/service/errors.ts`
- [ ] T004 [P] Define result types `ListSummary`, `ListRecord`, `CreateListResult`, `UpdateListResult`, `DeleteListResult`, `PublishListResult`, `UnpublishListResult` as specified in `data-model.md` — write to `src/lib/list/service/types.ts`
- [ ] T005 [P] Define Zod schemas `createListSchema` and `updateListSchema` (with `.refine` guard requiring at least one field) as specified in `data-model.md` — write to `src/schemas/list.ts`; export `CreateListInput`, `UpdateListInput` inferred types
- [ ] T006 [P] Extend `src/types/list.ts`: add `slug: string`, `description: string | null`, `createdAt: Date` to the existing `List` interface; keep `placeCount: number` for backward compatibility; add `ListSummary` re-export aligned with the service type
- [ ] T007 Implement `getListsByUser(userId: string): Promise<ListSummary[]>` in `src/lib/list/service.ts` — Drizzle `SELECT` on `lists` filtered by `eq(lists.userId, userId)` and `isNull(lists.deletedAt)`, ordered `desc(lists.createdAt)`, returning `{ id, title, slug, isPublished, createdAt }` columns only
- [ ] T008 Implement `createList({ userId, title }: CreateListInput & { userId: string }): Promise<CreateListResult>` in `src/lib/list/service.ts` — generate slug with `crypto.randomUUID().replace(/-/g,'').slice(0,4)`; on unique-constraint violation (`isUniqueViolation`) retry once; throw `slugCollisionError` if retry also collides; log `[ListService:createList]`
- [ ] T009 Implement `updateList({ listId, userId, title?, description? }): Promise<UpdateListResult>` in `src/lib/list/service.ts` — single-query ownership+existence check (`eq(lists.id, listId)`, `eq(lists.userId, userId)`, `isNull(lists.deletedAt)`); throw `notFoundError` if no row returned; update only provided fields + `updatedAt`; log `[ListService:updateList]`
- [ ] T010 Implement `deleteList({ listId, userId }): Promise<DeleteListResult>` in `src/lib/list/service.ts` — same ownership check as T009; `UPDATE lists SET deleted_at = now()`, `updated_at = now()`; log `[ListService:deleteList]`
- [ ] T011 [P] Implement `publishList({ listId, userId }): Promise<PublishListResult>` in `src/lib/list/service.ts` — ownership + `isNull(deletedAt)` check; set `isPublished = true`, `publishedAt = new Date()`; log `[ListService:publishList]`
- [ ] T012 [P] Implement `unpublishList({ listId, userId }): Promise<UnpublishListResult>` in `src/lib/list/service.ts` — same guard as T011; set `isPublished = false`, `publishedAt = null`; log `[ListService:unpublishList]`
- [ ] T013 Unit test `src/lib/list/service.ts` — create `tests/unit/lib/list-service.test.ts`; mock `src/db` with `vi.mock`; cover happy-path and error branches for all six operations including slug-collision retry, `notFoundError` on wrong `userId`, and `deletedAt IS NULL` guard on publish/unpublish; target ≥ 90% coverage for this file

**Checkpoint**: `pnpm test -- tests/unit/lib/list-service.test.ts` passes; all six service operations are verified in isolation.

---

## Phase 3: User Story 5 — Dashboard Displays Real Lists (Priority: P1) 🎯 MVP

**Goal**: Remove the mock data simulation and render real lists from the database for the authenticated user.

**Independent Test**: Sign in with a test account that has 2 lists in the local Supabase DB; load `/dashboard`; confirm exactly 2 cards render with correct titles and no `setTimeout` simulation visible.

- [ ] T014 [US5] Create `src/app/(dashboard)/dashboard/DashboardClient.tsx` — extract all current interactive logic from `dashboard/page.tsx` (filter state, `useSearchParams`, `useRouter`, `handleListClick`, `handleFilterChange`, filter tab rendering, `ListGrid`/`EmptyState` rendering) into a `"use client"` component that accepts `initialLists: ListSummary[]` and `initialError?: string` as props; keep the Suspense boundary
- [ ] T015 [US5] Refactor `src/app/(dashboard)/dashboard/page.tsx` into a Server Component: remove `"use client"` directive; call `getSession()` (return redirect on unauthenticated); call `getListsByUser(userId)` directly; catch `ListServiceError` and pass error string; render `<DashboardClient initialLists={lists} />` (no mock data, no `setTimeout`)
- [ ] T016 [US5] Delete `src/lib/mocks/lists.ts` and remove its import from `dashboard/page.tsx` (import is eliminated as part of T015 but confirm no other file imports from `@/lib/mocks/lists`)
- [ ] T017 [US5] Integration test: create `tests/integration/list-service.test.ts` — against local Supabase; seed a test user with 2 lists (one soft-deleted); call `getListsByUser`; assert exactly 2 active lists returned in `createdAt DESC` order and deleted list is absent

**Checkpoint**: Dashboard shows real data; mock file is deleted; `pnpm test` passes.

---

## Phase 4: User Story 1 — Create a New List (Priority: P1)

**Goal**: Authenticated user submits a title, a new draft list is created with a system-assigned slug, and the card immediately appears in the dashboard grid.

**Independent Test**: Submit the "New list" form with the title "Best Coffee Shops"; confirm a new draft card appears in the dashboard and a 4-char slug is stored in the DB.

- [ ] T018 [P] [US1] Implement `createListAction` Server Action in `src/actions/list-actions.ts`: authenticate (`getSession`), validate (`createListSchema.safeParse`), delegate (`createList`), map `ListServiceError` codes to `ActionState` error messages per `contracts/list-actions.md`, revalidate `'/dashboard'`; export `CreateListSuccessData` type
- [ ] T019 [US1] Create `src/components/dashboard/CreateListForm.tsx` — `"use client"` component using `useActionState(createListAction, initialState)`; title `<Input>` field; submit button disabled while title is empty/whitespace-only (`FR-003a`); show inline field errors from `fieldErrors.title`; show top-level `error` message; on `isSuccess` close the form/dialog
- [ ] T020 [US1] Wire `CreateListForm` into the dashboard UI — add a "New list" trigger button to `DashboardClient.tsx` (or `DashboardHeader.tsx`); render `CreateListForm` inside a `Dialog` from `src/components/ui/dialog.tsx`; no direct shadcn/ui edits
- [ ] T021 [US1] Component test: create `tests/component/CreateListForm.test.tsx` — render form; assert submit button is disabled when title is empty; assert button is enabled after typing a valid title; assert inline error renders when `fieldErrors.title` is populated via mock action state

**Checkpoint**: Full create-list flow works end-to-end; new list card appears in dashboard without page reload.

---

## Phase 5: User Story 2 — Update List Metadata (Priority: P2)

**Goal**: User can edit the title and/or description of an existing list from the dashboard; slug is not shown as an editable field.

**Independent Test**: Click edit on an existing list; change the title to "Updated Title"; save; confirm the card title updates immediately and description is persisted on refresh.

- [ ] T022 [P] [US2] Implement `updateListAction` in `src/actions/list-actions.ts`: authenticate, validate (`updateListSchema.safeParse` + `listId` non-empty check), delegate (`updateList`), map `NOT_FOUND` error, revalidate `'/dashboard'`; export `UpdateListSuccessData` type
- [ ] T023 [US2] Create `src/components/dashboard/EditListForm.tsx` — `"use client"` component; `title` input (pre-filled), `description` textarea (pre-filled); hidden `listId` field; uses `useActionState(updateListAction, initialState)`; submit disabled when no changes made; show field and top-level errors
- [ ] T024 [US2] Wire `EditListForm` into the dashboard — add an "Edit" action (kebab menu or button) on the `ListCard` component that opens an `EditListForm` inside a `Dialog`; pass current `title`, `description`, and `id` as initial props

**Checkpoint**: Edit flow works; slug field is absent; both title-only and description-only updates persist correctly.

---

## Phase 6: User Story 3 — Publish and Unpublish a List (Priority: P2)

**Goal**: User can toggle the published state of any active list from the dashboard.

**Independent Test**: On a draft list, click "Publish"; confirm `isPublished = true` and the card badge changes to "Published". Then click "Unpublish"; confirm `isPublished = false`.

- [ ] T025 [P] [US3] Implement `publishListAction` in `src/actions/list-actions.ts`: authenticate, validate `listId`, delegate (`publishList`), map `NOT_FOUND`, revalidate `'/dashboard'`; export `PublishListSuccessData` type
- [ ] T026 [P] [US3] Implement `unpublishListAction` in `src/actions/list-actions.ts`: authenticate, validate `listId`, delegate (`unpublishList`), map `NOT_FOUND`, revalidate `'/dashboard'`; export `UnpublishListSuccessData` type
- [ ] T027 [US3] Add publish/unpublish toggle control to the `ListCard` component (or its action menu) — call `publishListAction` / `unpublishListAction` via `useTransition`; show pending state on the button; do not edit `src/components/ui/` directly

**Checkpoint**: Published badge updates immediately on toggle; soft-deleted lists cannot be publish-toggled (action returns error).

---

## Phase 7: User Story 4 — Soft Delete a List (Priority: P3)

**Goal**: User can delete a list from the dashboard; list disappears immediately; data is preserved with `deletedAt` set.

**Independent Test**: Click "Delete" on a list; confirm the card is removed from the grid; query the DB directly and confirm `deleted_at IS NOT NULL` for that list.

- [ ] T028 [P] [US4] Implement `deleteListAction` in `src/actions/list-actions.ts`: authenticate, validate `listId`, delegate (`deleteList`), map `NOT_FOUND`, revalidate `'/dashboard'`; export `DeleteListSuccessData` type
- [ ] T029 [US4] Add a "Delete" action to the `ListCard` action menu — show a confirmation `AlertDialog` before calling `deleteListAction` via `useTransition`; optimistically remove the card on confirm; show error toast if action fails; do not edit `src/components/ui/` directly

**Checkpoint**: Deleted list disappears from dashboard; DB row has `deleted_at` set; refreshing the page confirms it stays gone.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T030 [P] Run `pnpm typecheck` and resolve any TypeScript errors introduced across all new and modified files
- [ ] T031 [P] Run `pnpm lint:fix` across `src/lib/list/`, `src/actions/list-actions.ts`, `src/schemas/list.ts`, `src/components/dashboard/`, `src/app/(dashboard)/dashboard/`
- [ ] T032 Run full test suite `pnpm test` and confirm all unit, component, and integration tests pass; verify coverage ≥ 90% for `src/lib/list/service.ts` (SC-003)
- [ ] T033 Verify SC-006: confirm `src/lib/mocks/lists.ts` does not exist and no file in the workspace imports from `@/lib/mocks/lists` — run `grep -r "lib/mocks/lists" src/`
- [ ] T034 [P] Update `src/lib/list/service.ts` JSDoc header to document the module, its public API, and link to `specs/005-lists-service/` following the pattern in `src/lib/auth/service.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user story phases**
- **Phase 3 (US5)**: Depends on Phase 2 — can start once `getListsByUser` is implemented (T007)
- **Phase 4 (US1)**: Depends on Phase 2 — can start once `createList` is implemented (T008)
- **Phase 5 (US2)**: Depends on Phase 2 — starts once `updateList` is implemented (T009)
- **Phase 6 (US3)**: Depends on Phase 2 — starts once `publishList`/`unpublishList` are implemented (T011, T012)
- **Phase 7 (US4)**: Depends on Phase 2 — starts once `deleteList` is implemented (T010)
- **Phase 8 (Polish)**: Depends on all desired phases being complete

### User Story Dependencies

- **US5 (P1)**: Unblocks as soon as T007 (`getListsByUser`) lands — no dependency on US1–US4
- **US1 (P1)**: Unblocks as soon as T008 (`createList`) lands — no dependency on US2–US5
- **US2 (P2)**: Independent of US1 and US5 at the service level; integrates into the same dashboard UI
- **US3 (P2)**: Independent of US1 and US2 at the service level
- **US4 (P3)**: Independent of all other stories

### Parallel Opportunities Within Phase 2

T003, T004, T005, T006 can all proceed in parallel (different files, no inter-dependencies). T007–T012 can be drafted in parallel but all live in `service.ts` — coordinate on a single file to avoid conflicts, or stub functions and fill bodies in order.

---

## Parallel Execution Examples

### Phase 2 split (two developers)

```
Dev A: T003 (errors.ts) → T007 (getListsByUser) → T008 (createList) → T010 (deleteList)
Dev B: T004 (types.ts) + T005 (schemas) + T006 (types/list.ts)  →  T009 (updateList) + T011 (publishList) + T012 (unpublishList)
Both: T013 unit tests after all service operations merged
```

### After Phase 2: US5 + US1 in parallel

```
Dev A: T014 → T015 → T016 → T017  (US5 dashboard refactor)
Dev B: T018 → T019 → T020 → T021  (US1 create form)
```

---

## Implementation Strategy

### MVP (US5 + US1 only — real data + create flow)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US5 — dashboard shows real data, mock deleted ✅
4. Complete Phase 4: US1 — create form works end-to-end ✅
5. **Stop and validate** — users can create lists and see them live

### Incremental Delivery

1. Setup + Foundational → service layer tested in isolation
2. US5 → real dashboard (MVP, no mocks)
3. US1 → create list
4. US2 → edit list
5. US3 → publish/unpublish toggle
6. US4 → soft delete
7. Polish → clean up, coverage check, docs

---

## Task Count Summary

| Phase | Tasks | Stories |
|-------|-------|---------|
| Phase 1: Setup | 2 | — |
| Phase 2: Foundational | 11 | — |
| Phase 3: US5 — Dashboard Real Lists | 4 | US5 |
| Phase 4: US1 — Create List | 4 | US1 |
| Phase 5: US2 — Update List | 3 | US2 |
| Phase 6: US3 — Publish/Unpublish | 3 | US3 |
| Phase 7: US4 — Soft Delete | 2 | US4 |
| Phase 8: Polish | 5 | — |
| **Total** | **34** | **5 stories** |
