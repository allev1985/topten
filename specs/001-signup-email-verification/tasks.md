# Tasks: Signup & Email Verification Endpoints

**Input**: Design documents from `/specs/001-signup-email-verification/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Required - specification requires >65% unit test coverage (SC-007)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create foundational directory structure

- [x] T001 Install zod dependency using `pnpm add zod`
- [x] T002 [P] Create validation directory structure at `/src/lib/validation/`
- [x] T003 [P] Create auth library directory structure at `/src/lib/auth/`
- [x] T004 [P] Create API route directories at `/src/app/api/auth/signup/` and `/src/app/api/auth/verify/`
- [x] T005 [P] Create unit test directories at `/tests/unit/lib/validation/` and `/tests/unit/lib/auth/`
- [x] T006 [P] Create integration test directory at `/tests/integration/auth/`

**Checkpoint**: Directory structure ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation and error handling infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational Phase (Write FIRST, ensure FAIL before implementation) ⚠️

- [x] T007 [P] Write unit tests for validation schemas in `/tests/unit/lib/validation/auth.test.ts`
- [x] T008 [P] Write unit tests for AuthError class and factory functions in `/tests/unit/lib/auth/errors.test.ts`

### Implementation for Foundational Phase

- [x] T009 [P] Create input validation schemas (signupSchema, verifyTokenSchema, verifyCodeSchema) in `/src/lib/validation/auth.ts`
- [x] T010 [P] Create AuthError class and error factory functions (validationError, invalidTokenError, expiredTokenError, serverError) in `/src/lib/auth/errors.ts`
- [x] T011 Run unit tests to verify foundational modules pass - `pnpm test tests/unit/lib/validation/auth.test.ts tests/unit/lib/auth/errors.test.ts`

**Checkpoint**: Foundation ready - validation and error handling infrastructure complete and tested

---

## Phase 3: User Story 1 - New User Creates Account (Priority: P1) 🎯 MVP

**Goal**: Allow new users to create an account by submitting email and password, with validation and user enumeration protection

**Independent Test**: Submit a new email/password combination to POST `/api/auth/signup` and verify:

- Returns 201 with generic success message
- Verification email is dispatched (check Supabase logs)
- Invalid inputs return 400 with specific validation errors

### Tests for User Story 1 ⚠️

- [x] T012 [P] [US1] Write integration tests for signup endpoint (valid signup, invalid email, weak password, duplicate email returns same response) in `/tests/integration/auth/signup.test.ts`

### Implementation for User Story 1

- [x] T013 [US1] Create signup API route handler (POST) with input validation, Supabase auth integration, and user enumeration protection in `/src/app/api/auth/signup/route.ts`
- [x] T014 [US1] Add structured logging for signup attempts (success and failure) in `/src/app/api/auth/signup/route.ts`
- [x] T015 [US1] Run integration tests to verify signup endpoint - `pnpm test tests/integration/auth/signup.test.ts`

**Checkpoint**: User Story 1 complete - new users can sign up and receive verification emails

---

## Phase 4: User Story 2 - User Verifies Email Address (Priority: P1)

**Goal**: Allow users to verify their email via verification link, create session, and redirect to dashboard

**Independent Test**: Click a valid verification link (with token_hash or code) and verify:

- Redirects to `/dashboard` with session cookie set
- Invalid/expired tokens redirect to `/auth/error` with appropriate error parameter

### Tests for User Story 2 ⚠️

- [x] T016 [P] [US2] Write integration tests for verify endpoint (valid OTP token, valid PKCE code, expired token, invalid token, missing token) in `/tests/integration/auth/verify.test.ts`

### Implementation for User Story 2

- [x] T017 [US2] Create email verification API route handler (GET) with OTP and PKCE support in `/src/app/api/auth/verify/route.ts`
- [x] T018 [US2] Implement token validation using Supabase verifyOtp and exchangeCodeForSession in `/src/app/api/auth/verify/route.ts`
- [x] T019 [US2] Add structured logging for verification attempts in `/src/app/api/auth/verify/route.ts`
- [x] T020 [US2] Run integration tests to verify verification endpoint - `pnpm test tests/integration/auth/verify.test.ts`

**Checkpoint**: User Story 2 complete - users can verify email and get redirected to dashboard with session

---

## Phase 5: User Story 3 - Existing User Attempts Signup (Priority: P2)

**Goal**: Ensure existing users attempting to sign up receive identical response to new users (user enumeration protection)

**Independent Test**: Submit an already-registered email to signup and verify:

- Response is identical (201, same message) to new signup
- Backend sends "account already exists" notification (check Supabase email logs)

### Tests for User Story 3 ⚠️

- [x] T021 [P] [US3] Write integration test verifying identical response for existing vs new email in `/tests/integration/auth/signup.test.ts` (extend existing)

### Implementation for User Story 3

- [x] T022 [US3] Verify user enumeration protection is working (response timing and body identical) in `/src/app/api/auth/signup/route.ts`
- [x] T023 [US3] Run integration tests confirming enumeration protection - `pnpm test tests/integration/auth/signup.test.ts`

**Checkpoint**: User Story 3 complete - existing users receive identical response, preventing enumeration attacks

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, coverage check, and documentation

- [x] T024 Run full test suite and verify >65% coverage for validation and error modules - `pnpm test:coverage`
- [x] T025 [P] Verify all edge cases from spec.md are handled (empty inputs, malformed email, tampered tokens, etc.)
- [x] T026 [P] Run ESLint and Prettier on all new files - `pnpm lint && pnpm format`
- [x] T027 [P] Update quickstart.md verification checklist with implementation status
- [x] T028 Run code_review tool to validate implementation
- [x] T029 Run codeql_checker to scan for security vulnerabilities
- [ ] T030 Manual testing following quickstart.md Step 8 curl commands (requires running dev server)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (different endpoints)
  - US3 extends US1 testing, so depends on US1 completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```
Setup (Phase 1)
     │
     ▼
Foundational (Phase 2) - validation + error handling
     │
     ├──────────────────────┬────────────────────┐
     ▼                      ▼                    │
User Story 1 (P1)    User Story 2 (P1)          │
 (Signup)             (Verification)             │
     │                      │                    │
     │                      │                    │
     ▼                      ▼                    │
User Story 3 (P2) ◄─────────┘                   │
 (Enumeration Protection - extends US1)          │
     │                                           │
     ▼                                           │
Polish (Phase 6) ◄──────────────────────────────┘
```

- **User Story 1 (P1)**: Can start after Foundational - no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - no dependencies on US1 (different endpoint)
- **User Story 3 (P2)**: Depends on US1 being complete (extends signup tests)

### Within Each User Story

- Tests (T012, T016, T021) MUST be written and FAIL before implementation
- Implementation tasks (T013-T015, T017-T020, T022) follow tests
- Run tests to verify (T015, T020, T023) after implementation

### Parallel Opportunities

- Setup tasks T002, T003, T004, T005, T006 can all run in parallel
- Foundational tests T007, T008 can run in parallel
- Foundational implementations T009, T010 can run in parallel
- US1 test T012 and US2 test T016 can run in parallel (after Foundation complete)
- US1 implementation and US2 implementation can proceed in parallel
- Polish tasks T025, T026, T027 can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tests together:
Task T007: "Write unit tests for validation schemas in /tests/unit/lib/validation/auth.test.ts"
Task T008: "Write unit tests for AuthError class in /tests/unit/lib/auth/errors.test.ts"

# Launch all foundational implementations together (after tests):
Task T009: "Create validation schemas in /src/lib/validation/auth.ts"
Task T010: "Create AuthError class in /src/lib/auth/errors.ts"
```

## Parallel Example: User Stories

```bash
# After Foundational complete, launch US1 and US2 in parallel:

# Developer A: User Story 1
Task T012: "Write integration tests for signup endpoint"
Task T013: "Create signup API route handler"
Task T014: "Add structured logging for signup"
Task T015: "Run integration tests"

# Developer B: User Story 2
Task T016: "Write integration tests for verify endpoint"
Task T017: "Create email verification API route handler"
Task T018: "Implement token validation"
Task T019: "Add structured logging for verification"
Task T020: "Run integration tests"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T011)
3. Complete Phase 3: User Story 1 - Signup (T012-T015)
4. Complete Phase 4: User Story 2 - Verification (T016-T020)
5. **STOP and VALIDATE**: Test both endpoints independently
6. At this point, core auth flow is complete and deployable

### Full Delivery

1. Complete MVP (above)
2. Add Phase 5: User Story 3 - Enumeration Protection (T021-T023)
3. Complete Phase 6: Polish (T024-T030)
4. Security review and merge

### Estimated Timeline

| Phase        | Tasks        | Estimated Time |
| ------------ | ------------ | -------------- |
| Setup        | T001-T006    | 15 min         |
| Foundational | T007-T011    | 45 min         |
| User Story 1 | T012-T015    | 1.5 hrs        |
| User Story 2 | T016-T020    | 1.5 hrs        |
| User Story 3 | T021-T023    | 30 min         |
| Polish       | T024-T030    | 1 hr           |
| **Total**    | **30 tasks** | **~5.5 hrs**   |

---

## Files Created/Modified Summary

| File Path                                 | Purpose                              | Story        |
| ----------------------------------------- | ------------------------------------ | ------------ |
| `/src/lib/validation/auth.ts`             | Input validation schemas (~80 lines) | Foundational |
| `/src/lib/auth/errors.ts`                 | Custom error classes (~70 lines)     | Foundational |
| `/src/app/api/auth/signup/route.ts`       | Signup endpoint (~150 lines)         | US1, US3     |
| `/src/app/api/auth/verify/route.ts`       | Verification endpoint (~100 lines)   | US2          |
| `/tests/unit/lib/validation/auth.test.ts` | Validation unit tests                | Foundational |
| `/tests/unit/lib/auth/errors.test.ts`     | Error class unit tests               | Foundational |
| `/tests/integration/auth/signup.test.ts`  | Signup integration tests             | US1, US3     |
| `/tests/integration/auth/verify.test.ts`  | Verify integration tests             | US2          |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Password validation: 12+ chars, uppercase, lowercase, number, special char
- User enumeration protection: identical 201 response for new/existing emails
- Redirect on verification: success → `/dashboard`, error → `/auth/error?error={code}`
