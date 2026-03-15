# Feature Specification: DB Layer Abstraction

**Feature Branch**: `009-db-layer-abstraction`  
**Created**: 2026-03-13  
**Status**: Draft  
**Input**: User description: "Refactor codebase to ensure server actions do not directly call drizzle functions/methods. There needs to be a thin abstraction between server actions and the db layer. The db layer should be where all drizzle logic lives. Consider benefits of keeping server actions -> services -> db layer vs server actions -> db layer."

---

## Architectural Decision: 3-Tier vs 2-Tier

### Current State

The codebase already has a partial layered architecture:

```
Server Actions  →  Services  →  Drizzle (directly in services)
src/actions/       src/lib/      db.select(), db.insert(), etc.
```

Server actions are already clean — they never import drizzle. Services are the boundary where drizzle currently leaks in. The goal is to push drizzle down one more level.

### Option A — server actions → services → db layer (3-tier)  ✅ RECOMMENDED

```
src/actions/          src/lib/*/service.ts       src/db/repositories/
Server Actions    →   Services              →    Repository Layer
  - Auth/validation   - Business logic            - All Drizzle SQL
  - Error mapping     - Ownership checks          - Query composition
  - Revalidation      - Retry logic               - Raw DB access
  - No business       - Compose repos             - No business logic
    logic             - Domain errors             - No service errors
```

**Why this is the right choice for this codebase:**

The existing services contain real, non-trivial business logic that does NOT belong in the db layer:

- **Slug collision retry** (`createList`): generates a slug, attempts insert, retries once on `23505` unique violation — this is application logic, not data access
- **Ownership verification** (`updateList`, `deleteList`, `publishList`): combining `userId + listId + deletedAt IS NULL` into a WHERE clause enforces a business rule; the resulting `NOT_FOUND` error is a domain concern, not a DB concern
- **Multi-table atomic operations** (`createPlace` with optional `listId`): orchestrates insert-then-insert with rollback semantics — belongs in services, not repositories
- **Error translation**: mapping raw DB errors to typed `ServiceError` instances lives in services; repositories should surface raw errors (or a thin `RepositoryError`)
- **`React.cache` wrapping** (`public/service.ts`): caching is a service-level concern, not a data-access concern

Keeping services intact means zero changes to server actions and zero changes to public API contracts.

### Option B — server actions → db layer (2-tier)  ❌ NOT RECOMMENDED

Collapsing services into the db layer would:
- Move business logic (slug retry, ownership checks, error mapping) into server actions or the db layer — both are wrong homes
- Require changes to the server action layer (currently stable and spec-compliant)
- Break existing service-level error contracts established in specs 005–008
- Produce a bloated db layer that mixes business rules with SQL

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Repository Layer Created for All Domains (Priority: P1)

As a developer, I can navigate to `src/db/repositories/` and find one repository module per domain. Each repository module exposes typed functions that issue Drizzle queries. Services import from these modules — not from `drizzle-orm` or `@/db` directly.

**Why this priority**: This is the foundational structural change. All other stories depend on it.

**Independent Test**: Run `grep -r "from \"drizzle-orm\"" src/lib/` and confirm zero results. Each repository function can be tested in isolation by mocking the `db` object.

**Acceptance Scenarios**:

1. **Given** a developer searches `src/lib/**/*.ts` for `drizzle-orm` imports, **When** the refactor is complete, **Then** zero matches are found — all drizzle imports are confined to `src/db/repositories/**` and `src/db/index.ts`
2. **Given** a developer searches `src/lib/**/*.ts` for `import { db }` from `@/db`, **When** the refactor is complete, **Then** zero matches are found
3. **Given** the repository layer exists, **When** a developer calls `listRepository.getListsByUser(userId)`, **Then** the function returns typed rows without the caller knowing any SQL

---

### User Story 2 — Services Delegate to Repositories, Business Logic Preserved (Priority: P1)

As a developer, when I read a service file (e.g. `src/lib/list/service.ts`), I see business logic (ownership checks, retry logic, error mapping) but no raw SQL. All data access is delegated to a repository function call.

**Why this priority**: Equals P1 — without this, the repository layer is unused scaffolding.

**Independent Test**: Each service method can be tested by mocking its repository. All existing business rules (slug retry, NOT_FOUND on empty result, etc.) continue to behave identically.

**Acceptance Scenarios**:

1. **Given** `createList` in the list service, **When** reading the implementation, **Then** the slug-collision retry logic is present but the actual DB insert is delegated to `listRepository.insertList(values)` — no `.insert(lists)...` syntax appears in the service
2. **Given** `publishList` in the list service, **When** reading the implementation, **Then** the list update and the user `vanitySlug` lookup are each delegated to separate repository calls
3. **Given** a DB operation fails inside a repository, **When** the exception propagates to the service, **Then** the service catches it and re-throws a typed `ServiceError` exactly as before — the error contract is unchanged
4. **Given** `public/service.ts`, **When** `getPublicProfile` is called, **Then** the `React.cache` wrapper remains in the service layer and the underlying query is delegated to a repository function

---

### User Story 3 — Server Actions & Public API Are Unchanged (Priority: P2)

As a developer, I confirm that all server action files under `src/actions/` are unmodified. All exported function signatures, return types, and error messages are identical to pre-refactor.

**Why this priority**: Zero regression risk at the API boundary that UI components depend on.

**Independent Test**: `git diff --name-only` on `src/actions/` shows no changes. Existing E2E tests pass without modification.

**Acceptance Scenarios**:

1. **Given** the git diff after the refactor, **When** examining `src/actions/`, **Then** zero files are changed
2. **Given** the running application, **When** a user creates or deletes a list, **Then** the behaviour is identical to pre-refactor

---

### User Story 4 — Schema and DB Bootstrap Are Unchanged (Priority: P2)

Drizzle schema files under `src/db/schema/` and `src/db/index.ts` remain unchanged. The repository layer imports from schema; it never modifies them.

**Independent Test**: `git diff --name-only` on `src/db/schema/` and `src/db/index.ts` shows no changes.

**Acceptance Scenarios**:

1. **Given** the git diff after the refactor, **When** examining `src/db/schema/`, **Then** zero schema files are changed
2. **Given** `src/db/index.ts`, **When** examining the file, **Then** it continues to export the `db` singleton in the same shape

---

### Edge Cases

- What happens when a repository function is called with an invalid UUID? → The repository does not validate input — that remains the service's or action's responsibility. The DB returns an empty result set or throws a constraint error which the service catches.
- How are multi-step operations (e.g. `createPlace` with optional `listId`) handled? → The **repository owns the transaction**. `place.repository.ts` exposes a `createPlaceWithListAttachment(params)` function (or similar) that internally starts a `db.transaction()`, inserts into `places` and `listPlaces` atomically, and returns both created rows. The service calls this single repository function — it never receives, holds, or passes a `tx` handle.
- What happens to `React.cache` wrappers in `public/service.ts`? → They remain in the service layer. Repositories have no awareness of React's request cache.
- Does the repository layer define its own error types? → Repositories throw raw errors and let them propagate. Services catch and translate them to typed `ServiceError` instances — this is the existing pattern and must be preserved.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A `src/db/repositories/` directory MUST be created containing one module per domain: `list`, `place`, `profile`, `public`, and `user` (for cross-domain user lookups such as `vanitySlug` fetch).
- **FR-002**: Each repository module MUST export typed async functions that encapsulate all Drizzle query syntax (`.select()`, `.insert()`, `.update()`, `.delete()`, `.returning()`, joins, operators, etc.).
- **FR-003**: Repository functions MUST accept plain-data parameter objects and return typed plain-data results — no Drizzle query builder objects or schema table references may appear in a repository's exported types.
- **FR-004**: Service files in `src/lib/*/service.ts` MUST NOT import from `drizzle-orm` or `@/db` after the refactor.
- **FR-005**: Service files MUST retain all existing business logic: slug-collision retry, ownership verification, error translation, and `React.cache` wrapping. Services MUST NOT orchestrate multi-step DB operations directly — any operation requiring atomicity MUST be encapsulated in a single repository function.
- **FR-005a**: Repositories that perform multi-step writes MUST wrap those writes in `db.transaction()` internally. No `tx` handle, transaction object, or drizzle client reference may be passed from a service into a repository function. The transaction boundary is entirely the repository's responsibility.
- **FR-006**: Server action files in `src/actions/` MUST NOT be modified.
- **FR-007**: Schema files in `src/db/schema/` MUST NOT be modified.
- **FR-008**: `src/db/index.ts` MUST NOT be modified.
- **FR-009**: Repository modules MUST follow a consistent naming convention: `<domain>.repository.ts` inside `src/db/repositories/`.
- **FR-010**: Repository modules MUST NOT import from `src/lib/` — the dependency arrow is strictly one-way: `services → repositories`, never `repositories → services`.
- **FR-011**: `pnpm tsc --noEmit` MUST complete with zero type errors after the refactor.
- **FR-012**: The application MUST start and all existing feature flows (list CRUD, place CRUD, profile update, public profile view) MUST work correctly after the refactor.

### Key Entities

- **Repository**: A module in `src/db/repositories/` that encapsulates all Drizzle ORM queries for a single domain. Contains no business logic. Returns typed plain-data objects.
- **Service**: Existing modules in `src/lib/*/service.ts`. Retains all business logic. Delegates data access to its domain repository. Translates raw errors to typed `ServiceError` instances.
- **Domain**: A bounded context — current domains requiring repositories: `list`, `place`, `profile`, `public`, `user`.

---

## Scope of Changes

| File | Change |
|---|---|
| `src/db/repositories/list.repository.ts` | **NEW** — all Drizzle logic extracted from `list/service.ts` |
| `src/db/repositories/place.repository.ts` | **NEW** — all Drizzle logic extracted from `place/service.ts` |
| `src/db/repositories/profile.repository.ts` | **NEW** — all Drizzle logic extracted from `profile/service.ts` |
| `src/db/repositories/public.repository.ts` | **NEW** — all Drizzle logic extracted from `public/service.ts` |
| `src/db/repositories/user.repository.ts` | **NEW** — user lookups shared across domains (e.g. `vanitySlug` fetch used by `publishList` and `unpublishList`) |
| `src/db/repositories/index.ts` | **NEW** — optional barrel export for all repositories |
| `src/lib/list/service.ts` | **MODIFIED** — remove drizzle imports, replace inline queries with repository calls |
| `src/lib/place/service.ts` | **MODIFIED** — remove drizzle imports, replace inline queries with repository calls |
| `src/lib/profile/service.ts` | **MODIFIED** — remove drizzle imports, replace inline queries with repository calls |
| `src/lib/public/service.ts` | **MODIFIED** — remove drizzle imports, replace inline queries with repository calls |
| `src/actions/*.ts` | **NO CHANGE** |
| `src/db/schema/*.ts` | **NO CHANGE** |
| `src/db/index.ts` | **NO CHANGE** |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `grep -r "from \"drizzle-orm\"" src/lib/` returns **zero matches** after the refactor.
- **SC-002**: `grep -r "from \"@/db\"" src/lib/` returns **zero matches** after the refactor.
- **SC-003**: `pnpm tsc --noEmit` completes with **zero type errors**.
- **SC-004**: `git diff --name-only` shows **zero changes** inside `src/actions/`.
- **SC-005**: `git diff --name-only` shows **zero changes** inside `src/db/schema/` and `src/db/index.ts`.
- **SC-006**: All existing Vitest unit/integration tests pass without modification to test files.
- **SC-007**: All existing Playwright E2E tests pass without modification.
- **SC-008**: Each repository module, read in isolation, contains only: drizzle imports, schema imports, the `db` import from `@/db`, and typed query functions — no service imports, no error classes from `src/lib/`.
- **SC-009**: No service file contains a `db.transaction(` call or holds a drizzle transaction handle. All transaction boundaries live exclusively in `src/db/repositories/`.
