# Data Model: Places Service

**Branch**: `006-places-service` | **Date**: 2026-03-04

---

## Entities

### Place (existing table `places`)

No schema migration required. The `places` table already exists with all required columns.

| Column | Type | Nullable | Constraints | Notes |
|--------|------|----------|-------------|-------|
| `id` | `uuid` | NO | PK, default `gen_random_uuid()` | — |
| `google_place_id` | `varchar(255)` | NO | UNIQUE (via `places_google_place_id_idx`) | System-assigned UUID string; immutable after creation; never shown to users |
| `name` | `varchar(255)` | NO | — | Required, non-whitespace |
| `address` | `varchar(500)` | NO | — | Required, non-whitespace |
| `latitude` | `decimal(10,7)` | NO | — | Stored as `0` this iteration; populated by Google Places integration in future spec |
| `longitude` | `decimal(10,7)` | NO | — | Stored as `0` this iteration; populated by Google Places integration in future spec |
| `created_at` | `timestamptz` | NO | default `now()` | — |
| `updated_at` | `timestamptz` | NO | default `now()` | Refreshed on every mutation |
| `deleted_at` | `timestamptz` | YES | — | Soft delete; `null` = active |

**Existing indexes**:
- `places_google_place_id_idx` — `UNIQUE (google_place_id)` — global uniqueness

**New index required** (migration needed):
- `places_deleted_at_idx` — `INDEX (deleted_at)` — supports `getPlacesByList` and `getAvailablePlacesForList` which both filter `deleted_at IS NULL`; without this, both queries require a sequential scan of the entire `places` table

---

### ListPlace (existing table `list_places`)

No schema migration required. The `list_places` table already exists with all required columns.

| Column | Type | Nullable | Constraints | Notes |
|--------|------|----------|-------------|-------|
| `id` | `uuid` | NO | PK, default `gen_random_uuid()` | — |
| `list_id` | `uuid` | NO | FK → `lists.id` | Owning list |
| `place_id` | `uuid` | NO | FK → `places.id` | Attached place |
| `position` | `integer` | NO | — | Display order within the list; assigned as `max(position) + 1` on append |
| `hero_image_url` | `varchar(2048)` | YES | — | Out of scope this spec; set to `null` for all new records |
| `created_at` | `timestamptz` | NO | default `now()` | — |
| `deleted_at` | `timestamptz` | YES | — | Soft delete; `null` = active |

**Existing indexes**:
- `list_places_list_position_idx` — `INDEX (list_id, position)` — optimises ordered place fetch and max-position query for append
- `list_places_list_place_idx` — `UNIQUE (list_id, place_id)` — prevents duplicate place in same list; also used by `addExistingPlaceToList` duplicate check

**New index required** (migration needed):
- `list_places_place_id_idx` — `INDEX (place_id)` — supports the reverse lookup in `getAvailablePlacesForList` ("which lists does this place already belong to?"); the existing indexes both lead with `list_id` and cannot efficiently serve a `place_id`-first lookup

---

## Validation Rules

### `createPlace` input

| Field | Rule |
|-------|------|
| `listId` | Required, valid UUID (from route context — not user input) |
| `userId` | Required, valid UUID (from session — not user input) |
| `name` | Required; `.trim()` must produce non-empty string; max 255 chars |
| `address` | Required; `.trim()` must produce non-empty string; max 500 chars |

> `googlePlaceId`, `latitude`, and `longitude` are NOT accepted from the caller. All three are assigned by the service.

### `addExistingPlaceToList` input

| Field | Rule |
|-------|------|
| `listId` | Required, valid UUID |
| `placeId` | Required, valid UUID |
| `userId` | Required, valid UUID (from session) |

> Service MUST verify list ownership (`lists.user_id = userId`) and absence of an existing active `ListPlace` for `(listId, placeId)` before writing.

### `updatePlace` input

| Field | Rule |
|-------|------|
| `placeId` | Required, valid UUID |
| `listId` | Required, valid UUID (used for ownership verification) |
| `userId` | Required, valid UUID (from session) |
| `name` | Optional; if provided, `.trim()` must produce non-empty string; max 255 chars |
| `address` | Optional; if provided, `.trim()` must produce non-empty string; max 500 chars |

> `googlePlaceId` is **never** an accepted parameter for `updatePlace`. Any caller passing it receives a TypeScript compile error.

### `deletePlace` input

| Field | Rule |
|-------|------|
| `placeId` | Required, valid UUID |
| `listId` | Required, valid UUID (used for ownership verification) |
| `userId` | Required, valid UUID (from session) |

---

## `googlePlaceId` Generation

```
googlePlaceId = crypto.randomUUID()
// e.g. "a3f27b1c-9e44-4f2a-8d0b-c1e5fa3d9201"
// Full UUID string — globally unique; 2^122 values
```

No collision retry needed (negligible probability at this scale). The existing `places_google_place_id_idx` unique index is the hard backstop.

---

## Position Assignment

```
position = SELECT COALESCE(MAX(position), 0) + 1
           FROM list_places
           WHERE list_id = :listId
```

Executed within the same transaction as the `ListPlace` insert to prevent race conditions during concurrent additions to the same list.

---

## State Transitions

```
                createPlace / addExistingPlaceToList
                            │
                            ▼
                    ┌──────────────┐
                    │    ACTIVE    │◄─── (no undelete in MVP)
                    │ (deletedAt   │
                    │  = null)     │
                    └──────────────┘
                            │
                       deletePlace
                            │
                            ▼
                    ┌──────────────┐
                    │   DELETED    │
                    │ (deletedAt   │
                    │  IS NOT NULL)│
                    └──────────────┘
```

- `updatePlace` is only valid when `deletedAt IS NULL`. Service returns `NOT_FOUND` if the place is soft-deleted.
- No undelete operation is in scope for MVP.

---

## TypeScript Types (new)

### `src/lib/place/service/types.ts`

```typescript
/** Minimal place data needed for list display */
export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
}

/** Full place data returned after a mutation */
export interface PlaceRecord {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Typed result objects for each service operation */
export interface CreatePlaceResult {
  place: PlaceRecord;
  listPlaceId: string;
}

export interface AddExistingPlaceResult {
  listPlaceId: string;
}

export interface UpdatePlaceResult {
  place: PlaceRecord;
}

export interface DeletePlaceResult {
  placeId: string;
  deletedAt: Date;
}
```

### `src/lib/place/service/errors.ts`

```typescript
export type PlaceServiceErrorCode =
  | 'NOT_FOUND'           // Place or List not found, or not owned by user
  | 'ALREADY_IN_LIST'     // Place is already attached to this list (list_places duplicate)
  | 'VALIDATION_ERROR'    // Input validation failed
  | 'SERVICE_ERROR';      // Unexpected error

export class PlaceServiceError extends Error {
  constructor(
    public readonly code: PlaceServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'PlaceServiceError';
  }
}
```

---

## Drizzle Schema Changes Required

Both new indexes require a Drizzle migration. No column or constraint changes are involved — these are additive index additions only.

### `src/db/schema/place.ts` — add `places_deleted_at_idx`

```typescript
import {
  pgTable, uuid, varchar, decimal, timestamp,
  uniqueIndex, index,   // add 'index'
} from "drizzle-orm/pg-core";

export const places = pgTable(
  "places",
  { /* ...existing columns unchanged... */ },
  (table) => [
    uniqueIndex("places_google_place_id_idx").on(table.googlePlaceId),
    index("places_deleted_at_idx").on(table.deletedAt),  // NEW
  ]
);
```

### `src/db/schema/listPlace.ts` — add `list_places_place_id_idx`

```typescript
export const listPlaces = pgTable(
  "list_places",
  { /* ...existing columns unchanged... */ },
  (table) => [
    index("list_places_list_position_idx").on(table.listId, table.position),
    uniqueIndex("list_places_list_place_idx").on(table.listId, table.placeId),
    index("list_places_place_id_idx").on(table.placeId),  // NEW
  ]
);
```

After updating the schema files, generate the migration with:
```bash
pnpm drizzle-kit generate
```
and apply it before deploying the service.

---

## `getPlacesByList` Query

Returns all active (non-deleted) places attached to a given list, joined through `list_places`, ordered by `list_places.position ASC`.

**Filters**:
- `list_places.list_id = :listId`
- `list_places.deleted_at IS NULL`
- `places.deleted_at IS NULL`

**Returns**: `PlaceSummary[]` — `{ id, name, address }` sufficient for list display.

---

## `getAvailablePlacesForList` Query

Returns all active places that belong to at least one of the user's active lists but are NOT currently attached to the specified target list.

**Filters**:
- Place is in at least one `ListPlace` where `list_places.list_id IN (SELECT id FROM lists WHERE user_id = :userId AND deleted_at IS NULL)`
- Place is NOT in a `ListPlace` where `list_places.list_id = :listId AND list_places.deleted_at IS NULL`
- `places.deleted_at IS NULL`

**Returns**: `PlaceSummary[]` ordered by `places.name ASC`.
