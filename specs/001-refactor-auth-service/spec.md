# Feature Specification: Refactor Password Actions to Use Auth Service

**Feature Branch**: `001-refactor-auth-service`  
**Created**: 2025-12-07  
**Status**: Draft  
**Input**: User description: "Create a specification for refactoring password-related server actions to use the Auth Service instead of HTTP fetch calls."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Password Reset Request (Priority: P1)

A user who has forgotten their password visits the password reset page, enters their email address, and submits the form to receive a password reset link. The system processes the request using the Auth Service instead of making HTTP calls, providing the same reliable behavior with better performance and maintainability.

**Why this priority**: This is the entry point for the password reset flow and the most commonly used password-related action. Users depend on this to regain access to their accounts.

**Independent Test**: Can be fully tested by submitting a password reset request form with a valid email address and verifying that the request is processed correctly (always returns success for enumeration protection) without making HTTP fetch calls.

**Acceptance Scenarios**:

1. **Given** a user on the password reset page, **When** they enter a valid email address and submit the form, **Then** the system returns a success message indicating an email has been sent (if account exists) and uses the Auth Service `resetPassword()` method instead of HTTP fetch
2. **Given** a user on the password reset page, **When** they enter an invalid email format, **Then** the system returns field validation errors without making any service calls
3. **Given** a user on the password reset page, **When** they submit the form for a non-existent email, **Then** the system still returns success (enumeration protection) using the Auth Service
4. **Given** the Auth Service encounters an error, **When** processing a password reset request, **Then** the system still returns success to the user (enumeration protection) but logs the error internally

---

### User Story 2 - Password Update via Reset Link (Priority: P1)

A user clicks a password reset link from their email, arrives at the password update page with a token, enters their new password, and submits the form to set their new password. The system updates their password using the Auth Service and redirects them to login.

**Why this priority**: This completes the password reset flow initiated in Story 1. Without this, users cannot regain access to their accounts.

**Independent Test**: Can be fully tested by submitting a password update form with a valid token, new password, and confirmation, then verifying the password is updated via the Auth Service `updatePassword()` method and the user is redirected to login.

**Acceptance Scenarios**:

1. **Given** a user with a valid reset token on the password update page, **When** they enter a new password and confirmation that match and meet requirements, **Then** the system updates their password via Auth Service `updatePassword()` with token parameters, signs them out, and redirects to login
2. **Given** a user on the password update page, **When** their passwords don't match, **Then** the system returns a field error without making any service calls
3. **Given** a user on the password update page, **When** their new password doesn't meet requirements (length, complexity), **Then** the system returns field validation errors without making any service calls
4. **Given** a user with an expired reset token, **When** they submit the password update form, **Then** the system returns an error message indicating the link has expired (detected via Auth Service error helper `isExpiredTokenError()`)
5. **Given** a user with an invalid or tampered token, **When** they submit the password update form, **Then** the system returns an authentication error
6. **Given** a logged-in user on the password update page without a token, **When** they submit a new password, **Then** the system updates their password using their existing session via Auth Service `updatePassword()` without token parameters

---

### User Story 3 - Password Change for Authenticated Users (Priority: P2)

An authenticated user visits their account settings, navigates to the password change section, enters their current password and new password, and submits the form to change their password. The system verifies their current password and updates to the new one using Auth Service methods.

**Why this priority**: This allows users to proactively change their password for security reasons. It's lower priority than the reset flow because users can still use password reset as an alternative.

**Independent Test**: Can be fully tested by logging in, navigating to password change, submitting the form with current and new passwords, and verifying the password is changed via Auth Service methods without HTTP fetch calls.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the password change page, **When** they enter their correct current password and a new password that meets requirements, **Then** the system verifies the current password via Auth Service `login()`, updates the password via Auth Service `updatePassword()`, and returns success
2. **Given** an authenticated user on the password change page, **When** they enter an incorrect current password, **Then** the system returns an error message indicating the current password is incorrect (detected via Auth Service error handling)
3. **Given** an authenticated user on the password change page, **When** their new password doesn't match the confirmation, **Then** the system returns a field error without making any service calls
4. **Given** an authenticated user on the password change page, **When** their new password doesn't meet requirements, **Then** the system returns field validation errors without making any service calls
5. **Given** an unauthenticated user, **When** they attempt to access the password change page, **Then** the system detects no session via Auth Service `getSession()` and returns an authentication error
6. **Given** an authenticated user whose session expires during password change, **When** they submit the form, **Then** the system detects the expired session via Auth Service and returns an authentication error

---

### Edge Cases

- What happens when the Auth Service is temporarily unavailable during a password operation?
- How does the system handle concurrent password change attempts from the same user?
- What happens if a user submits multiple password reset requests in quick succession?
- How does the system handle password updates when the user's session is revoked between form load and submission?
- What happens when a user tries to use the same password they currently have when changing their password?
- How does the system handle password reset tokens that are valid but for a different user than the current session (if any)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the HTTP fetch call in `passwordResetRequestAction()` with a direct call to Auth Service `resetPassword()` method
- **FR-002**: System MUST replace the HTTP fetch call in `passwordUpdateAction()` with a direct call to Auth Service `updatePassword()` method
- **FR-003**: System MUST replace all three HTTP fetch calls in `passwordChangeAction()` with direct calls to Auth Service methods (`getSession()`, `login()`, `updatePassword()`)
- **FR-004**: System MUST remove all `getCookieHeader()` calls from the three password actions since the Auth Service handles cookies automatically via the Supabase client
- **FR-005**: System MUST maintain existing validation logic for all three actions (Zod schema validation, password matching, etc.)
- **FR-006**: System MUST maintain enumeration protection in `passwordResetRequestAction()` (always return success regardless of whether email exists)
- **FR-007**: System MUST maintain error handling behavior, using Auth Service error helpers (`isEmailNotVerifiedError()`, `isExpiredTokenError()`, `isSessionError()`) instead of HTTP status codes
- **FR-008**: System MUST preserve existing error messages shown to users for consistency
- **FR-009**: System MUST maintain the redirect to login after successful password update in `passwordUpdateAction()`
- **FR-010**: System MUST support both token-based authentication (password reset flow) and session-based authentication (authenticated user flow) in `passwordUpdateAction()`
- **FR-011**: System MUST verify the current password in `passwordChangeAction()` by calling Auth Service `login()` instead of making an HTTP call to the login API
- **FR-012**: System MUST preserve all existing TypeScript types and action signatures (no breaking changes to action interfaces)
- **FR-013**: System MUST remove the `getCookieHeader()` helper function if it is no longer used by any other actions after this refactoring
- **FR-014**: All existing tests MUST be updated to mock Auth Service methods instead of HTTP fetch calls
- **FR-015**: System MUST handle Auth Service errors gracefully, mapping them to appropriate user-facing error messages
- **FR-016**: System MUST maintain the same return types (`ActionState<T>`) for all three actions

### Key Entities

This refactoring does not introduce new entities. It modifies the internal implementation of existing server actions to use the Auth Service layer instead of HTTP calls. The entities involved are:

- **Auth Service**: Centralized authentication service at `src/lib/auth/service.ts` that provides methods for authentication operations
- **Server Actions**: Password-related server actions in `src/actions/auth-actions.ts` that will be refactored to use the Auth Service
- **Auth Service Errors**: Error handling utilities at `src/lib/auth/service/errors.ts` including `AuthServiceError` class and error helper functions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero HTTP fetch calls remain in `passwordResetRequestAction()`, `passwordUpdateAction()`, and `passwordChangeAction()` functions
- **SC-002**: All three password actions successfully use Auth Service methods directly (verified by code review and test assertions)
- **SC-003**: Zero `getCookieHeader()` calls remain in the three password actions (and the helper is removed if unused elsewhere)
- **SC-004**: All existing user-facing behavior is preserved - users experience no changes in functionality, error messages, or flows
- **SC-005**: TypeScript compilation completes with zero errors
- **SC-006**: ESLint passes with zero errors
- **SC-007**: 100% of existing tests pass after updating to mock Auth Service instead of fetch
- **SC-008**: Code reduction - the refactored actions contain fewer lines of code due to removal of HTTP-related boilerplate (cookie forwarding, HTTP status handling, etc.)
- **SC-009**: All tests verify that Auth Service methods are called with correct parameters instead of fetch being called
- **SC-010**: Error handling correctly uses Auth Service error helpers (`isEmailNotVerifiedError()`, `isExpiredTokenError()`, `isSessionError()`) instead of checking HTTP status codes
