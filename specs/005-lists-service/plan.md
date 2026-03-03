# Implementation Plan: Lists Service

**Branch**: `005-lists-service` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-lists-service/spec.md`

## Summary

Implement the `ListService` domain module (`src/lib/list/`) following the established service-based architecture. Expose `createList`, `updateList`, `deleteList`, `publishList`, `unpublishList`, and `getListsByUser`; wire them to thin Server Actions; convert the dashboard page from a mocked Client Component to a Server Component that passes real data to the existing interactive shell; and delete the mock list file.

Slug is system-assigned at creation as the first 4 hex characters of a random UUID. Slugs are immutable. All mutations verify ownership and `deletedAt IS NULL` before writing.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20 (Next.js 15, App Router)  
**Primary Dependencies**: Next.js 15, Drizzle ORM, Supabase (Postgres), Zod, shadcn/ui, Tailwind CSS v4  
**Storage**: PostgreSQL via Supabase; Drizzle schema at `src/db/schema/list.ts` — table already exists, no migration needed  
**Testing**: Vitest (unit + component + integration), Playwright (E2E)  
**Target Platform**: Vercel (server), browser (client)  
**Project Type**: Full-stack web application (Next.js App Router)  
**Performance Goals**: List creation ≤ 3 s p95; dashboard load ≤ 500 ms p95 for ≤ 50 lists  
**Constraints**: No new API routes; all mutations via Server Actions; DB calls in service layer only; Google Places API server-side only  
**Scale/Scope**: Single-user lists feature; no pagination required for MVP

## Constitution Check

*GATE: Must pass before implementation. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — single responsibility, DRY | ✅ PASS | `ListService` is a dedicated domain module; no logic duplication with auth/profile services |
| II. Testing Discipline — tests alongside implementation | ✅ PASS | Unit tests for service, component tests for form, integration test for `getListsByUser`; plan documented in Project Structure |
| III. UX Consistency — terminology, patterns match app | ✅ PASS | Follows existing dashboard card/grid pattern; no breaking UX changes |
| IV. Performance — targets captured | ✅ PASS | ≤ 3 s creation, ≤ 500 ms dashboard load documented above |
| V. Observability — structured logging, no PII leak | ✅ PASS | Service logs use `[ListService:operationName]` prefix; no PII in logs |
| VI. Architecture Integrity — service layer, thin actions, no new API routes | ✅ PASS | Service owns all DB calls; actions authenticate → validate → delegate → map errors → revalidate |
| VII. Data Integrity — soft deletes, `deletedAt IS NULL` filter | ✅ PASS | `deleteList` sets `deletedAt`; `getListsByUser` filters `deletedAt IS NULL`; slugs scoped per user |
| VIII. Security — no client-side secrets, ownership verification | ✅ PASS | All service operations verify `userId` ownership before write; no secrets exposed |

## Project Structure

### Documentation (this feature)

```text
specs/005-lists-service/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions & rationale
├── data-model.md        # Phase 1 — entity & validation rules
├── contracts/
│   └── list-actions.md  # Phase 1 — Server Action contracts
└── tasks.md             # Phase 2 — created by /speckit.tasks (not this command)
```

### Source Code (new files)

```text
src/
├── lib/
│   └── list/
│       ├── service.ts              # Domain service — all business logic & DB access
│       └── service/
│           ├── errors.ts           # ListServiceError class + factory functions
│           └── types.ts            # Result types for each operation
├── actions/
│   └── list-actions.ts             # Thin Server Actions wrapping the list service
└── schemas/
    └── list.ts                     # Zod schemas for createList and updateList inputs
```

### Source Code (modified files)

```text
src/
├── app/(dashboard)/dashboard/
│   ├── page.tsx                    # Convert: remove mock data; wrap with server data-fetch
│   └── DashboardServer.tsx         # New: Server Component that fetches real lists, renders client shell
├── types/
│   └── list.ts                     # Extend List type with slug, description, createdAt
└── lib/mocks/
    └── lists.ts                    # DELETE this file
```

### Test files (new)

```text
tests/
├── unit/
│   └── lib/
│       └── list-service.test.ts    # Unit: createList, updateList, deleteList, publishList, unpublishList
├── component/
│   └── CreateListForm.test.tsx     # Component: title validation, disabled submit state
└── integration/
    └── list-service.test.ts        # Integration: getListsByUser with real DB (Supabase local)
```

## Complexity Tracking

> No constitution violations. No justifications required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
