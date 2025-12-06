# Feature Specification: Multi-Auth Password Reset Endpoint

**Feature Branch**: `002-multi-auth-password-reset`  
**Created**: 2025-11-30  
**Status**: Draft  
**Input**: User description: "Implement multiple authentication methods in the password reset endpoint to support PKCE code authentication, OTP token verification, and existing session authentication, with automatic sign-out after successful password reset."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Password Reset via Email Link (PKCE) (Priority: P1)

A user who has forgotten their password clicks the password reset link in their email. The link contains a PKCE code that authenticates them for the password reset operation. After successfully setting a new password, they are signed out and must log in with their new credentials.

**Why this priority**: This is the primary password reset flow that most users will experience. It's the standard "forgot password" journey and must work reliably for users who cannot access their account.

**Independent Test**: Can be fully tested by requesting a password reset email, clicking the link, setting a new password, and verifying the user can log in with the new password.

**Acceptance Scenarios**:

1. **Given** a user has requested a password reset and received an email with a valid PKCE code link, **When** they click the link and submit a valid new password, **Then** their password is updated and they are signed out.
2. **Given** a user has a valid PKCE code, **When** they submit an invalid password (doesn't meet requirements), **Then** they see validation errors and can retry with a valid password.
3. **Given** a user has an expired PKCE code, **When** they attempt to reset their password, **Then** they see an error indicating the link has expired and should request a new one.
4. **Given** a user has an invalid PKCE code, **When** they attempt to reset their password, **Then** they see a generic authentication error (not revealing if code was invalid vs expired).

---

### User Story 2 - Password Reset via OTP Token (Priority: P2)

A user who has clicked a password reset link with an OTP token (token_hash) can authenticate and reset their password. This supports alternative email verification flows where the token is embedded differently in the URL.

**Why this priority**: Supports an alternative authentication flow that some email clients or configurations may use. Important for complete coverage but secondary to the primary PKCE flow.

**Independent Test**: Can be fully tested by generating a password reset with OTP token, submitting the token with a new password, and verifying the user can log in with the new password.

**Acceptance Scenarios**:

1. **Given** a user has a valid OTP token_hash from a password reset email, **When** they submit the token with a valid new password, **Then** their password is updated and they are signed out.
2. **Given** a user has an expired OTP token, **When** they attempt to reset their password, **Then** they see an error indicating the link has expired and should request a new one.
3. **Given** a user has an invalid OTP token, **When** they attempt to reset their password, **Then** they see a generic authentication error.

---

### User Story 3 - Password Reset for Authenticated User (Priority: P3)

A user who is already logged in can change their password directly. This supports users who want to update their password while already authenticated.

**Why this priority**: This flow is already partially implemented. It's the least critical for the "forgot password" use case since users are already authenticated, but completes the endpoint's functionality.

**Independent Test**: Can be fully tested by logging in, submitting a new password while authenticated, and verifying the user is signed out and can log in with the new password.

**Acceptance Scenarios**:

1. **Given** a user is already authenticated, **When** they submit a valid new password, **Then** their password is updated and they are signed out.
2. **Given** a user's session has expired mid-flow, **When** they attempt to update their password, **Then** they see an authentication error.

---

### User Story 4 - Post-Reset Sign Out (Priority: P1)

After any successful password reset (via any authentication method), the user is automatically signed out. This ensures security by invalidating old sessions and requiring the user to log in with their new credentials.

**Why this priority**: Critical security requirement. Ensures that password reset invalidates potentially compromised sessions and forces re-authentication.

**Independent Test**: Can be tested by completing any password reset flow and verifying the user's session is invalidated and they are redirected to login.

**Acceptance Scenarios**:

1. **Given** a user has successfully reset their password via any method, **When** the password update completes, **Then** the user's session is invalidated and they are redirected to the login page.
2. **Given** a user has other active sessions, **When** they reset their password, **Then** all sessions are invalidated (handled by Supabase).

---

### Edge Cases

- What happens when a user provides both a PKCE code and OTP token? The system prioritizes PKCE code and ignores the OTP token.
- What happens when a user provides authentication credentials but no new password? The system returns a validation error for the missing password.
- What happens when the password reset completes but sign-out fails? The password is still updated; sign-out failure is logged but doesn't cause the operation to fail.
- What happens when a user rapidly submits multiple password reset requests? Rate limiting (handled by Supabase) prevents abuse.
- What happens when a user uses an old reset link after already resetting their password? The code/token is already consumed and returns an authentication error.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST accept password reset requests with a PKCE code for authentication.
- **FR-002**: System MUST accept password reset requests with an OTP token_hash and type for authentication.
- **FR-003**: System MUST accept password reset requests from users with an existing authenticated session.
- **FR-004**: System MUST validate authentication credentials in priority order: PKCE code first, then OTP token, then existing session. When multiple authentication methods are present in a single request, only the highest-priority method is used.
- **FR-005**: System MUST validate the new password meets ALL security requirements simultaneously: minimum 12 characters AND at least one uppercase letter AND at least one lowercase letter AND at least one number AND at least one special character.
- **FR-006**: System MUST sign out the user after a successful password update.
- **FR-007**: System MUST return a generic authentication error for invalid or expired codes/tokens (not revealing which).
- **FR-008**: System MUST return appropriate error messages for validation failures (password requirements not met).
- **FR-009**: System MUST return an authentication error when no valid authentication method is provided.
- **FR-010**: System MUST log password reset operations for security auditing (without logging sensitive data).

### Key Entities

- **PKCE Code**: A single-use authorization code from the password reset email link, exchanged for a session to authorize password updates.
- **OTP Token**: A token hash from email verification that can be verified to establish an authenticated session.
- **User Session**: An authenticated session representing a logged-in user, validated against the authentication service.
- **Password**: The user's credential, subject to security requirements (length, complexity).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete password reset via PKCE code in under 30 seconds after clicking the email link.
- **SC-002**: 100% of successful password resets result in user sign-out (no sessions remain active).
- **SC-003**: Invalid or expired authentication credentials return errors within 2 seconds.
- **SC-004**: Password validation errors clearly indicate which requirements are not met.
- **SC-005**: System maintains 99.9% success rate for valid password reset attempts.
- **SC-006**: Zero sensitive data (passwords, tokens, codes) is logged in system logs.

## Assumptions

- Supabase handles token expiration and rate limiting automatically.
- PKCE codes are single-use and time-limited (typically 5-10 minutes).
- OTP tokens follow Supabase's standard expiration policy.
- The client (form/page) is responsible for extracting code/token from URL parameters and passing to the API.
- Sign-out invalidates all sessions for the user (Supabase default behavior).
