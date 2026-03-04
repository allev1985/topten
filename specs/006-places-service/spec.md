# Feature Specification: Places Service

**Feature Branch**: `006-places-service`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "Implement the Places Service with CRUD operations. Create a place (name, address; auto-generate a UUID as googlePlaceId for now). Update a place (name/address only; googlePlaceId is immutable). Soft delete a place (deletePlace function). Enable adding a place from the Lists Page: users click into a list, see all places in that list, can click a place to update it, or click 'add a place' to create and attach it to the list via ListPlace."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Add a Place to a List (Priority: P1)

A signed-in user navigates to one of their lists. They click "Add a place". The form presents a searchable list of all places that exist across their other lists but have not yet been added to this list. The user can type to filter the list by name and select an existing place to attach it to the current list. Alternatively, if no suitable place exists, the user can create a brand-new place by entering a name and address; the new place is created and immediately attached to the list.

**Why this priority**: This is the primary entry point for all place data in the application. Surfacing existing places avoids duplicate records and lets users quickly reuse places they have already curated. Without this flow, the feature has no user-facing value.

**Independent Test**: Starting from a list with zero places, a user can (a) select an existing place they have in another list via the search and see it appear in the current list, and (b) create a brand-new place and see it appear — with no mock data involved.

**Acceptance Scenarios**:

1. **Given** the user opens the "Add a place" form, **Then** a searchable list of places from their other lists that are not yet in the current list is displayed.
2. **Given** the "Add a place" form is open and the available-places list is shown, **When** the user types in the search field, **Then** the list is filtered in real time to show only places whose name contains the search term (case-insensitive).
3. **Given** the user selects an existing place from the search results and confirms, **Then** a `ListPlace` record is created linking that place to the current list, no new `Place` record is created, and the place appears in the list.
4. **Given** the user searches and finds no matching existing places (or chooses to create new regardless), **When** they switch to the "Create new place" path and submit a valid name and address, **Then** a new `Place` record is created, a `ListPlace` record is created linking it to the list, and the place appears in the list.
5. **Given** the "Create new place" form is open, **When** the user submits with an empty name, **Then** the submission is rejected with a validation error and no records are created.
6. **Given** the "Create new place" form is open, **When** the user submits with an empty address, **Then** the submission is rejected with a validation error and no records are created.
7. **Given** a user creates a new place, **Then** the `googlePlaceId` field is set to a system-generated UUID (not supplied by the user) and is not visible in the form.
8. **Given** the available-places list is displayed, **Then** places that are already attached to the current list and not soft-deleted are excluded from the results (soft-deleted attachments remain available so they can be restored).

---

### User Story 2 — View Places in a List (Priority: P1)

A signed-in user navigates to a list detail page. The page displays all non-deleted places attached to that list, in their stored order. Each place shows its name and address.

**Why this priority**: Users must be able to see the places in their list before they can manage them. This is the foundational display needed before any edit or delete can be performed.

**Independent Test**: Given a list with 3 attached places, all 3 places (name and address) appear on the list detail page in the correct order when the user navigates to it. Given the same list alongside 4 unattached places (from the user's other lists), only those 4 unattached places appear in the "Add a place" available-places list — the 3 already-attached places do not appear there.

**Acceptance Scenarios**:

1. **Given** a list has 3 non-deleted attached places, **When** the user views the list, **Then** all 3 places are displayed with their name and address.
2. **Given** a list has no attached places, **When** the user views the list, **Then** an appropriate empty state is displayed (e.g., "No places yet — add one!").
3. **Given** a place in the list has been soft-deleted, **When** the user views the list, **Then** that place does not appear.
4. **Given** a user tries to view a list that belongs to another user, **When** the page loads, **Then** the request is rejected with an authorization error.

---

### User Story 3 — Update a Place (Priority: P2)

A user clicks on a place within their list. An edit form opens pre-filled with the place's current name and address. The user changes one or both fields and saves. The updated values are immediately reflected in the list. The `googlePlaceId` is not shown and cannot be changed.

**Why this priority**: Places need to be correctable. Names get mistyped and addresses change. This is the core content-management action after creation.

**Independent Test**: Given a place with name "Old Cafe" and address "1 Main St", a user can update the name to "New Cafe" and see "New Cafe" displayed in the list on save. The `googlePlaceId` remains unchanged.

**Acceptance Scenarios**:

1. **Given** a place exists in a list, **When** the user updates the name, **Then** `name` and `updatedAt` are updated; `address`, `googlePlaceId`, and all other fields remain unchanged.
2. **Given** a place exists in a list, **When** the user updates the address, **Then** `address` and `updatedAt` are updated; `name` and `googlePlaceId` remain unchanged.
3. **Given** the edit form is open, **When** the user clears the name and saves, **Then** the update is rejected with a validation error.
4. **Given** the edit form is open, **When** the user clears the address and saves, **Then** the update is rejected with a validation error.
5. **Given** a user attempts to update a place they do not own (via the list), **When** the service validates ownership, **Then** the operation is rejected with an authorization error.
6. **Given** the edit form opens with the saved values, **When** the user has not changed any field, **Then** the Save button is disabled and no dirty indicator is shown.
7. **Given** the edit form opens with the saved values, **When** the user changes at least one field, **Then** a visible unsaved-changes indicator appears and the Save button becomes enabled (assuming the changed fields are valid).
8. **Given** the user has made changes in the edit form (dirty state), **When** they attempt to close the form or navigate away without saving, **Then** they are presented with a confirmation prompt warning them that unsaved changes will be lost.
9. **Given** the user confirms they want to discard changes, **When** the form closes, **Then** the place retains its previous saved values and no update is persisted.
10. **Given** the user saves successfully, **When** the save completes, **Then** the dirty indicator is cleared and the Save button returns to its disabled (clean) state.

---

### User Story 4 — Remove a Place from a List (Priority: P3)

A user removes a place from a specific list. The `Place` record itself is not deleted; only the `ListPlace` junction row is soft-deleted (`deletedAt` is set on the `ListPlace` row). The place is no longer shown in that list but remains available for other lists the user owns.

**Why this priority**: Removing a place from a list preserves data integrity (the `Place` record is retained for reuse on other lists) and supports future recovery. However, users' immediate need is creation and editing; deletion is lower-frequency.

**Independent Test**: After calling `deletePlaceFromList`, the place no longer appears in the list detail page for that list but is still present in `getAvailablePlacesForList` results for any other list the user owns (since the `Place` record is not deleted).

**Acceptance Scenarios**:

1. **Given** a place is attached to a list, **When** the user removes it, **Then** `deletedAt` is set to the current UTC timestamp on the `ListPlace` row and the place no longer appears in that list.
2. **Given** a user attempts to remove a place from a list they do not own, **When** the service validates ownership, **Then** the operation is rejected.
3. **Given** the `ListPlace` row is already soft-deleted, **When** a remove is attempted again, **Then** the operation returns a not-found error (idempotent).

---

### Edge Cases

- What happens if a user submits a place name or address consisting entirely of whitespace? → Treat as empty; reject with a validation error before any database call.
- What if a place name exceeds 255 characters or address exceeds 500 characters? → Reject with a validation error.
- What if the same place is added to the same list twice? → Before creating a `ListPlace` record, the service MUST verify that no non-deleted `ListPlace` already exists for `(listId, placeId)`. If a duplicate is detected, the operation is rejected with a user-friendly error before any database write. The `list_places_list_place_idx` unique index on `(listId, placeId)` acts as a hard backstop at the database level. The "Add a place" form's available-places list naturally prevents this in the happy path by filtering out already-attached places, but the service-level guard is still required.
- What if a place with a matching `googlePlaceId` already exists in the system (relevant once Google Places integration is added)? → The service MUST check for an existing `Place` record with the same `googlePlaceId` before creating a new one. If a match is found, the existing record is reused and a `ListPlace` entry is created for it rather than inserting a duplicate `Place`. For the current iteration (UUID-assigned IDs), this path is not practically triggered, but the guard MUST be in place for forward compatibility.
- What is the `position` value for a newly added place? → The system assigns `position` as one greater than the current maximum position in the list (append to end).
- Does removing a place from a list (`deletePlaceFromList`) affect other lists? → No. Only the `ListPlace` row for the specified `(listId, placeId)` pair has `deletedAt` set. The `Place` record is left intact, so it remains accessible on any other lists it belongs to and is discoverable via `getAvailablePlacesForList`.
- What if the user edits the name field, then manually restores it to the original value? → The form compares current field values against the originally loaded values; if all fields match the saved state, the form is considered clean (no unsaved indicator, Save button disabled).
- What if a save is in progress and the user tries to close the form? → The close affordance is disabled while a save is in progress to prevent partial-state confusion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a `PlaceService` module at `src/lib/services/place/` exposing: `createPlace`, `addExistingPlaceToList`, `updatePlace`, and `deletePlaceFromList`.
- **FR-002**: `createPlace` MUST accept `{ listId, name, address }`. The system MUST auto-generate a UUID for `googlePlaceId` at creation time. Users MUST NOT supply or see `googlePlaceId` via the form. Before inserting, the service MUST check for an existing `Place` with the same `googlePlaceId`; if found, it MUST reuse that record rather than creating a duplicate.
- **FR-003**: `createPlace` MUST validate that `name` is non-empty and non-whitespace (max 255 chars) and `address` is non-empty and non-whitespace (max 500 chars) before any database interaction. If either check fails, the operation MUST be rejected with a validation error.
- **FR-004**: `createPlace` MUST, after creating (or identifying an existing) `Place` record, create a corresponding `ListPlace` record linking the place to the specified list with `position` set to one greater than the current highest position in that list (i.e., appended to the end). Both writes MUST succeed atomically; if either fails, neither record is persisted.
- **FR-004a**: `addExistingPlaceToList` MUST accept `{ listId, placeId }`. The service MUST verify that the authenticated user owns the list and that no non-deleted `ListPlace` already exists for `(listId, placeId)` before writing. On success, a `ListPlace` record is created with `position` appended to the end. No new `Place` record is created.
- **FR-004b**: The system MUST provide a `getAvailablePlacesForList` query that accepts `{ listId, userId }` and returns all non-deleted `Place` records that belong to at least one of the user's lists but are NOT currently attached (via a non-deleted `ListPlace`) to the specified list. Results MUST be ordered by place name ascending.
- **FR-005**: `updatePlace` MUST accept `{ placeId, listId, name?, description? }` — specifically `name` and `address` as optional update fields. `googlePlaceId` MUST NOT be an accepted parameter; any attempt to pass it MUST be silently ignored or rejected. The service MUST verify that the authenticated user owns the list containing this place before writing. Only provided fields are updated; `updatedAt` is always refreshed.
- **FR-006**: `deletePlaceFromList` MUST set `deletedAt` to the current UTC timestamp on the `ListPlace` row for the given `(listId, placeId)` pair, leaving the `Place` record untouched. The service MUST verify that the authenticated user owns the list and that the `ListPlace` row is currently active (`deletedAt IS NULL`) before writing.
- **FR-007**: The system MUST provide a `getPlacesByList` query that returns all non-deleted places attached to a given list (`deletedAt IS NULL` on the `Place` record), ordered by `ListPlace.position ASC`.
- **FR-008**: The list detail page MUST display all places returned by `getPlacesByList` for the current list, showing each place's name and address.
- **FR-009**: The list detail page MUST include an "Add a place" affordance that opens a two-path form:
  - **Path A — Add existing**: A searchable list populated by `getAvailablePlacesForList`. The user types to filter by name (case-insensitive, real-time). Selecting a result and confirming calls `addExistingPlaceToList`.
  - **Path B — Create new**: A form with `name` and `address` fields. On submission, `createPlace` is called.
  On success from either path, the list is refreshed to show the newly attached place. If `getAvailablePlacesForList` returns no results, the form defaults directly to Path B.
- **FR-010**: Clicking a place in the list detail page MUST open an edit form pre-filled with the place's current `name` and `address`. On submission, `updatePlace` is called. The `googlePlaceId` field MUST NOT appear in this form.
- **FR-011**: All service functions MUST be callable from Server Actions and MUST NOT expose database internals to client components.
- **FR-012**: The "Add a place" form submit button MUST remain disabled while required fields (`name`, `address`) are empty or whitespace-only.
- **FR-013**: The "Edit place" form MUST track dirty state by comparing current field values against the values loaded when the form opened. The Save button MUST be disabled when the form is clean (no changes) or invalid, and enabled only when the form is both dirty and valid.
- **FR-014**: The "Edit place" form MUST display a visible unsaved-changes indicator (e.g., a badge or label) whenever the form is in a dirty state.
- **FR-015**: When the user attempts to close the "Edit place" form or navigate away while the form is in a dirty state, the system MUST present a confirmation prompt (e.g., "You have unsaved changes. Discard them?"). Confirming discards in-memory edits and reverts to the last saved values; cancelling returns the user to the form without any data loss.
- **FR-016**: While a save operation is in progress, the close affordance of the "Edit place" form MUST be disabled to prevent the user from dismissing the form mid-save.

### Key Entities

- **Place**: A physical location that can be added to lists. Key attributes: unique ID, name (required), address (required), system-assigned Google Place ID (opaque to users for now), and a soft-delete timestamp. A place is immutable in its `googlePlaceId` after creation.
- **ListPlace**: The join record that attaches a place to a list. Key attributes: linked list ID, linked place ID, position (integer ordering within the list), and a soft-delete timestamp. Determines display order of places within a list.
- **List** (referenced, not modified): Owns `ListPlace` entries; identified by UUID. Ownership is verified by checking the list's `userId` against the authenticated user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a place (name + address) to a list and see it appear in the list in under 3 seconds (p95) on a standard connection.
- **SC-002**: A user can update a place's name or address and see the updated value reflected in the list immediately on save.
- **SC-003**: All three service operations (`createPlace`, `updatePlace`, `deletePlaceFromList`) have unit-test coverage ≥ 90% for happy-path and primary error branches.
- **SC-004**: A soft-deleted `ListPlace` row causes the place to be absent from `getPlacesByList` results immediately after `deletePlaceFromList` is called, verifiable via an integration test.
- **SC-005**: Two places created in the same list receive sequential `position` values (e.g., 1 and 2), verifiable via a unit test on the position-assignment logic.
- **SC-006**: A place cannot be added to the same list twice — the duplicate attempt is rejected with a user-friendly error at the service layer, verifiable via an integration test.
- **SC-007**: The available-places search filters results in real time as the user types; a list of 50 existing places is filtered to matching results without a full-page reload, verifiable via a component test.
- **SC-008**: `getAvailablePlacesForList` returns only places not already attached to the specified list, verifiable via an integration test using a user with places spread across multiple lists.

## Assumptions

- A `List` record owned by the authenticated user already exists before any place operation is performed (created via the Lists Service, `005-lists-service`).
- Ownership of a place is determined transitively: a user owns a place if they own the list it is being added to or edited within. There is no separate concept of a "place owner" at the `Place` record level for this iteration.
- `latitude` and `longitude` on the `Place` schema are marked `notNull` in the database, but they are out of scope for this iteration (no Google Places API integration). The service will store `0` (or a placeholder) for these fields and they will not appear in any form. This will be corrected in a future spec when Google Places is integrated.
- No pagination is required in `getPlacesByList` for this iteration; all non-deleted places for a given list are returned in one query.
- The list detail page route does not yet exist; this feature spec includes creating it (e.g., at `/dashboard/lists/[listId]` or similar). The exact route path is a technical decision left to the plan phase.
