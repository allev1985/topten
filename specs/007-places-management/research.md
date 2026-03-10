# Research: Places Management

**Branch**: `007-places-management` | **Date**: 2026-03-10

---

## Decision 1: Standalone place creation — unified `createPlace` with optional `listId` overload

**Decision**: Extend the existing `createPlace` function in `src/lib/place/service.ts` with an optional `listId` parameter, using TypeScript overload signatures to preserve precise return types at each call site. No separate `createStandalonePlace` function exists.

**Overload signatures**:
```typescript
// With listId — returns place + listPlaceId (transaction path)
export async function createPlace(params: { listId: string; userId: string; name: string; address: string }): Promise<CreatePlaceResult>;

// Without listId — returns place only (standalone path)
export async function createPlace(params: { userId: string; name: string; address: string }): Promise<CreateStandalonePlaceResult>;
```

**Rationale**: A dedicated `createStandalonePlace` function was initially built but contained an almost-complete duplication of the `INSERT INTO places` logic from `createPlace`. The refactor merges them into a single function with branching on `listId`: the transaction path (creates `Place` + `ListPlace` atomically) and the standalone path (creates `Place` only, no `ListPlace` row). TypeScript overloads give callers the precise return type without a union, so call sites stay clean and type-safe. Constitution I (no duplication) is better served by the unified function.

`CreateStandalonePlaceResult` is defined as `Pick<CreatePlaceResult, "place">` — it shares the same `place` shape without duplicating the interface definition.

**Alternatives considered**:
- *Dedicated `createStandalonePlace` function*: Initially built; rejected during PR review because it duplicated the `INSERT INTO places` logic verbatim. Keeping it would require any future changes to place creation (e.g., new columns, audit logging) to be applied in two places.
- *Extract a `createPlaceRecord` private helper called by both*: Valid, but was rendered unnecessary once both call sites were merged into a single function body. No extra internal layer needed.

---

## Decision 2: `deletePlace` cascade strategy

**Decision**: `deletePlace` uses a single Drizzle transaction that: (1) verifies ownership via `places.userId`, (2) sets `places.deletedAt = now()` on the target row, (3) bulk-sets `listPlaces.deletedAt = now()` on all active `ListPlace` rows for that `placeId` via a single `UPDATE … WHERE placeId = ? AND deletedAt IS NULL`.

**Rationale**: A single transaction guarantees atomicity (Constitution VII). Using a bulk `UPDATE` rather than fetching all `ListPlace` IDs first minimises round-trips. Ownership is asserted via `places.userId` — no need to check `lists.userId` for each `ListPlace` row because `places.userId` is the authoritative ownership signal (established in spec 006).

**Alternatives considered**:
- *Fetch all `ListPlace` IDs then delete individually*: Rejected — N+1 queries inside a transaction; no benefit over bulk `UPDATE`.
- *Database-level CASCADE*: Rejected — the schema uses soft deletes; a `ON DELETE CASCADE` would hard-delete rows, violating Constitution VII. A triggers-based approach would be opaque and hard to test.
- *Call `deletePlaceFromList` once per list*: Rejected — this is a service-internal concern; looping over a variable number of lists is fragile and does not have the atomicity guarantee of a single transaction.

---

## Decision 3: `getAllPlacesByUser` — how to compute `activeListCount`

**Decision**: Use a Drizzle correlated count subquery (or a `leftJoin` + `count()` with `groupBy`) to annotate each `Place` row with the count of its active (non-null `deletedAt`) `ListPlace` rows in a single query.

**Rationale**: Fetching places then issuing per-place count queries would be O(N) queries. A join + `groupBy` is a single round-trip and is well-supported by Drizzle's aggregation API. Performance is acceptable at the expected scale (tens of places).

**Concrete Drizzle approach**:
```typescript
import { count, eq, and, isNull, asc } from "drizzle-orm";

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

**Alternatives considered**:
- *Separate count query per place*: Rejected — O(N) round-trips.
- *Correlated subquery via Drizzle `sql` template*: Valid but more verbose; the `leftJoin` + `count` approach uses Drizzle's type-safe API.

---

## Decision 4: Dirty-state tracking in `EditPlaceDialog` (My Places)

**Decision**: Reuse the same pattern established in spec 006 (FR-013/FR-014): compare current controlled field values against the values loaded when the form opened; disable Save when clean or invalid; show an unsaved-changes badge when dirty; prompt on navigation-away when dirty.

**Rationale**: Consistency (Constitution III). The component should share the same logic, and potentially the same component, as the edit form on the list-detail page. If the list-detail `EditPlaceDialog` already follows this pattern, `PlacesClient` should import and reuse it (or a shared component) rather than duplicating it.

---

## Decision 5: `deletePlace` — should it return a `DeletePlaceResult` with the cascade count?

**Decision**: Yes. The service function returns `{ deletedListPlaceCount: number }` so the calling action (and UI) can surface the impact in the confirmation toast (e.g., "Place deleted and removed from 2 list(s)").

**Rationale**: The count is already computed inside the transaction (the bulk `UPDATE` returns affected rows in Postgres). Surfacing it costs nothing extra and gives the action layer enough information to produce a meaningful success message without a follow-up query.

---

## Decision 6: Navigation — where to add the "My Places" nav link

**Decision**: Add `DASHBOARD_ROUTES.places = "/dashboard/places"` to `src/lib/config/index.ts` and add a navigation link in the dashboard `layout.tsx` (or the sidebar component if one exists) pointing to that route. Middleware already protects the `/dashboard` prefix, so no middleware changes are needed.

**Rationale**: Constitution rules state new routes MUST be registered in `src/lib/config/`. The `/dashboard/places` route is a protected dashboard route so existing middleware coverage is sufficient.
