# Implementation Plan: Fix Verify-Email Page to Handle Verification Code

**Branch**: `001-fix-verify-email` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-verify-email/spec.md`

## Summary

This feature enhances the verify-email page to accept and process email verification codes from URL parameters. Currently, the page only shows "pending verification" instructions. The implementation will:

1. Accept `code` or `token_hash` + `type` URL parameters from Supabase verification emails
2. Process verification server-side using Supabase `verifyOtp()` or `exchangeCodeForSession()`
3. Display appropriate success/error states with feedback
4. Provide a "resend verification email" capability for error recovery
5. Redirect verified users to the dashboard

Technical approach leverages existing patterns from the `/api/auth/verify` route and reset-password page.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x  
**Primary Dependencies**: Next.js 15 (App Router), Supabase Auth (@supabase/ssr), React 19, shadcn/ui, Zod  
**Storage**: Supabase (PostgreSQL) - handled by Supabase Auth  
**Testing**: Vitest + React Testing Library (component), Playwright (E2E)  
**Target Platform**: Web (modern browsers)
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Verification completes within 5 seconds (SC-001), feedback visible within 3 seconds (SC-003)  
**Constraints**: Must handle both OTP (token_hash + type) and PKCE (code) verification flows  
**Scale/Scope**: Single page enhancement, 3 user stories, ~5 components/actions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Code Quality & Maintainability | Reuse existing auth patterns, DRY | ✅ | Extends existing auth-actions.ts patterns, reuses verification schemas from auth.ts |
| II. Testing Discipline | Tests before/alongside implementation | ✅ | Existing tests in verify-email-page.test.tsx will be extended |
| III. User Experience Consistency | Consistent terminology, patterns | ✅ | Follows Card-based UI pattern from reset-password page |
| IV. Performance & Resource Efficiency | 5s verification, 3s feedback | ✅ | Server-side verification, minimal client JS |
| V. Observability & Debuggability | Structured logging, actionable errors | ✅ | Follows logging pattern from /api/auth/verify route |

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-verify-email/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - verification patterns research
├── data-model.md        # Phase 1 output - state and component model
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - API contracts
│   └── verify-email-action.md  # Server action contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── actions/
│   └── auth-actions.ts        # Add verifyEmailAction, resendVerificationAction
├── app/(auth)/verify-email/
│   ├── page.tsx               # Updated: async server component with URL params
│   └── verification-states.tsx # New: client components for UI states
├── schemas/
│   └── auth.ts                # Already has verifyTokenSchema, verifyCodeSchema
├── lib/
│   ├── config/index.ts        # Already has VERIFICATION_TYPE_EMAIL
│   └── auth/errors.ts         # Already has error types
└── components/ui/             # Existing shadcn/ui components

tests/
├── component/auth/
│   └── verify-email-page.test.tsx  # Extend with new test cases
└── integration/                     # (future) E2E verification tests
```

**Structure Decision**: Web application using Next.js App Router with server components and server actions. The feature extends the existing `/src/app/(auth)/verify-email/` directory with enhanced page logic and client state components.

## Complexity Tracking

> **No violations identified.** All design decisions align with the Constitution principles.
