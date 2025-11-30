# Implementation Plan: Fix Reset Password Flow

**Branch**: `001-fix-reset-password-flow` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-reset-password-flow/spec.md`

## Summary

Fix the reset password flow to support email link code exchange for unauthenticated users. The current implementation only checks for a code in the URL but does not exchange it for a session before displaying the form, causing failures when unauthenticated users try to reset their passwords via email link.

**Technical Approach**: Implement a server-side code exchange using `supabase.auth.exchangeCodeForSession(code)` when the page loads, following the established pattern in `/api/auth/verify/route.ts`. This will establish a valid session before rendering the password reset form, enabling the `passwordUpdateAction` to work correctly.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js (via Next.js)  
**Primary Dependencies**: Next.js 15 (App Router), Supabase Auth (@supabase/ssr), React 19, Zod  
**Storage**: Supabase (PostgreSQL) - session management handled by Supabase Auth  
**Testing**: Vitest + React Testing Library (unit/integration), Playwright (E2E)  
**Target Platform**: Web (server-side rendering with Next.js App Router)  
**Project Type**: Web application (Next.js monolithic architecture)  
**Performance Goals**: Page load and form submission under 3 seconds (per SC-002)  
**Constraints**: Must use PKCE flow for code exchange, server-side session management  
**Scale/Scope**: Single page fix with associated server action modifications

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability ✅
- [x] Single responsibility: Code exchange logic isolated in page server component
- [x] DRY: Reuse existing `createClient()` and `exchangeCodeForSession` patterns from `/api/auth/verify/route.ts`
- [x] Style compliance: Follow existing TypeScript/ESLint/Prettier rules
- [x] Complexity justified: No new abstractions needed; simple server-side code exchange

### II. Testing Discipline & Safety Nets ✅
- [x] Test coverage: Unit tests for code exchange logic, component tests for form states
- [x] Tests before merge: All existing tests must pass, new tests for code exchange scenarios
- [x] Critical paths covered: Email link flow, authenticated user flow, error states

### III. User Experience Consistency ✅
- [x] Consistent terminology: Use existing error messages and UI patterns
- [x] Interaction patterns: Match existing auth flow UI (cards, forms, alerts)
- [x] Visual structure: Use existing shadcn/ui components

### IV. Performance & Resource Efficiency ✅
- [x] Performance target: <3s for page load with code exchange (SC-002)
- [x] No additional API calls beyond code exchange

### V. Observability & Debuggability ✅
- [x] Structured logging: Follow existing `console.info("[Verify]", ...)` pattern
- [x] Actionable error messages: Clear messages for invalid/expired codes

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-reset-password-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output - technical research findings
├── data-model.md        # Phase 1 output - entity relationships
├── quickstart.md        # Phase 1 output - developer guide
├── contracts/           # Phase 1 output - API contracts
│   └── reset-password.yaml
└── tasks.md             # Phase 2 output - implementation tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/
│   │   └── reset-password/
│   │       ├── page.tsx                # Modified: Server-side code exchange
│   │       └── password-reset-form.tsx # Client component (minimal changes)
│   └── api/
│       └── auth/
│           └── verify/
│               └── route.ts            # Reference pattern for code exchange
├── actions/
│   └── auth-actions.ts                 # passwordUpdateAction (no changes needed)
├── lib/
│   ├── supabase/
│   │   ├── server.ts                   # Server client factory
│   │   └── client.ts                   # Browser client factory
│   └── config/
│       └── index.ts                    # Route configuration
└── schemas/
    └── auth.ts                         # Password validation schema

tests/
├── integration/
│   └── auth/
│       ├── password-update.test.ts     # Existing tests
│       └── reset-password-flow.test.ts # New: Code exchange flow tests
├── unit/
│   └── actions/
│       └── auth-actions.test.ts        # Existing tests
└── component/
    └── auth/
        └── reset-password-page.test.tsx # New: Page component tests
```

**Structure Decision**: Next.js App Router monolithic structure. All auth-related code is co-located in `src/app/(auth)/` with shared utilities in `src/lib/`. This follows the existing project conventions.

## Complexity Tracking

> No violations - implementation follows established patterns with minimal changes.
