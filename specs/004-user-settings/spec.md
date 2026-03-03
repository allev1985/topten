# Feature Specification: User Settings Page

**Feature Branch**: `004-user-settings`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "Build out the specification for the settings of the app. The settings will enable: 1. Update slug to a personalised slug for the main lists page. 2. Update first and last name. 3. Update password. All accessible from the dashboard settings section as a single page with different labelled sections."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Update Vanity Slug (Priority: P1)

An authenticated user navigates to the dashboard settings page. They see their current vanity slug displayed in the "Profile URL" section. They type a new personalised slug (e.g. `johndoe`) and submit. The system validates the slug is unique across all users. If unique, the slug is saved and the page refreshes to show the new slug and updated profile URL. The user can immediately share or visit `/<new-slug>` to see their public lists page.

**Why this priority**: The slug is core to a user's public identity in the app and is the most personalised piece of their profile. Getting this right first ensures value is delivered to users who want a custom URL.

**Independent Test**: Can be fully tested by navigating to `/dashboard/settings`, entering a new slug value, submitting and verifying the success state and updated URL preview. If the slug is already taken, a human-friendly inline error message must be shown.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the Settings page, **When** they enter a slug that is not used by any other user and submit, **Then** the slug is saved, the page refreshes, and the new slug is shown in the "Profile URL" field.
2. **Given** an authenticated user is on the Settings page, **When** they enter a slug that is already taken by another user and submit, **Then** the save is rejected and a human-friendly inline error message reads "This URL is already taken. Please choose a different one."
3. **Given** an authenticated user is on the Settings page, **When** they enter a slug containing invalid characters (not lowercase alphanumeric or hyphens) and submit, **Then** a human-friendly inline validation error is shown before the server is called.
4. **Given** an authenticated user is on the Settings page, **When** they submit their current existing slug unchanged, **Then** the save succeeds (no false conflict with self).

---

### User Story 2 - Update Display Name (Priority: P2)

An authenticated user navigates to the dashboard settings page. They see a "Profile" section containing a single "Name" field pre-populated with their current display name. They update it and submit. The page re-renders immediately to reflect the updated name.

**Why this priority**: Name is fundamental personal information and a natural companion to the slug. It is straightforward to implement as a single-field profile update with no schema changes required.

**Independent Test**: Can be fully tested by navigating to `/dashboard/settings`, editing the Name field, submitting, and verifying the page re-renders with the new value. No external dependencies required.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the Settings page, **When** they update their name and submit, **Then** the name is saved and the settings page re-renders displaying the updated value.
2. **Given** an authenticated user is on the Settings page, **When** they submit with an empty Name field, **Then** a human-friendly inline validation error is shown and the form is not submitted.
3. **Given** an authenticated user has just saved a new name, **When** they navigate away and return to settings, **Then** the updated name is still shown in the Name field.

---

### User Story 3 - Update Password (Priority: P3)

An authenticated user navigates to the dashboard settings page. They see a "Security" section with fields for their current password, a new password, and a confirmation of the new password. They complete all three fields and submit. The password is verified and updated. A success confirmation is shown inline on the settings page.

**Why this priority**: Password change is important for account security but the core infrastructure (`passwordChangeAction`, `PasswordChangeForm`) already exists at `settings/password/`. The primary work is surfacing it on the unified settings page.

**Independent Test**: Can be fully tested by navigating to `/dashboard/settings`, entering the current password and a new valid password, submitting and verifying the success state. Incorrect current password must show an error.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on the Settings page, **When** they enter their correct current password, a valid new password, and a matching confirmation, **Then** the password is updated and a success message is shown inline.
2. **Given** an authenticated user is on the Settings page, **When** they enter an incorrect current password, **Then** a human-friendly inline error is shown: "Current password is incorrect."
3. **Given** an authenticated user is on the Settings page, **When** the new password and confirmation do not match, **Then** a human-friendly inline validation error is shown before the server is called.
4. **Given** an authenticated user is on the Settings page, **When** the new password does not meet the minimum requirements (min 12 chars, uppercase, lowercase, digit, symbol), **Then** a human-friendly inline validation error lists the specific unmet requirements in plain language.

---

### Edge Cases

- What happens when a slug update request races with another user registering the same slug simultaneously? The DB unique constraint (`users_vanity_slug_idx`) is the final arbiter and must surface as a "slug taken" error.
- What happens when a user has no existing `vanitySlug` (legacy or incomplete profile)? The form should handle empty initial state gracefully and require the user to set one.
- The `users` table stores a single `name varchar(255)` column. The settings page uses this field directly — no schema migration is required. The "Name" input maps 1-to-1 to `users.name`.
- What happens if the user submits the settings page while offline or with a network error? Each section should show an appropriate generic error and the form should remain editable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard **MUST** expose a single settings page at `/dashboard/settings` accessible from the dashboard navigation.
- **FR-002**: The settings page **MUST** display three labelled sections: "Profile URL" (slug), "Profile" (name), and "Security" (password), each as an independently submittable form section.
- **FR-003**: The "Profile URL" section **MUST** allow the authenticated user to view and update their `vanitySlug` (max 50 chars, lowercase alphanumeric and hyphens only).
- **FR-004**: The system **MUST** validate that the new slug is unique across all users before persisting; the current user's own slug **MUST NOT** be treated as a conflict.
- **FR-005**: The system **MUST** return a human-friendly inline error message when a submitted slug is already in use by another user.
- **FR-006**: The "Profile" section **MUST** allow the authenticated user to update their display name via a single "Name" text field, writing directly to the existing `users.name` column (varchar 255). No schema migration is required.
- **FR-007**: After a successful name update the settings page **MUST** re-render and display the new values without a full navigation reload.
- **FR-008**: The "Security" section **MUST** allow the authenticated user to change their password by providing their current password, a new password, and a confirmation.
- **FR-009**: The system **MUST** verify the current password before accepting a password change.
- **FR-010**: All three form sections **MUST** display human-friendly inline success and error feedback without navigating away from the settings page. Error messages **MUST** be written in plain language, avoid technical jargon, and clearly describe what went wrong and (where applicable) how to correct it.
- **FR-011**: Each form section **MUST** be independently submittable (submitting slug does not affect name or password state).
- **FR-012**: The settings page **MUST** be protected by authentication middleware; unauthenticated users **MUST** be redirected to `/login`.

### Key Entities

- **User Profile (`users` table)**: Represents the application-level profile for an authenticated user. Key attributes: `id` (FK to auth.users), `name` varchar(255) (display name, single field), `vanitySlug` (unique, max 50 chars), `updatedAt`.
- **Auth User (`auth.users`)**: Supabase Auth record owning credentials. Password is managed via Supabase Auth — not stored in the application `users` table.
- **Vanity Slug**: A globally unique, URL-safe string that forms the path for the user's public lists page (e.g. `/<vanitySlug>`). Validated for uniqueness at the application layer before DB write.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can update their vanity slug from the settings page in under 30 seconds, including validation feedback.
- **SC-002**: When a duplicate slug is submitted, a human-friendly error message is displayed within the same page interaction — no page navigation occurs.
- **SC-003**: After a successful name update, the updated name is visible on the settings page within 1 second of submission (client-side state update or server re-render).
- **SC-004**: The password change flow on the settings page reuses the existing `passwordChangeAction` and `PasswordChangeForm` infrastructure with no duplication of business logic.
- **SC-005**: All three settings sections are accessible and functional on a single route (`/dashboard/settings`) — no separate sub-routes required for slug or name.
- **SC-006**: The slug uniqueness check prevents 100% of duplicate slug assignments at the application layer (DB constraint provides a second safety net).

## Assumptions

- The existing `passwordChangeAction` server action and `PasswordChangeForm` component will be reused or composed into the unified settings page; they do not need to be rebuilt.
- A slug is considered valid if it matches the pattern `^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$` (2–50 chars, starts and ends with alphanumeric, hyphens allowed in between). This is consistent with the existing `vanity_slug` column constraint (`length: 50`).
- The public lists URL pattern is `/<vanitySlug>` (root-level, not nested under a path prefix).
- The settings page will be accessible from the existing dashboard navigation/sidebar; no new navigation entry point design is required as part of this spec.
- Password validation rules remain as already defined: minimum 12 characters, at least one uppercase letter, one lowercase letter, one digit, and one symbol.
- The `name` field uses the existing `users.name` varchar(255) column directly — no DB schema changes are in scope for this feature.
