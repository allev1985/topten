# Tasks: Supabase Configuration & Environment Setup

**Input**: Design documents from `/specs/001-supabase-auth-setup/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Unit tests are REQUIRED per FR-010 (>65% code coverage for authentication utilities)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Path alias: `@/*` maps to `./src/*`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure for authentication utilities

- [x] T001 Create `src/types/` directory for TypeScript type definitions
- [x] T002 [P] Create `tests/unit/lib/supabase/` directory structure for Supabase client tests
- [x] T003 [P] Create `tests/unit/lib/` directory for environment validation tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript types that MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create auth types module with `AuthUser`, `AuthSession`, `AuthError`, `AuthState`, and `AuthResult<T>` in `src/types/auth.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Developer Sets Up Local Authentication Environment (Priority: P1) 🎯 MVP

**Goal**: Enable developers to set up the authentication foundation locally with working Supabase clients (browser, server, middleware) that instantiate correctly when environment is properly configured.

**Independent Test**: Can be fully tested by running the application locally and verifying that Supabase clients instantiate correctly, middleware helpers export properly, and TypeScript types compile without errors.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Create unit tests for browser client in `tests/unit/lib/supabase/client.test.ts` - mock `@supabase/ssr` `createBrowserClient`, verify it's called with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, assert return value is a valid Supabase client instance
- [x] T006 [P] [US1] Create unit tests for server client in `tests/unit/lib/supabase/server.test.ts` - mock `@supabase/ssr` `createServerClient` and `next/headers` `cookies()`, verify cookie handlers (`getAll`, `setAll`) are configured, assert return value is a valid Supabase client instance
- [x] T007 [P] [US1] Create unit tests for middleware helper in `tests/unit/lib/supabase/middleware.test.ts` - mock `@supabase/ssr` `createServerClient`, mock `NextRequest`/`NextResponse`, verify `getAll`/`setAll` cookie pattern is used, assert `supabase.auth.getUser()` is called for session refresh, verify response cookies are set

### Implementation for User Story 1

- [x] T008 [US1] Create middleware helper with `updateSession(request: NextRequest)` function in `src/lib/supabase/middleware.ts` using `getAll`/`setAll` cookie pattern per research.md

**Checkpoint**: At this point, User Story 1 should be fully functional - all three Supabase client utilities (browser, server, middleware) can be imported and instantiated

---

## Phase 4: User Story 2 - Developer Uses Type-Safe Authentication Objects (Priority: P2)

**Goal**: Provide TypeScript types for authentication responses enabling type-safe code and compile-time error detection.

**Independent Test**: Can be fully tested by importing auth types in TypeScript files and verifying that the compiler accepts valid usage and rejects invalid usage.

### Tests for User Story 2 ⚠️

- [x] T009 [P] [US2] Create unit tests for auth types in `tests/unit/types/auth.test.ts` - test type exports, `AuthError` interface, `AuthState` discriminated union, and `AuthResult<T>` type

### Implementation for User Story 2

- [x] T010 [US2] Verify auth types module exports compile correctly and provide accurate type checking (types already created in T004, verify integration)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - TypeScript compilation completes with zero type errors

---

## Phase 5: User Story 3 - Application Validates Environment Configuration (Priority: P3)

**Goal**: Validate required environment variables at startup with clear error messages for configuration issues.

**Independent Test**: Can be fully tested by starting the application with missing or invalid environment variables and verifying appropriate error messages are displayed.

### Tests for User Story 3 ⚠️

- [x] T011 [P] [US3] Create unit tests for environment validation in `tests/unit/lib/env.test.ts` - test `validateEnv()` and `getEnv()` functions with valid, missing, and empty string scenarios

### Implementation for User Story 3

- [x] T012 [US3] Enhance `getRequiredEnv()` function in `src/lib/env.ts` to validate empty strings by adding `|| value.trim() === ''` check (treat empty as missing per research.md line 109)

**Checkpoint**: At this point, all user stories should be independently functional - environment validation provides clear, actionable error messages

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and coverage validation

- [x] T013 Run full test suite with coverage to verify >65% coverage target for auth utilities: `pnpm test:coverage`
- [x] T014 Validate quickstart.md scenarios work as documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (auth types needed for testing)
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Types created in Phase 2, this story verifies integration
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1 and US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core implementation before integration verification
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003)
- All tests within a phase marked [P] can run in parallel (T005, T006, T007 in Phase 3)
- Different user stories could be worked on in parallel by different team members after Phase 2

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T005 [P] [US1]: "Create unit tests for browser client in tests/unit/lib/supabase/client.test.ts"
Task T006 [P] [US1]: "Create unit tests for server client in tests/unit/lib/supabase/server.test.ts"
Task T007 [P] [US1]: "Create unit tests for middleware helper in tests/unit/lib/supabase/middleware.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004)
3. Complete Phase 3: User Story 1 (T005-T008)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Middleware helper working (MVP!)
3. Add User Story 2 → Test independently → Type-safe auth objects
4. Add User Story 3 → Test independently → Environment validation enhanced
5. Each story adds value without breaking previous stories

---

## File Mapping

| File Path                                    | Task(s) | User Story   | Status             |
| -------------------------------------------- | ------- | ------------ | ------------------ |
| `src/types/auth.ts`                          | T004    | Foundational | NEW                |
| `src/lib/supabase/middleware.ts`             | T008    | US1          | NEW                |
| `src/lib/env.ts`                             | T012    | US3          | EXISTS (enhance)   |
| `src/lib/supabase/client.ts`                 | -       | -            | EXISTS (test only) |
| `src/lib/supabase/server.ts`                 | -       | -            | EXISTS (test only) |
| `tests/unit/lib/supabase/client.test.ts`     | T005    | US1          | NEW                |
| `tests/unit/lib/supabase/server.test.ts`     | T006    | US1          | NEW                |
| `tests/unit/lib/supabase/middleware.test.ts` | T007    | US1          | NEW                |
| `tests/unit/types/auth.test.ts`              | T009    | US2          | NEW                |
| `tests/unit/lib/env.test.ts`                 | T011    | US3          | NEW                |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing files (`client.ts`, `server.ts`, `env.ts`) should NOT be recreated - only tested or enhanced

---

## Summary

| Metric                     | Value                                  |
| -------------------------- | -------------------------------------- |
| **Total Tasks**            | 14                                     |
| **Phase 1 (Setup)**        | 3 tasks                                |
| **Phase 2 (Foundational)** | 1 task                                 |
| **Phase 3 (US1 - P1)**     | 4 tasks (3 tests + 1 implementation)   |
| **Phase 4 (US2 - P2)**     | 2 tasks (1 test + 1 verification)      |
| **Phase 5 (US3 - P3)**     | 2 tasks (1 test + 1 enhancement)       |
| **Phase 6 (Polish)**       | 2 tasks                                |
| **Parallel Opportunities** | 7 tasks marked [P]                     |
| **New Files**              | 6 (1 type, 1 middleware, 4 test files) |
| **Enhanced Files**         | 1 (`env.ts`)                           |
| **MVP Scope**              | Phase 1-3 (8 tasks)                    |
