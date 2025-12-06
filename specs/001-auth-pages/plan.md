# Implementation Plan: Authentication Pages

**Branch**: `001-auth-pages` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-pages/spec.md`

## Summary

Create reusable form components and authentication pages for signup, login, password reset, and email verification using Supabase Auth. The implementation uses barebone HTML with browser default styling, leverages existing API routes at `/api/auth/*`, and integrates with the existing auth schemas and validation utilities. Server actions will handle form submissions, calling the existing API routes internally.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2.0, Next.js 16.0.5 (App Router)  
**Primary Dependencies**: @supabase/ssr, @supabase/supabase-js, Zod 4.1.13  
**Storage**: PostgreSQL (via Supabase), Supabase Auth for session management  
**Testing**: Vitest + React Testing Library (unit/component), Playwright (e2e)  
**Target Platform**: Web application (modern browsers)
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Password strength feedback < 100ms, page load < 3s, form submission response < 2s  
**Constraints**: Progressive enhancement (forms work without JS), WCAG 2.1 AA accessibility  
**Scale/Scope**: 6 authentication pages, 8+ reusable components, 1 custom hook, minimum 65% test coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality & Maintainability | ✅ PASS | Reusable components follow DRY; existing utilities reused (validatePassword, schemas) |
| II. Testing Discipline & Safety Nets | ✅ PASS | 65% minimum coverage target; unit tests for hooks, component tests for UI |
| III. User Experience Consistency | ✅ PASS | All auth pages use consistent auth-card wrapper; barebone HTML maintains consistency |
| IV. Performance & Resource Efficiency | ✅ PASS | Password strength < 100ms; no unnecessary re-renders via controlled state |
| V. Observability & Debuggability | ✅ PASS | Existing logging in API routes; actionable error messages defined |

**Pre-Phase 0 Gate**: PASSED - All constitution principles addressed in design.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-pages/
├── plan.md              # This file
├── research.md          # Phase 0 output - design decisions
├── data-model.md        # Phase 1 output - component/hook interfaces
├── quickstart.md        # Phase 1 output - developer guide
├── contracts/           # Phase 1 output - API contracts
│   └── server-actions.md
└── tasks.md             # Phase 2 output (NOT created by this plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/                          # Auth route group (public)
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── auth/verify/page.tsx
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/                     # Dashboard route group (protected)
│   │   └── settings/password/page.tsx
│   └── api/auth/                        # Existing API routes (not modified)
├── actions/
│   └── auth-actions.ts                  # Server actions for form handling
├── components/
│   └── auth/
│       ├── form-input.tsx
│       ├── password-input.tsx
│       ├── form-button.tsx
│       ├── error-message.tsx
│       ├── auth-card.tsx
│       ├── login-form.tsx
│       └── password-reset-form.tsx
├── hooks/
│   └── use-form-state.ts
├── lib/
│   ├── utils/validation/password.ts     # Existing (reuse)
│   └── config/index.ts                  # Existing (reuse)
├── schemas/
│   └── auth.ts                          # Existing (reuse)
└── types/
    └── auth.ts                          # Existing (may extend)

tests/
├── unit/
│   └── hooks/
│       └── use-form-state.test.ts
├── component/
│   └── auth/
│       ├── form-input.test.tsx
│       ├── password-input.test.tsx
│       ├── form-button.test.tsx
│       ├── error-message.test.tsx
│       ├── auth-card.test.tsx
│       ├── login-form.test.tsx
│       └── password-reset-form.test.tsx
└── integration/
    └── auth/
        └── auth-flows.test.ts           # Optional: page-level tests
```

**Structure Decision**: Next.js App Router structure with route groups `(auth)` and `(dashboard)` for layout organization. Components follow the existing `/src/components/` pattern. Server actions in `/src/actions/` follow Next.js 13+ conventions.

## Post-Phase 1 Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Code Quality & Maintainability | ✅ PASS | DRY enforced: `useFormState` hook centralizes state management; atomic components (FormInput, PasswordInput, etc.) reused across all pages; existing `validatePassword()` and Zod schemas reused |
| II. Testing Discipline & Safety Nets | ✅ PASS | Test strategy defined in quickstart.md; test file locations documented; 65% coverage target; unit tests for hooks, component tests for UI components |
| III. User Experience Consistency | ✅ PASS | AuthCard wrapper provides consistent page structure; all forms use same component hierarchy; error messaging follows consistent ActionState pattern |
| IV. Performance & Resource Efficiency | ✅ PASS | Password strength updates client-side only (no server roundtrip); server actions avoid HTTP overhead by calling Supabase directly; minimal component re-renders via React 19 |
| V. Observability & Debuggability | ✅ PASS | Error types documented in data-model.md; ActionState provides structured error information; existing API route logging preserved; debug tips in quickstart.md |

**Post-Phase 1 Gate**: PASSED - Design artifacts complete and constitution-compliant.

## Complexity Tracking

> No constitution violations identified. Design follows all principles without exceptions.
