# Implementation Plan: Supabase Configuration & Environment Setup

**Branch**: `001-supabase-auth-setup` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-supabase-auth-setup/spec.md`

## Summary

Create the authentication foundation for YourFavs by implementing a middleware helper for session refresh, TypeScript types for authentication responses, and ensuring environment validation works correctly. This task establishes the foundational utilities required for all subsequent authentication features.

**Primary deliverables:**

1. Middleware helper at `/src/lib/supabase/middleware.ts` for session refresh during request processing
2. TypeScript types at `/src/types/auth.ts` for `AuthUser`, `AuthSession`, and `AuthError`
3. Verification and testing of environment validation in `/src/lib/env.ts`
4. Unit tests achieving >65% coverage for authentication utilities

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js ≥20.0.0
**Primary Dependencies**: Next.js 16.0.5 (App Router), @supabase/ssr 0.8.0, @supabase/supabase-js 2.86.0
**Storage**: Supabase (PostgreSQL) with cookie-based session storage
**Testing**: Vitest 4.0.14 with React Testing Library, coverage via V8 provider
**Target Platform**: Web application (Vercel deployment), browsers supporting HTTP-only cookies
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Environment validation errors must surface within 1 second of startup
**Constraints**: Cookie-based authentication (not localStorage), server-side Google Places API calls only
**Scale/Scope**: Foundation for authentication system, affects all protected routes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                 | Status  | Evidence                                                                                                           |
| ----------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| **I. Code Quality & Maintainability**     | ✅ PASS | Single responsibility modules: `middleware.ts` for middleware client, `auth.ts` for types, `env.ts` for validation |
| **II. Testing Discipline & Safety Nets**  | ✅ PASS | Spec requires >65% coverage for auth utilities; unit tests planned for all new code                                |
| **III. User Experience Consistency**      | ✅ PASS | Developer-facing API follows existing patterns in `client.ts` and `server.ts`                                      |
| **IV. Performance & Resource Efficiency** | ✅ PASS | Performance goal defined: error messages within 1 second of startup                                                |
| **V. Observability & Debuggability**      | ✅ PASS | FR-007 requires clear, actionable error messages for missing environment variables                                 |

**Gate Status**: ✅ ALL GATES PASS - Proceeding to Phase 0

### Post-Design Constitution Check (Phase 1 Complete)

| Principle                                 | Status  | Evidence                                                                                               |
| ----------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| **I. Code Quality & Maintainability**     | ✅ PASS | Research confirms single-responsibility modules; middleware uses recommended `getAll`/`setAll` pattern |
| **II. Testing Discipline & Safety Nets**  | ✅ PASS | Test structure defined in research; mocking strategy documented; >65% coverage target                  |
| **III. User Experience Consistency**      | ✅ PASS | API contracts follow existing patterns; consistent with `client.ts` and `server.ts`                    |
| **IV. Performance & Resource Efficiency** | ✅ PASS | Lazy-loaded env validation; no unnecessary computation                                                 |
| **V. Observability & Debuggability**      | ✅ PASS | Error types include codes and messages; env validation provides actionable error messages              |

**Post-Design Gate Status**: ✅ ALL GATES PASS - Ready for Phase 2 (Tasks)

## Project Structure

### Documentation (this feature)

```text
specs/001-supabase-auth-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output - research findings
├── data-model.md        # Phase 1 output - entity definitions
├── quickstart.md        # Phase 1 output - developer guide
├── contracts/           # Phase 1 output - API contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── supabase/
│       ├── client.ts      # Browser client (exists)
│       ├── server.ts      # Server client (exists)
│       └── middleware.ts  # NEW: Middleware helper for session refresh
├── types/
│   └── auth.ts            # NEW: TypeScript auth types
└── lib/
    └── env.ts             # Environment validation (exists, verify/test)

tests/
└── unit/
    ├── lib/
    │   └── supabase/
    │       ├── client.test.ts     # NEW: Browser client tests
    │       ├── server.test.ts     # NEW: Server client tests
    │       └── middleware.test.ts # NEW: Middleware helper tests
    └── lib/
        └── env.test.ts            # NEW: Environment validation tests
```

**Structure Decision**: Follows existing Next.js App Router structure with `src/` for source code and `tests/unit/` for unit tests. New files integrate with existing Supabase client organization under `src/lib/supabase/`.

## Complexity Tracking

> No violations - implementation follows simple, established patterns.
