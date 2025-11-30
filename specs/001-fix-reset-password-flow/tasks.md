# Tasks: Fix Reset Password Flow

**Input**: Design documents from `/specs/001-fix-reset-password-flow/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/reset-password.yaml ✅

**Tests**: Tests are included as the feature specification mentions test coverage requirements in the Constitution Check and the plan explicitly lists test files.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (Next.js App Router)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new setup required - this feature modifies existing files using established patterns.

- [X] T001 Review existing code exchange pattern in src/app/api/auth/verify/route.ts for reference implementation
- [X] T002 Review existing password-reset-form.tsx component in src/app/(auth)/reset-password/password-reset-form.tsx

**Checkpoint**: Reference patterns understood - ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Define PageState type and ErrorState component in src/app/(auth)/reset-password/page.tsx (type: "form" | "error"; errorType: "expired" | "invalid" | "access_denied")

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Password Reset via Email Link (Priority: P1) 🎯 MVP

**Goal**: Users clicking valid reset links from email can exchange the code for a session and reset their password.

**Independent Test**: Request password reset email → click link with code → verify form displays → submit new password → verify redirect to login.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T004 [P] [US1] Create integration test file tests/integration/auth/reset-password-flow.test.ts with test scaffolding
- [X] T005 [P] [US1] Add test: "exchanges valid code for session and renders form" in tests/integration/auth/reset-password-flow.test.ts
- [X] T006 [P] [US1] Add test: "renders expired error when code is expired" in tests/integration/auth/reset-password-flow.test.ts
- [X] T007 [P] [US1] Add test: "renders invalid error when code exchange fails" in tests/integration/auth/reset-password-flow.test.ts

### Implementation for User Story 1

- [X] T008 [US1] Add import for createClient from @/lib/supabase/server in src/app/(auth)/reset-password/page.tsx
- [X] T009 [US1] Implement code exchange logic when code parameter is present in src/app/(auth)/reset-password/page.tsx
- [X] T010 [US1] Add error detection logic for expired vs invalid codes in src/app/(auth)/reset-password/page.tsx
- [X] T011 [US1] Add console.info logging for code exchange attempts following "[ResetPassword]" pattern in src/app/(auth)/reset-password/page.tsx
- [X] T012 [US1] Render PasswordResetForm when code exchange is successful in src/app/(auth)/reset-password/page.tsx
- [X] T013 [US1] Render ErrorState with errorType "expired" when code is expired in src/app/(auth)/reset-password/page.tsx
- [X] T014 [US1] Render ErrorState with errorType "invalid" when code is invalid in src/app/(auth)/reset-password/page.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can click reset links from email, exchange code for session, and reset password.

---

## Phase 4: User Story 2 - Authenticated User Password Change (Priority: P2)

**Goal**: Logged-in users can visit /reset-password without a code and change their password using their existing session.

**Independent Test**: Log in → navigate to /reset-password (no code) → verify form displays → submit new password.

### Tests for User Story 2

- [X] T015 [P] [US2] Add test: "renders form when user has existing session (no code)" in tests/integration/auth/reset-password-flow.test.ts

### Implementation for User Story 2

- [X] T016 [US2] Add session check using supabase.auth.getUser() when no code parameter is present in src/app/(auth)/reset-password/page.tsx
- [X] T017 [US2] Add console.info logging for authenticated user access in src/app/(auth)/reset-password/page.tsx
- [X] T018 [US2] Render PasswordResetForm when user has existing session in src/app/(auth)/reset-password/page.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Both email link users and authenticated users can reset their passwords.

---

## Phase 5: User Story 3 - Unauthorized Access Prevention (Priority: P3)

**Goal**: Unauthenticated users without a valid reset code are blocked from accessing the password reset functionality with clear error messaging.

**Independent Test**: While logged out, navigate directly to /reset-password (no code) → verify access denied message with link to /forgot-password.

### Tests for User Story 3

- [X] T019 [P] [US3] Add test: "renders access denied when no code and no session" in tests/integration/auth/reset-password-flow.test.ts

### Implementation for User Story 3

- [X] T020 [US3] Add console.info logging for access denied scenarios in src/app/(auth)/reset-password/page.tsx
- [X] T021 [US3] Render ErrorState with errorType "access_denied" when neither code nor session exists in src/app/(auth)/reset-password/page.tsx

**Checkpoint**: All user stories should now be independently functional. The reset password page correctly handles all three scenarios.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T022 [P] Add component tests for ErrorState rendering in tests/component/auth/reset-password-page.test.tsx
- [X] T023 Verify all existing tests pass by running pnpm test
- [ ] T024 Run manual testing following quickstart.md validation scenarios
- [X] T025 [P] Update any relevant documentation if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US2 and US3 share the session check logic established in US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after User Story 1 - Shares page component
- **User Story 3 (P3)**: Can start after User Story 2 - Shares session check logic from US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation tasks are sequential within the page.tsx file
- Story complete before moving to next priority

### Parallel Opportunities

- All test tasks marked [P] can run in parallel (different test files)
- T004-T007 (US1 tests) can run in parallel
- T015 (US2 test) and T019 (US3 test) can run in parallel
- T022 (component tests) can run in parallel with T025 (documentation)

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task: T004 "Create integration test file tests/integration/auth/reset-password-flow.test.ts with test scaffolding"
Task: T005 "Add test: exchanges valid code for session and renders form"
Task: T006 "Add test: renders expired error when code is expired"
Task: T007 "Add test: renders invalid error when code exchange fails"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (review reference patterns)
2. Complete Phase 2: Foundational (PageState type, ErrorState component)
3. Complete Phase 3: User Story 1 (code exchange logic)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - users can reset passwords via email link

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Single Developer Strategy

Since this is a single-file modification, tasks should be executed sequentially:

1. Complete all tests for current story phase
2. Implement changes to page.tsx
3. Verify tests pass
4. Move to next story

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 25 |
| Phase 1 (Setup) | 2 |
| Phase 2 (Foundational) | 1 |
| Phase 3 (US1 - MVP) | 11 |
| Phase 4 (US2) | 4 |
| Phase 5 (US3) | 3 |
| Phase 6 (Polish) | 4 |
| Parallelizable Tasks | 10 |

### Task Distribution by User Story

- **User Story 1 (P1)**: 11 tasks (4 tests + 7 implementation) - Core email link flow
- **User Story 2 (P2)**: 4 tasks (1 test + 3 implementation) - Authenticated user flow
- **User Story 3 (P3)**: 3 tasks (1 test + 2 implementation) - Access denied flow

### MVP Scope

Completing through Phase 3 (User Story 1) delivers the core value: **Users can reset their password via email link**.

### Files Modified

| File | Changes |
|------|---------|
| src/app/(auth)/reset-password/page.tsx | Major: Add code exchange, session check, error states |
| src/app/(auth)/reset-password/password-reset-form.tsx | None (unchanged) |
| src/actions/auth-actions.ts | None (unchanged) |
| tests/integration/auth/reset-password-flow.test.ts | New: Integration tests for all scenarios |
| tests/component/auth/reset-password-page.test.tsx | New: Component tests for error states |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow existing code exchange pattern from /api/auth/verify/route.ts
- Use console.info with "[ResetPassword]" prefix for logging consistency
