# Feature Specification: Login & Logout Endpoints

**Feature Branch**: `001-login-logout`  
**Created**: 2025-11-29  
**Status**: Draft  
**Input**: Task 2.2: Login & Logout Endpoints - Create login and logout API routes with redirectTo validation, redirect URL validation, and session cookie management for YourFavs authentication system.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Login with Redirect (Priority: P1)

As a registered user, I want to log in to my account with my email and password so that I can access my dashboard and manage my lists. After logging in, I should be redirected to my originally intended destination or the dashboard.

**Why this priority**: Login is the fundamental authentication action that enables users to access protected content. Without login functionality, no user can access their personalized content or manage their lists.

**Independent Test**: Can be fully tested by submitting valid credentials via the login form and verifying the user receives a session and is redirected to the appropriate destination.

**Acceptance Scenarios**:

1. **Given** a registered user with verified email, **When** the user submits correct email and password, **Then** the system creates a session and redirects to the dashboard (or specified redirectTo destination).

2. **Given** a user accessing a protected page while unauthenticated, **When** the user successfully logs in, **Then** the system redirects the user to the originally requested page (preserved via redirectTo parameter).

3. **Given** any login request with valid credentials, **When** the login succeeds, **Then** the session tokens are stored in secure HTTP-only cookies.

---

### User Story 2 - User Logout (Priority: P1)

As a logged-in user, I want to log out of my account so that my session is securely ended and my account is protected from unauthorized access on shared devices.

**Why this priority**: Logout is equally critical as login for security. Users must be able to end their sessions to protect their accounts, especially on shared or public devices.

**Independent Test**: Can be fully tested by calling the logout endpoint while authenticated and verifying the session is invalidated and cookies are cleared.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** the user requests to logout, **Then** the system invalidates the session and clears all session cookies.

2. **Given** an authenticated user who has logged out, **When** they attempt to access a protected resource, **Then** they are redirected to the login page.

---

### User Story 3 - Invalid Login Attempt (Priority: P1)

As a user attempting to log in, if I enter incorrect credentials, I want to receive clear feedback that my login failed without revealing whether the email exists in the system.

**Why this priority**: Security is paramount. Invalid login handling must prevent user enumeration attacks while still providing useful feedback to legitimate users who may have mistyped their credentials.

**Independent Test**: Can be fully tested by submitting invalid credentials and verifying the response message does not reveal whether the email exists.

**Acceptance Scenarios**:

1. **Given** a user with incorrect password, **When** the user attempts to log in, **Then** the system returns a generic error message that does not reveal whether the email exists.

2. **Given** an email that is not registered, **When** a login attempt is made, **Then** the system returns the same generic error message as for wrong password.

3. **Given** any failed login attempt, **When** the attempt fails, **Then** the system logs the failed attempt for security monitoring (without logging the password).

---

### User Story 4 - Secure Redirect Validation (Priority: P2)

As a security-conscious platform, the system must validate redirect URLs to prevent open redirect attacks that could be used for phishing or credential theft.

**Why this priority**: Redirect validation is critical for security but is a supporting feature to the core login flow. Open redirect vulnerabilities are common attack vectors that must be prevented.

**Independent Test**: Can be fully tested by providing various malicious redirect URLs and verifying they are rejected or sanitized to safe defaults.

**Acceptance Scenarios**:

1. **Given** a login request with a relative path redirectTo (e.g., `/dashboard/my-lists`), **When** login succeeds, **Then** the user is redirected to that path.

2. **Given** a login request with an absolute external URL redirectTo, **When** login succeeds, **Then** the system ignores the malicious URL and redirects to the default dashboard.

3. **Given** a login request with protocol-relative URL (`//evil.com`), **When** login succeeds, **Then** the system rejects it and redirects to the default dashboard.

4. **Given** a login request with `javascript:` or `data:` URL scheme, **When** login succeeds, **Then** the system rejects it and redirects to the default dashboard.

5. **Given** a login request with no redirectTo parameter, **When** login succeeds, **Then** the user is redirected to the default dashboard.

---

### Edge Cases

- What happens when a user attempts to login with an unverified email address?
  - The system should return an appropriate error indicating the email needs to be verified before login is allowed.

- What happens when session cookies are tampered with or corrupted?
  - The system should treat tampered cookies as invalid and require re-authentication.

- What happens when a user attempts to logout without an active session?
  - The system should handle gracefully and return a success response (idempotent operation).

- What happens when redirectTo contains URL-encoded malicious characters?
  - The system should decode and validate the URL, rejecting malicious patterns even when encoded.

- What happens when the login request body is malformed or missing required fields?
  - The system should return a validation error with details about the missing/invalid fields.

## Requirements *(mandatory)*

### Functional Requirements

**Login Endpoint (POST /api/auth/login)**

- **FR-001**: System MUST accept login requests containing email, password, and optional redirectTo fields.
- **FR-002**: System MUST validate email format and password presence before attempting authentication.
- **FR-003**: System MUST authenticate users against stored credentials and return session tokens on success.
- **FR-004**: System MUST store session tokens in HTTP-only, Secure, SameSite=Lax cookies.
- **FR-005**: System MUST return the validated redirectTo URL (or default) in the success response.
- **FR-006**: System MUST return identical generic error messages for invalid email and wrong password to prevent user enumeration.
- **FR-007**: System MUST log all login attempts (success and failure) with masked email addresses.
- **FR-008**: System MUST reject login attempts for users with unverified email addresses.

**Logout Endpoint (POST /api/auth/logout)**

- **FR-009**: System MUST invalidate the current user session on logout request.
- **FR-010**: System MUST clear all session-related cookies on logout.
- **FR-011**: System MUST return a success response regardless of prior authentication state (idempotent).
- **FR-012**: System MUST log logout events for security auditing.

**Redirect URL Validation**

- **FR-013**: System MUST only allow relative paths starting with `/` for redirectTo.
- **FR-014**: System MUST reject absolute URLs unless they match the application's configured domain.
- **FR-015**: System MUST reject protocol-relative URLs (starting with `//`).
- **FR-016**: System MUST reject URLs with `javascript:` or `data:` schemes.
- **FR-017**: System MUST default to `/dashboard` when redirectTo is invalid, missing, or rejected.
- **FR-018**: System MUST decode and validate URL-encoded redirectTo values.

**Security Requirements**

- **FR-019**: System MUST NOT expose raw passwords in any logs or error responses.
- **FR-020**: System MUST NOT reveal whether a specific email is registered in error responses.
- **FR-021**: System MUST prepare hooks for future rate limiting implementation.

### Key Entities

- **Session**: Represents an authenticated user's session containing access and refresh tokens, associated with a user and having an expiration time.
- **User Credentials**: The email and password combination used for authentication, with email being case-insensitive.
- **Redirect URL**: An optional destination URL that users should be sent to after successful login, subject to security validation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the login process in under 3 seconds from form submission to dashboard landing.
- **SC-002**: 100% of open redirect attack patterns (protocol-relative, javascript:, data:, external absolute URLs) are blocked and default to safe redirect.
- **SC-003**: Failed login attempts do not reveal whether an email address is registered in the system (verified through identical response times and messages).
- **SC-004**: Logout successfully clears all session data, preventing access to protected resources without re-authentication.
- **SC-005**: All authentication events (login success, login failure, logout) are logged for security auditing.
- **SC-006**: Session cookies use HTTP-only, Secure, and SameSite=Lax attributes to protect against XSS and CSRF attacks.
- **SC-007**: Unit and integration test coverage exceeds 65% for the login/logout functionality.

## Assumptions

- Users have already completed the signup and email verification flow (Task 2.1 is complete).
- Supabase Auth is properly configured and the server client utilities exist (Task 1.1 is complete).
- The existing AuthError class and error handling patterns from `/lib/auth/errors.ts` will be reused.
- The existing Zod validation patterns from `/schemas/auth.ts` will be extended for login.
- The application domain for redirect validation can be determined from environment variables or request headers.
- Rate limiting will be implemented in a future phase; this task only adds preparation hooks.
