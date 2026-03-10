# Feature Specification: Places Management

**Feature Branch**: `007-places-management`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "As a user I wish to be able to manage my places away from lists, specifically so I can: 1. Delete a place entirely and automatically from all lists 2. Add a place without having to worry about it being part of a list. 3. Modify a place and see the changes reflect across all lists."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View and Navigate My Places (Priority: P1)

A signed-in user navigates to a dedicated "My Places" page accessible from the dashboard. The page lists all of the user's places (across all lists) in a single view, showing each place's name, address, and the number of lists it currently belongs to. From this page the user can create, edit, or delete any place they own.

**Why this priority**: This page is the entry point for all three requested capabilities (delete, add standalone, modify). It must exist before any other story in this feature is usable. It also provides immediate value on its own: users gain a bird's-eye view of all their place data in one place for the first time.

**Independent Test**: A user with three places spread across two lists can navigate to `/dashboard/places`, see all three places listed with their names, addresses, and list counts — with no mock data involved.

**Acceptance Scenarios**:

1. **Given** a user is on the dashboard, **When** they click "My Places" in the navigation, **Then** the route `/dashboard/places` loads and displays all their non-deleted places.
2. **Given** the user has places in multiple lists, **Then** each place card shows the place's `name`, `address`, and the count of active lists it belongs to (e.g., "In 2 lists").
3. **Given** the user has no places, **When** the page loads, **Then** an appropriate empty state is shown with a prompt to create their first place.
4. **Given** the user navigates to `/dashboard/places`, **Then** only places owned by that user are shown (ownership enforced server-side).

---

### User Story 2 — Delete a Place Entirely (Priority: P1)

A user selects a place on the "My Places" page and deletes it entirely. The deletion soft-deletes the `Place` record and cascades atomically: all `ListPlace` rows linking that place to any list are also soft-deleted in the same operation. The place immediately disappears from every list detail page without any additional action from the user.

**Why this priority**: This is the highest-demand new capability from the feature request. The current service only supports removing a place from a single list at a time (`deletePlaceFromList`). A globally-deleted place must be gone everywhere instantly — users should not have to hunt through each list manually.

**Independent Test**: Given a place attached to two lists, a user deletes it from "My Places". Immediately after, both list detail pages no longer show that place. The `Place` record has `deletedAt` set, and both `ListPlace` rows for that place also have `deletedAt` set.

**Acceptance Scenarios**:

1. **Given** a place belongs to two lists, **When** the user deletes it from "My Places", **Then** the `Place` record is soft-deleted and all active `ListPlace` rows for that `placeId` are also soft-deleted in the same atomic transaction.
2. **Given** the deletion completes, **Then** the place no longer appears on any of the user's list detail pages and is not returned by `getPlacesByList` or `getAvailablePlacesForList`.
3. **Given** the user triggers delete, **Then** a confirmation dialog appears summarising the impact (e.g., "This place will be removed from 2 list(s). This cannot be undone.") before the operation proceeds.
4. **Given** the user dismisses the confirmation dialog, **Then** no records are modified.
5. **Given** the user attempts to delete a place they do not own, **Then** the operation is rejected with an authorisation error.
6. **Given** a place has `activeListCount` of 0, **When** the user deletes it, **Then** the `Place` record is still soft-deleted successfully (no `ListPlace` rows to cascade to).

---

### User Story 3 — Add a Place Without a List (Priority: P2)

A user creates a new place directly from "My Places" without having to attach it to a list. The form requires only a name and address. On success, the place is saved under the user's ownership and appears in "My Places" with a list count of 0. It is immediately available to add to any list via the existing "Add a place" flow on the list detail page.

**Why this priority**: Currently `createPlace` requires a `listId`, forcing users to choose a list just to record a place — a friction point the user explicitly called out. Standalone creation lets users build a library of places first and organise them into lists at their leisure.

**Independent Test**: A user on "My Places" creates a new place (name + address only, no list chosen). The place appears in "My Places" with "In 0 lists". The user then navigates to any of their lists, opens "Add a place", and the new standalone place appears in the available-places search results.

**Acceptance Scenarios**:

1. **Given** the user opens the "Add a place" form from "My Places", **Then** the form presents only `name` and `address` fields with no list picker.
2. **Given** the user submits a valid name and address, **Then** a `Place` record is created with the user's `userId` and a system-generated UUID `googlePlaceId`; no `ListPlace` row is created.
3. **Given** the user submits with an empty name, **Then** the submission is rejected with a validation error and no record is created.
4. **Given** the user submits with an empty address, **Then** the submission is rejected with a validation error and no record is created.
5. **Given** a standalone place is created, **Then** it appears immediately in "My Places" with a list count of 0.
6. **Given** a standalone place exists (list count 0), **When** the user opens "Add a place" on any of their lists, **Then** the standalone place appears as an option in the available-places search.

---

### User Story 4 — Modify a Place and See Changes Across All Lists (Priority: P2)

A user edits a place's name or address from the "My Places" page. Because the `Place` record is the single canonical source, the updated values are immediately reflected on every list detail page that displays that place — no per-list update is required.

**Why this priority**: The update already works at the service level (the existing `updatePlace` function modifies the canonical `Place` record). What is missing is a direct UI entry point on "My Places". This story is primarily a UI concern and can be built as soon as User Story 1 exists.

**Independent Test**: Given a place named "Old Cafe" appearing in two lists, a user edits it to "New Cafe" from "My Places". Both list detail pages immediately show "New Cafe" with no further action from the user.

**Acceptance Scenarios**:

1. **Given** the user clicks "Edit" on a place in "My Places", **Then** an edit form opens pre-filled with the place's current `name` and `address`; `googlePlaceId` is not shown.
2. **Given** the user changes the name and saves, **Then** `name` and `updatedAt` are updated on the `Place` record; `address`, `googlePlaceId`, and all other fields remain unchanged.
3. **Given** the user changes the address and saves, **Then** `address` and `updatedAt` are updated; `name` and `googlePlaceId` remain unchanged.
4. **Given** the edit is saved, **Then** the updated values appear on every list detail page that contains this place without any further user action.
5. **Given** the form is clean (no changes), **Then** the Save button is disabled and no dirty indicator is shown.
6. **Given** the form is dirty (at least one field changed to a valid non-empty value), **Then** a visible unsaved-changes indicator is shown and the Save button becomes enabled.
7. **Given** the user clears the name field and attempts to save, **Then** the update is rejected with a validation error.
8. **Given** the user clears the address field and attempts to save, **Then** the update is rejected with a validation error.
9. **Given** the user attempts to edit a place they do not own, **Then** the operation is rejected with an authorisation error.
10. **Given** the user has made changes in the edit form, **When** they attempt to close or navigate away without saving, **Then** a confirmation prompt warns them that unsaved changes will be lost.

---

### Edge Cases

- What if the place is in 0 lists when deleted? → `deletePlace` MUST still succeed; there are simply no `ListPlace` rows to cascade to.
- What if a name or address consists entirely of whitespace? → Treat as empty; reject with a validation error before any database call.
- What if the name exceeds 255 characters or address exceeds 500 characters? → Reject with a validation error.
- What if two places have the same name? → Permitted; places are identified by UUID. Both appear in "My Places".
- What happens if a `deletePlace` call is made while the user is on a list detail page viewing that place? → Optimistic UI may show a stale card briefly; on any revalidation or navigation the place will be absent.
- What if a place has had all its `ListPlace` rows individually soft-deleted via `deletePlaceFromList` (list count already 0)? → The `Place` record still exists and appears in "My Places" with count 0; `deletePlace` still works correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a `/dashboard/places` route rendering a "My Places" page accessible only to authenticated users.
- **FR-002**: The system MUST provide a `getAllPlacesByUser` query accepting `{ userId }` that returns all non-deleted `Place` records owned by the user, each annotated with an `activeListCount` integer (count of active, non-deleted `ListPlace` rows for that place). Results MUST be ordered by `name ASC`.
- **FR-003**: The system MUST provide a `deletePlace` service function accepting `{ placeId, userId }`. In a single atomic transaction, the function MUST: (a) verify the authenticated user owns the place; (b) soft-delete the `Place` record; (c) soft-delete all active `ListPlace` rows for that `placeId`. If the place does not exist or is already soft-deleted, the function MUST return a not-found error.
- **FR-004**: The system MUST provide a `createStandalonePlace` service function (or extend `createPlace` to make `listId` optional) accepting `{ userId, name, address }`. When `listId` is absent, only the `Place` record is created — no `ListPlace` row is created. The function MUST validate name (non-empty, non-whitespace, max 255 chars) and address (non-empty, non-whitespace, max 500 chars), auto-generate `googlePlaceId` as a UUID, and set `userId` from the authenticated session.
- **FR-005**: The "My Places" page MUST include an "Add a place" affordance that opens a form with `name` and `address` fields only (no list selector). On submission, `createStandalonePlace` is called. On success, the page refreshes to show the new place with list count 0.
- **FR-006**: The "My Places" page MUST display a delete affordance for each place. Before executing, a confirmation dialog MUST state the place will be removed from N list(s) and cannot be undone. The `deletePlace` operation MUST proceed only after explicit user confirmation.
- **FR-007**: The "My Places" page MUST display an edit affordance for each place that opens a form pre-filled with the place's current `name` and `address`. On submission, the existing `updatePlace` service function is called. `googlePlaceId` MUST NOT appear in this form.
- **FR-008**: All new service functions (`getAllPlacesByUser`, `deletePlace`, `createStandalonePlace`) MUST be callable from Server Actions and MUST NOT expose database internals to client components.
- **FR-009**: The dashboard navigation MUST include a link to `/dashboard/places` so the page is discoverable without knowing the URL.
- **FR-010**: After a successful `deletePlace` call, the relevant list detail paths MUST be revalidated (via `revalidatePath`) so that list views reflect the deletion should the user navigate to them.
- **FR-011**: The "My Places" edit form MUST implement dirty-state tracking identical to the list detail edit form (spec `006-places-service` FR-013/FR-014): Save disabled when clean or invalid; unsaved-changes indicator shown when dirty; navigation-away confirmation when dirty.

### Key Entities

- **Place** (`places` table): The canonical, user-owned record for a location. Contains `userId`, `name`, `address`, `googlePlaceId`, standard timestamps, and `deletedAt`. Soft-deleting this record is the authoritative "place is gone" signal; the cascade to `ListPlace` rows ensures all list views reflect the deletion automatically.
- **ListPlace** (`list_places` table): Junction row linking a `Place` to a `List`. Cascading soft-deletion of all `ListPlace` rows for a given `placeId` (as part of `deletePlace`) ensures the place disappears from every list's active view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can navigate to "My Places" from the dashboard and see all their places in under 1 second (local dev, single-digit place counts typical for this product stage).
- **SC-002**: After a user deletes a place from "My Places", 100% of their list detail pages that previously contained that place no longer show it — verifiable in the same session without a full reload of each list.
- **SC-003**: A user can create a standalone place in under 30 seconds (open form → fill two fields → submit) without choosing a list, and the place is immediately available to be added to any list via the existing "Add a place" flow.
- **SC-004**: A user can update a place's name or address from "My Places" and observe the change reflected on every affected list detail page in the same session, without repeating the edit per list.
- **SC-005**: Zero active `ListPlace` rows remain (i.e., all have `deletedAt` set) for a place after `deletePlace` completes — verified by a service-level integration test querying all `ListPlace` rows for the target `placeId`.
