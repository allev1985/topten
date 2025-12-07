# Tasks: Refactor Password Actions to Use Auth Service

**Feature Branch**: `001-refactor-auth-service`  
**Input**: Design documents from `/specs/001-refactor-auth-service/`  
**Prerequisites**: plan.md ✅, spec.md ✅, quickstart.md ✅

**Tests**: Test updates are included (updating existing tests to use new mocks)

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each password action.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare imports and dependencies for Auth Service refactoring

**⚠️ Note**: No new infrastructure needed - Auth Service already exists. This phase updates imports only.

- [ ] T001 Add Auth Service method imports to src/actions/auth-actions.ts (resetPassword, updatePassword, login, getSession)
- [ ] T002 Add Auth Service error helper imports to src/actions/auth-actions.ts (isExpiredTokenError, isSessionError, AuthServiceError)
- [ ] T003 Add Auth Service mock imports to tests/unit/actions/auth-actions.test.ts for new methods

**Checkpoint**: TypeScript should recognize new imports without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update test infrastructure to support Auth Service mocking

**⚠️ CRITICAL**: Test mocks must be ready before refactoring actions

- [ ] T004 Create mock references for resetPassword in tests/unit/actions/auth-actions.test.ts
- [ ] T005 [P] Create mock references for updatePassword in tests/unit/actions/auth-actions.test.ts
- [ ] T006 [P] Create mock references for login in tests/unit/actions/auth-actions.test.ts
- [ ] T007 [P] Create mock references for getSession in tests/unit/actions/auth-actions.test.ts
- [ ] T008 Import AuthServiceError in tests/unit/actions/auth-actions.test.ts for error mocking

**Checkpoint**: Test file imports and mocks ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Password Reset Request (Priority: P1) 🎯 MVP

**Goal**: Refactor passwordResetRequestAction to use Auth Service resetPassword() method instead of HTTP fetch, maintaining enumeration protection

**Independent Test**: Submit password reset request form and verify success is always returned regardless of email existence, with Auth Service method being called

### Implementation for User Story 1

- [ ] T009 [US1] Replace fetch call with resetPassword() call in passwordResetRequestAction in src/actions/auth-actions.ts
- [ ] T010 [US1] Update error handling to catch Auth Service errors and maintain enumeration protection in src/actions/auth-actions.ts
- [ ] T011 [US1] Remove HTTP-related boilerplate (getAppUrl, fetch, response parsing) from passwordResetRequestAction in src/actions/auth-actions.ts
- [ ] T012 [US1] Preserve existing Zod validation logic in passwordResetRequestAction in src/actions/auth-actions.ts
- [ ] T013 [US1] Verify TypeScript compilation passes for passwordResetRequestAction refactoring

### Tests for User Story 1

- [ ] T014 [P] [US1] Update test "returns success message regardless of email existence" to mock resetPassword in tests/unit/actions/auth-actions.test.ts
- [ ] T015 [P] [US1] Update test "returns same success message even if email does not exist" to mock resetPassword error in tests/unit/actions/auth-actions.test.ts
- [ ] T016 [P] [US1] Update test "returns validation errors for invalid email" to verify no service call made in tests/unit/actions/auth-actions.test.ts
- [ ] T017 [US1] Verify all passwordResetRequestAction tests pass

**Checkpoint**: User Story 1 complete - passwordResetRequestAction uses Auth Service, all tests pass, enumeration protection maintained

---

## Phase 4: User Story 2 - Password Update via Reset Link (Priority: P1)

**Goal**: Refactor passwordUpdateAction to use Auth Service updatePassword() method instead of HTTP fetch, supporting both token-based and session-based password updates

**Independent Test**: Submit password update form with token parameters and verify password is updated via Auth Service, user is signed out, and redirected to login

### Implementation for User Story 2

- [ ] T018 [US2] Replace fetch call with updatePassword() call in passwordUpdateAction in src/actions/auth-actions.ts
- [ ] T019 [US2] Add support for optional token_hash and type parameters in updatePassword() call in src/actions/auth-actions.ts
- [ ] T020 [US2] Update error handling to use AuthServiceError and isExpiredTokenError() helper in src/actions/auth-actions.ts
- [ ] T021 [US2] Add redirect error handling to re-throw Next.js redirect in src/actions/auth-actions.ts
- [ ] T022 [US2] Remove HTTP-related boilerplate (getCookieHeader, getAppUrl, fetch, response parsing) from passwordUpdateAction in src/actions/auth-actions.ts
- [ ] T023 [US2] Preserve existing validation logic (password match, Zod validation) in passwordUpdateAction in src/actions/auth-actions.ts
- [ ] T024 [US2] Preserve redirect to /login on success in passwordUpdateAction in src/actions/auth-actions.ts
- [ ] T025 [US2] Verify TypeScript compilation passes for passwordUpdateAction refactoring

### Tests for User Story 2

- [ ] T026 [P] [US2] Update test "returns error when session has expired" to mock AuthServiceError with expired token in tests/unit/actions/auth-actions.test.ts
- [ ] T027 [P] [US2] Update test "redirects to login on successful password update" to mock updatePassword success in tests/unit/actions/auth-actions.test.ts
- [ ] T028 [P] [US2] Update test "returns error when update fails" to mock AuthServiceError in tests/unit/actions/auth-actions.test.ts
- [ ] T029 [P] [US2] Update test "returns validation errors for invalid password" to verify no service call made in tests/unit/actions/auth-actions.test.ts
- [ ] T030 [P] [US2] Update test "returns error when passwords do not match" to verify no service call made in tests/unit/actions/auth-actions.test.ts
- [ ] T031 [US2] Verify all passwordUpdateAction tests pass

**Checkpoint**: User Story 2 complete - passwordUpdateAction uses Auth Service, all tests pass, supports both token and session flows

---

## Phase 5: User Story 3 - Password Change for Authenticated Users (Priority: P2)

**Goal**: Refactor passwordChangeAction to use Auth Service methods (getSession, login, updatePassword) instead of three separate HTTP fetch calls

**Independent Test**: As authenticated user, submit password change form with current and new passwords, verify current password is verified and new password is set via Auth Service

### Implementation for User Story 3

- [ ] T032 [US3] Replace session fetch with getSession() call in passwordChangeAction in src/actions/auth-actions.ts
- [ ] T033 [US3] Add authentication check using session.authenticated and session.user.email in src/actions/auth-actions.ts
- [ ] T034 [US3] Replace login verify fetch with login() call for current password verification in src/actions/auth-actions.ts
- [ ] T035 [US3] Add error handling for incorrect current password using AuthServiceError in src/actions/auth-actions.ts
- [ ] T036 [US3] Replace password update fetch with updatePassword() call in passwordChangeAction in src/actions/auth-actions.ts
- [ ] T037 [US3] Remove all HTTP-related boilerplate (getCookieHeader, getAppUrl, three fetch calls, response parsing) from passwordChangeAction in src/actions/auth-actions.ts
- [ ] T038 [US3] Preserve existing validation logic (current password required, password match, Zod validation) in passwordChangeAction in src/actions/auth-actions.ts
- [ ] T039 [US3] Preserve success message without redirect in passwordChangeAction in src/actions/auth-actions.ts
- [ ] T040 [US3] Verify TypeScript compilation passes for passwordChangeAction refactoring

### Tests for User Story 3

- [ ] T041 [P] [US3] Update test "returns error when not authenticated" to mock getSession unauthenticated state in tests/unit/actions/auth-actions.test.ts
- [ ] T042 [P] [US3] Update test "returns error when current password is incorrect" to mock login AuthServiceError in tests/unit/actions/auth-actions.test.ts
- [ ] T043 [P] [US3] Update test "updates password successfully" to mock getSession, login, and updatePassword success in tests/unit/actions/auth-actions.test.ts
- [ ] T044 [P] [US3] Update test "returns validation error when current password not provided" to verify no service call made in tests/unit/actions/auth-actions.test.ts
- [ ] T045 [P] [US3] Update test "returns error when passwords do not match" to verify no service call made in tests/unit/actions/auth-actions.test.ts
- [ ] T046 [P] [US3] Update test "returns validation errors for invalid password" to verify no service call made in tests/unit/actions/auth-actions.test.ts
- [ ] T047 [US3] Verify all passwordChangeAction tests pass

**Checkpoint**: All user stories complete - all three password actions use Auth Service, all tests pass

---

## Phase 6: Cleanup & Polish

**Purpose**: Remove unused code and verify final state

- [ ] T048 Remove getCookieHeader helper function from src/actions/auth-actions.ts (lines 19-28)
- [ ] T049 Check if getAppUrl is still used in src/actions/auth-actions.ts and remove import if unused
- [ ] T050 Verify code reduction achieved (expect ~240 lines → ~90 lines, ~62% reduction)
- [ ] T051 Run full test suite to ensure no regressions
- [ ] T052 Run TypeScript compilation to verify zero errors
- [ ] T053 Run ESLint to verify zero errors
- [ ] T054 Verify all HTTP fetch calls removed from three password actions (grep verification)
- [ ] T055 Verify all success criteria from spec.md are met
- [ ] T056 Run quickstart.md validation steps to ensure refactoring is complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Phase 2
  - User Story 2 (P1): Can start after Phase 2 (parallel with US1)
  - User Story 3 (P2): Can start after Phase 2 (parallel with US1 & US2)
- **Cleanup (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1 (different action function)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 & US2 (different action function)

**⚠️ NOTE**: All three user stories modify the same file (src/actions/auth-actions.ts) but different functions, so they can be done in parallel by the same developer or sequentially. Tests can run in parallel since they test different functions.

### Within Each User Story

- Implementation before tests (to avoid test failures during refactoring)
- Core refactoring before validation
- Tests can run in parallel (marked with [P])
- Verify step runs after all tests for that story

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can run sequentially (same file, adding imports)
- **Phase 2**: T005, T006, T007 can run in parallel (different mock variables)
- **Between User Stories**: US1, US2, US3 can be worked on in sequence or parallel (different functions in same file)
- **Within User Stories**: Test tasks marked [P] can run in parallel
- **Cross-Story Tests**: After all implementations complete, all test suites can run in parallel

---

## Parallel Example: User Story 1

```bash
# After T009-T013 implementation complete, run all US1 tests together:
Task: T014 [P] [US1] Update test "returns success message regardless of email existence"
Task: T015 [P] [US1] Update test "returns same success message even if email does not exist"
Task: T016 [P] [US1] Update test "returns validation errors for invalid email"

# Then verify:
Task: T017 [US1] Verify all passwordResetRequestAction tests pass
```

---

## Parallel Example: User Story 2

```bash
# After T018-T025 implementation complete, run all US2 tests together:
Task: T026 [P] [US2] Update test "returns error when session has expired"
Task: T027 [P] [US2] Update test "redirects to login on successful password update"
Task: T028 [P] [US2] Update test "returns error when update fails"
Task: T029 [P] [US2] Update test "returns validation errors for invalid password"
Task: T030 [P] [US2] Update test "returns error when passwords do not match"

# Then verify:
Task: T031 [US2] Verify all passwordUpdateAction tests pass
```

---

## Parallel Example: User Story 3

```bash
# After T032-T040 implementation complete, run all US3 tests together:
Task: T041 [P] [US3] Update test "returns error when not authenticated"
Task: T042 [P] [US3] Update test "returns error when current password is incorrect"
Task: T043 [P] [US3] Update test "updates password successfully"
Task: T044 [P] [US3] Update test "returns validation error when current password not provided"
Task: T045 [P] [US3] Update test "returns error when passwords do not match"
Task: T046 [P] [US3] Update test "returns validation errors for invalid password"

# Then verify:
Task: T047 [US3] Verify all passwordChangeAction tests pass
```

---

## Implementation Strategy

### MVP First (Minimum Viable Refactoring)

1. Complete Phase 1: Setup (imports)
2. Complete Phase 2: Foundational (test mocks)
3. Complete Phase 3: User Story 1 (passwordResetRequestAction)
4. **STOP and VALIDATE**: Verify US1 tests pass, TypeScript compiles, action works
5. If successful, this proves the Auth Service refactoring pattern works

### Incremental Delivery

1. Complete Setup + Foundational → Test infrastructure ready
2. Add User Story 1 → Test independently → Validate (MVP!)
3. Add User Story 2 → Test independently → Validate
4. Add User Story 3 → Test independently → Validate
5. Cleanup phase → Final validation

### Sequential Strategy (Recommended)

Since all three user stories modify the same file (src/actions/auth-actions.ts), sequential implementation is recommended:

1. Complete Phases 1 & 2 (Setup + Foundational)
2. Complete Phase 3 (US1) → Verify tests pass
3. Complete Phase 4 (US2) → Verify tests pass
4. Complete Phase 5 (US3) → Verify tests pass
5. Complete Phase 6 (Cleanup) → Final verification

### Alternative: Parallel Testing Strategy

If implementation is done sequentially, tests can still run in parallel after all implementations are complete:

1. Complete all implementations (T009-T040)
2. Launch all test updates in parallel (T014-T046)
3. Verify all pass together (T017, T031, T047)

---

## Success Criteria Checklist

From spec.md Success Criteria:

- [ ] **SC-001**: Zero HTTP fetch calls remain in passwordResetRequestAction, passwordUpdateAction, and passwordChangeAction
- [ ] **SC-002**: All three password actions use Auth Service methods (verified by code review and test assertions)
- [ ] **SC-003**: Zero getCookieHeader() calls remain (helper removed)
- [ ] **SC-004**: All user-facing behavior preserved (verified via tests)
- [ ] **SC-005**: TypeScript compilation passes with zero errors
- [ ] **SC-006**: ESLint passes with zero errors
- [ ] **SC-007**: 100% of existing tests pass after updates
- [ ] **SC-008**: Code reduction achieved (~240 lines → ~90 lines, ~62% reduction)
- [ ] **SC-009**: Tests verify Auth Service methods called with correct parameters
- [ ] **SC-010**: Error handling uses Auth Service error helpers correctly (isExpiredTokenError, isSessionError, AuthServiceError)

---

## Notes

- [P] tasks = Can run in parallel (different test cases, different mock variables)
- [Story] label maps task to specific user story (US1, US2, US3)
- Each user story modifies a different function, enabling independent testing
- All three user stories modify the same file, so sequential implementation recommended
- Tests can be updated in parallel after implementation
- Verify tests fail appropriately during refactoring, then pass after completion
- Commit after each user story phase completion
- Follow quickstart.md for detailed implementation guidance
- Refer to plan.md for technical context and examples
