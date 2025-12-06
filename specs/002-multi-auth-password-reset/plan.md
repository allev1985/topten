# Implementation Plan: Multi-Auth Password Reset Endpoint

**Branch**: `002-multi-auth-password-reset` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-multi-auth-password-reset/spec.md`

## Summary

Implement multiple authentication methods in the password reset endpoint to support:

1. PKCE code authentication (primary "forgot password" flow)
2. OTP token verification (alternative email verification flow)
3. Existing session authentication (authenticated user password change)

Authentication is validated in priority order: PKCE code → OTP token → existing session. After successful password update, the user is automatically signed out for security.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js >=20.0.0
**Primary Dependencies**: Next.js (App Router), Supabase Auth (@supabase/ssr, @supabase/supabase-js), Zod (validation)
**Storage**: Supabase (PostgreSQL) - Auth handled by Supabase Auth service
**Testing**: Vitest + React Testing Library (unit/integration tests)
**Target Platform**: Web (Next.js on Vercel)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Password reset completion in <30 seconds, error responses in <2 seconds
**Constraints**: Zero sensitive data (passwords, tokens, codes) in logs
**Scale/Scope**: Standard web app authentication flow

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status  | Evidence                                                                                                                                                                                  |
| ------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Code Quality & Maintainability     | ✅ PASS | Follows existing patterns in `verify/route.ts`. Extends existing `passwordUpdateSchema`. DRY: reuses Supabase auth methods, existing error handling utilities, existing response helpers. |
| II. Testing Discipline                | ✅ PASS | Integration tests required in `tests/integration/auth/password-update.test.ts`. Tests cover all auth methods, success/failure cases, and sign-out behavior.                               |
| III. User Experience Consistency      | ✅ PASS | Uses existing auth flow patterns (verify endpoint). Error messages consistent with existing auth error responses. Redirects follow existing patterns.                                     |
| IV. Performance & Resource Efficiency | ✅ PASS | Target: <30s completion, <2s error response. Supabase auth calls are fast. No complex computation required.                                                                               |
| V. Observability & Debuggability      | ✅ PASS | Structured logging via console.info/error (matches existing pattern). Sensitive data (passwords, tokens, codes) NOT logged per SC-006.                                                    |

**Gate Status**: ✅ PASS - All principles satisfied, no violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-multi-auth-password-reset/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── password-api.yaml
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/auth/password/
│   │   └── route.ts           # Main endpoint to modify (PUT handler)
│   └── (auth)/reset-password/
│       ├── page.tsx           # Page component to modify
│       └── password-reset-form.tsx  # Form component to modify
├── actions/
│   └── auth-actions.ts        # Server action to modify
├── schemas/
│   └── auth.ts                # Validation schema to extend
└── lib/
    ├── config/
    │   └── index.ts           # Config constants (VERIFICATION_TYPE_EMAIL)
    ├── auth/
    │   └── errors.ts          # Error handling utilities
    ├── supabase/
    │   └── server.ts          # Supabase client
    └── utils/
        └── api/
            └── response.ts    # Response utilities

tests/
└── integration/
    └── auth/
        └── password-update.test.ts  # Tests to extend
```

**Structure Decision**: Uses existing Next.js App Router structure. All modifications are to existing files following established patterns from `src/app/api/auth/verify/route.ts`.

## Complexity Tracking

> No violations identified. All changes follow existing patterns and extend current implementations.

## Post-Design Constitution Re-Check

_Re-evaluation after Phase 1 design completion._

| Principle                             | Status  | Evidence Post-Design                                                                                                         |
| ------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| I. Code Quality & Maintainability     | ✅ PASS | Design follows DRY - reuses existing patterns from verify/route.ts. Schema extension is minimal. No unnecessary abstraction. |
| II. Testing Discipline                | ✅ PASS | Test strategy defined in quickstart.md. Covers all auth methods, error cases, and sign-out behavior.                         |
| III. User Experience Consistency      | ✅ PASS | Error messages match existing auth flows. Redirect behavior consistent with current implementation.                          |
| IV. Performance & Resource Efficiency | ✅ PASS | No additional API calls beyond existing pattern. Sequential auth checks are efficient.                                       |
| V. Observability & Debuggability      | ✅ PASS | Logging strategy confirmed - auth method logged, sensitive data never logged.                                                |

**Post-Design Gate Status**: ✅ PASS - Design aligns with all constitution principles.
