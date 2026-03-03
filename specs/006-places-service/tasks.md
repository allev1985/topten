# Tasks: Places Service

**Input**: Design documents from `/specs/006-places-service/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Tests**: Included — SC-003 requires ≥ 90% unit test coverage for all three service operations; SC-007 and SC-008 require component and integration tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4 map to spec.md)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Schema index additions, migration, module skeleton, new type and config entries.

- [ ] T001 Add `index("places_deleted_at_idx").on(table.deletedAt)` to the `pgTable` index array in `src/db/schema/place.ts`; import `index` from `drizzle-orm/pg-core` alongside the existing `uniqueIndex` import
- [ ] T002 Add `index("list_places_place_id_idx").on(table.placeId)` to the `pgTable` index array in `src/db/schema/listPlace.ts` (existing `index` import already present)
- [ ] T003 Generate and inspect the Drizzle migration: run `pnpm drizzle-kit generate`; confirm the generated SQL in `supabase/migrations/` creates exactly two indexes (`places_deleted_at_idx`, `list_places_place_id_idx`) and no other changes; apply via `pnpm db:migrate` (or Supabase CLI) against the local database
- [ ] T004 [P] Create empty placeholder files to establish the module tree: `src/lib/place/service.ts`, `src/lib/place/service/errors.ts`, `src/lib/place/service/types.ts`, `src/schemas/place.ts`
- [ ] T005 [P] Add `listDetail: (listId: string) => \`/dashboard/lists/\${listId}\`` to the `DASHBOARD_ROUTES` (or equivalent route-constants object) in `src/lib/config/index.ts`; follow the existing constant naming pattern; also add `/dashboard/lists` to `PROTECTED_ROUTES` if a prefix match does not already cover it
- [ ] T006 [P] Create `src/types/place.ts` — export `PlaceSummary { id: string; name: string; address: string }` as specified in `data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Full service layer — all business logic and DB access — plus shared types and Zod schemas. No user story can be implemented until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 Implement `PlaceServiceError` class and error factory functions (`notFoundError`, `alreadyInListError`, `validationError`, `placeServiceError`) in `src/lib/place/service/errors.ts`; mirror the pattern in `src/lib/list/service/errors.ts`; export `PlaceServiceErrorCode` union type as specified in `data-model.md`
- [ ] T008 [P] Define result types `PlaceRecord`, `PlaceSummary`, `CreatePlaceResult`, `AddExistingPlaceResult`, `UpdatePlaceResult`, `DeletePlaceResult` in `src/lib/place/service/types.ts` as specified in `data-model.md`
- [ ] T009 [P] Define Zod schemas `createPlaceSchema` and `updatePlaceSchema` (with `.refine` guard requiring at least one field for update) in `src/schemas/place.ts`; export inferred `CreatePlaceInput` and `UpdatePlaceInput` types; follow the pattern in `src/schemas/list.ts`
- [ ] T010 Implement `getPlacesByList(listId: string): Promise<PlaceSummary[]>` in `src/lib/place/service.ts` — Drizzle join of `list_places` → `places` filtered by `eq(listPlaces.listId, listId)`, `isNull(listPlaces.deletedAt)`, `isNull(places.deletedAt)`, ordered `asc(listPlaces.position)`, returning `{ id, name, address }` columns; log `[PlaceService:getPlacesByList]`
- [ ] T011 [P] Implement `getAvailablePlacesForList({ listId, userId }: { listId: string; userId: string }): Promise<PlaceSummary[]>` in `src/lib/place/service.ts` — returns non-deleted places belonging to at least one of the user's active lists that are NOT currently attached to the target list, as specified in `data-model.md`; ordered `asc(places.name)`; log `[PlaceService:getAvailablePlacesForList]`
- [ ] T012 Implement `createPlace({ listId, userId, name, address }: CreatePlaceInput & { listId: string; userId: string }): Promise<CreatePlaceResult>` in `src/lib/place/service.ts` — verify list ownership (`lists.userId = userId`, `deletedAt IS NULL`); throw `notFoundError` if check fails; wrap `INSERT INTO places` and `INSERT INTO list_places` in `db.transaction()`; `googlePlaceId = crypto.randomUUID()`; `latitude = "0"`, `longitude = "0"`; `position = MAX(position) + 1` computed within the transaction; log `[PlaceService:createPlace]`
- [ ] T013 [P] Implement `addExistingPlaceToList({ listId, placeId, userId }: { listId: string; placeId: string; userId: string }): Promise<AddExistingPlaceResult>` in `src/lib/place/service.ts` — verify list ownership; check no active `ListPlace` exists for `(listId, placeId)` (throw `alreadyInListError` if found); insert `ListPlace` with `position = MAX(position) + 1`; log `[PlaceService:addExistingPlaceToList]`
- [ ] T014 [P] Implement `updatePlace({ placeId, listId, userId, name?, address? }): Promise<UpdatePlaceResult>` in `src/lib/place/service.ts` — verify list ownership and that `place.deletedAt IS NULL`; throw `notFoundError` on failure; update only provided fields + `updatedAt`; `googlePlaceId` MUST NOT be an accepted parameter (omit from input type); log `[PlaceService:updatePlace]`
- [ ] T015 [P] Implement `deletePlace({ placeId, listId, userId }): Promise<DeletePlaceResult>` in `src/lib/place/service.ts` — verify list ownership; throw `notFoundError` if place is already deleted or not found; set `deletedAt = new Date()` on the `Place` record; operation is idempotent (return not-found rather than error on repeat call); log `[PlaceService:deletePlace]`
- [ ] T016 Unit test all six service functions: create `tests/unit/lib/place-service.test.ts`; mock `src/db` with `vi.mock`; cover happy-path and primary error branches for `createPlace` (ownership failure, transaction rollback), `addExistingPlaceToList` (duplicate), `updatePlace` (immutable `googlePlaceId`), `deletePlace` (idempotency), `getPlacesByList` (soft-deleted exclusion), `getAvailablePlacesForList` (already-attached exclusion); target ≥ 90% coverage for `src/lib/place/service.ts`

**Checkpoint**: `pnpm test -- tests/unit/lib/place-service.test.ts` passes; all six service operations verified in isolation.

---

## Phase 3: User Story 2 — View Places in a List (Priority: P1) 🎯 MVP

**Goal**: Authenticated user navigates to a list and sees all attached places in position order; empty state shown when none exist.

**Independent Test**: Seed a test list with 3 places at positions 1, 2, 3 in the local Supabase DB; navigate to `/dashboard/lists/[listId]`; confirm all 3 place cards render with correct names and addresses in order, and a soft-deleted 4th place does not appear.

- [ ] T017 [US2] Create `src/app/(dashboard)/dashboard/lists/[listId]/page.tsx` as a Server Component — call `getSession()` and redirect if unauthenticated; call `getPlacesByList(listId)` and `getAvailablePlacesForList({ listId, userId })`; pass both result arrays as props to `<PlaceList>`; render list title (fetch from `getListsByUser` or a new `getListById` query); handle errors with appropriate UI
- [ ] T018 [P] [US2] Create `src/app/(dashboard)/dashboard/lists/[listId]/_components/PlaceCard.tsx` — `"use client"` component; accepts `place: PlaceSummary`; renders name and address; includes placeholder slots for edit and delete affordances (to be wired in later phases); no direct `src/components/ui/` edits
- [ ] T019 [US2] Create `src/app/(dashboard)/dashboard/lists/[listId]/_components/PlaceList.tsx` — `"use client"` component; accepts `places: PlaceSummary[]` and `availablePlaces: PlaceSummary[]`; renders a `<PlaceCard>` for each place; renders empty state ("No places yet — add one!") when `places` is empty; renders the "Add a place" button affordance (dialog trigger placeholder for Phase 4)
- [ ] T020 [US2] Update `src/app/(dashboard)/dashboard/DashboardClient.tsx` — make list card clickable; on click navigate to `DASHBOARD_ROUTES.listDetail(list.id)` using `useRouter`; follow the existing `handleListClick` or routing pattern already in the component
- [ ] T021 [US2] Integration test: create `tests/integration/place-service.test.ts` — against local Supabase; seed a test list with 3 active places (positions 1–3) and 1 soft-deleted place; call `getPlacesByList`; assert exactly 3 places returned in position order; call `getAvailablePlacesForList` with a second list to assert only non-attached places are returned (SC-008)

**Checkpoint**: List detail page renders real place data; navigating from the dashboard opens the correct list; `pnpm test` passes.

---

## Phase 4: User Story 1 — Add a Place to a List (Priority: P1)

**Goal**: User opens "Add a place" dialog; can search existing places by name and attach one to the list, or create a brand-new place. Both paths create the appropriate records and refresh the list.

**Independent Test**: From a list with zero places, (a) use the search to attach an existing place from another list — confirm it appears in the list and no new `Place` row was created; (b) create a new place via the form — confirm both a new `Place` row and a `ListPlace` row exist in the DB.

- [ ] T022 [P] [US1] Implement `createPlaceAction` in `src/actions/place-actions.ts`: authenticate (`getSession`), validate (`createPlaceSchema.safeParse` + `listId` non-empty check), delegate (`createPlace`), map `PlaceServiceError` codes to `ActionState` error messages per `contracts/place-actions.md`, revalidate `/dashboard/lists/[listId]`; export `CreatePlaceSuccessData` type
- [ ] T023 [P] [US1] Implement `addExistingPlaceToListAction` in `src/actions/place-actions.ts`: authenticate, validate `listId` and `placeId` as non-empty strings, delegate (`addExistingPlaceToList`), map `ALREADY_IN_LIST` and `NOT_FOUND` errors, revalidate `/dashboard/lists/[listId]`; export `AddExistingPlaceSuccessData` type
- [ ] T024 [US1] Create `src/app/(dashboard)/dashboard/lists/[listId]/_components/AddPlaceDialog.tsx` — `"use client"` component; accepts `listId: string` and `availablePlaces: PlaceSummary[]` as props; two-path UI: **Path A** shows a search `<Input>` that filters `availablePlaces` client-side by `name.toLowerCase().includes(term.toLowerCase())` in real time; selecting a result and confirming calls `addExistingPlaceToListAction` via `useActionState`; **Path B** shows `name` and `address` `<Input>` fields and calls `createPlaceAction` via `useActionState`; if `availablePlaces` is empty, default to Path B; submit disabled when required fields are empty/whitespace (FR-012); show field and top-level errors; close dialog on success
- [ ] T025 [US1] Wire `AddPlaceDialog` into `PlaceList.tsx` — replace the placeholder "Add a place" button with the real `<AddPlaceDialog listId={listId} availablePlaces={availablePlaces} />`; pass `availablePlaces` prop already present on `PlaceList`
- [ ] T026 [US1] Component test: create `tests/component/dashboard/AddPlaceDialog.test.tsx` — render dialog with mock `availablePlaces`; assert Path A search input filters the list in real time (SC-007); assert selecting a place and confirming calls the correct action; assert switching to Path B shows the create form; assert submit button is disabled when required fields are empty; assert error messages render when action returns `fieldErrors`

**Checkpoint**: Both add-place paths work end-to-end; new/attached places appear in the list without a full page reload; `pnpm test` passes.

---

## Phase 5: User Story 3 — Update a Place (Priority: P2)

**Goal**: User clicks a place, edits its name or address, and saves. Dirty-state indicator appears when changes are made; Save button is disabled when clean or invalid; confirmation prompt fires on close with unsaved changes.

**Independent Test**: Open the edit form for a place named "Old Cafe"; change the name to "New Cafe"; confirm the dirty indicator appears and Save is enabled; save; confirm "New Cafe" renders in the list. Reopen the form; make a change; close without saving; confirm "New Cafe" is still displayed unchanged.

- [ ] T027 [P] [US3] Implement `updatePlaceAction` in `src/actions/place-actions.ts`: authenticate, validate (`updatePlaceSchema.safeParse` + `placeId` and `listId` non-empty), delegate (`updatePlace`), map `NOT_FOUND`, revalidate `/dashboard/lists/[listId]`; export `UpdatePlaceSuccessData` type
- [ ] T028 [US3] Create `src/app/(dashboard)/dashboard/lists/[listId]/_components/EditPlaceDialog.tsx` — `"use client"` component; accepts `place: PlaceSummary` and `listId: string`; stores initial values in `useRef` on open; tracks live form values with `useState`; dirty state derived as `JSON.stringify(formValues) !== JSON.stringify(initialRef.current)`; Save button `disabled` when `!isDirty || !isValid` (FR-013); renders a visible unsaved-changes badge/label when dirty (FR-014); on attempted close while dirty, calls `window.confirm("You have unsaved changes. Discard them?")` — cancel returns to form, confirm resets to initial values and closes (FR-015); close affordance disabled while save is in progress (FR-016); calls `updatePlaceAction` via `useActionState`; `googlePlaceId` field MUST NOT appear; show field and top-level errors
- [ ] T029 [US3] Wire `EditPlaceDialog` into `PlaceCard.tsx` — clicking a place card (or an explicit "Edit" button on the card) opens `<EditPlaceDialog place={place} listId={listId} />`; pass `listId` down from `PlaceList` → `PlaceCard`
- [ ] T030 [US3] Component test: create `tests/component/dashboard/EditPlaceDialog.test.tsx` — render dialog with a seeded place; assert Save button is disabled on open (clean state); assert dirty indicator is absent on open; type a new name; assert dirty indicator appears and Save is enabled; clear the name field; assert Save is disabled (invalid); restore original name; assert form returns to clean state (FR edge case); mock `window.confirm` and assert discard prompt fires on close when dirty; assert confirm discards, cancel preserves in-memory edits; assert close button is disabled during a pending save

**Checkpoint**: Edit flow works with full dirty-state lifecycle; discard prompt fires correctly; `pnpm test` passes.

---

## Phase 6: User Story 4 — Soft Delete a Place (Priority: P3)

**Goal**: User deletes a place from the list; it disappears immediately with `deletedAt` set on the DB record.

**Independent Test**: Click "Delete" on a place; confirm it is removed from the list; query the DB and confirm `deleted_at IS NOT NULL` for that place record.

- [ ] T031 [P] [US4] Implement `deletePlaceAction` in `src/actions/place-actions.ts`: authenticate, validate `placeId` and `listId` as non-empty strings, delegate (`deletePlace`), map `NOT_FOUND` to a user-friendly error, revalidate `/dashboard/lists/[listId]`; export `DeletePlaceSuccessData` type
- [ ] T032 [US4] Add a "Delete" affordance to `PlaceCard.tsx` — render a delete button (or kebab menu item); show a shadcn/ui `<AlertDialog>` confirmation ("Remove this place from the list?") before calling `deletePlaceAction` via `useTransition`; disable the button while the transition is pending; display an error message if the action fails; do not edit `src/components/ui/` directly

**Checkpoint**: Deleted place disappears immediately; DB row has `deleted_at` set; refreshing the page confirms it stays gone.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T033 [P] Run `pnpm tsc --noEmit` and resolve any TypeScript errors introduced across all new and modified files
- [ ] T034 [P] Run `pnpm lint:fix` across `src/lib/place/`, `src/actions/place-actions.ts`, `src/schemas/place.ts`, `src/app/(dashboard)/dashboard/lists/`, `src/db/schema/place.ts`, `src/db/schema/listPlace.ts`
- [ ] T035 Run full test suite `pnpm test` and confirm all unit, component, and integration tests pass; verify coverage ≥ 90% for `src/lib/place/service.ts` (SC-003)
- [ ] T036 [P] Add JSDoc header to `src/lib/place/service.ts` documenting the module, its public API (`getPlacesByList`, `getAvailablePlacesForList`, `createPlace`, `addExistingPlaceToList`, `updatePlace`, `deletePlace`), and a link to `specs/006-places-service/`; follow the pattern in `src/lib/list/service.ts`
- [ ] T037 [P] Verify SC-006 (duplicate rejection): run the integration test confirming that calling `addExistingPlaceToList` with a `(listId, placeId)` pair that already exists returns `ALREADY_IN_LIST` — if not covered in T021, add the assertion there

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T001–T003 are sequential (generate migration after schema edits); T004–T006 are parallel with each other and with T001–T003
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user story phases**; T007 first (errors); T008–T009 in parallel; T010–T015 can be parallelised once T007 is done
- **Phase 3 (US2)**: Depends on T010 (`getPlacesByList`) and T011 (`getAvailablePlacesForList`) from Phase 2 — can start before Phase 2 is fully complete
- **Phase 4 (US1)**: Depends on T012 (`createPlace`) and T013 (`addExistingPlaceToList`) from Phase 2; also depends on Phase 3 (PlaceList scaffold must exist)
- **Phase 5 (US3)**: Depends on T014 (`updatePlace`) from Phase 2; also depends on Phase 3 (PlaceCard must exist)
- **Phase 6 (US4)**: Depends on T015 (`deletePlace`) from Phase 2; also depends on Phase 3 (PlaceCard must exist)
- **Phase 7 (Polish)**: Depends on all desired phases being complete

### User Story Dependencies

- **US2 (P1)**: Earliest unblock — readable as soon as T010 + T011 land; no dependency on US1, US3, US4
- **US1 (P1)**: Depends on US2 page scaffold (PlaceList) being in place; service-layer independent
- **US3 (P2)**: Depends on US2 PlaceCard scaffold being in place; service-layer independent
- **US4 (P3)**: Depends on US2 PlaceCard scaffold being in place; service-layer independent

### Parallel Execution (within Phase 2)

Once T007 (`PlaceServiceError`) is complete, the following can run in parallel across three workstreams:

| Workstream A | Workstream B | Workstream C |
|--------------|--------------|--------------|
| T008 (types) | T009 (Zod schemas) | T010 (getPlacesByList) |
| T011 (getAvailablePlacesForList) | T012 (createPlace) | T013 (addExistingPlaceToList) |
| T014 (updatePlace) | T015 (deletePlace) | — |

### Suggested MVP Scope

**US2 + enough of Phase 2 to unblock it** (T001–T011, T016–T021): delivers a meaningful, testable increment — a real list detail page showing places from the database. No mutation required for this slice. Adds US1 next to unlock the "Add a place" dialog.

---

## Task Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Phase 1: Setup | T001–T006 | — |
| Phase 2: Foundational | T007–T016 | — |
| Phase 3: US2 View Places | T017–T021 | US2 (P1) |
| Phase 4: US1 Add a Place | T022–T026 | US1 (P1) |
| Phase 5: US3 Update a Place | T027–T030 | US3 (P2) |
| Phase 6: US4 Delete a Place | T031–T032 | US4 (P3) |
| Phase 7: Polish | T033–T037 | — |

**Total tasks**: 37  
**Parallel opportunities**: 18 tasks marked `[P]`  
**Independent test criteria**: one per user story (Phases 3–6)
