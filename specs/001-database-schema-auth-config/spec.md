# Feature Specification: Database Schema & Supabase Auth Configuration

**Feature Branch**: `001-database-schema-auth-config`  
**Created**: 2025-11-29  
**Status**: Draft  
**Input**: Task 1.2: Database Schema & Supabase Auth Configuration - Configure Supabase Auth settings (email confirmation, password requirements), Set up email templates for verification and password reset, Configure Row Level Security (RLS) policies for user data, Create any additional user profile tables if needed.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - New User Signs Up with Email Verification (Priority: P1)

As a new user, I want to create an account and verify my email address so that I can access the platform with a secure, validated identity.

**Why this priority**: Email verification is the foundational security requirement that ensures users are who they claim to be. Without verified emails, the platform cannot send important notifications or enable password recovery.

**Independent Test**: Can be fully tested by completing the signup flow, receiving a verification email, clicking the verification link, and confirming the account is activated.

**Acceptance Scenarios**:

1. **Given** a visitor is on the signup page, **When** they submit a valid email and password meeting complexity requirements, **Then** an account is created in pending state and a verification email is sent.
2. **Given** a user has received a verification email, **When** they click the verification link, **Then** their account is activated and they can sign in.
3. **Given** a user attempts to sign in without email verification, **When** they submit valid credentials, **Then** they are informed that email verification is required.
4. **Given** a user submits a password shorter than 12 characters, **When** they attempt to create an account, **Then** they receive an error message explaining the minimum password length requirement.
5. **Given** a user submits a password without lowercase letters, uppercase letters, digits, and symbols, **When** they attempt to create an account, **Then** they receive an error message explaining the complexity requirements.

---

### User Story 2 - User Resets Forgotten Password (Priority: P2)

As a registered user who has forgotten my password, I want to receive a password reset email so that I can regain access to my account securely.

**Why this priority**: Password reset is critical for user retention and security. Users who cannot recover their accounts will abandon the platform.

**Independent Test**: Can be fully tested by requesting a password reset, receiving the reset email, clicking the reset link, and successfully setting a new password.

**Acceptance Scenarios**:

1. **Given** a user has forgotten their password, **When** they request a password reset with their registered email, **Then** a password reset email is sent to that address.
2. **Given** a user receives a password reset email, **When** they click the reset link, **Then** they are directed to a secure page to enter a new password.
3. **Given** a user is on the password reset page, **When** they enter a new password meeting complexity requirements, **Then** their password is updated and they can sign in with the new password.
4. **Given** a user enters a password that does not meet requirements, **When** they attempt to reset their password, **Then** they receive a clear error message explaining the requirements.
5. **Given** a password reset link, **When** more than 1 hour has passed, **Then** the link is no longer valid and the user must request a new reset.

---

### User Story 3 - User Profile Data is Protected (Priority: P3)

As a platform user, I want my profile data to be protected so that only I can view and edit my personal information, and other users cannot access my private data.

**Why this priority**: Row Level Security is essential for data privacy and compliance. Users must trust that their data is protected from unauthorized access.

**Independent Test**: Can be fully tested by attempting to access or modify another user's profile data and verifying the request is denied.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they request their own profile data, **Then** the system returns their complete profile information.
2. **Given** an authenticated user, **When** they attempt to access another user's private profile data, **Then** the system denies access.
3. **Given** an authenticated user, **When** they update their own profile information, **Then** the changes are saved successfully.
4. **Given** an authenticated user, **When** they attempt to update another user's profile, **Then** the system denies the modification.
5. **Given** an unauthenticated request, **When** it attempts to access any user's private data, **Then** the system denies access.

---

### User Story 4 - Email Templates Display Correctly (Priority: P4)

As a user receiving system emails, I want the verification and password reset emails to be professionally formatted and clearly communicate the required action so that I can complete the process easily.

**Why this priority**: Well-designed email templates improve user experience and reduce support requests. Poor email formatting leads to confusion and failed account activations.

**Independent Test**: Can be fully tested by triggering each email type and visually verifying the template renders correctly across major email clients.

**Acceptance Scenarios**:

1. **Given** a new user signs up, **When** they receive the verification email, **Then** the email clearly displays the platform branding, verification instructions, and a prominent call-to-action button.
2. **Given** a user requests a password reset, **When** they receive the reset email, **Then** the email clearly displays the platform branding, reset instructions, and a prominent call-to-action button.
3. **Given** an email is sent, **When** viewed on mobile devices, **Then** the email layout is responsive and readable.
4. **Given** an email is sent, **When** viewed in plain text email clients, **Then** the essential information and links are still accessible.

---

### Edge Cases

- What happens when a user attempts to register with an email address already in use?
- How does the system handle verification links that have been used more than once?
- What happens when a user requests multiple password resets in quick succession?
- How does the system handle email delivery failures (bounced emails)?
- What happens when a user's session expires during a security-sensitive operation?
- How does the system handle concurrent login attempts from different devices?
- What happens when RLS policies encounter database connection issues?
- How does the system handle profile updates when the user's session has expired?

## Requirements _(mandatory)_

### Functional Requirements

**Authentication Settings**

- **FR-001**: System MUST require email verification for all new account registrations before allowing sign-in.
- **FR-002**: System MUST enforce a minimum password length of 12 characters.
- **FR-003**: System MUST enforce password complexity requiring lowercase letters, uppercase letters, digits, and symbols.
- **FR-004**: System MUST send a verification email immediately upon account registration.
- **FR-005**: System MUST send a password reset email when requested by a user with a registered email address.

**Email Templates**

- **FR-006**: System MUST provide a branded email template for account verification emails.
- **FR-007**: System MUST provide a branded email template for password reset emails.
- **FR-008**: Email templates MUST include clear call-to-action buttons with the appropriate verification or reset links.
- **FR-009**: Email templates MUST be responsive and render correctly on mobile devices.
- **FR-010**: Email templates MUST include plain text alternatives for accessibility.

**Row Level Security (RLS)**

- **FR-011**: System MUST implement RLS policies that restrict users to only viewing their own profile data.
- **FR-012**: System MUST implement RLS policies that restrict users to only modifying their own profile data.
- **FR-013**: System MUST deny all unauthenticated requests to access user profile data.
- **FR-014**: RLS policies MUST be applied to all tables containing user-specific data.

**User Profile Schema**

- **FR-015**: System MUST link user profile data to the Supabase Auth user identifier.
- **FR-016**: System MUST support storing user profile metadata including display name, bio, and avatar URL.
- **FR-017**: System MUST support the existing vanity slug system for custom user URLs.
- **FR-018**: System MUST maintain data integrity between the auth system and profile tables.

**Testing Requirements**

- **FR-019**: Unit tests MUST achieve greater than 65% code coverage for authentication-related code.
- **FR-020**: All unit tests MUST pass without failures.
- **FR-021**: Code MUST have no linting errors.

### Key Entities

- **User Profile**: Represents a user's public and private profile information, linked to their authentication identity. Key attributes include unique identifier (linked to auth), email, display name, bio, avatar URL, vanity slug for custom URLs, and timestamps for creation, updates, and soft deletion.

- **Authentication Session**: Represents an active user session managed by the authentication system. Key attributes include session identifier, user reference, access token expiration, and refresh token status.

- **Email Template**: Represents a system email template for user communications. Key types include verification email and password reset email, each containing subject line, body content with dynamic placeholders, and branding elements.

## Assumptions

- Supabase Auth is the authentication provider (established in Task 1.1).
- The existing `users` table in the Drizzle schema will be linked to Supabase Auth users via the `id` field.
- Email delivery is handled by Supabase's built-in email service or a configured SMTP provider.
- The current minimum password length of 6 characters in config.toml needs to be increased to 12.
- The current `enable_confirmations = false` setting needs to be changed to `true`.
- The password complexity setting will use `lower_upper_letters_digits_symbols` as the requirement.
- Password reset links expire after 1 hour (Supabase default OTP expiry).
- The application follows Next.js App Router patterns as established in the existing codebase.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: New users complete email verification within 10 minutes of receiving the verification email (measured by time between email sent and account activation).
- **SC-002**: Password reset requests result in successful password changes 95% of the time when the user follows the email link.
- **SC-003**: Zero unauthorized data access attempts succeed when RLS policies are active (100% of unauthorized requests are blocked).
- **SC-004**: All email templates render correctly in the top 5 email clients (Gmail, Outlook, Apple Mail, Yahoo Mail, and mobile native clients).
- **SC-005**: Unit test coverage exceeds 65% for all authentication-related modules.
- **SC-006**: All unit tests pass without failures in the CI/CD pipeline.
- **SC-007**: Zero linting errors are reported by the project's configured linters.
- **SC-008**: Database migration scripts execute successfully without errors on fresh and existing database instances.
