# Feature Specification: Lists Service

**Feature Branch**: `005-lists-service`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "Implement the Lists service. Remove mock lists and implement CRUD operations on Lists. Create a new List — minimum requirements: title and slug (default to lowercase title with hyphens). Update a list's title, description, slug. Soft delete a list. Publish a list. Unpublish a list."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a New List (Priority: P1)

A signed-in user opens their dashboard and creates a new list. They enter a title. The system assigns an opaque, permanent 4-character slug (derived from a UUID) at creation time. The user does not see or interact with the slug during creation. On success the new list appears in the dashboard grid as a draft.

**Why this priority**: Creating a list is the foundational action. Every other operation assumes at least one list exists. Without creation, nothing else in this feature is usable.

**Independent Test**: A user can open the "New list" form, type a title, submit, and immediately see the new draft list card in the dashboard — with no mock data involved.

**Acceptance Scenarios**:

1. **Given** a user submits the "New list" form with a valid title, **Then** a new list record is created with `isPublished = false`, `deletedAt = null`, and `slug` set to a system-assigned 4-character identifier. The user does not supply or see the slug at creation time.
2. **Given** a user submits a form with an empty title, **When** the service validates the input, **Then** the operation is rejected with a validation error before any database call is made.

---

### User Story 2 — Update List Metadata (Priority: P2)

A user edits an existing list's title or description from the dashboard. The slug is immutable after creation and is never shown as an editable field. Changes are saved and the updated values are immediately reflected in the UI.

**Why this priority**: Lists need to be editable to be useful; updating the title or adding a description are common day-one actions after creation.

**Independent Test**: Given an existing list, a user can change its title and/or description and see the updated values persisted on refresh. The slug field is absent from the edit form.

**Acceptance Scenarios**:

1. **Given** a list exists, **When** the user updates the title, **Then** `title` and `updatedAt` are updated; `slug` and all other fields remain unchanged.
2. **Given** a list exists, **When** the user updates the description, **Then** `description` and `updatedAt` are updated; `slug` is unaffected.
3. **Given** a user tries to update a list belonging to another user, **When** the service checks ownership, **Then** the operation is rejected with an authorization error.

---

### User Story 3 — Publish and Unpublish a List (Priority: P2)

A user can toggle the published state of a list. Publishing makes the list visible at its public URL (`/@{vanity_slug}/{list-slug}`). Unpublishing hides it from public view while preserving the list and its places.

**Why this priority**: The publish/unpublish toggle is the core content-control mechanism. Without it, users cannot share their lists with others or retract them.

**Independent Test**: A draft list can be published (verify `isPublished = true` and `publishedAt` is set) and then unpublished (verify `isPublished = false`, `publishedAt` is cleared).

**Acceptance Scenarios**:

1. **Given** a draft list owned by the user, **When** they publish it, **Then** `isPublished = true` and `publishedAt` is set to the current UTC timestamp.
2. **Given** a published list owned by the user, **When** they unpublish it, **Then** `isPublished = false` and `publishedAt` is cleared (`null`).
3. **Given** a user tries to publish a list belonging to another user, **When** the service checks ownership, **Then** the operation is rejected with an authorization error.
4. **Given** a soft-deleted list, **When** a publish or unpublish is attempted, **Then** the operation is rejected with a not-found error.

---

### User Story 4 — Soft Delete a List (Priority: P3)

A user deletes a list from the dashboard. The list is not permanently removed; `deletedAt` is set. The list no longer appears in the dashboard or at its public URL.

**Why this priority**: Soft delete is important for data integrity and potential recovery, but losing a list is less disruptive than losing the ability to create or share one.

**Independent Test**: After soft-deleting a list, it does not appear in the user's dashboard list query, and accessing its public URL returns a 404.

**Acceptance Scenarios**:

1. **Given** a list owned by the user, **When** they soft-delete it, **Then** `deletedAt` is set to the current UTC timestamp and the list no longer appears in dashboard queries (which filter `deletedAt IS NULL`).
2. **Given** a user tries to soft-delete a list belonging to another user, **When** the service checks ownership, **Then** the operation is rejected.
3. **Given** a list is already soft-deleted, **When** a soft-delete is attempted again, **Then** the operation is a no-op (idempotent) or returns a not-found error.

---

### User Story 5 — Dashboard Displays Real Lists (Priority: P1)

The dashboard replaces the mock list data with real lists loaded from the database for the authenticated user. Only non-deleted lists are shown.

**Why this priority**: The mock data exists solely as a placeholder. Connecting to real data is the immediate goal of this feature and unlocks every other user story.

**Independent Test**: With mock data removed and the service in place, a freshly seeded user account with two lists sees exactly those two lists in the dashboard grid.

**Acceptance Scenarios**:

1. **Given** a user has 3 non-deleted lists in the database, **When** the dashboard loads, **Then** exactly 3 list cards are rendered from real database records (not mock data).
2. **Given** a user has no lists, **When** the dashboard loads, **Then** an appropriate empty state is shown (no mock cards).
3. **Given** a list is soft-deleted, **When** the dashboard loads, **Then** that list does not appear in the grid.

---

### Edge Cases

- What is the probability of an 4-character slug collision? → Vanishingly small in practice (16⁴ ≈ 65,536 possible values per user), but the unique index `lists_user_slug_idx` on `(userId, slug)` is the hard backstop. If a collision does occur, the service retries with a freshly generated slug before surfacing a generic error.
- Can a user change their list's slug after creation? → No. Slugs are permanently fixed at creation time to preserve canonical URLs and prevent broken links.
- What happens if a user submits a title of only whitespace? → Treat as an empty title; reject with a validation error before any database call.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a `ListService` module at `src/lib/services/list/` (mirroring the auth service pattern) exposing: `createList`, `updateList`, `deleteList`, `publishList`, `unpublishList`, and `getListsByUser`.
- **FR-002**: `createList` MUST accept `{ userId, title }` only. The slug MUST be system-assigned at creation time as the first 4 characters of a randomly generated UUID (hex, lowercase, e.g. `a3f2`). Users MUST NOT be able to supply or influence the slug value.
- **FR-003**: `createList` MUST validate that `title` is non-empty and non-whitespace (max 255 chars) before any database interaction. The operation MUST be rejected with a validation error if this check fails.
- **FR-003a**: The form submit button MUST remain disabled while the title is empty or whitespace-only.
- **FR-004**: `updateList` MUST accept `{ listId, userId, title?, description? }` only. `slug` MUST NOT be an accepted parameter; any attempt to pass one MUST be silently ignored or rejected. The service MUST verify that the list belongs to `userId` before writing. Only provided fields are updated; `updatedAt` is always refreshed.
- **FR-005**: `deleteList` MUST set `deletedAt` to the current UTC timestamp and MUST verify ownership before writing.
- **FR-006**: `publishList` MUST set `isPublished = true` and `publishedAt` to current UTC. `unpublishList` MUST set `isPublished = false` and `publishedAt = null`. Both MUST verify ownership and that `deletedAt IS NULL`.
- **FR-007**: `getListsByUser` MUST return only lists where `userId` matches and `deletedAt IS NULL`, ordered by `createdAt DESC`.
- **FR-008**: The dashboard Server Component MUST replace its reference to `mockLists` with a call to `getListsByUser` using the authenticated user's ID.
- **FR-009**: The mock file `src/lib/mocks/lists.ts` MUST be removed once real data is wired in.
- **FR-010**: All service operations MUST be callable from Server Actions and MUST NOT expose database internals to client components.
- **FR-011**: Slug uniqueness is enforced by the `lists_user_slug_idx` unique index on `(userId, slug)`. Slugs are immutable after creation — no service method accepts a slug update. In the unlikely event of a UUID collision, the service MUST retry with a new slug before surfacing a typed `ListServiceError` (mirroring `AuthServiceError`).

### Key Entities

- **List**: A curated collection of places belonging to one user. Key attributes (no implementation detail): unique ID, owning user, title (required), URL slug (required, unique per user), optional description, published flag, published timestamp, soft-delete timestamp, created/updated timestamps.
- **User** (referenced, not modified): Owns lists; identified by UUID. The service reads `userId` from the authenticated session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with zero database lists sees an empty-state dashboard with no mock cards after the migration.
- **SC-002**: A user can create a list with only a title in under 3 seconds (p95) on a standard connection.
- **SC-003**: All five service operations (`createList`, `updateList`, `softDeleteList`, `publishList`, `unpublishList`) have unit-test coverage ≥ 90% for happy-path and primary error branches.
- **SC-004**: Two lists created with the same title by the same user receive distinct slugs (different 4-char UUIDs), verifiable via a unit test on the slug-generation logic.
- **SC-005**: A soft-deleted list is absent from `getListsByUser` results immediately after deletion, verifiable via an integration test.
- **SC-006**: The `src/lib/mocks/lists.ts` file is deleted and no remaining source file imports from it.

## Assumptions

- The `users` record for a newly signed-up user is already present by the time list operations are performed (auth service handles user record creation on first sign-in).
- List slugs are unique **per user**, not globally — two different users can have a list with the same slug.
- No pagination is required in `getListsByUser` for this iteration; all non-deleted lists for the user are returned.
- `placeCount` shown in the dashboard list card will be derived via a separate query / join and is out of scope for this service spec; it may remain `0` or be computed at query time.
- Hero images are managed separately (via `ListPlace.heroImageUrl`) and are out of scope here.
