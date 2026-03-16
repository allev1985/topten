# Implementation Plan: DB Layer Abstraction

**Branch**: `009-db-layer-abstraction` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/009-db-layer-abstraction/spec.md`

## Summary

Extract all Drizzle ORM logic from `src/lib/*/service.ts` into a new `src/db/repositories/` layer. Services retain all business logic (slug-collision retry, ownership verification, error translation, `React.cache`) but delegate every SQL statement to a matching repository function. Repositories own all `db.*` calls including `db.transaction()` for multi-step writes. Server actions and schema files are untouched.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 22  
**Primary Dependencies**: Next.js 16 (App Router), Drizzle ORM, Supabase (Postgres), Vitest 4, Playwright  
**Storage**: PostgreSQL via Supabase — Drizzle as ORM  
**Testing**: Vitest (unit + integration), Playwright (E2E)  
**Target Platform**: Vercel (server-side only code path)  
**Project Type**: Web application (Next.js, full-stack)  
**Performance Goals**: No change to runtime performance — this is a pure structural refactor  
**Constraints**: Zero changes to public API contracts (server action signatures, return types, error messages); zero schema changes; zero migration required  
**Scale/Scope**: 4 service files, ~5 repository files to create, ~35 unit tests to update mock targets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|---|---|---|
| **I. Code Quality** — single responsibility, no unnecessary abstractions | ✅ PASS | Repository pattern is explicitly justified in spec (business logic in services is non-trivial; it cannot safely be pushed down) |
| **II. Testing Discipline** — tests written/updated with implementation | ✅ PASS | Existing unit tests mock `@/db` directly; after refactor they must mock repositories instead. All mocks to be updated in same PR. |
| **VI. Architecture** — no direct Drizzle in server actions | ✅ PASS | Actions already clean; this refactor pushes Drizzle further down from services → repositories |
| **VI. Architecture** — constitution states "direct DB calls in service layer only" | ⚠️ VIOLATION → JUSTIFIED | The constitution's ORM row (`direct DB calls in service layer only`) was written before a repository layer existed. This refactor supersedes that rule. A minor constitution amendment is required post-merge (patch: update ORM row to "direct DB calls in repository layer only"). |
| **VII. Data Integrity** — soft deletes, `deleted_at IS NULL` filters preserved | ✅ PASS | All query logic moves verbatim into repositories; no WHERE clause changes |
| **VIII. Security** — no new public surface; no client-side exposure | ✅ PASS | Repositories are server-side only; no new env vars or API routes |

**Constitution Amendment Required** (patch, post-merge):  
Update `constitution.md` Technology Stack table, ORM row:  
- From: `direct DB calls in service layer only`  
- To: `direct DB calls in repository layer only (src/db/repositories/); services orchestrate business logic`

## Project Structure

### Documentation (this feature)

```text
specs/009-db-layer-abstraction/
├── plan.md          ← this file
├── research.md      ← Phase 0 output
├── data-model.md    ← Phase 1 output
└── tasks.md         ← Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
src/
├── db/
│   ├── index.ts                        ← NO CHANGE (exports db singleton)
│   ├── schema/                         ← NO CHANGE
│   └── repositories/                   ← NEW directory
│       ├── index.ts                    ← NEW barrel export
│       ├── list.repository.ts          ← NEW (extracted from lib/list/service.ts)
│       ├── place.repository.ts         ← NEW (extracted from lib/place/service.ts)
│       ├── profile.repository.ts       ← NEW (extracted from lib/profile/service.ts)
│       ├── public.repository.ts        ← NEW (extracted from lib/public/service.ts)
│       └── user.repository.ts          ← NEW (vanitySlug lookups used by list service)
└── lib/
    ├── list/service.ts                 ← MODIFIED (remove drizzle imports, call repos)
    ├── place/service.ts                ← MODIFIED (remove drizzle imports, call repos)
    ├── profile/service.ts              ← MODIFIED (remove drizzle imports, call repos)
    └── public/service.ts               ← MODIFIED (remove drizzle imports, call repos)

src/actions/                            ← NO CHANGE
tests/
└── unit/lib/
    ├── list-service.test.ts            ← MODIFIED (mock repos not @/db)
    ├── place-service.test.ts           ← MODIFIED (mock repos not @/db)
    └── public-service.test.ts          ← MODIFIED (mock repos not @/db)
```

**Structure Decision**: Single Next.js project. New `src/db/repositories/` sits alongside the existing `src/db/schema/` and `src/db/index.ts`. No new packages, no new workspace projects.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Repository pattern adds a new layer | Services contain real business logic (slug retry, ownership checks, error translation, `React.cache`) that cannot be pushed into a db layer without creating a bloated, mixed-concern module | 2-tier (actions → db layer) would require moving all service business logic into actions or a fat db module — both violate Principle I |
| Constitution amendment required | Constitution's ORM rule pre-dates a repository layer | Amendment is a patch (clarification only); no principle changes; approved by this plan |
