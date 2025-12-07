# Implementation Plan: Fix Middleware Location and Route Protection

**Branch**: `001-fix-middleware-location` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-middleware-location/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature fixes a critical security issue where the authentication middleware is not being invoked because it's located in the project root instead of the `src/` directory. Next.js requires middleware.ts to be in the `src/` directory when using a src-based project structure. The middleware.ts file will be moved from the root to `src/middleware.ts`, ensuring protected routes like `/dashboard` and `/settings` are properly secured. All existing authentication logic, session refresh, and redirect handling will be preserved.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js >= 20.0.0  
**Primary Dependencies**: Next.js 16.0.5 (App Router), Supabase SSR 0.8.0, @supabase/supabase-js 2.86.0  
**Storage**: Supabase (PostgreSQL) with Drizzle ORM 0.44.7  
**Testing**: Vitest 4.0.14, React Testing Library 16.3.0, Playwright 1.57.0  
**Target Platform**: Web application (Vercel deployment)
**Project Type**: Web application with src/ directory structure (Next.js App Router)  
**Performance Goals**: Middleware execution < 100ms for route protection checks  
**Constraints**: Zero downtime migration, all existing tests must pass, session refresh must continue working  
**Scale/Scope**: Single middleware file relocation with ~112 LOC, affects all protected routes (/dashboard, /settings)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Justification |
|-----------|------------|---------------|
| **Code Quality & Maintainability** | ✅ PASS | Moving middleware.ts to correct location improves maintainability by following Next.js conventions. No new complexity added - simple file relocation. |
| **DRY (Don't Repeat Yourself)** | ✅ PASS | No duplication introduced. Existing helper functions in `src/lib/auth/helpers/middleware.ts` will continue to be reused. |
| **Framework Code Integrity** | ✅ PASS | No framework-generated code is being modified. This is correcting the location of custom middleware code to align with framework expectations. |
| **Testing Discipline** | ✅ PASS | Existing tests (`tests/integration/middleware/auth-middleware.test.ts`, `tests/unit/lib/auth/helpers/middleware.test.ts`) will verify behavior is preserved. Tests must pass before merge. |
| **User Experience Consistency** | ✅ PASS | No UX changes - this is a behind-the-scenes fix. Users will experience proper authentication enforcement which was the intended behavior. |
| **Performance & Resource Efficiency** | ✅ PASS | No performance impact. Middleware location doesn't affect execution performance. Target < 100ms middleware execution time already established. |
| **Observability & Debuggability** | ✅ PASS | Existing error logging (`console.error("Auth middleware error:", error)`) preserved. No changes to observability. |

**Overall Status**: ✅ **APPROVED** - All constitutional principles satisfied. This is a standard file relocation to fix a deployment issue.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-middleware-location/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Next.js middleware conventions
├── data-model.md        # Phase 1 output - N/A (no data model changes)
├── quickstart.md        # Phase 1 output - Developer guide for middleware
└── contracts/           # Phase 1 output - N/A (no API contracts)
```

### Source Code (repository root)

```text
# Web application with Next.js App Router and src/ directory structure

# ROOT LEVEL (Next.js convention - config files only)
next.config.ts           # MUST remain at root - Next.js requirement
middleware.ts            # TO BE DELETED - currently at wrong location
package.json
tsconfig.json
vitest.config.ts
playwright.config.ts

# SRC DIRECTORY (application code)
src/
├── middleware.ts        # TO BE CREATED - correct location for Next.js
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Auth routes (login, signup, etc.)
│   ├── dashboard/      # Protected dashboard routes
│   └── settings/       # Protected settings routes
├── lib/
│   ├── auth/
│   │   └── helpers/
│   │       └── middleware.ts    # Helper functions (unchanged)
│   ├── supabase/
│   │   └── middleware.ts        # Session update logic (unchanged)
│   └── config/
│       └── index.ts             # PROTECTED_ROUTES, PUBLIC_ROUTES (unchanged)
└── components/

# TESTS
tests/
├── integration/
│   └── middleware/
│       └── auth-middleware.test.ts    # Integration tests (may need path updates)
└── unit/
    └── lib/
        ├── auth/helpers/
        │   └── middleware.test.ts     # Unit tests for helpers (unchanged)
        └── supabase/
            └── middleware.test.ts     # Unit tests for session (unchanged)
```

**Structure Decision**: This is a Next.js App Router application using the `src/` directory structure. Per Next.js documentation, when using a `src/` directory, middleware.ts MUST be located at `src/middleware.ts`, not at the project root. The `next.config.ts` file correctly remains at the root level as it's a configuration file, not application code. This relocation ensures the middleware is properly invoked by the Next.js framework.

## Complexity Tracking

> **No constitutional violations - this section is not applicable**

This feature is a straightforward file relocation with no complexity justifications needed. All constitutional principles are satisfied.
