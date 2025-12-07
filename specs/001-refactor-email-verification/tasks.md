# Tasks: Refactor Email Verification to Use Auth Service

**Input**: Design documents from `/specs/001-refactor-email-verification/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are REQUIRED for this feature - comprehensive test coverage exists and must be maintained.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js web application with the following structure:
- Application code: `src/` at repository root
- Tests: `tests/` at repository root
- Specs: `specs/001-refactor-email-verification/`

---

## Phase 1: Setup (Type Definitions & Contracts)

**Purpose**: Define TypeScript types and contracts for the new service function

- [ ] T001 [P] Add VerifyEmailResult interface to src/lib/auth/service/types.ts
- [ ] T002 [P] Add VerifyEmailFunction type to src/lib/auth/service/types.ts
- [ ] T003 [P] Export new types from src/lib/auth/service/types.ts

**Checkpoint**: Type definitions ready - service implementation can now begin

---

## Phase 2: Foundational (Auth Service Implementation)

**Purpose**: Core service function that MUST be complete before route refactoring

**⚠️ CRITICAL**: No route work can begin until this phase is complete

- [ ] T004 Implement verifyEmail() function in src/lib/auth/service.ts
- [ ] T005 Add error handling with isExpiredTokenError() in verifyEmail()
- [ ] T006 Add logging with [AuthService:verifyEmail] prefix in verifyEmail()
- [ ] T007 Export verifyEmail from src/lib/auth/service.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Email Verification via OTP Token (Priority: P1) 🎯 MVP

**Goal**: New users can verify their email by clicking a verification link, which automatically logs them in and redirects to the dashboard

**Independent Test**: Create test user account, retrieve verification link with token_hash and type=email parameters, make GET request to /api/auth/verify endpoint, verify successful redirect to /dashboard with active session

### Tests for User Story 1 ⚠️

> **NOTE: Update existing tests to work with new Auth Service abstraction**

- [ ] T008 [P] [US1] Add unit tests for verifyEmail() success case in tests/unit/lib/auth/service.test.ts
- [ ] T009 [P] [US1] Add unit tests for verifyEmail() with valid token that returns user and session in tests/unit/lib/auth/service.test.ts
- [ ] T010 [P] [US1] Add unit test verifying verifyEmail() calls Supabase verifyOtp() with correct parameters in tests/unit/lib/auth/service.test.ts
- [ ] T011 [US1] Update integration test mocks to use Auth Service in tests/integration/auth/verify.test.ts
- [ ] T012 [US1] Update test "redirects to dashboard on successful OTP verification" to mock verifyEmail() in tests/integration/auth/verify.test.ts
- [ ] T013 [US1] Update test "sets session cookies correctly" to mock verifyEmail() in tests/integration/auth/verify.test.ts
- [ ] T014 [US1] Update test "handles already verified email (idempotent)" to mock verifyEmail() in tests/integration/auth/verify.test.ts

### Implementation for User Story 1

- [ ] T015 [US1] Update verify route to import verifyEmail from Auth Service in src/app/api/auth/verify/route.ts
- [ ] T016 [US1] Replace direct verifyOtp() call with verifyEmail() call in OTP flow in src/app/api/auth/verify/route.ts
- [ ] T017 [US1] Update success redirect logic to use result from verifyEmail() in src/app/api/auth/verify/route.ts
- [ ] T018 [US1] Remove unused createClient import for OTP flow (if no longer needed) in src/app/api/auth/verify/route.ts
- [ ] T019 [US1] Run updated integration tests to verify successful OTP verification flow

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - valid tokens verify successfully and redirect to dashboard

---

## Phase 4: User Story 2 - Handling Invalid or Expired Tokens (Priority: P2)

**Goal**: Users attempting verification with invalid or expired tokens receive clear error messages and are redirected to appropriate error pages

**Independent Test**: Make GET requests to /api/auth/verify with invalid tokens, expired tokens, and missing parameters, verify redirects to /auth/error with correct error parameters (expired_token, invalid_token, missing_token)

### Tests for User Story 2 ⚠️

> **NOTE: Update existing error handling tests to work with Auth Service abstraction**

- [ ] T020 [P] [US2] Add unit test for verifyEmail() with expired token in tests/unit/lib/auth/service.test.ts
- [ ] T021 [P] [US2] Add unit test for verifyEmail() with invalid token in tests/unit/lib/auth/service.test.ts
- [ ] T022 [P] [US2] Add unit test verifying verifyEmail() throws AuthServiceError on Supabase errors in tests/unit/lib/auth/service.test.ts
- [ ] T023 [US2] Update integration test "redirects to error page on expired token" to mock verifyEmail() in tests/integration/auth/verify.test.ts
- [ ] T024 [US2] Update integration test "redirects to error page on invalid token" to mock verifyEmail() in tests/integration/auth/verify.test.ts
- [ ] T025 [US2] Update integration test "redirects to error page on missing token" in tests/integration/auth/verify.test.ts

### Implementation for User Story 2

- [ ] T026 [US2] Update error handling to catch AuthServiceError in src/app/api/auth/verify/route.ts
- [ ] T027 [US2] Map AuthServiceError with "expired" message to expired_token error parameter in src/app/api/auth/verify/route.ts
- [ ] T028 [US2] Map AuthServiceError with other messages to invalid_token error parameter in src/app/api/auth/verify/route.ts
- [ ] T029 [US2] Ensure missing_token error handling remains unchanged in src/app/api/auth/verify/route.ts
- [ ] T030 [US2] Ensure server_error fallback for unexpected errors in src/app/api/auth/verify/route.ts
- [ ] T031 [US2] Run updated integration tests to verify all error scenarios

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - all error cases properly handled

---

## Phase 5: User Story 3 - PKCE-Based Verification (Priority: P3)

**Goal**: OAuth and PKCE-based authentication flows continue to work without regression

**Independent Test**: Initiate PKCE flow, obtain valid code parameter, make GET request to /api/auth/verify with code parameter, verify successful session creation and redirect to dashboard

### Tests for User Story 3 ⚠️

> **NOTE: Verify PKCE tests still pass - no changes should be needed**

- [ ] T032 [P] [US3] Verify integration test "handles PKCE code exchange" still passes in tests/integration/auth/verify.test.ts
- [ ] T033 [P] [US3] Verify integration test "redirects to error on invalid PKCE code" still passes in tests/integration/auth/verify.test.ts

### Implementation for User Story 3

- [ ] T034 [US3] Verify PKCE code exchange logic remains unchanged in src/app/api/auth/verify/route.ts
- [ ] T035 [US3] Verify PKCE flow does NOT use Auth Service (out of scope) in src/app/api/auth/verify/route.ts
- [ ] T036 [US3] Run PKCE-related integration tests to confirm no regression

**Checkpoint**: All user stories should now be independently functional - OTP and PKCE flows both work

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and documentation

- [ ] T037 [P] Run full test suite (unit + integration) and verify 100% pass rate
- [ ] T038 [P] Run TypeScript compiler (tsc --noEmit) and verify zero errors
- [ ] T039 [P] Run ESLint and verify zero errors
- [ ] T040 Review code changes for any unused imports or dead code in src/app/api/auth/verify/route.ts
- [ ] T041 Verify verifyEmail() function follows Auth Service patterns (logging, error handling) in src/lib/auth/service.ts
- [ ] T042 Verify all acceptance scenarios from spec.md are covered by tests
- [ ] T043 [P] Update quickstart.md if any implementation details differ from initial design
- [ ] T044 Perform manual testing with quickstart.md validation scenarios
- [ ] T045 Final code review checklist per constitution gates (DRY, testing, UX consistency)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational (Phase 2) completion
  - User stories can proceed sequentially in priority order (P1 → P2 → P3)
  - OR can be worked in parallel if tests are properly isolated
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on Foundational (Phase 2) - Builds on US1 error handling
- **User Story 3 (P3)**: Depends on Foundational (Phase 2) - Independent of US1/US2 (just verification that PKCE flow unaffected)

### Within Each User Story

- Tests should be updated FIRST to fail with new service abstraction
- Service implementation (Phase 2) before route refactoring (Phase 3)
- Route changes after tests are updated to use new mocks
- Integration tests run after each implementation change
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1 (Setup)**: All type definition tasks (T001-T003) can run in parallel
- **Phase 3 (US1 Tests)**: Unit tests (T008-T010) can run in parallel
- **Phase 4 (US2 Tests)**: Unit tests (T020-T022) can run in parallel
- **Phase 5 (US3 Tests)**: Integration test verifications (T032-T033) can run in parallel
- **Phase 6 (Polish)**: Test suite run, TypeScript check, ESLint (T037-T039) can run in parallel
- **Limited parallelization**: Most tasks edit the same files (service.ts, route.ts) so must be sequential

---

## Parallel Example: User Story 1 Unit Tests

```bash
# Launch all unit tests for verifyEmail() function together:
Task T008: "Add unit tests for verifyEmail() success case in tests/unit/lib/auth/service.test.ts"
Task T009: "Add unit tests for verifyEmail() with valid token in tests/unit/lib/auth/service.test.ts"
Task T010: "Add unit test verifying verifyEmail() calls Supabase verifyOtp() in tests/unit/lib/auth/service.test.ts"

# These can be implemented in parallel as they test different aspects of the same function
```

---

## Parallel Example: User Story 2 Unit Tests

```bash
# Launch all error scenario tests together:
Task T020: "Add unit test for verifyEmail() with expired token in tests/unit/lib/auth/service.test.ts"
Task T021: "Add unit test for verifyEmail() with invalid token in tests/unit/lib/auth/service.test.ts"
Task T022: "Add unit test verifying verifyEmail() throws AuthServiceError in tests/unit/lib/auth/service.test.ts"

# These can be implemented in parallel as they test different error paths
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (type definitions)
2. Complete Phase 2: Foundational (verifyEmail() implementation) - CRITICAL
3. Complete Phase 3: User Story 1 (OTP verification)
4. **STOP and VALIDATE**: Test User Story 1 independently with manual and automated tests
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Service layer ready
2. Add User Story 1 → Test independently → Basic OTP verification working (MVP!)
3. Add User Story 2 → Test independently → Error handling complete
4. Add User Story 3 → Test independently → PKCE flow verified unaffected
5. Polish phase → Final validation and cleanup
6. Each story adds value without breaking previous stories

### Sequential Strategy (Recommended for this refactoring)

Given that most tasks modify the same 2-3 files, sequential execution is recommended:

1. **Phase 1**: Define types (can be parallel)
2. **Phase 2**: Implement service function (sequential - single file)
3. **Phase 3**: Update tests + refactor route for US1 (sequential - same files)
4. **Phase 4**: Update tests + error handling for US2 (sequential - same files)
5. **Phase 5**: Verify PKCE flow for US3 (quick validation)
6. **Phase 6**: Final polish (some tasks can be parallel)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete work
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable via acceptance scenarios
- Tests must be updated to mock at Auth Service boundary (not Supabase client)
- PKCE flow remains unchanged (out of scope) - only verify it still works
- Commit after each logical task group (e.g., after type definitions, after service implementation, after each user story)
- Stop at any checkpoint to validate story independently
- Zero regression requirement: all existing tests must pass with updated mocks
- Avoid: breaking PKCE flow, changing redirect behavior, modifying error messages

---

## Success Validation Checklist

After completing all phases, verify:

- ✅ All 6+ integration tests pass with updated Auth Service mocks
- ✅ All new unit tests for verifyEmail() pass
- ✅ TypeScript compilation succeeds with zero errors
- ✅ ESLint validation passes with zero errors
- ✅ PKCE flow still works (tests T032-T033 pass)
- ✅ OTP verification flow works (tests T012-T014 pass)
- ✅ Error handling works (tests T023-T025 pass)
- ✅ Manual testing per quickstart.md succeeds
- ✅ No performance degradation (response time <200ms p95)
- ✅ Session cookies set correctly after verification
- ✅ Redirect behavior unchanged for all scenarios
- ✅ Zero code duplication (auth logic centralized in service)
- ✅ Constitution gates passed (DRY, testing, UX consistency, performance, observability)

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (US1)**: 12 tasks (7 tests + 5 implementation)
- **Phase 4 (US2)**: 11 tasks (6 tests + 5 implementation)
- **Phase 5 (US3)**: 5 tasks (2 tests + 3 implementation)
- **Phase 6 (Polish)**: 9 tasks

**Total**: 44 tasks

**Parallel Opportunities**: 11 tasks marked [P] (25% of total)

**Independent Test Criteria**:
- US1: Valid token verification succeeds and redirects to dashboard with session
- US2: Invalid/expired tokens redirect to error pages with correct parameters
- US3: PKCE flow continues to work without regression

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 19 tasks
This delivers the core refactoring with OTP verification working via Auth Service.
