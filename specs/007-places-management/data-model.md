# Data Model: Places Management

**Branch**: `007-places-management` | **Date**: 2026-03-10

---

## Entities

No schema migrations are required for this feature. All new functionality is implemented on top of the existing `places` and `list_places` tables.

### Place (existing table `places`)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | `uuid` | NO | PK |
| `user_id` | `uuid` | NO | FK → `users.id` — direct ownership proof |
| `google_place_id` | `varchar(255)` | NO | UNIQUE; system-assigned UUID |
| `name` | `varchar(255)` | NO | User-supplied |
| `address` | `varchar(500)` | NO | User-supplied |
| `latitude` | `numeric(10,7)` | NO | Stored as `"0"` until Google Places integration |
| `longitude` | `numeric(10,7)` | NO | Stored as `"0"` until Google Places integration |
| `created_at` | `timestamptz` | NO | default `now()` |
| `updated_at` | `timestamptz` | NO | default `now()` |
| `deleted_at` | `timestamptz` | YES | Soft delete; `null` = active |

**Relevant indexes** (existing):
- `places_google_place_id_idx` — UNIQUE `(google_place_id)`
- `places_deleted_at_idx` — `INDEX (deleted_at)` — added in spec 006

### ListPlace (existing table `list_places`)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | `uuid` | NO | PK |
| `list_id` | `uuid` | NO | FK → `lists.id` |
| `place_id` | `uuid` | NO | FK → `places.id` |
| `position` | `integer` | NO | Display order within the list |
| `hero_image_url` | `varchar(2048)` | YES | Out of scope this spec |
| `created_at` | `timestamptz` | NO | default `now()` |
| `deleted_at` | `timestamptz` | YES | Soft delete; `null` = active |

**Relevant indexes** (existing):
- `list_places_list_position_idx` — `INDEX (list_id, position)`
- `list_places_list_place_idx` — UNIQUE `(list_id, place_id)`
- `list_places_place_id_idx` — `INDEX (place_id)` — added in spec 006; supports the `deletePlace` cascade `UPDATE` and the `activeListCount` join

---

## New TypeScript Types

### `src/lib/place/service/types.ts` — additions

```typescript
/**
 * A place record annotated with the count of active lists it currently belongs to.
 * Returned by getAllPlacesByUser.
 */
export interface PlaceWithListCount {
  id: string;
  name: string;
  address: string;
  /** Number of active (non-deleted) ListPlace rows for this place */
  activeListCount: number;
}

/** Result of a successful createStandalonePlace operation */
export interface CreateStandalonePlaceResult {
  place: PlaceRecord;
}

/** Result of a successful deletePlace operation */
export interface DeletePlaceResult {
  /** Number of ListPlace rows that were cascade-soft-deleted */
  deletedListPlaceCount: number;
}
```

---

## New Service Functions

### `getAllPlacesByUser(params: { userId: string }): Promise<PlaceWithListCount[]>`

**Query**: Single `SELECT` with a `LEFT JOIN` on `list_places` (filtered to active rows via the join condition) + `count()` + `GROUP BY`.

```typescript
const rows = await db
  .select({
    id: places.id,
    name: places.name,
    address: places.address,
    activeListCount: count(listPlaces.id),
  })
  .from(places)
  .leftJoin(
    listPlaces,
    and(eq(listPlaces.placeId, places.id), isNull(listPlaces.deletedAt))
  )
  .where(and(eq(places.userId, userId), isNull(places.deletedAt)))
  .groupBy(places.id, places.name, places.address)
  .orderBy(asc(places.name));
```

**Returns**: `PlaceWithListCount[]` ordered by `name ASC`. Empty array (not an error) if the user has no places.

---

### `deletePlace(params: { placeId: string; userId: string }): Promise<DeletePlaceResult>`

**Transaction**:
1. `SELECT id FROM places WHERE id = placeId AND userId = userId AND deletedAt IS NULL` — verify ownership; throw `NotFoundError` if missing.
2. `UPDATE places SET deletedAt = now(), updatedAt = now() WHERE id = placeId`
3. `UPDATE list_places SET deletedAt = now() WHERE placeId = placeId AND deletedAt IS NULL` — bulk cascade; capture `rowCount` for the result.

```typescript
return await db.transaction(async (tx) => {
  // 1. Ownership check
  const [existing] = await tx
    .select({ id: places.id })
    .from(places)
    .where(and(eq(places.id, placeId), eq(places.userId, userId), isNull(places.deletedAt)));
  if (!existing) throw notFoundError();

  // 2. Soft-delete the Place record
  await tx
    .update(places)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(places.id, placeId));

  // 3. Cascade: soft-delete all active ListPlace rows
  const cascadeResult = await tx
    .update(listPlaces)
    .set({ deletedAt: new Date() })
    .where(and(eq(listPlaces.placeId, placeId), isNull(listPlaces.deletedAt)));

  return { deletedListPlaceCount: cascadeResult.rowCount ?? 0 };
});
```

---

### `createStandalonePlace(params: { userId: string; name: string; address: string }): Promise<CreateStandalonePlaceResult>`

**Operation**: Single `INSERT` into `places` with no `ListPlace` creation.

```typescript
const [place] = await db
  .insert(places)
  .values({
    userId,
    googlePlaceId: crypto.randomUUID(),
    name,
    address,
    latitude: "0",
    longitude: "0",
  })
  .returning();

return { place };
```

---

## New Zod Schema

### `src/schemas/place.ts` — addition

```typescript
/**
 * Schema for creating a standalone place (no list attachment).
 * Identical validation to createPlaceSchema but without listId.
 */
export const createStandalonePlaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or fewer"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(500, "Address must be 500 characters or fewer"),
});

export type CreateStandalonePlaceInput = z.infer<typeof createStandalonePlaceSchema>;
```

---

## New Server Actions

### `src/actions/place-actions.ts` — additions

#### `getAllPlacesAction()`
```typescript
// Returns ActionState<{ places: PlaceWithListCount[] }>
// Called by the /dashboard/places page Server Component (not via useActionState)
// — or more likely consumed directly by the page.tsx server component via the service.
// The page.tsx Server Component will call getAllPlacesByUser directly (same pattern
// as DashboardPage calling getListsByUser directly).
```
> **Note**: `getAllPlacesByUser` is a read query called directly from the Server Component (`page.tsx`), not via a Server Action. No `getAllPlacesAction` is needed. The Server Actions for this feature are:

#### `createStandalonePlaceAction(_prevState, formData)`
- Auth → Zod validate (`createStandalonePlaceSchema`) → `createStandalonePlace(...)` → `revalidatePath("/dashboard/places")` → return `ActionState<{ placeId: string }>`

#### `deletePlaceAction(_prevState, formData)`
- Auth → extract `placeId` from `formData` → `deletePlace(...)` → `revalidatePath("/dashboard/places")` + `revalidatePath` for all list detail routes (via `revalidatePath("/dashboard/lists", "layout")` to cover all `[listId]` segments) → return `ActionState<{ deletedListPlaceCount: number }>`

---

## Config Change

### `src/lib/config/index.ts` — addition

```typescript
export const DASHBOARD_ROUTES = {
  home: "/dashboard",
  listDetail: (listId: string) => `/dashboard/lists/${listId}`,
  places: "/dashboard/places",   // NEW
} as const;
```

---

## State Transitions

### Place lifecycle (extended)

```
ACTIVE (deletedAt IS NULL)
  │
  ├─ updatePlace          → ACTIVE (name/address updated, updatedAt refreshed)
  │
  ├─ deletePlaceFromList  → no effect on Place; only the ListPlace row is soft-deleted
  │
  └─ deletePlace (new)    → DELETED (deletedAt set)
                              └─ cascade: all active ListPlace rows → deletedAt set
```

### Standalone place lifecycle (new path)

```
(does not exist)
  │
  └─ createStandalonePlace → ACTIVE, activeListCount = 0
                               │
                               └─ addExistingPlaceToList → ACTIVE, activeListCount += 1
```

---

## Testing Strategy

| Layer | File | Coverage |
|-------|------|----------|
| Unit | `tests/unit/place/service.test.ts` | `getAllPlacesByUser` (0, 1, many places; mixed list counts), `deletePlace` (success + cascade count, not-found, wrong owner, already deleted), `createStandalonePlace` (success, validation errors) |
| Integration | `tests/integration/place/deletePlace.cascade.test.ts` | Delete a place attached to 2 lists → verify both `ListPlace` rows have `deletedAt`; verify `Place` row has `deletedAt`; verify lists' `getPlacesByList` returns empty for those lists |
| Component | `tests/component/places/DeletePlaceDialog.test.tsx` | Renders impact count, cancel = no action, confirm = calls action |
| Component | `tests/component/places/AddPlaceDialog.test.tsx` | Validates required fields, submits with valid data |
| Component | `tests/component/places/EditPlaceDialog.test.tsx` | Dirty-state: Save disabled when clean; enabled when valid+dirty; unsaved-changes indicator |
| E2E | `tests/e2e/places-management.spec.ts` | View "My Places" page; delete place and verify it disappears from list; create standalone place and verify it appears in "Add a place" search |
