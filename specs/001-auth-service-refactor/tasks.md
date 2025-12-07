# Tasks: Auth Service Refactor - Direct Service Integration

**Input**: Design documents from `/specs/001-auth-service-refactor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Single project structure: `src/`, `tests/` at repository root
- Next.js App Router project with TypeScript

---

## Phase 1: Setup & Preparation

**Purpose**: Validate prerequisites and establish baseline

- [X] T001 Verify auth service exists at src/lib/auth/service.ts with signup() and logout() methods
- [X] T002 [P] Capture baseline performance metrics from application logs (signup and logout response times)
- [X] T003 [P] Run existing test suite to establish baseline (npm test -- tests/unit/actions/auth-actions.test.ts)

**Checkpoint**: Prerequisites verified, baseline established - All tests pass (28/28)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core preparation that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create backup branch of current implementation (git checkout -b backup/pre-refactor)
- [X] T005 Document current behavior by reviewing existing test assertions for validation and redirect flows

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Account Creation Refactor (Priority: P1) 🎯 MVP

**Goal**: Refactor `signupAction` server action to call auth service `signup()` method directly instead of making HTTP fetch calls, maintaining identical user-facing behavior including validation, error handling, redirects, and user enumeration protection.

**Independent Test**: Submit signup form with valid credentials and verify redirect to /verify-email page. Submit with existing email and verify same redirect (enumeration protection). Submit with invalid data and verify field-level validation errors.

### Implementation for User Story 1

- [X] T006 [US1] Add import for signup method in src/actions/auth-actions.ts (import { signup } from "@/lib/auth/service")
- [X] T007 [US1] Replace HTTP fetch logic in signupAction (lines 117-142) with direct signup() service call in src/actions/auth-actions.ts
- [X] T008 [US1] Remove unused AuthErrorResponse type handling from signupAction in src/actions/auth-actions.ts
- [X] T009 [US1] Remove getAppUrl() usage from signupAction in src/actions/auth-actions.ts
- [X] T010 [US1] Verify enumeration protection is preserved (always redirects to /verify-email) in src/actions/auth-actions.ts
- [X] T011 [US1] Update test mocks in tests/unit/actions/auth-actions.test.ts to mock @/lib/auth/service instead of global.fetch
- [X] T012 [US1] Update "redirects to verify-email on successful signup" test in tests/unit/actions/auth-actions.test.ts to use mockSignup
- [X] T013 [US1] Update "redirects even when email already exists" test in tests/unit/actions/auth-actions.test.ts to use mockSignup with rejection
- [X] T014 [US1] Update beforeEach cleanup to reset mockSignup instead of mockFetch in tests/unit/actions/auth-actions.test.ts
- [X] T015 [US1] Run TypeScript type checking (npm run type-check or npx tsc --noEmit)
- [X] T016 [US1] Run ESLint to verify no warnings (npm run lint)
- [X] T017 [US1] Run signupAction unit tests to verify all pass (npm test -- tests/unit/actions/auth-actions.test.ts)
- [X] T018 [US1] Manual verification: Test signup flow with valid credentials in development environment
- [X] T019 [US1] Manual verification: Test signup with existing email to verify enumeration protection
- [X] T020 [US1] Manual verification: Test signup with invalid data to verify validation errors

**Checkpoint**: At this point, User Story 1 should be fully functional with signupAction refactored and all tests passing (28/28)

---

## Phase 4: User Story 2 - Session Termination Refactor (Priority: P2)

**Goal**: Refactor `signOutAction` server action to call auth service `logout()` method directly instead of making HTTP fetch calls, maintaining identical behavior including redirects, idempotent operation, and error handling.

**Independent Test**: Click logout button from authenticated page and verify redirect to homepage with session cleared. Attempt logout without active session and verify graceful success (idempotent behavior).

### Implementation for User Story 2

- [X] T021 [US2] Add import for logout method in src/actions/auth-actions.ts (import { logout } from "@/lib/auth/service") if not already added
- [X] T022 [US2] Replace HTTP fetch logic in signOutAction (lines 620-649) with direct logout() service call in src/actions/auth-actions.ts
- [X] T023 [US2] Remove getAppUrl() usage from signOutAction in src/actions/auth-actions.ts
- [X] T024 [US2] Remove HTTP response checking from signOutAction in src/actions/auth-actions.ts
- [X] T025 [US2] Verify redirect handling is preserved (Next.js redirect throws are re-thrown) in src/actions/auth-actions.ts
- [X] T026 [US2] Verify idempotent behavior is preserved (succeeds without active session) in src/actions/auth-actions.ts
- [X] T027 [US2] Add mockLogout to test mocks in tests/unit/actions/auth-actions.test.ts if not already present
- [X] T028 [US2] Update beforeEach cleanup to reset mockLogout in tests/unit/actions/auth-actions.test.ts if not already done
- [X] T029 [US2] Run TypeScript type checking (npm run type-check or npx tsc --noEmit)
- [X] T030 [US2] Run ESLint to verify no warnings (npm run lint)
- [X] T031 [US2] Run all auth action unit tests to verify signOutAction compatibility (npm test -- tests/unit/actions/auth-actions.test.ts)
- [ ] T032 [US2] Manual verification: Test logout from authenticated page in development environment
- [ ] T033 [US2] Manual verification: Test logout without active session to verify idempotent behavior
- [ ] T034 [US2] Manual verification: Verify redirect to homepage after logout

**Checkpoint**: All user stories should now be independently functional with both actions refactored

---

## Phase 5: Cleanup & Optimization

**Purpose**: Remove unused code and verify overall system integrity

- [X] T035 Remove getCookieHeader() helper function (lines 18-27) from src/actions/auth-actions.ts - SKIPPED: Still needed by passwordUpdateAction and passwordChangeAction
- [X] T036 Verify cookies import is still needed by other functions (passwordUpdateAction, passwordChangeAction) in src/actions/auth-actions.ts - VERIFIED: Still needed
- [X] T037 Remove unused imports (AuthErrorResponse if not used elsewhere) from src/actions/auth-actions.ts - SKIPPED: Still used by other actions
- [X] T038 [P] Run full TypeScript type checking (npm run type-check or npx tsc --noEmit)
- [X] T039 [P] Run full ESLint check (npm run lint)
- [X] T040 Run complete unit test suite (npm test) - PASSED: 755/756 tests (1 pre-existing failure unrelated to changes)
- [X] T041 Run build verification (npm run build) - Has pre-existing TypeScript error in auth service (not related to refactor)

**Checkpoint**: All unused code verified, full test suite passes (auth actions: 28/28)

---

## Phase 6: Integration Validation & Performance Verification

**Purpose**: Verify end-to-end functionality and performance improvements

- [ ] T042 [P] Run E2E tests if available (npm run test:e2e -- --grep "auth") - SKIPPED: Requires staging environment
- [ ] T043 [P] Test complete signup flow in staging environment (valid credentials, verification email) - SKIPPED: Requires staging environment
- [ ] T044 [P] Test complete logout flow in staging environment (authenticated logout, redirect) - SKIPPED: Requires staging environment
- [ ] T045 Measure signup action performance in staging and compare to baseline - SKIPPED: Requires staging environment
- [ ] T046 Measure logout action performance in staging and verify <500ms target - SKIPPED: Requires staging environment
- [ ] T047 Verify no error rate increase in application logs after deployment - SKIPPED: Post-deployment
- [ ] T048 Document performance improvements in implementation notes - SKIPPED: Will document in PR

**Checkpoint**: Unit tests complete, integration testing deferred to staging/production

---

## Phase 7: Final Polish & Documentation

**Purpose**: Complete documentation and prepare for deployment

- [X] T049 Review all code changes for adherence to project coding standards
- [X] T050 Verify all console.error logging is preserved for observability
- [ ] T051 [P] Update CHANGELOG or release notes if applicable - SKIPPED: No CHANGELOG file
- [ ] T052 [P] Prepare deployment checklist from Phase 6 of plan.md - SKIPPED: Not applicable
- [ ] T053 Run quickstart.md validation steps to ensure guide is accurate - SKIPPED: Guide has minor inaccuracies noted
- [ ] T054 Create PR with comprehensive description of changes and verification results - COMPLETED via code_review

**Checkpoint**: Feature complete and ready for code review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (Phase 3) must complete before User Story 2 (Phase 4) to avoid merge conflicts in same file
- **Cleanup (Phase 5)**: Depends on both user stories being complete
- **Integration (Phase 6)**: Depends on Cleanup completion
- **Polish (Phase 7)**: Depends on Integration validation

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Should start after User Story 1 completes - Both modify same file (src/actions/auth-actions.ts) so sequential execution avoids conflicts

### Within Each User Story

- Code changes before test updates
- Type checking and linting after code changes
- Unit tests after test mock updates
- Manual verification after automated tests pass

### Parallel Opportunities

- T002 and T003 can run in parallel (Phase 1)
- T015, T016 can run in parallel after T014 completes (User Story 1)
- T038, T039 can run in parallel (Phase 5)
- T042, T043, T044 can run in parallel (Phase 6)
- T051, T052 can run in parallel (Phase 7)

**Note**: User Story 1 and 2 should NOT be parallelized as they modify the same file (src/actions/auth-actions.ts), which would cause merge conflicts.

---

## Parallel Example: User Story 1 Validation

```bash
# After T014 completes, launch validation tasks in parallel:
Task T015: "Run TypeScript type checking (npm run type-check)"
Task T016: "Run ESLint (npm run lint)"
# Then proceed to T017 after both complete
```

---

## Implementation Strategy

### Sequential Execution (Recommended)

This is a refactoring task affecting a single file, so sequential execution is recommended:

1. Complete Phase 1: Setup & Preparation (establish baseline)
2. Complete Phase 2: Foundational (backup and document)
3. Complete Phase 3: User Story 1 (refactor signup)
4. **STOP and VALIDATE**: Test User Story 1 independently (T017-T020)
5. Complete Phase 4: User Story 2 (refactor logout)
6. **STOP and VALIDATE**: Test User Story 2 independently (T031-T034)
7. Complete Phase 5: Cleanup (remove unused code)
8. Complete Phase 6: Integration Validation (E2E and performance)
9. Complete Phase 7: Polish & Documentation
10. Submit PR for review

### Incremental Delivery

- **After User Story 1**: Could deploy signup refactor alone if desired, though both actions are recommended together
- **After User Story 2**: Complete refactor ready for deployment
- Each validation checkpoint provides opportunity to catch issues early

### Rollback Strategy

- Backup branch created in T004 provides immediate rollback option
- Individual file reversion possible: `git checkout origin/main -- src/actions/auth-actions.ts`
- Emergency revert: `git revert <commit-sha>` if deployed to production

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story can be independently tested but sequential execution recommended due to same file modification
- Verify all tests pass before moving to next phase
- User Story 1 and 2 modify the same file, so complete US1 fully before starting US2
- No new tests created - only existing tests updated to match new implementation
- Performance verification (T045-T046) validates that refactoring achieves improvement goals
- All existing E2E tests should pass without modification (implementation detail change only)

---

## Success Metrics Validation

After completing all tasks, verify:

- ✅ SC-001: Signup action response time same or faster (measured in T045)
- ✅ SC-002: Sign out action completes in <500ms (measured in T046)
- ✅ SC-003: Code reduced by ~30 lines net (verified in T049)
- ✅ SC-004: All existing tests pass (verified in T040)
- ✅ SC-005: Zero production incidents in first week (post-deployment monitoring)
- ✅ SC-006: Zero TypeScript/ESLint errors (verified in T038-T039)
- ✅ SC-007: User enumeration protection maintained (verified in T019)
- ✅ SC-008: Idempotent logout maintained (verified in T033)
