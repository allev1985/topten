# Implementation Plan: Places Service

**Branch**: `006-places-service` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/006-places-service/spec.md`

## Summary

Implement the `PlaceService` domain module (`src/lib/place/`) following the established service-based architecture. Expose `createPlace`, `addExistingPlaceToList`, `updatePlace`, `deletePlace`, `getPlacesByList`, and `getAvailablePlacesForList`; wire them to thin Server Actions; and build the list detail page at `/dashboard/lists/[listId]` that renders real place data, with a two-path "Add a place" dialog (select existing via name-filtered search, or create new) and an "Edit place" dialog with dirty-state tracking and a discard-changes guard.

`googlePlaceId` is system-assigned at creation as a full random UUID. It is stored for forward-compatibility with the future Google Places integration and is never shown to users. The `latitude` and `longitude` columns are stored as `0` for this iteration and will be populated by the Google Places integration in a future spec.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20 (Next.js 15, App Router)  
**Primary Dependencies**: Next.js 15, Drizzle ORM, Supabase (Postgres), Zod, shadcn/ui, Tailwind CSS v4  
**Storage**: PostgreSQL via Supabase; Drizzle schemas at `src/db/schema/place.ts` and `src/db/schema/listPlace.ts` — tables already exist; **two new indexes require a migration** (see data-model.md)  
**Testing**: Vitest (unit + component + integration), Playwright (E2E)  
**Target Platform**: Vercel (server), browser (client)  
**Project Type**: Full-stack web application (Next.js App Router)  
**Performance Goals**: Place creation / attach ≤ 3 s p95; list detail page load ≤ 500 ms p95 for ≤ 50 places  
**Constraints**: No new API routes; all mutations via Server Actions; DB calls in service layer only; `googlePlaceId` and `lat/lng` hidden from users this iteration  
**Scale/Scope**: Per-user lists feature; no pagination required for MVP

## Constitution Check

*GATE: Must pass before implementation. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — single responsibility, DRY | ✅ PASS | `PlaceService` is a dedicated domain module; no duplication with list/auth/profile services; `getAvailablePlacesForList` co-located with other place queries |
| II. Testing Discipline — tests alongside implementation | ✅ PASS | Unit tests for service functions, component tests for dialogs (dirty state, search), integration tests for `getPlacesByList` and `getAvailablePlacesForList`; plan documented in Project Structure |
| III. UX Consistency — terminology, patterns match app | ✅ PASS | Dialogs follow existing shadcn/ui Dialog usage; dirty-state indicator is additive and consistent with existing form patterns |
| IV. Performance — targets captured | ✅ PASS | ≤ 3 s place creation, ≤ 500 ms list detail load documented above; available-places search is client-side over already-fetched data |
| V. Observability — structured logging, no PII leak | ✅ PASS | Service logs use `[PlaceService:operationName]` prefix; place names are user content, not PII; no secrets in logs |
| VI. Architecture Integrity — service layer, thin actions, no new API routes | ✅ PASS | Service owns all DB calls; actions authenticate → validate → delegate → map errors → revalidate; no raw DB calls in actions or components |
| VII. Data Integrity — soft deletes, `deletedAt IS NULL` filter | ✅ PASS | `deletePlace` sets `deletedAt` on `Place`; all queries filter `deletedAt IS NULL`; `getAvailablePlacesForList` excludes already-attached places; new indexes ensure these filters are efficient |
| VIII. Security — no client-side secrets, ownership verification | ✅ PASS | All mutations verify list ownership via `userId`; no Google Places API key usage this iteration; `googlePlaceId` generation is server-side only |

## Project Structure

### Documentation (this feature)

```text
specs/006-places-service/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions & rationale
├── data-model.md        # Phase 1 — entity & validation rules
├── contracts/
│   └── place-actions.md # Phase 1 — Server Action contracts
└── tasks.md             # Phase 2 — created by /speckit.tasks (not this command)
```

### Source Code (new files)

```text
src/
├── lib/
│   └── place/
│       ├── service.ts              # Domain service — all business logic & DB access
│       └── service/
│           ├── errors.ts           # PlaceServiceError class + factory functions
│           └── types.ts            # Result types for each operation
├── actions/
│   └── place-actions.ts            # Thin Server Actions wrapping the place service
└── schemas/
    └── place.ts                    # Zod schemas for createPlace and updatePlace inputs
```

### Source Code (new UI files)

```text
src/
└── app/
    └── (dashboard)/
        └── dashboard/
            └── lists/
                └── [listId]/
                    ├── page.tsx                    # Server Component — fetches list + places, renders list detail
                    └── _components/
                        ├── PlaceList.tsx           # Client Component — renders place cards, triggers dialogs
                        ├── AddPlaceDialog.tsx      # Client Component — two-path dialog (search existing / create new)
                        ├── EditPlaceDialog.tsx     # Client Component — edit form with dirty-state tracking
                        └── PlaceCard.tsx           # Client Component — single place row (name, address, edit/delete)
```

### Source Code (modified files)

```text
src/
├── db/schema/
│   ├── place.ts                    # Add places_deleted_at_idx
│   └── listPlace.ts                # Add list_places_place_id_idx
├── lib/config/index.ts             # Add DASHBOARD_ROUTES.listDetail route constant
├── types/
│   └── place.ts                    # New: PlaceSummary type for list display
└── app/(dashboard)/dashboard/
    └── DashboardClient.tsx         # Add navigation to /dashboard/lists/[listId] on list card click
```

### Migration (new)

```text
supabase/migrations/
└── YYYYMMDDHHMMSS_place_service_indexes.sql   # Generated by: pnpm drizzle-kit generate
                                                # Adds: places_deleted_at_idx, list_places_place_id_idx
```

### Test files (new)

```text
tests/
├── unit/
│   └── lib/
│       └── place-service.test.ts        # Unit: createPlace, updatePlace, deletePlace, getAvailablePlacesForList
├── component/
│   └── dashboard/
│       ├── AddPlaceDialog.test.tsx      # Component: search filter, path switching, submit disabled states
│       └── EditPlaceDialog.test.tsx     # Component: dirty state, discard prompt, save-in-progress lock
└── integration/
    └── place-service.test.ts            # Integration: getPlacesByList, getAvailablePlacesForList, addExistingPlaceToList
```

## Complexity Tracking

> No constitution violations. No justifications required.
