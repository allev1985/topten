# Tasks: Fix Verify-Email Page to Handle Verification Code

**Input**: Design documents from `/specs/001-fix-verify-email/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: YES - Tests are requested per the feature specification and plan.md testing requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new project setup needed - extending existing Next.js app with new server actions and components.

- [x] T001 Verify existing auth patterns in src/actions/auth-actions.ts are understood and can be extended
- [x] T002 [P] Verify existing Supabase verification schemas exist in src/schemas/auth.ts (verifyTokenSchema, verifyCodeSchema)
- [x] T003 [P] Verify VERIFICATION_TYPE_EMAIL constant exists in src/lib/config/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core server actions that ALL user stories depend on

**⚠️ CRITICAL**: User story implementation depends on these actions being complete

### Server Actions (Required for all stories)

- [x] T004 Add VerifyEmailSuccessData interface to src/actions/auth-actions.ts
- [x] T005 Add VerifyEmailParams interface to src/actions/auth-actions.ts
- [x] T006 Add ResendVerificationSuccessData interface to src/actions/auth-actions.ts
- [x] T007 Implement verifyEmailAction server action in src/actions/auth-actions.ts (handles both OTP and PKCE flows per contracts/verify-email-actions.md)
- [x] T008 Implement resendVerificationAction server action in src/actions/auth-actions.ts (uses passwordResetSchema for email validation)

### Unit Tests for Server Actions

- [x] T009 [P] Add verifyEmailAction tests to tests/unit/actions/auth-actions.test.ts (valid PKCE code, valid OTP token, expired code, invalid code, missing parameters)
- [x] T010 [P] Add resendVerificationAction tests to tests/unit/actions/auth-actions.test.ts (valid email, invalid email format, empty email)

**Checkpoint**: Server actions ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Successful Email Verification (Priority: P1) 🎯 MVP

**Goal**: Users who click a valid verification link from their email have their account verified and are redirected to the dashboard.

**Independent Test**: Navigate to /verify-email?code=validcode (or token_hash=valid&type=email) and confirm success message displays followed by redirect to dashboard.

### Component Tests for User Story 1

- [ ] T011 [P] [US1] Add test case for success state rendering in tests/component/auth/verify-email-page.test.tsx (mocks successful verification)
- [ ] T012 [P] [US1] Add test case for redirect behavior after success in tests/component/auth/verify-email-page.test.tsx

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create VerificationSuccess client component in src/app/(auth)/verify-email/verification-success.tsx (displays success message, handles timed redirect to dashboard)
- [ ] T014 [US1] Update verify-email page.tsx to accept searchParams (code, token_hash, type) in src/app/(auth)/verify-email/page.tsx
- [ ] T015 [US1] Update verify-email page.tsx to call verifyEmailAction when code or token_hash is present in src/app/(auth)/verify-email/page.tsx
- [ ] T016 [US1] Update verify-email page.tsx to render VerificationSuccess component on successful verification in src/app/(auth)/verify-email/page.tsx

**Checkpoint**: User Story 1 complete - valid verification links work end-to-end

---

## Phase 4: User Story 2 - Pending Verification Instructions (Priority: P2)

**Goal**: Users who navigate to verify-email page without a verification code see clear instructions about checking their email.

**Independent Test**: Navigate directly to /verify-email (no URL parameters) and confirm instructional content displays with spam folder guidance.

### Component Tests for User Story 2

- [ ] T017 [P] [US2] Ensure existing tests in tests/component/auth/verify-email-page.test.tsx still pass for pending state (no code in URL)
- [ ] T018 [P] [US2] Add test case that pending state shows when no searchParams in tests/component/auth/verify-email-page.test.tsx

### Implementation for User Story 2

- [ ] T019 [P] [US2] Create VerificationPending component in src/app/(auth)/verify-email/verification-pending.tsx (extracts existing pending UI from page.tsx)
- [ ] T020 [US2] Update verify-email page.tsx to render VerificationPending when no verification params present in src/app/(auth)/verify-email/page.tsx

**Checkpoint**: User Story 2 complete - pending state preserved and works independently

---

## Phase 5: User Story 3 - Failed Verification Recovery (Priority: P3)

**Goal**: Users with expired or invalid verification links see a clear error message and can request a new verification email.

**Independent Test**: Navigate to /verify-email?code=invalidcode and confirm error state displays with email input form to request new verification.

### Component Tests for User Story 3

- [ ] T021 [P] [US3] Add test case for error state rendering in tests/component/auth/verify-email-page.test.tsx (mocks failed verification)
- [ ] T022 [P] [US3] Add test case for resend form display in error state in tests/component/auth/verify-email-page.test.tsx
- [ ] T023 [P] [US3] Add test case for successful resend submission in tests/component/auth/verify-email-page.test.tsx

### Implementation for User Story 3

- [ ] T024 [P] [US3] Create VerificationError client component in src/app/(auth)/verify-email/verification-error.tsx (displays error, includes resend form with email input)
- [ ] T025 [US3] Update verify-email page.tsx to render VerificationError component when verification fails in src/app/(auth)/verify-email/page.tsx
- [ ] T026 [US3] Wire resend form in VerificationError to use resendVerificationAction via useFormState hook in src/app/(auth)/verify-email/verification-error.tsx

**Checkpoint**: User Story 3 complete - error recovery flow works independently

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T027 Run all component tests via `pnpm test tests/component/auth/verify-email-page.test.tsx`
- [ ] T028 Run all unit tests via `pnpm test tests/unit/actions/auth-actions.test.ts`
- [ ] T029 Run quickstart.md manual testing steps to validate all states (pending, success, error, resend)
- [ ] T030 [P] Review and ensure all error messages match contracts/verify-email-actions.md
- [ ] T031 [P] Verify accessibility: all interactive elements have proper labels and ARIA attributes
- [ ] T032 Code cleanup: Remove any unused imports, ensure consistent code style with existing auth pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification of existing code
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T004-T010)
- **User Story 2 (Phase 4)**: Depends on Foundational (T004-T010), can run parallel to US1
- **User Story 3 (Phase 5)**: Depends on Foundational (T004-T010), can run parallel to US1 and US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational - Independent of US1 and US2

### Within Each Phase

- Tests should be written first and FAIL before implementation
- Server actions before components
- Components before page integration
- Core implementation before polish

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002 (verify schemas) || T003 (verify config constant)
```

**Phase 2 (Foundational)**:
```
T004-T008 (sequential - interfaces then implementation)
Then: T009 (verifyEmail tests) || T010 (resend tests)
```

**Phase 3-5 (User Stories)** - Can all start in parallel after Phase 2:
```
US1: T011 || T012, then T013, then T014-T016 sequential
US2: T017 || T018, then T019, then T020
US3: T021 || T022 || T023, then T024, then T025-T026 sequential
```

**Phase 6 (Polish)**:
```
T030 || T031 (parallel review tasks)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verification tasks)
2. Complete Phase 2: Foundational (server actions + tests)
3. Complete Phase 3: User Story 1 (success flow)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - users can verify email successfully

### Incremental Delivery

1. Setup + Foundational → Server actions ready
2. Add User Story 1 → Test success flow → Deploy (MVP!)
3. Add User Story 2 → Test pending state → Deploy
4. Add User Story 3 → Test error recovery → Deploy
5. Each story adds value without breaking previous stories

### File Changes Summary

| File | Action | User Stories |
|------|--------|--------------|
| src/actions/auth-actions.ts | Modify | All (Foundational) |
| src/app/(auth)/verify-email/page.tsx | Modify | US1, US2, US3 |
| src/app/(auth)/verify-email/verification-pending.tsx | Create | US2 |
| src/app/(auth)/verify-email/verification-success.tsx | Create | US1 |
| src/app/(auth)/verify-email/verification-error.tsx | Create | US3 |
| tests/unit/actions/auth-actions.test.ts | Modify | Foundational |
| tests/component/auth/verify-email-page.test.tsx | Modify | US1, US2, US3 |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow existing patterns from reset-password page and auth-actions.ts
