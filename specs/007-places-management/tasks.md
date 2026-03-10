# Tasks: Places Management

**Input**: Design documents from `specs/007-places-management/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.  
**No DB migration required** — all schema work was completed in spec 006.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to ([US1]–[US4])

---

## Phase 1: Setup

**Purpose**: Add new TypeScript types, Zod schema, and config constants that all service functions and UI components depend on.

- [x] T001 [P] Add `PlaceWithListCount`, `CreateStandalonePlaceResult`, and `DeletePlaceResult` interfaces to `src/lib/place/service/types.ts`
- [x] T002 [P] ~~Add `createStandalonePlaceSchema`~~ — **refactored**: standalone creation reuses the existing `createPlaceSchema` (name + address fields); no separate schema required. `CreateStandalonePlaceResult` is `Pick<CreatePlaceResult, "place">` in `src/lib/place/service/types.ts`
- [x] T003 [P] Add `places: "/dashboard/places"` to `DASHBOARD_ROUTES` in `src/lib/config/index.ts`

**Checkpoint**: Types, schema, and config ready — service and action layers can now be implemented

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the three new service functions inside `src/lib/place/service.ts`. All user story phases block on this phase completing.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add `getAllPlacesByUser({ userId })` to `src/lib/place/service.ts` — left-join `list_places` on `(placeId, deletedAt IS NULL)` + `count()` + `groupBy`, filtered to `places.userId = userId` and `places.deletedAt IS NULL`, ordered `name ASC`; return `PlaceWithListCount[]`; log `[PlaceService:getAllPlacesByUser]`
- [x] T005 ~~Add `createStandalonePlace`~~ — **refactored into `createPlace`**: `createPlace` now accepts an optional `listId` via TypeScript overload signatures. Without `listId` it performs a single `INSERT INTO places` (system-generated `googlePlaceId`, `latitude = "0"`, `longitude = "0"`, no `ListPlace` row) and returns `CreateStandalonePlaceResult`. With `listId` it runs the original transaction path and returns `CreatePlaceResult`. No separate function exists.
- [x] T006 Add `deletePlace({ placeId, userId })` to `src/lib/place/service.ts` — single Drizzle transaction: (1) `SELECT` to verify `places.userId = userId` and `deletedAt IS NULL`, throw `notFoundError()` if missing; (2) `UPDATE places SET deletedAt = now(), updatedAt = now()`; (3) bulk `UPDATE list_places SET deletedAt = now() WHERE placeId = ? AND deletedAt IS NULL`; capture and return `{ deletedListPlaceCount: rowCount }`; log `[PlaceService:deletePlace]`
- [x] T007 Export `getAllPlacesByUser`, `deletePlace`, and their result types from the public API block at the top of `src/lib/place/service.ts` — ~~`createStandalonePlace`~~ is not exported separately; standalone creation is via the existing `createPlace` export
- [x] T008 Write unit tests for `getAllPlacesByUser` in `tests/unit/place/service.test.ts` — cases: user with 0 places, 1 standalone place (count 0), 1 place in 2 lists (count 2), multiple places ordered by name
- [x] T009 Write unit tests for standalone `createPlace` (no `listId`) in `tests/unit/place/service.test.ts` — describe block: `"createPlace (standalone — no listId)"`; cases: success (no ListPlace row created), validation errors delegated to Zod layer
- [x] T010 Write unit tests for `deletePlace` in `tests/unit/place/service.test.ts` — cases: success (returns correct `deletedListPlaceCount`), place not found, wrong owner, place already soft-deleted
- [x] T011 Write integration test for `deletePlace` cascade in `tests/integration/place/deletePlace.cascade.test.ts` — seed a place attached to 2 lists; call `deletePlace`; assert `places.deletedAt` is set; assert both `list_places.deletedAt` rows are set; assert `getPlacesByList` for both lists returns empty

**Checkpoint**: All three service functions implemented and tested — user story implementation can now begin

---

## Phase 3: User Story 1 — View and Navigate My Places (Priority: P1) 🎯 MVP

**Goal**: A user can navigate to `/dashboard/places` and see all their places with name, address, and active list count.

**Independent Test**: A user with 3 places across 2 lists navigates to `/dashboard/places` and sees all 3 place cards with correct names, addresses, and list counts. User with 0 places sees an empty state.

- [x] T012 [P] [US1] Create `src/app/(dashboard)/dashboard/places/_components/PlaceCard.tsx` — Client Component; renders place `name`, `address`, `"In N list(s)"` badge; accepts `place: PlaceWithListCount` prop; includes Edit and Delete button slots (no-op callbacks for now)
- [x] T013 [P] [US1] Create `src/app/(dashboard)/dashboard/places/_components/PlacesClient.tsx` — Client Component; accepts `initialPlaces: PlaceWithListCount[]`; renders a list of `PlaceCard` components; renders empty state when `initialPlaces.length === 0` (e.g., "No places yet — add one!"); stub out dialog open/close state for AddPlaceDialog, EditPlaceDialog, DeletePlaceDialog (not wired yet)
- [x] T014 [US1] Create `src/app/(dashboard)/dashboard/places/page.tsx` — Server Component; call `getSession()` and `redirect("/login")` if unauthenticated; call `getAllPlacesByUser(userId)`; pass result as `initialPlaces` to `<PlacesClient />`; handle `PlaceServiceError` with a graceful error message prop (same pattern as `DashboardPage`)
- [x] T015 [US1] Add a "My Places" navigation link using `DASHBOARD_ROUTES.places` in the dashboard layout or sidebar — locate the nav in `src/app/(dashboard)/dashboard/layout.tsx` or the relevant nav component and add the link alongside the existing dashboard nav items
- [x] T016 [US1] Write component test for `PlacesClient` in `tests/component/places/PlacesClient.test.tsx` — cases: renders N place cards from `initialPlaces`, renders empty state when array is empty

**Checkpoint**: `/dashboard/places` renders real place data and is reachable via nav — User Story 1 is fully functional

---

## Phase 4: User Story 2 — Delete a Place Entirely (Priority: P1)

**Goal**: A user can delete a place from "My Places" with a confirmation dialog, and the place disappears from all lists automatically.

**Independent Test**: User deletes a place with `activeListCount = 2`; confirmation dialog shows "removed from 2 list(s)"; after confirm, the place is gone from "My Places" and both list detail pages no longer show it.

- [x] T017 [P] [US2] Create `src/app/(dashboard)/dashboard/places/_components/DeletePlaceDialog.tsx` — Client Component; accepts `place: PlaceWithListCount`, `open: boolean`, `onOpenChange`, `onConfirm` props; renders shadcn/ui `<Dialog>`; body text shows `"This place will be removed from ${activeListCount} list(s). This cannot be undone."`; Cancel dismisses, Confirm calls `onConfirm`; shows loading state while action is pending
- [x] T018 [P] [US2] Add `deletePlaceAction` to `src/actions/place-actions.ts` — Server Action: `requireAuth` → extract `placeId` from `FormData` → call `deletePlace({ placeId, userId })` → on success call `revalidatePath(DASHBOARD_ROUTES.places)` AND `revalidatePath("/dashboard/lists", "layout")` → return `ActionState<{ deletedListPlaceCount: number }>`; map `PlaceServiceError` to user-safe message
- [x] T019 [US2] Wire `DeletePlaceDialog` into `PlacesClient.tsx` — add `selectedPlaceForDelete` state; pass the `deletePlaceAction` bound to `useActionState` to the dialog's `onConfirm`; on success close dialog and show a toast (e.g., "Place deleted and removed from N list(s)")
- [x] T020 [US2] Wire the Delete button in `PlaceCard.tsx` to open `DeletePlaceDialog` via the callback from `PlacesClient`
- [x] T021 [US2] Write component test for `DeletePlaceDialog` in `tests/component/places/DeletePlaceDialog.test.tsx` — cases: renders correct list count in message, cancel = `onConfirm` not called, confirm = `onConfirm` called, shows loading state while pending

**Checkpoint**: Delete flow complete end-to-end with cascade — User Story 2 is fully functional

---

## Phase 5: User Story 3 — Add a Place Without a List (Priority: P2)

**Goal**: A user can create a new place from "My Places" with only a name and address — no list required.

**Independent Test**: User opens "Add a place" from "My Places", fills name + address, submits; new place appears in "My Places" with "In 0 lists"; place appears in the available-places search on any of the user's lists.

- [x] T022 [P] [US3] Create `src/app/(dashboard)/dashboard/places/_components/AddPlaceDialog.tsx` — Client Component; accepts `open: boolean`, `onOpenChange`, `action` prop (Server Action); renders shadcn/ui `<Dialog>` with controlled `name` and `address` inputs; Submit button disabled when either field is empty or whitespace-only; no list selector; shows field-level validation errors from `ActionState.fieldErrors`; closes on success
- [x] T023 [P] [US3] ~~Add `createStandalonePlaceAction`~~ — **refactored into `createPlaceAction`**: `createPlaceAction` in `src/actions/place-actions.ts` now handles both cases. When `listId` is absent from `FormData` it calls `createPlace({ userId, name, address })` (standalone path) and revalidates `DASHBOARD_ROUTES.places`. When `listId` is present it calls `createPlace({ listId, userId, name, address })` (list-attach path) and revalidates both routes. Returns `ActionState<{ placeId: string; listPlaceId?: string }>`.
- [x] T024 [US3] Wire `AddPlaceDialog` into `PlacesClient.tsx` — add an "Add a place" button in the page header; manage `addDialogOpen` state; pass `createPlaceAction` to the dialog (no `listId` prop so it uses the standalone path); on success close dialog and show success toast
- [x] T025 [US3] Write component test for `AddPlaceDialog` in `tests/component/places/AddPlaceDialog.test.tsx` — cases: Submit disabled when name empty, Submit disabled when address empty, Submit enabled with both valid, field errors rendered from `ActionState`, closes on success state

**Checkpoint**: Standalone place creation complete — User Story 3 is fully functional

---

## Phase 6: User Story 4 — Modify a Place Across All Lists (Priority: P2)

**Goal**: A user can edit a place's name or address from "My Places"; changes are reflected on all list detail pages immediately.

**Independent Test**: User edits place "Old Cafe" → "New Cafe" from "My Places"; both list detail pages containing that place show "New Cafe" without any further action.

- [x] T026 [P] [US4] Create `src/app/(dashboard)/dashboard/places/_components/EditPlaceDialog.tsx` — Client Component; closely mirrors or reuses `src/app/(dashboard)/dashboard/lists/[listId]/_components/EditPlaceDialog.tsx`; accepts `place: PlaceWithListCount`, `open: boolean`, `onOpenChange`, `action`; pre-fills `name` and `address` fields; tracks dirty state (compare current values to loaded values); Save disabled when clean or invalid; unsaved-changes indicator shown when dirty; prompts before close if dirty; does NOT show `googlePlaceId`
- [x] T027 [US4] Wire `EditPlaceDialog` into `PlacesClient.tsx` — add `selectedPlaceForEdit` state; pass the existing `updatePlaceAction` (already in `src/actions/place-actions.ts`) along with the selected place data; on success close dialog and show success toast; ensure `revalidatePath("/dashboard/lists", "layout")` is called in the action so list detail pages update (verify this is already done in `updatePlaceAction` or add it)
- [x] T028 [US4] Wire the Edit button in `PlaceCard.tsx` to open `EditPlaceDialog` via the callback from `PlacesClient`
- [x] T029 [US4] Verify `updatePlaceAction` in `src/actions/place-actions.ts` calls `revalidatePath("/dashboard/lists", "layout")` in addition to `revalidatePath(DASHBOARD_ROUTES.listDetail(listId))` so edits made via "My Places" (where no specific `listId` context exists) still invalidate all list pages; add the broad `revalidatePath` call if absent
- [x] T030 [US4] Write component test for `EditPlaceDialog` in `tests/component/places/EditPlaceDialog.test.tsx` — cases: pre-fills fields from place prop, Save disabled when clean, Save enabled when dirty+valid, unsaved-changes indicator shown when dirty, Save disabled when name cleared, Save disabled when address cleared, prompts before close when dirty

**Checkpoint**: Edit flow complete — changes reflect on all lists. All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: E2E coverage for critical paths, error-state hardening, and overall consistency review.

- [x] T031 [P] E2E unauthenticated redirect test in `tests/e2e/places-management.spec.ts` — implemented and passing: navigating to `/dashboard/places` without a session redirects to `/login`
- [x] T032 [P] E2E authenticated journeys — **deferred**: `test.describe.skip("My Places — Delete a place (US2)")` stub added to `places-management.spec.ts` with TODO comment for the shared Playwright login fixture. Full flow (seed place in 2 lists → delete → verify cascade) is written but skipped until the auth fixture lands.
- [x] T033 [P] E2E authenticated journeys — **deferred**: `test.describe.skip("My Places — Add a place (US3)")` stub added with TODO comment. Full flow (open add dialog → fill name + address → submit → verify "not in any list") is written but skipped until the auth fixture lands.
- [x] T034 [P] Add error boundary / error prop handling to `PlacesClient.tsx` — display a user-friendly banner if `initialError` is set (same pattern as `DashboardClient`)
- [x] T035 Validate the "My Places" nav link is visible and active-styled on the `/dashboard/places` route (verify against the dashboard navigation component's active-link pattern)
- [x] T036 Run `pnpm test` and `pnpm test:e2e --grep "places-management"` to confirm all tests pass; fix any failures before marking feature complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; all three tasks are parallel
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — specifically needs `getAllPlacesByUser` (T004)
- **US2 (Phase 4)**: Depends on Phase 2 — specifically needs `deletePlace` (T006); can run in parallel with US3/US4 after Phase 2
- **US3 (Phase 5)**: Depends on Phase 2 — uses standalone path of `createPlace` (T005 refactored); can run in parallel with US2/US4 after Phase 2
- **US4 (Phase 6)**: Depends on Phase 2 — uses existing `updatePlace`; depends on US1 for `PlacesClient` wiring (T013); can start after T013
- **Polish (Phase 7)**: Depends on all four user story phases completing

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — no dependency on US2/US3/US4
- **US2 (P1)**: Unblocked after Phase 2 — integrates into `PlacesClient` from US1 but can be developed against the stub
- **US3 (P2)**: Unblocked after Phase 2 — integrates into `PlacesClient` from US1 but can be developed against the stub
- **US4 (P2)**: Depends on `PlacesClient.tsx` skeleton (T013) existing; otherwise unblocked

### Parallel Opportunities Per Phase

**Phase 1**: T001 + T002 + T003 all in different files — fully parallel

**Phase 2**: T004 + T005 + T006 are separate functions in the same file — write sequentially or split by function block (whichever is faster); T008 + T009 + T010 test files can be written in parallel alongside the implementation

**Phase 3**: T012 (PlaceCard) + T013 (PlacesClient) can be written in parallel before T014 (page.tsx) wires them together

**Phase 4**: T017 (DeletePlaceDialog) + T018 (deletePlaceAction) fully parallel — different files

**Phase 5**: T022 (AddPlaceDialog) + T023 (`createPlaceAction` standalone path) fully parallel — different files

**Phase 6**: T026 (EditPlaceDialog) can be written in parallel with T029 (revalidatePath audit)

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T011)
3. Complete Phase 3: US1 — "My Places" page (T012–T016)
4. Complete Phase 4: US2 — Delete with cascade (T017–T021)
5. **STOP and VALIDATE**: Both P1 stories independently testable and demonstrable
6. Proceed to Phase 5 (US3) and Phase 6 (US4) as P2 stories

### Incremental Delivery

1. Setup + Foundational → service layer ready, tested
2. US1 → `/dashboard/places` shows real data, nav link works
3. US2 → delete from "My Places" cascades to all lists ← **highest user-reported pain point delivered**
4. US3 → standalone place creation without list friction
5. US4 → cross-list edit from "My Places"
6. Polish → E2E coverage, error hardening

---

## Notes

- `updatePlaceAction` already exists in `src/actions/place-actions.ts` — US4 reuses it with a `revalidatePath` audit (T029) rather than creating a new action
- `EditPlaceDialog` is now a shared component at `src/components/dashboard/places/EditPlaceDialog.tsx`; both the list-detail and My Places contexts re-export it as a thin wrapper. The shared `CreatePlaceForm` at `src/components/dashboard/places/CreatePlaceForm.tsx` is used by both `AddPlaceDialog` contexts with a `submitLabel` prop to handle contextual label differences.
- `revalidatePath("/dashboard/lists", "layout")` with the `"layout"` segment type invalidates all `/dashboard/lists/[listId]` pages in one call — use this in both `deletePlaceAction` (T018) and the `updatePlaceAction` audit (T029)
- All [P] tasks = independent files, no mutual dependencies
- [Story] label maps each task to the user story for traceability
- Commit after each checkpoint to preserve a known-good state
