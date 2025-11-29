# Implementation Plan: Login & Logout Endpoints

**Branch**: `001-login-logout` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-login-logout/spec.md`

## Summary

Implement login and logout API routes for the YourFavs authentication system using Supabase Auth. The login endpoint validates credentials via `signInWithPassword`, manages session cookies, and validates redirect URLs to prevent open redirect attacks. The logout endpoint invalidates sessions and clears cookies. Both endpoints follow existing patterns from signup/verify endpoints with proper error handling, logging, and user enumeration protection.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+  
**Primary Dependencies**: Next.js 16 (App Router), Supabase Auth (@supabase/ssr ^0.8.0), Zod (^4.1.13)  
**Storage**: Supabase (PostgreSQL) via @supabase/supabase-js  
**Testing**: Vitest + React Testing Library (unit/integration), Playwright (E2E)  
**Target Platform**: Web (Server-side Next.js API routes)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Login/logout complete in <3 seconds (SC-001 from spec)  
**Constraints**: HTTP-only, Secure, SameSite=Lax cookies; no password logging; identical error responses for invalid credentials  
**Scale/Scope**: Standard auth flow; follows existing signup/verify patterns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality & Maintainability | ✅ PASS | Reuses existing patterns from signup/verify; extends existing schemas and error types |
| I. DRY Compliance | ✅ PASS | Reuses `AuthError`, `maskEmail`, `createClient`, existing validation patterns |
| II. Testing Discipline | ✅ PASS | Spec requires >65% coverage; will follow signup.test.ts patterns |
| III. UX Consistency | ✅ PASS | Follows existing error response format and HTTP status conventions |
| IV. Performance & Resource Efficiency | ✅ PASS | <3 second target defined in SC-001 |
| V. Observability & Debuggability | ✅ PASS | Logging with masked emails, structured error responses |

**Gate Status**: PASSED - No violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-login-logout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
└── tasks.md             # Phase 2 output (NOT created by this command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── auth/
│           ├── signup/route.ts    # Existing
│           ├── verify/route.ts    # Existing
│           ├── login/route.ts     # NEW
│           └── logout/route.ts    # NEW
├── lib/
│   ├── auth/
│   │   ├── errors.ts              # Existing (may extend with authError factory)
│   │   └── redirect-validation.ts # NEW
│   ├── config/
│   │   └── index.ts               # Existing (add DEFAULT_REDIRECT)
│   ├── supabase/
│   │   └── server.ts              # Existing
│   └── utils/
│       └── email.ts               # Existing
└── schemas/
    └── auth.ts                    # Existing (add loginSchema)

tests/
├── integration/
│   └── auth/
│       ├── signup.test.ts         # Existing
│       ├── verify.test.ts         # Existing
│       ├── login.test.ts          # NEW
│       └── logout.test.ts         # NEW
└── unit/
    └── lib/
        └── auth/
            ├── errors.test.ts     # Existing
            └── redirect-validation.test.ts  # NEW
```

**Structure Decision**: Following existing Next.js App Router structure with API routes under `src/app/api/auth/`. New files follow established patterns from signup/verify endpoints.

## Post-Design Constitution Re-Check

*Re-evaluation after Phase 1 design completion*

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Code Quality & Maintainability | ✅ PASS | Design extends existing modules (`errors.ts`, `auth.ts`) rather than creating new patterns |
| I. DRY Compliance | ✅ PASS | Reuses `signupSchema` email validation pattern; uses existing `AuthError` class |
| II. Testing Discipline | ✅ PASS | Test structure defined in quickstart.md; follows signup.test.ts patterns |
| III. UX Consistency | ✅ PASS | Response format matches existing auth endpoints; consistent error codes |
| IV. Performance & Resource Efficiency | ✅ PASS | Single Supabase call per endpoint; no heavy processing |
| V. Observability & Debuggability | ✅ PASS | Structured logging defined with `[Login]`/`[Logout]` prefixes |

**Post-Design Gate Status**: PASSED

## Complexity Tracking

> **No violations - table not required**
