# Research: DB Layer Abstraction

**Branch**: `009-db-layer-abstraction` | **Date**: 2026-03-13  
**Status**: Complete — all unknowns resolved

---

## Decision 1: 3-Tier vs 2-Tier Architecture

**Decision**: Keep the 3-tier model — server actions → services → repository layer.

**Rationale**: The existing services are not thin pass-throughs to Drizzle. They contain real, non-trivial business logic that has no natural home in a db layer:

| Logic | Service | Why it stays in service |
|---|---|---|
| Slug collision retry (up to 2 attempts) | `list/service.ts` | Application retry policy, not SQL |
| `ALREADY_IN_LIST` guard before insert | `place/service.ts` | Domain rule; involves a prior query whose result drives conditional logic |
| Two-tier slug uniqueness defence (pre-check + race-condition catch) | `profile/service.ts` | Race-condition error mapping is service concern |
| `React.cache` wrapping on public reads | `public/service.ts` | React request-level caching is a server-component concern |
| Typed `ServiceError` translation | all services | Domain error vocabulary belongs with business logic |

Collapsing to 2-tier would require either (a) bloating server actions with the above or (b) mixing business rules into the db layer — both violate Principle I.

**Alternatives Considered**:
- 2-tier (actions → db layer): rejected — moves business logic to wrong layer, breaks existing error contracts from specs 005–008, requires action file changes.

---

## Decision 2: Transaction Ownership

**Decision**: Repositories own all `db.transaction()` calls. Services never receive, hold, or pass a transaction handle.

**Rationale**: The two transactional operations in the codebase are:

1. **`createPlace` with `listId`** (`place/service.ts`, line ~415): atomically inserts a `places` row and a `listPlaces` row, with a MAX+1 position query inside the same transaction. Moving this into a repository function `createPlaceWithListAttachment(params)` preserves atomicity without exposing the `tx` handle to the service.

2. **`deletePlace`** (`place/service.ts`, line ~740): atomically soft-deletes the `places` row and cascades soft-deletes to all active `listPlaces` rows. This maps cleanly to `deletePlaceWithCascade(params)` in the repository.

Passing a `tx` handle from services to repositories would mean services need to import `db` to call `db.transaction()`, which contradicts FR-004 (services must not import from `@/db`). Having repositories own the transaction boundary is the only approach that eliminates `@/db` imports from services entirely.

**Alternatives Considered**:
- Service calls `db.transaction(tx => repo.fn(params, tx))`: rejected — service must import `db`, violating FR-004.
- Separate insert + insert with no transaction: rejected — non-atomic; partial failure leaves orphaned rows.

---

## Decision 3: Repository Function Naming Convention

**Decision**: Use descriptive verb-noun names, not generic CRUD (e.g. `getListsByUser`, not `getMany`). Transaction-wrapping functions use the pattern `verbNounWithNoun` to signal multi-table scope (e.g. `createPlaceWithListAttachment`, `deletePlaceWithCascade`).

**Rationale**: Descriptive names keep repositories self-documenting without requiring callers to know SQL internals.

---

## Decision 4: Test Strategy — Updating Existing Unit Tests

**Decision**: Existing unit tests for services (`list-service.test.ts`, `place-service.test.ts`, `public-service.test.ts`) mock `@/db` today. After the refactor they will mock the repository modules instead (`@/db/repositories/list.repository`, etc.), using `vi.mock(...)` with stub implementations per test.

**Rationale**: The services' public API (function signatures, return types, error codes) is unchanged. Only the mock target changes. Profile service currently has no dedicated unit test file; `tests/integration/profile-actions.integration.test.ts` mocks services at the action level and does not need updating.

**Implication**: The refactor and test updates must land in the same PR so `pnpm test` stays green throughout.

---

## Decision 5: `user.repository.ts` Scope

**Decision**: Create `user.repository.ts` to house the `vanitySlug` lookup used by `publishList` and `unpublishList` in `list/service.ts`. This avoids importing from `place.repository.ts` or `profile.repository.ts` for a query that conceptually belongs to the `user` domain.

**Rationale**: Cross-domain lookups (list service reading `users.vanitySlug`) should not create inter-repository imports. A minimal `user.repository.ts` exporting `getVanitySlugByUserId(userId)` cleanly serves this need.

---

## Phase 0 Conclusion

All unknowns from the spec are resolved. No external research required — all decisions are derivable from the existing codebase. Proceed to Phase 1.
