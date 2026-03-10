# Implementation Plan: Places Management

**Branch**: `007-places-management` | **Date**: 2026-03-10 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/007-places-management/spec.md`

## Summary

Add a "My Places" page at `/dashboard/places` giving users a unified view of all their places with the ability to: (1) delete a place and automatically cascade-soft-delete all its `ListPlace` rows in one atomic transaction; (2) create a standalone place with no list attached; (3) edit a place's name or address with changes immediately reflected across every list. The implementation extends the existing `PlaceService` with three new functions (`getAllPlacesByUser`, `deletePlace`, `createStandalonePlace`), adds matching Server Actions, and wires them to a new Server + Client component pair at the already-scaffolded `/dashboard/places` route.

## Technical Context

**Language/Version**: TypeScript 5 / Node 20  
**Primary Dependencies**: Next.js 15 App Router, Drizzle ORM, Supabase Postgres, shadcn/ui, Tailwind CSS v4, Zod, Vitest, Playwright  
**Storage**: PostgreSQL via Supabase — `places` table (with `userId` ownership column, confirmed in schema) and `list_places` junction table  
**Testing**: Vitest (unit + integration), React Testing Library (component), Playwright (E2E)  
**Target Platform**: Vercel (server-side Next.js, no edge runtime)  
**Project Type**: Web application (Next.js App Router — Server Components + Client Components + Server Actions)  
**Performance Goals**: "My Places" page load < 1 second (local dev, single-digit place counts); cascade delete completes in a single DB round-trip (transaction)  
**Constraints**: All DB access in service layer only (Constitution VI); no new API routes; no direct Drizzle calls in Server Actions or components; soft-deletes only (Constitution VII)  
**Scale/Scope**: Individual creator accounts; place counts expected in the tens, not thousands; no pagination required for MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Notes |
|-----------|-------|-------|
| I — Code Quality | ✅ PASS | New functions extend `src/lib/place/service.ts`; no logic duplication with existing functions |
| II — Testing Discipline | ✅ PASS | Unit + integration tests planned for all three new service functions; component tests for dialogs; E2E for P1 journeys |
| III — UX Consistency | ✅ PASS | "My Places" edit form reuses the same dirty-state pattern as the list-detail edit form (spec 006 FR-013/014) |
| IV — Performance | ✅ PASS | `getAllPlacesByUser` uses a single join query with a `count()` subquery; `deletePlace` uses a single transaction |
| V — Observability | ✅ PASS | All new service functions will follow the existing `[PlaceService:fnName]` structured log pattern |
| VI — Architecture Integrity | ✅ PASS | Three new service functions, three new Server Actions; no direct DB calls outside the service; no new API routes |
| VII — Data Integrity | ✅ PASS | `deletePlace` soft-deletes only; cascade covers both `Place.deletedAt` and all `ListPlace.deletedAt`; all queries filter `isNull(deletedAt)` |
| VIII — Security | ✅ PASS | Ownership verified in service layer before any write; no new auth surface; no new env vars |

**Post-design re-check**: No violations introduced. No Complexity Tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/007-places-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (modified and new files)

```text
src/
├── lib/
│   ├── place/
│   │   ├── service.ts                          # MODIFY — add getAllPlacesByUser, deletePlace, createStandalonePlace
│   │   └── service/
│   │       └── types.ts                        # MODIFY — add PlaceWithListCount, DeletePlaceResult, CreateStandalonePlaceResult
│   └── config/
│       └── index.ts                            # MODIFY — add DASHBOARD_ROUTES.places
├── schemas/
│   └── place.ts                                # MODIFY — add createStandalonePlaceSchema
├── actions/
│   └── place-actions.ts                        # MODIFY — add getAllPlacesAction, deletePlaceAction, createStandalonePlaceAction
└── app/
    └── (dashboard)/
        └── dashboard/
            └── places/
                ├── page.tsx                    # NEW — Server Component; fetches getAllPlacesByUser, renders PlacesClient
                └── _components/
                    ├── PlacesClient.tsx         # NEW — Client Component; orchestrates list, dialogs, optimistic state
                    ├── PlaceCard.tsx            # NEW — displays name, address, list count, edit/delete affordances
                    ├── AddPlaceDialog.tsx       # NEW — standalone create form (name + address only)
                    ├── EditPlaceDialog.tsx      # NEW — pre-filled edit form with dirty-state tracking
                    └── DeletePlaceDialog.tsx    # NEW — confirmation dialog showing affected list count

tests/
├── unit/
│   └── place/
│       └── service.test.ts                     # MODIFY — add tests for getAllPlacesByUser, deletePlace, createStandalonePlace
├── integration/
│   └── place/
│       └── deletePlace.cascade.test.ts         # NEW — verifies all ListPlace rows are soft-deleted atomically
├── component/
│   └── places/
│       ├── AddPlaceDialog.test.tsx              # NEW
│       ├── EditPlaceDialog.test.tsx             # NEW
│       └── DeletePlaceDialog.test.tsx           # NEW
└── e2e/
    └── places-management.spec.ts               # NEW — P1 journeys: view page, delete with cascade, standalone create
```

**Structure Decision**: Extends the existing single-project Next.js App Router layout. The `/dashboard/places` route directory already exists (scaffolded with an empty `_components/` folder). All service work stays in `src/lib/place/service.ts` consistent with the pattern established in spec 006.
