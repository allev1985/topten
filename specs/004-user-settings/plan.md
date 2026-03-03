# Implementation Plan: User Settings Page

**Branch**: `004-user-settings` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-user-settings/spec.md`

## Summary

Build a unified `/dashboard/settings` page exposing three independently submittable sections: **Profile URL** (vanity slug update with uniqueness validation), **Profile** (display name update), and **Security** (password change). The password section reuses the existing `passwordChangeAction` server action and `PasswordChangeForm` component with no duplication. Slug and name mutations are new server actions following the established `"use server"` + Zod + `ActionState<T>` pattern, writing to the existing `users` table via Drizzle. No DB schema changes are required.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 15 App Router (React 19)  
**Primary Dependencies**: Drizzle ORM, Supabase Auth, Zod, shadcn/ui, `useActionState` (React 19)  
**Storage**: PostgreSQL via Supabase — `public.users` table (`name varchar(255)`, `vanity_slug varchar(50) UNIQUE`)  
**Testing**: Vitest (unit + integration), React Testing Library (component), Playwright (E2E)  
**Target Platform**: Vercel / Node.js server  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Server action round-trip < 500 ms p95; settings page initial load < 1.5 s  
**Constraints**: No new API routes (Constitution §VI); all mutations via server actions; no client-side DB access; server-side session verification before every mutation  
**Scale/Scope**: Low-frequency writes (< 1 req/min per user); single-user settings; no pagination or bulk operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — still PASS.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — DRY | ✅ PASS | `PasswordChangeForm` reused directly; no logic duplication. `mapZodErrors` utility reused from `auth-actions.ts`. |
| II. Testing Discipline | ✅ PASS | Unit tests for actions, component tests for forms, integration test for slug uniqueness, E2E for full settings journey. |
| III. UX Consistency | ✅ PASS | Same `Card` + `useFormState` + inline feedback pattern as existing auth forms. |
| IV. Performance | ✅ PASS | Simple single-row reads/writes; indices on `vanity_slug` and `deleted_at` already exist. |
| V. Observability | ✅ PASS | Server actions log with `console.info`/`console.error` + masked identifiers, matching auth service pattern. |
| VI. Architecture Integrity | ✅ PASS | No new API routes. All mutations are server actions. No client-side DB or Supabase calls. |
| VII. Data Integrity | ✅ PASS | All queries include `deleted_at IS NULL`. `updatedAt` set on every write. Slug uniqueness check excludes current user to avoid false conflicts. |
| VIII. Security Boundaries | ✅ PASS | Session resolved server-side via `getSession()` before every mutation. No secrets in client code. |

## Project Structure

### Documentation (this feature)

```text
specs/004-user-settings/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── server-actions.md  ← Phase 1 output
└── tasks.md             ← Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── actions/
│   ├── auth-actions.ts          (existing — passwordChangeAction reused)
│   └── profile-actions.ts       (NEW — updateNameAction, updateSlugAction)
├── schemas/
│   ├── auth.ts                  (existing — no changes)
│   └── profile.ts               (NEW — updateNameSchema, updateSlugSchema)
├── app/
│   └── (dashboard)/
│       └── settings/
│           ├── page.tsx         (NEW — unified settings page, server component)
│           ├── password/        (existing — kept, but /settings now primary entry)
│           │   ├── page.tsx     (existing)
│           │   └── password-change-form.tsx  (existing — reused)
│           └── _components/     (NEW — settings-specific client form components)
│               ├── SlugSettingsForm.tsx
│               └── NameSettingsForm.tsx
└── components/
    └── (existing shared components — no changes)

tests/
├── unit/
│   └── actions/
│       └── profile-actions.test.ts   (NEW)
├── component/
│   └── settings/
│       ├── SlugSettingsForm.test.tsx  (NEW)
│       └── NameSettingsForm.test.tsx  (NEW)
├── integration/
│   └── profile-actions.integration.test.ts  (NEW — slug uniqueness against DB)
└── e2e/
    └── settings.spec.ts              (NEW — full settings page journey)
```

**Structure Decision**: Next.js App Router web application pattern. Settings-specific client components co-located under `(dashboard)/settings/_components/` following the existing `settings/password/password-change-form.tsx` precedent. New actions and schemas in their own files (`profile-actions.ts`, `profile.ts`) to keep `auth-actions.ts` focused on auth flows only.
