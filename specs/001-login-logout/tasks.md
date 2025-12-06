# Tasks: Login & Logout Endpoints

**Input**: Design documents from `/specs/001-login-logout/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests ARE required per the prompt requirements (coverage must be > 65%)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add configuration constants and shared utilities needed by all user stories

- [x] T001 Add DEFAULT_REDIRECT constant to `/src/lib/config/index.ts`
- [x] T002 [P] Add authError factory function to `/src/lib/auth/errors.ts`
- [x] T003 [P] Add loginSchema and LoginInput type to `/src/schemas/auth.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create redirect validation module at `/src/lib/auth/redirect-validation.ts` with `isValidRedirect()` and `getValidatedRedirect()` functions per quickstart.md
- [x] T005 Create unit tests for redirect validation at `/tests/unit/lib/auth/redirect-validation.test.ts` covering: valid relative paths, protocol-relative URLs (//), javascript: scheme, data: scheme, external absolute URLs, URL-encoded attacks, double-encoded URLs, empty/null inputs

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Login with Redirect (Priority: P1) 🎯 MVP

**Goal**: Allow registered users to log in with email/password and receive validated redirect URL

**Independent Test**: Submit valid credentials via login endpoint, verify session is created and redirectTo is returned

### Tests for User Story 1

- [x] T006 [P] [US1] Create integration test file at `/tests/integration/auth/login.test.ts` with test scaffold and mock setup following signup.test.ts patterns
- [x] T007 [US1] Add login success tests: returns 200 with success=true and redirectTo, calls signInWithPassword with correct params, normalizes email to lowercase, trims whitespace from email
- [x] T008 [US1] Add redirectTo tests: returns /dashboard as default when not provided, accepts valid relative paths, validates and returns provided redirectTo

### Implementation for User Story 1

- [x] T009 [US1] Create login route handler at `/src/app/api/auth/login/route.ts` per quickstart.md Step 5
- [x] T010 [US1] Implement request validation using loginSchema with proper error response format
- [x] T011 [US1] Implement Supabase signInWithPassword call and success response with validated redirect
- [x] T012 [US1] Add logging for login attempts with masked email (using maskEmail utility)

**Checkpoint**: User Story 1 (Login with Redirect) should be fully functional and testable independently

---

## Phase 4: User Story 2 - User Logout (Priority: P1)

**Goal**: Allow logged-in users to securely end their session with cookie clearing

**Independent Test**: Call logout endpoint while authenticated, verify success response and cookies cleared

### Tests for User Story 2

- [x] T013 [P] [US2] Create integration test file at `/tests/integration/auth/logout.test.ts` with test scaffold and mock setup
- [x] T014 [US2] Add logout success tests: returns 200 with success=true and message, calls signOut, is idempotent (succeeds without active session)

### Implementation for User Story 2

- [x] T015 [US2] Create logout route handler at `/src/app/api/auth/logout/route.ts` per quickstart.md Step 6
- [x] T016 [US2] Implement session invalidation via Supabase signOut
- [x] T017 [US2] Add logging for logout events

**Checkpoint**: User Story 2 (Logout) should be fully functional and testable independently

---

## Phase 5: User Story 3 - Invalid Login Attempt (Priority: P1)

**Goal**: Handle failed login attempts with user enumeration protection (identical error messages for invalid email/wrong password)

**Independent Test**: Submit invalid credentials, verify generic error message that doesn't reveal whether email exists

### Tests for User Story 3

- [x] T018 [US3] Add validation error tests to login.test.ts: returns 400 for missing email, returns 400 for invalid email format, returns 400 for missing password, returns 400 for empty email, returns 400 for empty password
- [x] T019 [US3] Add auth failure tests to login.test.ts: returns 401 with AUTH_ERROR for wrong password, returns 401 with identical message for unknown email (user enumeration protection)
- [x] T020 [US3] Add unverified email test to login.test.ts: returns 401 with "Please verify your email before logging in" message when email not confirmed

### Implementation for User Story 3

- [x] T021 [US3] Add authentication error handling to login route: detect unverified email via error.code or error.message, return appropriate AUTH_ERROR
- [x] T022 [US3] Ensure user enumeration protection: identical error message "Invalid email or password" for wrong email and wrong password scenarios

**Checkpoint**: User Story 3 (Invalid Login) should be fully functional with proper security

---

## Phase 6: User Story 4 - Secure Redirect Validation (Priority: P2)

**Goal**: Prevent open redirect attacks by validating all redirect URLs

**Independent Test**: Provide various malicious redirect URLs to login endpoint, verify they are rejected and default to /dashboard

### Tests for User Story 4

- [x] T023 [US4] Add redirect validation integration tests to login.test.ts: rejects absolute external URLs (https://evil.com), rejects protocol-relative URLs (//evil.com), rejects javascript: URLs, rejects data: URLs, handles URL-encoded malicious URLs
- [x] T024 [US4] Add edge case tests to redirect-validation.test.ts: handles null byte injection, handles double-encoded URLs, handles unicode bypass attempts

### Implementation for User Story 4

- [x] T025 [US4] Verify redirect validation is properly integrated in login route handler (should already be done via getValidatedRedirect)
- [x] T026 [US4] Add additional redirect validation test cases if any edge cases identified

**Checkpoint**: User Story 4 (Secure Redirect) should provide complete protection against open redirect attacks

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, error handling improvements, and documentation

- [x] T027 Add server error tests to login.test.ts: returns 500 for Supabase connection error, returns 500 for unexpected exceptions
- [x] T028 Add server error test to logout.test.ts: returns 500 for Supabase connection error
- [x] T029 [P] Add logging tests: verify passwords are never logged, verify emails are masked in logs
- [x] T030 Run full test suite and verify coverage > 65% for login/logout functionality
- [x] T031 Run quickstart.md validation steps to ensure implementation matches specification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on T001 (DEFAULT_REDIRECT constant) - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Depends on User Story 1 login endpoint existing - Adds error handling
- **User Story 4 (P2)**: Depends on redirect-validation.ts from Phase 2 - Tests integration

### Within Each User Story

- Tests should be written first and FAIL before implementation
- Schema/utility changes before route handlers
- Route handlers before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 can run in parallel (different files)
- T006 and T013 can run in parallel (different test files)
- T027 and T029 can run in parallel (different concerns)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch setup tasks together:
Task T001: "Add DEFAULT_REDIRECT constant to /src/lib/config/index.ts"
# Then in parallel:
Task T002: "Add authError factory function to /src/lib/auth/errors.ts"
Task T003: "Add loginSchema and LoginInput type to /src/schemas/auth.ts"
```

## Parallel Example: Test File Creation

```bash
# Launch test file creation in parallel:
Task T006: "Create integration test file at /tests/integration/auth/login.test.ts"
Task T013: "Create integration test file at /tests/integration/auth/logout.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 - Login (T006-T012)
4. Complete Phase 4: User Story 2 - Logout (T013-T017)
5. **STOP and VALIDATE**: Test login and logout work independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP login works!
3. Add User Story 2 → Test independently → Full auth flow works!
4. Add User Story 3 → Test error handling → Security hardened!
5. Add User Story 4 → Test redirect security → Fully secure!
6. Polish phase → Full coverage → Production ready!

### Single Developer Strategy

Complete tasks in order: T001 → T002 → T003 → T004 → T005 → T006 → ... → T031

Execute sequentially, committing after each logical group (e.g., after completing each phase).

---

## Key Implementation Files

| File | Purpose | Estimated Lines |
|------|---------|-----------------|
| `/src/lib/config/index.ts` | Add DEFAULT_REDIRECT constant | +2 |
| `/src/lib/auth/errors.ts` | Add authError factory function | +10 |
| `/src/schemas/auth.ts` | Add loginSchema | +20 |
| `/src/lib/auth/redirect-validation.ts` | NEW: Redirect URL validation | ~90 |
| `/src/app/api/auth/login/route.ts` | NEW: Login endpoint | ~180 |
| `/src/app/api/auth/logout/route.ts` | NEW: Logout endpoint | ~80 |
| `/tests/unit/lib/auth/redirect-validation.test.ts` | NEW: Unit tests | ~150 |
| `/tests/integration/auth/login.test.ts` | NEW: Integration tests | ~250 |
| `/tests/integration/auth/logout.test.ts` | NEW: Integration tests | ~100 |

---

## Summary

- **Total Task Count**: 31 tasks
- **Task Count per User Story**:
  - Setup: 3 tasks (T001-T003)
  - Foundational: 2 tasks (T004-T005)
  - User Story 1 (Login with Redirect): 7 tasks (T006-T012)
  - User Story 2 (Logout): 5 tasks (T013-T017)
  - User Story 3 (Invalid Login): 5 tasks (T018-T022)
  - User Story 4 (Secure Redirect): 4 tasks (T023-T026)
  - Polish: 5 tasks (T027-T031)
- **Parallel Opportunities**: 8 tasks marked [P]
- **Independent Test Criteria**: Each user story has specific test criteria defined
- **Suggested MVP Scope**: User Stories 1 & 2 (Login and Logout) provide complete auth flow

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow existing patterns from signup.test.ts and verify.test.ts
