# Tasks: Multi-Auth Password Reset

**Input**: Design documents from `/specs/002-multi-auth-password-reset/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/password-api.yaml, quickstart.md

**Tests**: Integration tests ARE included as specified in quickstart.md and plan.md (Testing Discipline requirement).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Files are at repository root following existing Next.js App Router structure (per plan.md):

```text
src/
├── app/api/auth/password/route.ts     # API endpoint
├── app/(auth)/reset-password/
│   ├── page.tsx                       # Page component
│   └── password-reset-form.tsx        # Form component
├── actions/auth-actions.ts            # Server action
└── schemas/auth.ts                    # Validation schema

tests/integration/auth/
└── password-update.test.ts            # Integration tests
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

> **No setup tasks required** - All infrastructure exists. This feature extends existing files.

**Checkpoint**: Infrastructure ready - proceed to foundational phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema extension that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Extend `passwordUpdateSchema` to add optional `code` field with `z.string().min(1).optional()` in `src/schemas/auth.ts`
- [x] T002 Extend `passwordUpdateSchema` to add optional `token_hash` field with `z.string().min(1).optional()` in `src/schemas/auth.ts`
- [x] T003 Extend `passwordUpdateSchema` to add optional `type` field with `z.literal(VERIFICATION_TYPE_EMAIL).optional()` in `src/schemas/auth.ts`
- [x] T004 Update `PasswordUpdateInput` type export to reflect new schema fields in `src/schemas/auth.ts`

**Checkpoint**: Schema extended - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Password Reset via Email Link (PKCE) (Priority: P1) 🎯 MVP

**Goal**: Users who have forgotten their password can click the password reset link in their email containing a PKCE code to authenticate and reset their password.

**Independent Test**: Request a password reset email, click the link with `?code=xxx`, set a new password, and verify the user can log in with the new password.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Add test "returns 200 for valid PKCE code authentication" in `tests/integration/auth/password-update.test.ts`
- [x] T006 [P] [US1] Add test "returns 401 for invalid PKCE code" in `tests/integration/auth/password-update.test.ts`
- [x] T007 [P] [US1] Add test "returns 401 for expired PKCE code with appropriate message" in `tests/integration/auth/password-update.test.ts`
- [x] T008 [P] [US1] Add test "calls exchangeCodeForSession when code is provided" in `tests/integration/auth/password-update.test.ts`

### Implementation for User Story 1

- [x] T009 [US1] Add `exchangeCodeForSession` mock to Supabase mock in `tests/integration/auth/password-update.test.ts`
- [x] T010 [US1] Import `VERIFICATION_TYPE_EMAIL` constant in `src/app/api/auth/password/route.ts`
- [x] T011 [US1] Extract `code`, `token_hash`, `type` from validated request body in `src/app/api/auth/password/route.ts`
- [x] T012 [US1] Add PKCE code authentication flow with `exchangeCodeForSession(code)` before session check in `src/app/api/auth/password/route.ts`
- [x] T013 [US1] Add logging for PKCE authentication method (log "PKCE" not the code) in `src/app/api/auth/password/route.ts`
- [x] T014 [US1] Update `PasswordResetForm` to accept optional `code` prop in `src/app/(auth)/reset-password/password-reset-form.tsx`
- [x] T015 [US1] Add hidden input field for `code` in form when prop is provided in `src/app/(auth)/reset-password/password-reset-form.tsx`
- [x] T016 [US1] Pass `code` searchParam to `PasswordResetForm` component in `src/app/(auth)/reset-password/page.tsx`
- [x] T017 [US1] Update `passwordUpdateAction` to extract `code` from formData in `src/actions/auth-actions.ts`
- [x] T018 [US1] Include `code` in API request body in `passwordUpdateAction` in `src/actions/auth-actions.ts`

**Checkpoint**: At this point, User Story 1 (PKCE authentication) should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Password Reset via OTP Token (Priority: P2)

**Goal**: Users who have clicked a password reset link with an OTP token (token_hash) can authenticate and reset their password.

**Independent Test**: Generate a password reset with OTP token, submit the token with a new password via API, and verify the user can log in with the new password.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US2] Add test "returns 200 for valid OTP token authentication" in `tests/integration/auth/password-update.test.ts`
- [x] T020 [P] [US2] Add test "returns 401 for invalid OTP token" in `tests/integration/auth/password-update.test.ts`
- [x] T021 [P] [US2] Add test "returns 401 for expired OTP token with appropriate message" in `tests/integration/auth/password-update.test.ts`
- [x] T022 [P] [US2] Add test "calls verifyOtp when token_hash and type are provided" in `tests/integration/auth/password-update.test.ts`
- [x] T023 [P] [US2] Add test "requires type=email when token_hash is provided" in `tests/integration/auth/password-update.test.ts`

### Implementation for User Story 2

- [x] T024 [US2] Add `verifyOtp` mock to Supabase mock in `tests/integration/auth/password-update.test.ts`
- [x] T025 [US2] Add OTP token authentication flow with `verifyOtp({ type: 'email', token_hash })` after PKCE check in `src/app/api/auth/password/route.ts`
- [x] T026 [US2] Add logging for OTP authentication method (log "OTP" not the token) in `src/app/api/auth/password/route.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Password Reset for Authenticated User (Priority: P3)

**Goal**: Users who are already logged in can change their password directly using their existing session.

**Independent Test**: Log in, submit a new password while authenticated, and verify the user is signed out and can log in with the new password.

### Tests for User Story 3

> **NOTE: These tests should already pass with existing implementation, but add explicit tests for clarity**

- [x] T027 [P] [US3] Add test "returns 200 for session-based authentication when no code or token provided" in `tests/integration/auth/password-update.test.ts`
- [x] T028 [P] [US3] Add test "returns 401 when session is invalid and no code/token provided" in `tests/integration/auth/password-update.test.ts`

### Implementation for User Story 3

- [x] T029 [US3] Add logging for session authentication method in `src/app/api/auth/password/route.ts`
- [x] T030 [US3] Add error handling for "Authentication required" when no valid auth method in `src/app/api/auth/password/route.ts`

**Checkpoint**: All authentication methods should now work independently.

---

## Phase 6: User Story 4 - Post-Reset Sign Out (Priority: P1)

**Goal**: After any successful password reset (via any authentication method), the user is automatically signed out for security.

**Independent Test**: Complete any password reset flow and verify the user's session is invalidated.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T031 [P] [US4] Add test "calls signOut after successful password update via PKCE" in `tests/integration/auth/password-update.test.ts`
- [x] T032 [P] [US4] Add test "calls signOut after successful password update via OTP" in `tests/integration/auth/password-update.test.ts`
- [x] T033 [P] [US4] Add test "calls signOut after successful password update via session" in `tests/integration/auth/password-update.test.ts`
- [x] T034 [P] [US4] Add test "returns success even if signOut fails (logs error)" in `tests/integration/auth/password-update.test.ts`

### Implementation for User Story 4

- [x] T035 [US4] Add `signOut` mock to Supabase mock in `tests/integration/auth/password-update.test.ts`
- [x] T036 [US4] Add `signOut()` call after successful password update in `src/app/api/auth/password/route.ts`
- [x] T037 [US4] Add error handling for signOut failure (log error, don't fail operation) in `src/app/api/auth/password/route.ts`
- [x] T038 [US4] Add logging for sign-out success/failure in `src/app/api/auth/password/route.ts`

**Checkpoint**: All user stories should now be complete and independently functional.

---

## Phase 7: Authentication Priority & Edge Cases

**Purpose**: Ensure authentication priority order (PKCE → OTP → session) is correctly implemented

### Tests for Priority Order

- [x] T039 [P] Add test "prioritizes PKCE code over OTP token when both provided" in `tests/integration/auth/password-update.test.ts`
- [x] T040 [P] Add test "prioritizes OTP token over session when both provided" in `tests/integration/auth/password-update.test.ts`
- [x] T041 [P] Add test "does not log sensitive data (code, token, password)" in `tests/integration/auth/password-update.test.ts`

**Checkpoint**: Authentication priority and security requirements verified.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [x] T042 [P] Run linting on all modified files (`pnpm lint`)
- [x] T043 [P] Run type checking on all modified files (`pnpm type-check`)
- [x] T044 Run full test suite to ensure no regressions (`pnpm test`)
- [x] T045 Validate implementation against quickstart.md test scenarios
- [x] T046 Update JSDoc comments in modified files as needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No setup needed - existing infrastructure
- **Foundational (Phase 2)**: BLOCKS all user stories - schema must be extended first
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can proceed sequentially (recommended) or in parallel if staffed
  - Priority order: US1 (P1) → US2 (P2) → US3 (P3), but US4 (P1) can be done after US1
- **Priority & Edge Cases (Phase 7)**: Depends on all user story implementations
- **Polish (Phase 8)**: Depends on all previous phases

### User Story Dependencies

| User Story     | Priority | Dependencies           | Can Parallelize After                      |
| -------------- | -------- | ---------------------- | ------------------------------------------ |
| US1 (PKCE)     | P1       | Phase 2 complete       | Phase 2                                    |
| US2 (OTP)      | P2       | Phase 2 complete       | Phase 2 (can parallel with US1)            |
| US3 (Session)  | P3       | Phase 2 complete       | Phase 2 (can parallel with US1, US2)       |
| US4 (Sign Out) | P1       | US1 or US2 or US3 impl | Needs at least one auth method implemented |

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation follows test failures
- Story complete when all tests pass
- Commit after each task or logical group

### Parallel Opportunities

- All tests within a user story marked [P] can run in parallel
- All user stories can be worked in parallel (different code sections, minimal overlap)
- Phase 7 tests can be written in parallel
- Phase 8 linting and type-checking can run in parallel

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task T005: "Add test 'returns 200 for valid PKCE code authentication'"
Task T006: "Add test 'returns 401 for invalid PKCE code'"
Task T007: "Add test 'returns 401 for expired PKCE code with appropriate message'"
Task T008: "Add test 'calls exchangeCodeForSession when code is provided'"
```

---

## Implementation Strategy

### MVP First (User Story 1 with Sign Out)

1. Complete Phase 2: Foundational (schema extension)
2. Complete Phase 3: User Story 1 (PKCE authentication) - primary "forgot password" flow
3. Complete Phase 6: User Story 4 (sign out) - security requirement integrated with US1
4. **STOP and VALIDATE**: Test complete forgot password flow end-to-end (with sign out)
5. Deploy/demo if ready - this covers the most critical use case with full security

### Incremental Delivery

1. Complete Foundational → Schema ready
2. Add User Story 1 → Test independently → Primary flow working
3. Add User Story 4 → Test independently → Security complete for US1
4. Add User Story 2 → Test independently → Alternative auth method
5. Add User Story 3 → Test independently → Authenticated user flow
6. Complete Phase 7-8 → Polish and validate

### Sequential Developer Strategy (Recommended)

For a single developer:

1. Phase 2: Schema extension (T001-T004)
2. Phase 3: User Story 1 tests then implementation (T005-T018)
3. Phase 6: User Story 4 tests then implementation (T031-T038)
4. Phase 4: User Story 2 tests then implementation (T019-T026)
5. Phase 5: User Story 3 tests then implementation (T027-T030)
6. Phase 7: Priority tests (T039-T041)
7. Phase 8: Polish (T042-T046)

---

## Notes

- [P] tasks = different files or independent test cases, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Security**: Never log passwords, codes, or tokens (SC-006)
- **Error handling**: Use generic auth errors, detect "expired" for better UX (per research.md)
- **Reference**: Follow patterns from `src/app/api/auth/verify/route.ts` for PKCE/OTP implementation

---

## Summary

| Phase     | Task Count | Description                     |
| --------- | ---------- | ------------------------------- |
| Phase 1   | 0          | Setup (existing infrastructure) |
| Phase 2   | 4          | Foundational (schema extension) |
| Phase 3   | 14         | User Story 1 - PKCE (P1) 🎯 MVP |
| Phase 4   | 8          | User Story 2 - OTP (P2)         |
| Phase 5   | 4          | User Story 3 - Session (P3)     |
| Phase 6   | 8          | User Story 4 - Sign Out (P1)    |
| Phase 7   | 3          | Priority & Edge Cases           |
| Phase 8   | 5          | Polish                          |
| **Total** | **46**     |                                 |

### Tasks Per User Story

| User Story     | Test Tasks | Implementation Tasks | Total |
| -------------- | ---------- | -------------------- | ----- |
| US1 (PKCE)     | 4          | 10                   | 14    |
| US2 (OTP)      | 5          | 3                    | 8     |
| US3 (Session)  | 2          | 2                    | 4     |
| US4 (Sign Out) | 4          | 4                    | 8     |

### MVP Scope

**Recommended MVP**: Phase 2 + Phase 3 (US1) + Phase 6 (US4) = 26 tasks

This covers:

- ✅ Primary "forgot password" flow via email link (PKCE)
- ✅ Security requirement (sign out after reset)
- ✅ Most common user journey

### Independent Test Criteria

| User Story | How to Test Independently                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------- |
| US1        | Request reset email → Click link with `?code=xxx` → Set new password → Login with new password |
| US2        | API call with `token_hash` and `type=email` → Set new password → Login with new password       |
| US3        | Login → Submit new password → Verify signed out → Login with new password                      |
| US4        | Complete any password reset → Verify session cookie removed                                    |
