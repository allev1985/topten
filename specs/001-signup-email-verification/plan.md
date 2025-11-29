# Implementation Plan: Signup & Email Verification Endpoints

**Branch**: `001-signup-email-verification` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-signup-email-verification/spec.md`

## Summary

Implement the signup and email verification API endpoints for the YourFavs platform. This task creates secure authentication endpoints that enable users to register accounts and verify their email addresses using Supabase Auth. Key security features include user enumeration protection (identical responses for new and existing users), strong password validation (12+ characters with complexity requirements), and proper session management upon email verification.

The implementation uses Next.js App Router API routes, Supabase Auth for authentication, and Zod for input validation. All endpoints follow RESTful conventions and integrate with the existing Supabase client utilities established in Task 1.1.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+)  
**Primary Dependencies**: Next.js 16.0.5, @supabase/ssr 0.8.0, @supabase/supabase-js 2.86.0, Zod (to be added)  
**Storage**: PostgreSQL via Supabase (Supabase Auth handles user storage)  
**Testing**: Vitest + React Testing Library (unit/component), Playwright (e2e)  
**Target Platform**: Vercel Edge Runtime / Node.js server  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: <3s response time for all requests, verification email dispatch within 5s  
**Constraints**: <200ms p95 latency for validation, identical response timing for user enumeration protection  
**Scale/Scope**: MVP scale, ~400 lines of new code as specified in authentication.md

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Code Quality & Maintainability ✅

- **Single responsibility**: Each file has a clear purpose (signup route, verify route, validation schemas, error classes)
- **DRY compliance**: Validation logic extracted to `/src/lib/validation/auth.ts`, error handling to `/src/lib/auth/errors.ts`
- **Style/linting**: Will follow existing ESLint + Prettier configuration
- **Complexity justification**: No unnecessary abstraction; uses standard Next.js patterns

### II. Testing Discipline & Safety Nets ✅

- **Coverage target**: >65% unit test coverage for validation and error handling logic (per spec SC-007)
- **Test types planned**:
  - Unit tests: Validation functions, error classes
  - Integration tests: API route handlers with mocked Supabase
  - E2E tests: Complete signup/verification flow (deferred to Task 5.3)
- **Failing test first**: Bug fixes will include failing test

### III. User Experience Consistency ✅

- **Consistent responses**: All endpoints return consistent JSON format
- **Error messages**: User-friendly, actionable validation errors
- **No breaking changes**: New endpoints, no modification to existing behavior

### IV. Performance & Resource Efficiency ✅

- **Performance targets**: Defined in spec (SC-001 through SC-004)
- **Timing consistency**: Identical response timing for user enumeration protection (SC-005)
- **Benchmarks**: Response time monitoring via Supabase logging

### V. Observability & Debuggability ✅

- **Logging**: Structured logging for all auth events (FR-008, FR-015)
- **Error surfaces**: User-safe messages externally, detailed logs internally (FR-021, FR-022)
- **No sensitive data leakage**: Passwords and tokens never logged

## Project Structure

### Documentation (this feature)

```text
specs/001-signup-email-verification/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions and patterns
├── data-model.md        # Phase 1: Entity definitions and validation rules
├── quickstart.md        # Phase 1: Implementation guide
├── contracts/           # Phase 1: API specifications
│   └── auth-api.yaml    # OpenAPI spec for signup and verify endpoints
└── checklists/
    └── requirements.md  # Requirements tracking
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── auth/
│           ├── signup/
│           │   └── route.ts      # POST /api/auth/signup (~150 lines)
│           └── verify/
│               └── route.ts      # GET /api/auth/verify (~100 lines)
├── lib/
│   ├── supabase/                 # Existing - Supabase client utilities
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── validation/
│   │   └── auth.ts               # Input validation schemas (~80 lines)
│   └── auth/
│       └── errors.ts             # Custom error classes (~70 lines)
└── types/
    └── auth.ts                   # Existing - Auth type definitions

tests/
├── unit/
│   └── lib/
│       ├── validation/
│       │   └── auth.test.ts      # Validation unit tests
│       └── auth/
│           └── errors.test.ts    # Error class unit tests
└── integration/
    └── auth/
        ├── signup.test.ts        # Signup integration tests
        └── verify.test.ts        # Verify integration tests
```

**Structure Decision**: Using Next.js App Router convention with API routes under `src/app/api/`. Shared logic extracted to `src/lib/` following existing patterns (see `src/lib/supabase/`). Tests organized by type (unit/integration) following existing `tests/` structure.

## Complexity Tracking

> No constitution violations identified. Implementation follows standard patterns.

| Aspect                      | Decision              | Rationale                                                                         |
| --------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| Validation library          | Zod                   | Industry standard for TypeScript, excellent error messages, runtime + type safety |
| Error handling              | Custom error classes  | Clear separation of auth errors, consistent API responses                         |
| User enumeration protection | Timing-safe responses | Security requirement per authentication.md                                        |
