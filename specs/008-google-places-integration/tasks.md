# Tasks: Google Places Integration

**Branch**: `008-google-places-integration` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

**Organization**: Tasks are grouped by phase. Phase 2 (Foundational) MUST be complete before any User Story phase begins. User Story phases can proceed in parallel once Foundational is done.

**Tests**: Included per plan.md project structure and SC-006 (≥90% branch coverage on `GooglePlacesService`).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (operates on a different file from other [P] tasks in the same phase)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema, Drizzle types, Zod validation, and error codes that every User Story phase depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 Create migration `supabase/migrations/20260310000000_add_place_google_fields.sql` — `ALTER TABLE places ADD COLUMN description text, ADD COLUMN hero_image_url varchar(2048)`
- [ ] T002 Add `description: text("description")` and `heroImageUrl: varchar("hero_image_url", { length: 2048 })` columns to Drizzle table definition in `src/db/schema/place.ts`
- [ ] T003 [P] Extend `PlaceRecord` in `src/lib/place/service/types.ts` — add `description: string | null` and `heroImageUrl: string | null` fields
- [ ] T004 [P] Add `"IMMUTABLE_FIELD"` to `PlaceServiceErrorCode` union type in `src/lib/place/service/errors.ts`
- [ ] T005 Rewrite `createPlaceSchema` and `updatePlaceSchema` in `src/schemas/place.ts` — `createPlaceSchema` adds required `googlePlaceId`, `latitude`, `longitude` and optional `description`, `heroImageUrl`; `updatePlaceSchema` is simplified to accept only `description`

**Checkpoint**: Migration, Drizzle schema, types, and Zod schemas updated — user story implementation can begin.

---

## Phase 3: User Story 3 — Google Places Integration Service (Priority: P1)

**Goal**: A pure HTTP service module in `src/lib/services/google-places/` that can be imported by server actions without touching any DB or UI modules. This phase MUST complete before US1 and US2 actions can call into it.

**Independent Test**: Run `pnpm test tests/unit/google-places-service.test.ts` — all cases pass with no real network calls; `grep -r "@/db\|react" src/lib/services/google-places/` returns nothing.

- [ ] T006 [P] [US3] Create `GooglePlaceResult`, `GooglePlacesErrorCode`, and `GooglePlacesServiceError` class in `src/lib/services/google-places/types.ts`
- [ ] T007 [P] [US3] Create error factory functions (`invalidQuery`, `apiError`, `timeout`, `configurationError`) in `src/lib/services/google-places/errors.ts`
- [ ] T008 [US3] Implement `searchPlaces(query: string): Promise<GooglePlaceResult[]>` in `src/lib/services/google-places/service.ts` — POST to `https://places.googleapis.com/v1/places:searchText`, field mask `places.id,places.displayName,places.formattedAddress,places.location,places.editorialSummary,places.photos`, `pageSize: 5`, `AbortSignal.timeout(5000)`, map response to `GooglePlaceResult[]`, throw typed `GooglePlacesServiceError` on all failure paths (depends on T006, T007)
- [ ] T009 [US3] Implement `resolvePhotoUri(photoResourceName: string): Promise<string>` in `src/lib/services/google-places/service.ts` — GET `https://places.googleapis.com/v1/{photoResourceName}/media?maxWidthPx=800&skipHttpRedirect=true`, return `photoUri` from response body (depends on T008)
- [ ] T010 [US3] Export `searchPlaces` and `resolvePhotoUri` as named exports in `src/lib/services/google-places/index.ts` (depends on T008, T009)
- [ ] T011 [US3] Write Vitest unit tests for `GooglePlacesService` in `tests/unit/google-places-service.test.ts` — mock `fetch` globally; cover: valid Text Search response → correct `GooglePlaceResult[]` field mapping, `editorialSummary` absent → `description: null`, `photos` absent → `photoResourceName: null`, `INVALID_QUERY` (< 3 chars), `CONFIGURATION_ERROR` (missing API key), `API_ERROR` (non-200), `TIMEOUT` (AbortSignal fires), valid `resolvePhotoUri` → returns `photoUri` string

**Checkpoint**: `GooglePlacesService` fully tested and exported; server actions in Phase 4 can now call it.

---

## Phase 4: User Story 1 — Search Google Places When Adding a Place to a List (Priority: P1) 🎯 MVP

**Goal**: A signed-in user on a list detail page can search Google Places, select a result, and save a place with real API metadata — with all fields except `description` locked read-only.

**Independent Test**: From a list detail page, type "Nobu" in the Add a place search field. At least one suggestion appears. Select the first result; name, address, lat/long, googlePlaceId, description, heroImageUrl are pre-filled and non-description fields are disabled. Confirm; the saved Place record in the database has a real Google place ID, non-zero coordinates, and a `hero_image_url`. The place appears in the list.

- [ ] T012 [US1] Add `searchPlacesAction(query: string): Promise<ActionState<GooglePlaceResult[]>>` to `src/actions/place-actions.ts` — `requireAuth()`, validate `query.trim().length >= 3`, call `GooglePlacesService.searchPlaces(query)`, catch `GooglePlacesServiceError` and map each `code` to a user-safe message, return `ActionState<GooglePlaceResult[]>` with no `revalidatePath`
- [ ] T013 [US1] Add `resolveGooglePlacePhotoAction(photoResourceName: string): Promise<ActionState<{ photoUri: string }>>` to `src/actions/place-actions.ts` — `requireAuth()`, validate non-empty, call `GooglePlacesService.resolvePhotoUri(photoResourceName)`, map errors, return `ActionState<{ photoUri: string }>` with no `revalidatePath` (depends on T012 — same file, edit sequentially)
- [ ] T014 [US1] Extend `createPlaceAction` in `src/actions/place-actions.ts` to read `googlePlaceId`, `latitude`, `longitude`, `description`, `heroImageUrl` from FormData and pass them through to `createPlace` service; validate via updated `createPlaceSchema` from T005 (depends on T013 — same file)
- [ ] T015 [US1] Enforce unconditional immutability in `updatePlace` in `src/lib/place/service.ts` — after fetching the existing record, reject any update payload field other than `description` with `PlaceServiceError("IMMUTABLE_FIELD")`; remove any existing name/address-editable logic that would conflict
- [ ] T016 [US1] Write Vitest integration tests for `updatePlace` immutability enforcement in `tests/integration/update-place-source-rules.test.ts` — verify `description` update succeeds; verify `name`, `address`, `latitude`, `longitude`, `heroImageUrl` updates each return `IMMUTABLE_FIELD` error
- [ ] T017 [US1] Add Google Places search input (with 300 ms debounce) and suggestions dropdown to existing `src/components/dashboard/places/CreatePlaceForm.tsx` — on each debounced keystroke call `searchPlacesAction`; render loading state, error state ("Place search unavailable — please try again"), and results list showing `name` + `formattedAddress` per suggestion
- [ ] T018 [US1] Handle suggestion selection in `src/components/dashboard/places/CreatePlaceForm.tsx` — populate controlled form fields for `name`, `address`, `latitude`, `longitude`, `googlePlaceId`, `description`, `heroImageUrl`; set `name`/`address`/`latitude`/`longitude`/`googlePlaceId` inputs to `disabled`/`readOnly`; call `resolveGooglePlacePhotoAction(photoResourceName)` immediately on selection to resolve and store `heroImageUrl` (depends on T017)
- [ ] T019 [US1] Write RTL component tests in `tests/component/add-place-form-google.test.tsx` — mock `searchPlacesAction` and `resolveGooglePlacePhotoAction`; verify: suggestions render after 300 ms debounce, selecting a suggestion disables name/address/lat/long/googlePlaceId inputs, `description` input remains enabled, `heroImageUrl` resolve action is called

**Checkpoint**: Full list-attach flow with Google Places is functional and independently testable.

---

## Phase 5: User Story 2 — Search Google Places When Adding a Standalone Place (Priority: P1)

**Goal**: The same Google Places search behaviour available in the list-attach "Add a place" form is equally available in the standalone "My Places → Add a place" path.

**Independent Test**: From "My Places", open Add a place, type "Sketch London", select a Google Places result, save. The resulting Place record has a real `google_place_id`, non-zero coordinates, a `hero_image_url`, and list count 0.

- [ ] T020 [US2] Verify that the standalone place creation form (`src/components/dashboard/places/CreatePlaceForm.tsx` or equivalent standalone variant) uses the same Google Places search component implemented in T017–T018; if a separate form component exists for the standalone path, apply the same Google Places wiring there
- [ ] T021 [US2] Write Playwright E2E test in `tests/e2e/google-places-search.spec.ts` — covers both flows: (a) "My Places → Add → search → select → save → place appears with list count 0" and (b) "List detail → Add → search → select → save → place appears in list"; assert `google_place_id` is not a UUID format for saved records

**Checkpoint**: Both list-attach and standalone flows verified end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T022 [P] Add `GOOGLE_PLACES_API_KEY=` to `.env.example` with a comment: `# Required for Google Places integration — server-side only, MUST NOT use NEXT_PUBLIC_ prefix`
- [ ] T023 [P] Run `pnpm build` and verify `GOOGLE_PLACES_API_KEY` is absent from client bundle: `grep -r "GOOGLE_PLACES_API_KEY" .next/static/` MUST return no results (SC-004)
- [ ] T024 [P] Run `pnpm db:migrate` locally, connect to local Supabase, and confirm `description` and `hero_image_url` columns exist on the `places` table with correct types and nullability

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US3)**: Depends on Phase 2 completion (uses `PlaceServiceErrorCode` additions from T004, types from T003)
- **Phase 4 (US1)**: Depends on Phase 2 + Phase 3 (calls `GooglePlacesService`, uses updated Zod schemas, uses `IMMUTABLE_FIELD` error code)
- **Phase 5 (US2)**: Depends on Phase 4 (reuses same form component and actions)
- **Phase 6 (Polish)**: Depends on Phase 5 completion

### User Story Dependencies

- **US3**: Can begin after Phase 2 — no dependency on US1 or US2
- **US1**: Depends on US3 (calls `GooglePlacesService`) and Phase 2 (schema/types)
- **US2**: Depends on US1 (reuses form component and actions)

### Within Each Phase

- Tasks marked [P] within the same phase operate on different files and can be worked in parallel
- Tasks in the same file (T012 → T013 → T014, T017 → T018) must be applied sequentially

---

## Parallel Example: Phase 3 (US3)

```bash
# Launch in parallel (different files):
Task T006: Create src/lib/services/google-places/types.ts
Task T007: Create src/lib/services/google-places/errors.ts

# Then sequentially (same file, depends on T006 + T007):
Task T008: Implement searchPlaces() in service.ts
Task T009: Implement resolvePhotoUri() in service.ts
Task T010: Create index.ts

# Then:
Task T011: Write unit tests
```

## Parallel Example: Phase 2 (Foundational)

```bash
# Start immediately:
Task T001: Create migration SQL file
Task T002: Update src/db/schema/place.ts

# In parallel (different files):
Task T003: Extend PlaceRecord in src/lib/place/service/types.ts
Task T004: Add IMMUTABLE_FIELD in src/lib/place/service/errors.ts

# After T003 + T004:
Task T005: Rewrite Zod schemas in src/schemas/place.ts
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US3 (service)
3. Complete Phase 4: US1 (list-attach flow end-to-end)
4. **STOP and VALIDATE**: A user can search, select, and save a Google Place from a list page
5. Deploy / demo if ready

### Incremental Delivery

1. Phase 2 → Phase 3 → Foundation + Service ready
2. Phase 4 (US1) → Full list-attach flow, independently testable → **MVP**
3. Phase 5 (US2) → Standalone flow verified
4. Phase 6 (Polish) → Bundle security check passes

---

## Task Summary

| Phase | Tasks | Notes |
|-------|-------|-------|
| Phase 2: Foundational | T001–T005 (5 tasks) | Blocks everything |
| Phase 3: US3 — Service | T006–T011 (6 tasks) | Blocks US1 + US2 actions |
| Phase 4: US1 — List flow | T012–T019 (8 tasks) | MVP milestone |
| Phase 5: US2 — Standalone | T020–T021 (2 tasks) | Reuses US1 components |
| Phase 6: Polish | T022–T024 (3 tasks) | Security + env validation |
| **Total** | **24 tasks** | |

**Parallel opportunities**: T003/T004 (Phase 2), T006/T007 (Phase 3), T022/T023/T024 (Phase 6)
