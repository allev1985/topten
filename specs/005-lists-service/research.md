# Research: Lists Service

**Branch**: `005-lists-service` | **Date**: 2026-03-03

All decisions below resolve unknowns from the Technical Context in `plan.md`.

---

## Decision 1 — Service module location

**Decision**: `src/lib/list/service.ts` + `src/lib/list/service/errors.ts` + `src/lib/list/service/types.ts`

**Rationale**: Matches the established pattern used by `src/lib/auth/` and `src/lib/profile/`. The spec draft proposed `src/lib/services/list/` but that deviates from convention and would make it harder to navigate by domain. Consistency with the existing pattern is mandated by Constitution §I (DRY, readable by any contributor).

**Alternatives considered**: `src/lib/services/list/` — rejected, does not follow existing domain-per-folder convention.

---

## Decision 2 — Slug generation

**Decision**: `crypto.randomUUID().replace(/-/g, '').slice(0, 4)` — first 4 hex characters of a randomly generated UUID, lowercase.

**Rationale**: `crypto.randomUUID()` is available globally in Node.js 19+ and the Next.js edge/server runtime without any import. The spec confirms 4-char hex slugs (`^[0-9a-f]{4}$`), giving 65,536 possible values per user — sufficient for MVP list counts. The DB unique index `lists_user_slug_idx` is the hard constraint; the service retries once with a new UUID on the extremely unlikely collision.

**Alternatives considered**:
- 8-char slug — more collision-resistant but the spec explicitly chose 4 chars.
- `nanoid` — adds a dependency; no benefit over the built-in.
- Title-derived slug — abandoned (see spec history); breaks URL stability when title changes.

---

## Decision 3 — Dashboard page refactor strategy

**Decision**: Convert `dashboard/page.tsx` from a `"use client"` mocked simulation to a **Server Component** that fetches real data, then passes the list array as a prop to a renamed `DashboardClient.tsx` Client Component that owns the interactive filter/click logic.

**Rationale**: Constitution §VI mandates preferring Server Components; use Client Components only for interactivity. The current page simulates async loading with `setTimeout` purely because there was no real data source. With the service available, data fetching belongs on the server. The interactive filter tabs and click handlers must remain client-side — the split component pattern (server wrapper → client shell) is the idiomatic App Router approach.

**Alternatives considered**:
- Keep the page as a Client Component and call a Server Action on mount — rejected; Server Actions are for mutations, not reads. Reads belong in Server Components or `fetch`.
- Use React Query / SWR — rejected; over-engineering for a server-rendered list.

---

## Decision 4 — `ActionState` shape for list mutations

**Decision**: Reuse the existing `ActionState<T>` generic from `src/types/forms.ts`, matching the pattern used by `profile-actions.ts` and `auth-actions.ts`.

**Rationale**: The type is already defined and used consistently. Each action follows the same five-step contract defined in Constitution §VI: authenticate → validate → delegate → map errors → revalidate.

**Alternatives considered**: Custom result types per action — rejected; inconsistency, no benefit over the shared `ActionState<T>`.

---

## Decision 5 — `updateList` ownership check strategy

**Decision**: Single-layer DB check — query for the list by `(id, userId, deletedAt IS NULL)` in a single `SELECT`; if no row is returned, surface `NOT_FOUND` (which covers both "does not exist" and "belongs to another user" without leaking ownership information).

**Rationale**: A single combined check is simpler and avoids two round-trips. Distinguishing "not found" from "not yours" would leak ownership information to potential adversaries. Profile service uses a similar combined approach for soft-deleted record checks.

**Alternatives considered**: Separate ownership query then update — two round-trips, ownership leakage risk.

---

## Decision 6 — `getListsByUser` return type

**Decision**: Return `ListSummary[]` — a typed subset of `List` columns sufficient for the dashboard grid: `{ id, title, slug, isPublished, createdAt }`. `placeCount` is out of scope for this feature (spec Assumption 4); `description` is not needed for the card.

**Rationale**: Returning only needed columns avoids over-fetching and keeps the dashboard query fast. `placeCount` requires a `COUNT` join on `list_places` which is a separate concern.

**Alternatives considered**: Return full `List` row — fetches unnecessary columns; couples dashboard display to full entity shape.

---

## Decision 7 — No quickstart.md required

**Decision**: Skip `quickstart.md` for this feature.

**Rationale**: The feature adds internal service and action modules — no new local setup steps, environment variables, or external service integrations are introduced beyond what exists in the project. The existing `docs/QUICKSTART.md` covers all prerequisites.
