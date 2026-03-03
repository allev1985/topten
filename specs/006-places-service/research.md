# Research: Places Service

**Branch**: `006-places-service` | **Date**: 2026-03-04

All decisions below resolve unknowns from the Technical Context in `plan.md`.

---

## Decision 1 — Service module location

**Decision**: `src/lib/place/service.ts` + `src/lib/place/service/errors.ts` + `src/lib/place/service/types.ts`

**Rationale**: Matches the established pattern used by `src/lib/auth/`, `src/lib/profile/`, and `src/lib/list/`. The spec draft referenced `src/lib/services/place/` but that deviates from the domain-per-folder convention and would break navigation consistency. Constitution §I mandates DRY and readability by any contributor familiar with the stack.

**Alternatives considered**: `src/lib/services/place/` — rejected; does not follow existing domain-per-folder convention.

---

## Decision 2 — `googlePlaceId` generation

**Decision**: `crypto.randomUUID()` — a full UUID (e.g. `"a3f27b1c-9e44-4f2a-8d0b-c1e5fa3d9201"`).

**Rationale**: `crypto.randomUUID()` is available globally in Node.js 19+ and the Next.js server runtime with no import. Using full UUID (not a truncated slug) means the column is immediately compatible with the Google Places API string format (which uses a distinct ID format, not a UUID) — forward-compatibility is the intent. The value is never shown to users and is opaque. The `uniqueIndex("places_google_place_id_idx")` on `googlePlaceId` enforces global uniqueness; collision probability across 128 bits is negligible and no retry logic is required.

**Alternatives considered**:
- Truncated UUID (4–8 chars) — too short to serve as a future external-system identifier; increases collision risk.
- Empty string / null — rejected; `googlePlaceId` is `NOT NULL` in the schema.
- Pre-populate with placeholder string like `"TEMP_{uuid}"` — adds unnecessary parsing complexity when Google Places is integrated.

---

## Decision 3 — `latitude` / `longitude` placeholder

**Decision**: Store `"0"` (Drizzle `decimal` accepts a string or number) for both `latitude` and `longitude` when creating a place in this iteration.

**Rationale**: Both columns are `NOT NULL` in the existing schema. They have no user-facing display role in this spec and will be populated properly once Google Places integration lands. Storing `0` is numerically valid, easy to identify in data audits, and requires no schema change.

**Alternatives considered**:
- Make columns nullable via migration — introduces a schema change not justified yet; deferred to the Google Places spec.
- Store `null` — requires `NOT NULL` constraint change; rejected for the same reason.

---

## Decision 4 — Atomic Place + ListPlace creation

**Decision**: Wrap the `INSERT INTO places` and `INSERT INTO list_places` in a single Drizzle transaction using `db.transaction(async (tx) => { ... })`.

**Rationale**: FR-004 requires both writes to succeed atomically. If the `ListPlace` insert fails (e.g. duplicate constraint), the `Place` row must not be persisted. Drizzle's `db.transaction()` API rolls back on any thrown error, making this straightforward. Constitution §VII (data integrity) mandates referential consistency.

**Alternatives considered**: Two sequential inserts with manual rollback — error-prone; not idiomatic Drizzle; rejected.

---

## Decision 5 — `getAvailablePlacesForList` query strategy

**Decision**: Single query with a left-join exclusion pattern:

```sql
SELECT p.*
FROM places p
JOIN list_places lp_any
  ON lp_any.place_id = p.id
  AND lp_any.list_id IN (SELECT id FROM lists WHERE user_id = :userId AND deleted_at IS NULL)
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM list_places lp_cur
    WHERE lp_cur.place_id = p.id
      AND lp_cur.list_id = :listId
      AND lp_cur.deleted_at IS NULL
  )
ORDER BY p.name ASC
```

**Rationale**: Returns only places that (a) belong to at least one of the user's active lists and (b) are not already attached to the target list. A single server-side query is correct, safe, and avoids the N+1 problem. The result set is bounded by the user's total place count across all lists (expected to be small at MVP scale — no pagination required). Constitution §IV (performance) is met for the expected scale.

**Alternatives considered**:
- Fetch all user places and filter client-side — leaks all place data to the client; security and payload concern.
- Two separate queries (all user places, then attached places) and diff in TypeScript — two round-trips; more application code for no benefit.

---

## Decision 6 — Available-places search: client-side filtering

**Decision**: `getAvailablePlacesForList` fetches the full unfiltered result set once (server-side, at page load / dialog open). The search input in `AddPlaceDialog` filters the already-fetched array client-side in real time using a simple `name.toLowerCase().includes(term.toLowerCase())` comparison.

**Rationale**: The MVP place count per user is expected to be small (tens to low hundreds). Client-side filtering over a pre-fetched array is instantaneous, requires no debouncing or additional server round-trips, and satisfies SC-007 (filters without a full-page reload). Adding a server-side search endpoint would over-engineer the feature at this scale and violate Constitution §I (avoid unnecessary complexity).

**Alternatives considered**:
- Debounced Server Action search — adds latency, complexity, and an extra round-trip per keystroke; rejected for MVP scale.
- Dedicated search API route — explicitly rejected by Constitution §VI (no new API routes).

---

## Decision 7 — Dirty-state tracking implementation approach

**Decision**: `EditPlaceDialog` is a Client Component (`"use client"`). On open, it receives the current `PlaceSummary` as a prop and stores the initial values in a `useRef` (for stable reference). A `useState` object tracks the live form values. Dirty state is derived as `JSON.stringify(formValues) !== JSON.stringify(initialRef.current)`. The Save button's `disabled` prop is `!isDirty || !isValid`.

**Rationale**: This is the idiomatic React pattern for tracking unsaved changes without an external state library. `useRef` for initial values avoids triggering re-renders. The discard prompt uses `window.confirm()` for simplicity at MVP scale — a custom shadcn/ui AlertDialog would be more polished but is an enhancement deferred to UX polish iterations (not a functional requirement). Constitution §§I and III are satisfied.

**Alternatives considered**:
- `react-hook-form`'s built-in `isDirty` — viable, but adds a form-library dependency not used elsewhere in the project; consistency with existing forms (which use controlled inputs with `useState`) is preferred.
- Zustand / Jotai global form state — over-engineering; local component state is sufficient.

---

## Decision 8 — List detail page route

**Decision**: `/dashboard/lists/[listId]` — App Router dynamic segment at `src/app/(dashboard)/dashboard/lists/[listId]/page.tsx`.

**Rationale**: Follows the existing `/dashboard/**` protected-route pattern. The `(dashboard)` route group shares the existing layout (sidebar, nav). `listId` is the UUID primary key of the list — unambiguous, no slug needed since this is an authenticated owner view (not a public URL). The route must be added to `PROTECTED_ROUTES` in `src/lib/config/index.ts` and the middleware guard already covers `/dashboard/**` via a prefix match.

**Alternatives considered**:
- `/@{vanity_slug}/{list-slug}` — this is the public viewer URL (per constitution routing conventions); the list detail management page is a different surface and belongs under `/dashboard`.
- `/dashboard/[listSlug]` — slugs are 4-char opaque identifiers; UUIDs are more resilient to slug-not-yet-implemented edge cases; list detail is owner-only so SEO-friendly slugs add no value here.

---

## Decision 9 — `ActionState` shape for place mutations

**Decision**: Reuse the existing `ActionState<T>` generic from `src/types/forms.ts`, matching the pattern used by `list-actions.ts`, `profile-actions.ts`, and `auth-actions.ts`.

**Rationale**: The type is already defined and used consistently across the project. Each action follows the five-step contract from Constitution §VI. Introducing a custom result type would be duplication without benefit.

**Alternatives considered**: Custom result types per action — rejected; inconsistent with project-wide convention.

---

## Decision 10 — No quickstart.md required

**Decision**: Skip `quickstart.md` for this feature.

**Rationale**: No new environment variables, external service accounts, or local setup steps are introduced. `lat/lng` default to `0` and require no Google Places key. The existing `docs/QUICKSTART.md` covers all prerequisites.

---

## Decision 11 — New database indexes required

**Decision**: Add two new indexes via a Drizzle migration:

1. `index("places_deleted_at_idx").on(table.deletedAt)` on the `places` table.
2. `index("list_places_place_id_idx").on(table.placeId)` on the `list_places` table.

**Rationale**:

**`places_deleted_at_idx`**: Both `getPlacesByList` and `getAvailablePlacesForList` filter `places.deleted_at IS NULL`. Without this index, Postgres must sequential-scan the entire `places` table and evaluate the predicate for every row. At MVP scale this is tolerable, but a partial or full index on `deleted_at` makes soft-delete filtering efficient as data grows. The existing `places_google_place_id_idx` unique index covers only `google_place_id` and provides no help here.

**`list_places_place_id_idx`**: `getAvailablePlacesForList` must determine which places already belong to the user's lists. The query traverses `list_places` by `place_id` (reverse lookup: "give me all list memberships for this place"). The existing indexes on `list_places` are `list_places_list_position_idx (list_id, position)` and `list_places_list_place_idx (list_id, place_id)` — both are leading-column-on-`list_id` composites. A lookup starting from `place_id` alone cannot use either of those indexes efficiently. A dedicated `index("list_places_place_id_idx").on(table.placeId)` enables the reverse lookup without a sequential scan.

**Migration impact**: Both are non-breaking additive changes (index additions only). No column, constraint, or data change is involved. A Drizzle migration file must be generated and committed alongside the service implementation.

**Alternatives considered**:
- Rely on sequential scans at MVP scale — acceptable short-term, but violates Constitution §IV (performance targets must be considered up front) and creates technical debt before any real load.
- Partial index `WHERE deleted_at IS NULL` for `places` — slightly more efficient for reads but less portable across Postgres versions and harder to reason about; a standard full index on `deleted_at` is simpler and sufficient.
- Add `place_id` as a leading column to an existing composite index — would change the existing index semantics and require dropping/recreating it; a new standalone index is cleaner.
