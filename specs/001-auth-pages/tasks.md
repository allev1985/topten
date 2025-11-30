# Tasks: Authentication Pages

**Input**: Design documents from `/specs/001-auth-pages/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/server-actions.md ✓, quickstart.md ✓

**Tests**: Required per specification (65% minimum coverage target)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and foundational types needed by all auth components

- [X] T001 Create form state types in `src/types/forms.ts` with `FormState<T>`, `ActionState<T>`, `initialFormState()`, `FieldError`, and `mapFieldErrors()` per data-model.md
- [X] T002 [P] Create unit test for form types in `tests/unit/types/forms.test.ts` covering type initialization and utility functions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### 2.1 Form State Hook

- [X] T003 Create `useFormState` hook in `src/hooks/use-form-state.ts` that wraps React 19's `useActionState` and returns `{ state: FormState<T>, formAction, reset }` per data-model.md
- [X] T004 Create unit test for `useFormState` hook in `tests/unit/hooks/use-form-state.test.ts` covering:
  - Initial state values
  - Form action invocation
  - State transitions (pending, success, error)
  - Field error handling

### 2.2 Atomic UI Components

- [X] T005 [P] Create `FormInput` component in `src/components/auth/form-input.tsx` with props: id, name, type (text/email), label, required, autoComplete, error, defaultValue, placeholder, className; includes accessible label, aria-invalid, aria-describedby, and error display
- [X] T006 [P] Create component test for `FormInput` in `tests/component/auth/form-input.test.tsx` covering:
  - Rendering with label and input
  - Error message display
  - ARIA attributes (aria-invalid, aria-describedby)
  - Required attribute handling
  - Default value handling

- [X] T007 [P] Create `PasswordInput` component in `src/components/auth/password-input.tsx` as client component with props: id, name, label, required, autoComplete, error, defaultValue, showStrength, strengthLabel, placeholder, className; integrates `validatePassword()` for real-time strength feedback
- [X] T008 [P] Create component test for `PasswordInput` in `tests/component/auth/password-input.test.tsx` covering:
  - Rendering with label and password input
  - Password strength indicator display (weak/medium/strong)
  - Real-time strength updates on input change
  - Error message display
  - ARIA attributes and accessibility
  - showStrength toggle behavior

- [X] T009 [P] Create `FormButton` component in `src/components/auth/form-button.tsx` with props: children, pending, type, onClick, disabled, className; shows disabled state during form submission
- [X] T010 [P] Create component test for `FormButton` in `tests/component/auth/form-button.test.tsx` covering:
  - Rendering with children text
  - Disabled state when pending=true
  - Click handler invocation
  - Button type attribute
  - Loading indication text

- [X] T011 [P] Create `ErrorMessage` component in `src/components/auth/error-message.tsx` with props: message, className; renders error as plain text in semantic HTML with role="alert"
- [X] T012 [P] Create component test for `ErrorMessage` in `tests/component/auth/error-message.test.tsx` covering:
  - Rendering with message
  - Not rendering when message is null/undefined
  - Role="alert" accessibility attribute
  - className passthrough

- [X] T013 [P] Create `AuthCard` component in `src/components/auth/auth-card.tsx` with props: title, description, children, footer, className; provides consistent page wrapper structure for all auth pages
- [X] T014 [P] Create component test for `AuthCard` in `tests/component/auth/auth-card.test.tsx` covering:
  - Rendering with title and children
  - Optional description display
  - Optional footer content
  - Semantic HTML structure
  - className passthrough

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - New User Registration (Priority: P1) 🎯 MVP

**Goal**: A visitor can create an account by navigating to /signup, entering email/password with strength feedback, submitting, and being redirected to verification page.

**Independent Test**: Navigate to /signup, fill form with valid credentials, submit, verify redirect to /verify-email with appropriate messaging.

### Server Actions for US1

- [X] T015 [US1] Create `signupAction` server action in `src/actions/auth-actions.ts` that validates input with `signupSchema`, calls Supabase `auth.signUp()`, returns `ActionState<SignupSuccessData>` per server-actions contract
- [X] T016 [US1] Create unit test for `signupAction` in `tests/unit/actions/auth-actions.test.ts` covering:
  - Successful signup returns success state with redirectTo
  - Invalid email returns fieldErrors
  - Weak password returns fieldErrors
  - User enumeration protection (same response for existing email)

### Signup Page for US1

- [X] T017 [US1] Create route group layout file `src/app/(auth)/layout.tsx` if it doesn't exist; minimal layout wrapper for public auth pages
- [X] T018 [US1] Create signup page at `src/app/(auth)/signup/page.tsx` as Server Component wrapping client SignupForm in AuthCard with title "Create Account", description, and footer link to /login
- [X] T019 [US1] Create `SignupForm` client component in `src/app/(auth)/signup/signup-form.tsx` that uses `useFormState` with `signupAction`, renders FormInput (email), PasswordInput (password with strength), FormButton, ErrorMessage, and handles redirect on success

**Checkpoint**: Signup flow complete (form → action → redirect to verify-email)

---

## Phase 4: User Story 3 - Email Verification (Priority: P1)

**Goal**: After signing up, user lands on verification waiting page, clicks email link, verification handler processes token and redirects to dashboard.

**Independent Test**: Simulate verification link click with valid token, verify redirect to dashboard.

### Verification Pages for US3

- [X] T020 [US3] Create verify-email waiting page at `src/app/(auth)/verify-email/page.tsx` as Server Component with AuthCard showing "Check your email" title, clear instructions, and info about checking spam folder
- [X] T021 [US3] Create auth verify handler page at `src/app/(auth)/auth/verify/page.tsx` as Server Component that reads `token_hash`, `type`, `code` from searchParams, exchanges token via Supabase, redirects to dashboard on success or shows error with instructions on failure
- [X] T022 [US3] Create component test for verify-email page in `tests/component/auth/verify-email-page.test.tsx` covering:
  - Rendering of instructions
  - Check spam folder messaging
  - Accessible content structure

**Checkpoint**: Registration + verification flow complete (signup → verify-email → auth/verify → dashboard)

---

## Phase 5: User Story 2 - User Login (Priority: P1)

**Goal**: A registered user can login via /login, enter credentials with optional "Remember me", and be redirected to intended destination or default landing page.

**Independent Test**: Navigate to /login, enter valid credentials, submit, verify authentication and redirect.

### Login Server Action for US2

- [X] T023 [US2] Create `loginAction` server action in `src/actions/auth-actions.ts` that validates input with `loginSchema`, calls Supabase `auth.signInWithPassword()`, handles redirectTo validation, returns `ActionState<LoginSuccessData>` per server-actions contract

### Login Components for US2

- [X] T024 [US2] Create `LoginForm` component in `src/components/auth/login-form.tsx` as client component with props: redirectTo, defaultEmail; uses `useFormState` with `loginAction`, renders FormInput (email), PasswordInput (no strength), checkbox for "Remember me", FormButton, ErrorMessage, handles redirect on success
- [X] T025 [US2] Create component test for `LoginForm` in `tests/component/auth/login-form.test.tsx` covering:
  - Rendering all form fields
  - Remember me checkbox
  - Error message display for invalid credentials
  - Loading state on submit
  - defaultEmail prop handling
  - redirectTo passthrough in hidden input

### Login Page for US2

- [X] T026 [US2] Create login page at `src/app/(auth)/login/page.tsx` as Server Component that reads `redirectTo` and `email` from searchParams, renders AuthCard with title "Sign In", LoginForm with props, footer with links to /signup and /forgot-password, placeholder disabled social auth buttons

**Checkpoint**: Login flow complete (login → dashboard or redirectTo)

---

## Phase 6: User Story 4 - Password Reset Request (Priority: P2)

**Goal**: A user who forgot password can request reset via /forgot-password, enter email, and receive generic success message (user enumeration protection).

**Independent Test**: Navigate to /forgot-password, enter email, submit, verify generic success message appears.

### Password Reset Server Action for US4

- [X] T027 [US4] Create `passwordResetRequestAction` server action in `src/actions/auth-actions.ts` that validates email with `passwordResetSchema`, calls Supabase `auth.resetPasswordForEmail()`, always returns success message (user enumeration protection)

### Forgot Password Page for US4

- [X] T028 [US4] Create `ForgotPasswordForm` client component in `src/app/(auth)/forgot-password/forgot-password-form.tsx` using `useFormState` with `passwordResetRequestAction`, renders FormInput (email), FormButton, ErrorMessage, success message display
- [X] T029 [US4] Create forgot-password page at `src/app/(auth)/forgot-password/page.tsx` as Server Component with AuthCard title "Reset Password", description, ForgotPasswordForm, footer link to /login

**Checkpoint**: Password reset request flow complete

---

## Phase 7: User Story 5 - Password Reset Completion (Priority: P2)

**Goal**: User with reset email can click link, land on /reset-password, enter new password with confirmation and strength feedback, successfully update password.

**Independent Test**: Navigate to /reset-password with valid code, enter matching passwords meeting requirements, verify successful update and redirect to login.

### Password Update Server Action for US5

- [X] T030 [US5] Create `passwordUpdateAction` server action in `src/actions/auth-actions.ts` that validates password with `passwordUpdateSchema`, validates confirmPassword matches, calls Supabase `auth.updateUser()`, returns success with redirectTo "/login" or appropriate error

### Password Reset Components for US5

- [X] T031 [US5] Create `PasswordResetForm` component in `src/components/auth/password-reset-form.tsx` as client component with props: onSuccess, requireCurrentPassword; uses `useFormState`, renders PasswordInput (new password with strength), PasswordInput (confirm password), optional current password field, FormButton, ErrorMessage
- [X] T032 [US5] Create component test for `PasswordResetForm` in `tests/component/auth/password-reset-form.test.tsx` covering:
  - Rendering password and confirm password fields
  - Password strength indicator on new password
  - Error display for mismatched passwords
  - Current password field when requireCurrentPassword=true
  - Loading state on submit
  - Success callback invocation

### Reset Password Page for US5

- [X] T033 [US5] Create reset-password page at `src/app/(auth)/reset-password/page.tsx` as Server Component that reads `code` from searchParams, validates code presence, renders AuthCard with title "Set New Password", PasswordResetForm with onSuccess redirect to /login, error state for invalid/expired token with link to request new reset

**Checkpoint**: Password reset completion flow complete (reset-password → login)

---

## Phase 8: User Story 6 - Authenticated Password Change (Priority: P3)

**Goal**: Logged-in user can change password from /dashboard/settings/password by entering current password and new password with confirmation.

**Independent Test**: Login, navigate to /dashboard/settings/password, enter valid current and new passwords, verify successful update.

### Password Change Server Action for US6

- [X] T034 [US6] Create `passwordChangeAction` server action in `src/actions/auth-actions.ts` that verifies authentication, validates currentPassword, validates new password with `passwordUpdateSchema`, validates confirmPassword matches, calls Supabase `auth.updateUser()`, returns success message or appropriate error

### Password Settings Page for US6

- [X] T035 [US6] Create dashboard route group layout `src/app/(dashboard)/layout.tsx` if it doesn't exist; includes auth protection middleware redirect to /login for unauthenticated users
- [X] T036 [US6] Create password settings page at `src/app/(dashboard)/settings/password/page.tsx` as Server Component that verifies authentication (redirect to /login if not), renders page with PasswordResetForm with requireCurrentPassword=true, success message display
- [X] T037 [US6] Create `PasswordChangeForm` client component in `src/app/(dashboard)/settings/password/password-change-form.tsx` using `useFormState` with `passwordChangeAction`, renders current password field, new password with strength, confirm password, FormButton, ErrorMessage, success message

**Checkpoint**: Authenticated password change flow complete

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T038 Update auth-actions tests in `tests/unit/actions/auth-actions.test.ts` to cover all 5 server actions with comprehensive scenarios
- [X] T039 [P] Create index exports file `src/components/auth/index.ts` exporting all auth components for clean imports
- [X] T040 Run test coverage report and ensure minimum 65% coverage for auth components and hooks
- [ ] T041 Validate all pages work with JavaScript disabled (progressive enhancement)
- [ ] T042 Run accessibility audit on all auth pages (WCAG 2.1 AA compliance)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Phase 2 (Foundational) completion
  - US1 (Phase 3) and US3 (Phase 4) should complete together for MVP signup flow
  - US2 (Phase 5) can proceed in parallel with US1/US3
  - US4 (Phase 6) and US5 (Phase 7) should complete together for password reset flow
  - US6 (Phase 8) can proceed after US4/US5 (shares PasswordResetForm component)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - can complete after Phase 2
- **User Story 3 (P1)**: Logically follows US1 (signup → verify) but can be implemented independently
- **User Story 2 (P1)**: No dependencies on other stories - can complete after Phase 2
- **User Story 4 (P2)**: No dependencies on other stories - can complete after Phase 2
- **User Story 5 (P2)**: Logically follows US4 (forgot → reset) but can be implemented independently
- **User Story 6 (P3)**: Can reuse `PasswordResetForm` from US5, depends on protected dashboard layout

### Within Each User Story

- Server actions before pages that use them
- Forms/components before pages that compose them
- Tests alongside implementation (TDD where specified)

### Parallel Opportunities

**Phase 2 (All [P] marked tasks can run in parallel):**
```
T005, T007, T009, T011, T013 - All atomic components
T006, T008, T010, T012, T014 - All component tests
```

**After Phase 2 (User stories can be parallelized):**
```
Developer A: US1 (T015-T019) + US3 (T020-T022) = Signup + Verification MVP
Developer B: US2 (T023-T026) = Login
Developer C: US4 (T027-T029) + US5 (T030-T033) = Password Reset flow
```

---

## Implementation Strategy

### MVP First (User Stories 1, 3, 2)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (hook + atomic components)
3. Complete Phase 3: US1 - Signup
4. Complete Phase 4: US3 - Email Verification
5. Complete Phase 5: US2 - Login
6. **STOP and VALIDATE**: Test signup → verify → login flow independently
7. Deploy/demo if ready

### Incremental Delivery

1. Phase 1-2 → Foundation ready
2. Add US1 + US3 → Signup flow testable → Deploy/Demo (MVP!)
3. Add US2 → Login flow testable → Deploy/Demo
4. Add US4 + US5 → Password reset flow testable → Deploy/Demo
5. Add US6 → Settings password change → Deploy/Demo

### Parallel Team Strategy

With multiple developers:

1. Team completes Phases 1-2 together (foundation)
2. Once Phase 2 complete:
   - Developer A: US1 + US3 (signup/verification)
   - Developer B: US2 (login)
   - Developer C: US4 + US5 (password reset)
3. US6 can be added by any developer after US5 completes

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 42 |
| **Phase 1 (Setup)** | 2 tasks |
| **Phase 2 (Foundational)** | 12 tasks |
| **Phase 3 (US1 - Signup)** | 5 tasks |
| **Phase 4 (US3 - Verification)** | 3 tasks |
| **Phase 5 (US2 - Login)** | 4 tasks |
| **Phase 6 (US4 - Forgot Password)** | 3 tasks |
| **Phase 7 (US5 - Reset Password)** | 4 tasks |
| **Phase 8 (US6 - Password Change)** | 4 tasks |
| **Phase 9 (Polish)** | 5 tasks |
| **Parallelizable Tasks** | 15 tasks marked [P] |
| **MVP Scope** | Phases 1-5 (26 tasks) |

---

## Files to Create/Modify

### Types & Hooks
- `src/types/forms.ts` (new)
- `src/hooks/use-form-state.ts` (new)
- `tests/unit/types/forms.test.ts` (new)
- `tests/unit/hooks/use-form-state.test.ts` (new)

### Atomic Components
- `src/components/auth/form-input.tsx` (new)
- `src/components/auth/password-input.tsx` (new)
- `src/components/auth/form-button.tsx` (new)
- `src/components/auth/error-message.tsx` (new)
- `src/components/auth/auth-card.tsx` (new)
- `src/components/auth/login-form.tsx` (new)
- `src/components/auth/password-reset-form.tsx` (new)
- `src/components/auth/index.ts` (new)
- `tests/component/auth/form-input.test.tsx` (new)
- `tests/component/auth/password-input.test.tsx` (new)
- `tests/component/auth/form-button.test.tsx` (new)
- `tests/component/auth/error-message.test.tsx` (new)
- `tests/component/auth/auth-card.test.tsx` (new)
- `tests/component/auth/login-form.test.tsx` (new)
- `tests/component/auth/password-reset-form.test.tsx` (new)
- `tests/component/auth/verify-email-page.test.tsx` (new)

### Server Actions
- `src/actions/auth-actions.ts` (new)
- `tests/unit/actions/auth-actions.test.ts` (new)

### Pages (Auth Route Group)
- `src/app/(auth)/layout.tsx` (new)
- `src/app/(auth)/signup/page.tsx` (new)
- `src/app/(auth)/signup/signup-form.tsx` (new)
- `src/app/(auth)/verify-email/page.tsx` (new)
- `src/app/(auth)/auth/verify/page.tsx` (new)
- `src/app/(auth)/login/page.tsx` (new)
- `src/app/(auth)/forgot-password/page.tsx` (new)
- `src/app/(auth)/forgot-password/forgot-password-form.tsx` (new)
- `src/app/(auth)/reset-password/page.tsx` (new)

### Pages (Dashboard Route Group)
- `src/app/(dashboard)/layout.tsx` (new)
- `src/app/(dashboard)/settings/password/page.tsx` (new)
- `src/app/(dashboard)/settings/password/password-change-form.tsx` (new)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests pass after implementing each task
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All forms use native HTML with browser defaults (no custom CSS styling)
- All components follow WCAG 2.1 AA accessibility guidelines
- Progressive enhancement: forms work without JavaScript
