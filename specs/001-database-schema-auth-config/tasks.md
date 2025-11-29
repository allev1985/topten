# Tasks: Database Schema & Supabase Auth Configuration

**Input**: Design documents from `/specs/001-database-schema-auth-config/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅, contracts/ ✅

**Tests**: Unit tests are REQUIRED per FR-019, FR-020 (>65% coverage for auth-related code)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Source code**: `src/` at repository root
- **Tests**: `tests/` at repository root
- **Supabase config**: `supabase/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure preparation

- [x] T001 Create supabase/templates/ directory for email templates
- [x] T002 Create src/lib/validation/ directory for validation utilities
- [x] T003 Create tests/unit/lib/validation/ directory for validation tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Update supabase/config.toml with minimum_password_length = 12 in [auth] section
- [x] T005 Update supabase/config.toml with password_requirements = "lower_upper_letters_digits_symbols" in [auth] section
- [x] T006 Update supabase/config.toml with enable_confirmations = true in [auth.email] section
- [x] T007 Create supabase/migrations/001_initial_auth_setup.sql with RLS enable statements for users, lists, places, list_places tables

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - New User Signs Up with Email Verification (Priority: P1) 🎯 MVP

**Goal**: Enable new users to create accounts with strong password requirements and email verification

**Independent Test**: Can be fully tested by completing the signup flow with passwords of varying strength and verifying the validation utility correctly identifies valid/invalid passwords

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Create password validation unit test file at tests/unit/lib/validation/password.test.ts with describe blocks for validatePassword and getPasswordRequirements
- [x] T009 [P] [US1] Add test cases for valid passwords meeting all requirements in tests/unit/lib/validation/password.test.ts
- [x] T010 [P] [US1] Add test cases for invalid passwords (too short, missing lowercase, uppercase, digit, symbol) in tests/unit/lib/validation/password.test.ts
- [x] T011 [P] [US1] Add test cases for password strength calculation (weak, medium, strong) in tests/unit/lib/validation/password.test.ts
- [x] T012 [P] [US1] Add test cases for edge cases (empty string, exactly 12 chars, special characters) in tests/unit/lib/validation/password.test.ts

### Implementation for User Story 1

- [x] T013 [US1] Create password validation utility with PasswordValidationResult interface at src/lib/validation/password.ts
- [x] T014 [US1] Implement validatePassword function with checks for minLength, lowercase, uppercase, digit, symbol at src/lib/validation/password.ts
- [x] T015 [US1] Implement strength calculation (weak/medium/strong) based on passed checks at src/lib/validation/password.ts
- [x] T016 [US1] Implement getPasswordRequirements function returning requirement strings at src/lib/validation/password.ts
- [x] T017 [US1] Run unit tests and verify >65% coverage for password validation at tests/unit/lib/validation/password.test.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - User Resets Forgotten Password (Priority: P2)

**Goal**: Enable users to reset their password via email with proper security controls

**Independent Test**: Can be tested by triggering password reset flow and verifying the reset email template displays correctly

### Implementation for User Story 2

- [x] T018 [P] [US2] Create password recovery email template at supabase/templates/recovery.html with YourFavs branding
- [x] T019 [US2] Add responsive HTML structure with header, content, and footer sections to supabase/templates/recovery.html
- [x] T020 [US2] Add prominent Reset Password CTA button with {{ .ConfirmationURL }} link variable to supabase/templates/recovery.html
- [x] T021 [US2] Add 1-hour expiry notice and security messaging to supabase/templates/recovery.html

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - User Profile Data is Protected (Priority: P3)

**Goal**: Implement Row Level Security (RLS) policies to protect user data from unauthorized access

**Independent Test**: Can be tested by attempting to access or modify another user's profile data and verifying the request is denied

### Implementation for User Story 3

- [x] T022 [P] [US3] Add users_select_own RLS policy (auth.uid() = id) to supabase/migrations/001_initial_auth_setup.sql
- [x] T023 [P] [US3] Add users_select_public RLS policy (deleted_at IS NULL) to supabase/migrations/001_initial_auth_setup.sql
- [x] T024 [P] [US3] Add users_update_own RLS policy to supabase/migrations/001_initial_auth_setup.sql
- [x] T025 [P] [US3] Add users_insert_own RLS policy to supabase/migrations/001_initial_auth_setup.sql
- [x] T026 [P] [US3] Add lists_select_own and lists_select_published RLS policies to supabase/migrations/001_initial_auth_setup.sql
- [x] T027 [P] [US3] Add lists_insert_own and lists_update_own RLS policies to supabase/migrations/001_initial_auth_setup.sql
- [x] T028 [P] [US3] Add places_select_all, places_insert_authenticated, places_update_authenticated RLS policies to supabase/migrations/001_initial_auth_setup.sql
- [x] T029 [P] [US3] Add list_places_select_via_list RLS policy with EXISTS subquery to supabase/migrations/001_initial_auth_setup.sql
- [x] T030 [P] [US3] Add list_places_insert_owner, list_places_update_owner, list_places_delete_owner RLS policies to supabase/migrations/001_initial_auth_setup.sql
- [x] T031 [US3] Add foreign key constraint users_id_fkey referencing auth.users(id) to supabase/migrations/001_initial_auth_setup.sql

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Email Templates Display Correctly (Priority: P4)

**Goal**: Create professionally branded email templates for verification and password reset flows

**Independent Test**: Can be tested by triggering each email type and verifying the template renders correctly in email clients

### Implementation for User Story 4

- [x] T032 [P] [US4] Create email confirmation template at supabase/templates/confirmation.html with YourFavs branding
- [x] T033 [US4] Add responsive HTML structure with header, content, and footer sections to supabase/templates/confirmation.html
- [x] T034 [US4] Add prominent Verify Email CTA button with {{ .ConfirmationURL }} link variable to supabase/templates/confirmation.html
- [x] T035 [US4] Add security messaging ("if you didn't create an account...") to supabase/templates/confirmation.html
- [x] T036 [US4] Configure email template paths in supabase/config.toml (optional - templates can be uploaded via Supabase dashboard)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T037 Run ESLint on src/lib/validation/password.ts and fix any errors
- [x] T038 Run all unit tests and verify 100% pass rate
- [x] T039 Verify test coverage >65% for password validation code
- [x] T040 Add migration comments documenting RLS policy rationale in supabase/migrations/001_initial_auth_setup.sql
- [x] T041 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tests (US1) MUST be written and FAIL before implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1: T001, T002, T003 can run in parallel
- Phase 2: T004, T005, T006 can run in parallel (different config sections)
- Phase 3 (US1): T008-T012 tests can run in parallel, then T013-T016 implementation
- Phase 4 (US2): T018 can start as soon as Phase 2 completes
- Phase 5 (US3): T022-T030 can all run in parallel (different policies in same file)
- Phase 6 (US4): T032 can start as soon as Phase 2 completes
- User Stories 1-4 can all be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: T008 "Create password validation unit test file at tests/unit/lib/validation/password.test.ts"
Task: T009 "Add test cases for valid passwords meeting all requirements"
Task: T010 "Add test cases for invalid passwords"
Task: T011 "Add test cases for password strength calculation"
Task: T012 "Add test cases for edge cases"

# Then implement (after tests fail):
Task: T013 "Create password validation utility with PasswordValidationResult interface"
Task: T014 "Implement validatePassword function"
Task: T015 "Implement strength calculation"
Task: T016 "Implement getPasswordRequirements function"
```

---

## Parallel Example: User Story 3 (RLS Policies)

```bash
# All RLS policies can be added in parallel (same file, different sections):
Task: T022 "Add users_select_own RLS policy"
Task: T023 "Add users_select_public RLS policy"
Task: T024 "Add users_update_own RLS policy"
Task: T025 "Add users_insert_own RLS policy"
Task: T026 "Add lists_select_own and lists_select_published RLS policies"
Task: T027 "Add lists_insert_own and lists_update_own RLS policies"
Task: T028 "Add places_* RLS policies"
Task: T029 "Add list_places_select_via_list RLS policy"
Task: T030 "Add list_places_insert_owner, update_owner, delete_owner policies"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 - Password Validation (T008-T017)
4. **STOP and VALIDATE**: Run tests, verify >65% coverage
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → MVP for password validation
3. Add User Story 2 → Test independently → Password reset email template
4. Add User Story 3 → Test independently → RLS policies active
5. Add User Story 4 → Test independently → Email templates complete
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Password Validation)
   - Developer B: User Story 3 (RLS Policies)
   - Developer C: User Stories 2 + 4 (Email Templates)
3. Stories complete and integrate independently

---

## Summary

| Metric                 | Value                         |
| ---------------------- | ----------------------------- |
| **Total Tasks**        | 41                            |
| **Setup Phase**        | 3 tasks                       |
| **Foundational Phase** | 4 tasks                       |
| **User Story 1 (P1)**  | 10 tasks (5 test + 5 impl)    |
| **User Story 2 (P2)**  | 4 tasks                       |
| **User Story 3 (P3)**  | 10 tasks                      |
| **User Story 4 (P4)**  | 5 tasks                       |
| **Polish Phase**       | 5 tasks                       |
| **Parallel Tasks**     | 16 (marked with [P])          |
| **Suggested MVP**      | Phase 1-3 (User Story 1 only) |

---

## Files to Create/Modify

| File                                             | Action               | Phase      |
| ------------------------------------------------ | -------------------- | ---------- |
| `supabase/templates/`                            | Create directory     | Phase 1    |
| `src/lib/validation/`                            | Create directory     | Phase 1    |
| `tests/unit/lib/validation/`                     | Create directory     | Phase 1    |
| `supabase/config.toml`                           | Modify auth settings | Phase 2    |
| `supabase/migrations/001_initial_auth_setup.sql` | Create               | Phase 2, 5 |
| `tests/unit/lib/validation/password.test.ts`     | Create               | Phase 3    |
| `src/lib/validation/password.ts`                 | Create               | Phase 3    |
| `supabase/templates/recovery.html`               | Create               | Phase 4    |
| `supabase/templates/confirmation.html`           | Create               | Phase 6    |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD for US1)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- FR-019 requires >65% unit test coverage for auth-related code
- FR-020 requires all unit tests to pass
- FR-021 requires no linting errors
