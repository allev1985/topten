# Research: Database Schema & Supabase Auth Configuration

**Feature**: Task 1.2 - Database Schema & Supabase Auth Configuration  
**Date**: 2025-11-29  
**Status**: Complete

## Overview

This document consolidates research findings for configuring Supabase Auth, implementing Row Level Security (RLS) policies, creating email templates, and establishing password validation requirements.

---

## Research Topic 1: Supabase Auth Configuration Best Practices

### Decision: Use Supabase config.toml for Auth Settings

**Rationale**: Supabase CLI manages local development configuration via `config.toml`, which can then be applied to production via Supabase dashboard or CLI commands. This approach ensures consistency between local and production environments.

**Key Configuration Changes**:

| Setting                   | Current Value | New Value                            | Reason                              |
| ------------------------- | ------------- | ------------------------------------ | ----------------------------------- |
| `minimum_password_length` | 6             | 12                                   | FR-002: 12 character minimum        |
| `password_requirements`   | ""            | "lower_upper_letters_digits_symbols" | FR-003: Complexity requirements     |
| `enable_confirmations`    | false         | true                                 | FR-001: Email verification required |

**Alternatives Considered**:

- **Supabase Dashboard Only**: Rejected because changes wouldn't be version-controlled
- **Custom Auth System**: Rejected as it would duplicate Supabase Auth functionality

**Reference**: [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-config)

---

## Research Topic 2: Row Level Security (RLS) Patterns for User Data

### Decision: Use `auth.uid()` for User Ownership Verification

**Rationale**: Supabase provides the `auth.uid()` function which returns the authenticated user's ID from the JWT. This is the standard pattern for user-scoped RLS policies.

**Policy Design Patterns**:

1. **SELECT Policy**: Users can only read their own profile

   ```sql
   CREATE POLICY "Users can view own profile"
   ON users FOR SELECT
   USING (auth.uid() = id);
   ```

2. **UPDATE Policy**: Users can only modify their own profile

   ```sql
   CREATE POLICY "Users can update own profile"
   ON users FOR UPDATE
   USING (auth.uid() = id);
   ```

3. **Public Profile Data**: For publicly visible fields (e.g., vanity_slug, name), a separate policy allows anonymous reads:
   ```sql
   CREATE POLICY "Anyone can view public profiles"
   ON users FOR SELECT
   USING (deleted_at IS NULL);
   ```

**Decision**: Use dual SELECT policies - one for authenticated users viewing their full profile, one for public profile visibility.

**Alternatives Considered**:

- **Single permissive policy**: Rejected because it doesn't distinguish between own profile (full access) and others' profiles (limited fields)
- **Application-level authorization**: Rejected as RLS provides defense-in-depth at the database layer

**Reference**: [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

## Research Topic 3: Linking Drizzle Schema with Supabase Auth

### Decision: Use `auth.users.id` as Foreign Key Reference

**Rationale**: The existing `users` table uses UUID primary keys that should reference `auth.users.id`. Supabase Auth automatically creates users in the `auth.users` table, and our application `users` table extends this with profile data.

**Integration Pattern**:

```sql
-- The users.id column references auth.users.id
ALTER TABLE users
ADD CONSTRAINT users_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id)
ON DELETE CASCADE;
```

**Considerations**:

- **Automatic Profile Creation**: Use a trigger or Supabase Auth hook to create profile on signup
- **Cascade Deletion**: When auth user is deleted, profile should be soft-deleted (not hard-deleted due to referential integrity)

**Decision**: Maintain the existing schema but ensure the foreign key relationship is explicit in migrations.

**Alternatives Considered**:

- **Separate auth_user_id column**: Rejected as it adds unnecessary indirection; using same ID is simpler
- **No foreign key constraint**: Rejected as it could lead to orphaned records

---

## Research Topic 4: Email Template Design for Supabase

### Decision: Use HTML Templates with Supabase Template Variables

**Rationale**: Supabase supports custom email templates with variable substitution using double curly braces (`{{ .Variable }}`).

**Available Variables**:

- `{{ .ConfirmationURL }}` - Email verification link
- `{{ .Token }}` - OTP token if using OTP flow
- `{{ .TokenHash }}` - Hashed token for PKCE flow
- `{{ .SiteURL }}` - Base site URL
- `{{ .RedirectTo }}` - Redirect URL after verification

**Template Requirements**:

1. **Responsive Design**: Mobile-first HTML/CSS
2. **Plain Text Fallback**: Required for accessibility (FR-010)
3. **Clear CTA**: Prominent button for action (FR-008)
4. **Branding**: Consistent with YourFavs visual identity

**Template Structure**:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ .Subject }}</title>
  </head>
  <body style="...">
    <!-- Header with branding -->
    <!-- Main content with CTA button -->
    <!-- Footer with unsubscribe/help links -->
  </body>
</html>
```

**Decision**: Create two templates (confirmation.html, recovery.html) with inline CSS for maximum email client compatibility.

**Alternatives Considered**:

- **Third-party email service (SendGrid, Mailgun)**: Deferred to production setup; local dev uses Supabase's Inbucket
- **External CSS files**: Rejected as most email clients don't support external stylesheets

**Reference**: [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

## Research Topic 5: Password Validation Strategy

### Decision: Server-Side Validation with Client-Side Helper

**Rationale**: Password requirements must be enforced at multiple levels:

1. **Supabase Auth Level**: `config.toml` enforces minimum length and complexity
2. **Server-Side Validation**: Helper function validates before API calls
3. **Client-Side UX**: Real-time feedback for users

**Password Requirements (FR-002, FR-003)**:

- Minimum 12 characters
- At least 1 lowercase letter
- At least 1 uppercase letter
- At least 1 digit
- At least 1 symbol (special character)

**Validation Utility Design**:

```typescript
interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
}

function validatePassword(password: string): PasswordValidationResult;
```

**Decision**: Create a shared validation utility in `src/lib/validation/password.ts` that can be used on both client and server.

**Alternatives Considered**:

- **Only Supabase validation**: Rejected as it doesn't provide user-friendly error messages
- **Third-party library (zxcvbn)**: Deferred; native validation sufficient for MVP
- **Regex-only validation**: Rejected as it's harder to maintain and provide specific error messages

---

## Research Topic 6: Testing Strategy for Authentication

### Decision: Multi-Layer Testing Approach

**Rationale**: Authentication is security-critical and requires comprehensive testing at multiple levels.

**Test Layers**:

| Layer             | Tool                 | Coverage                        |
| ----------------- | -------------------- | ------------------------------- |
| Unit Tests        | Vitest               | Password validation utilities   |
| RLS Policy Tests  | Supabase CLI / pgTAP | Policy enforcement verification |
| Integration Tests | Vitest + Supabase    | Auth flow integration           |
| E2E Tests         | Playwright           | Complete user flows             |

**Unit Test Focus (FR-019, FR-020)**:

- Password validation function edge cases
- All requirement combinations
- Error message accuracy

**RLS Policy Tests**:

```sql
-- Test: User can only see own profile
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-1"}';
SELECT * FROM users WHERE id = 'user-uuid-2'; -- Should return 0 rows
```

**Decision**: Focus on unit tests for password validation (>65% coverage) and create SQL-based RLS policy tests.

**Alternatives Considered**:

- **Full E2E coverage only**: Rejected as it's slower and harder to test edge cases
- **Mocking Supabase Auth**: Useful for unit tests but doesn't test real RLS policies

---

## Consolidated Findings Summary

| Topic               | Decision                                | Confidence |
| ------------------- | --------------------------------------- | ---------- |
| Auth Configuration  | config.toml with version control        | High       |
| RLS Patterns        | `auth.uid()` with dual SELECT policies  | High       |
| Schema Integration  | Foreign key to `auth.users.id`          | High       |
| Email Templates     | Custom HTML with Supabase variables     | High       |
| Password Validation | Shared utility in `src/lib/validation/` | High       |
| Testing Strategy    | Unit tests + SQL policy tests           | High       |

---

## Open Questions (Resolved)

1. **Q**: Should we use database triggers for profile creation?
   **A**: Deferred to Task 2.1 (Signup flow). Migration in 1.2 establishes schema only.

2. **Q**: How to handle existing users without email verification?
   **A**: Not applicable for new deployments. Existing users would need migration plan.

3. **Q**: Should password validation include breach database checking?
   **A**: Deferred to future enhancement. Supabase can integrate HaveIBeenPwned but requires Pro plan.
