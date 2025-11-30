# Data Model: Fix Reset Password Flow

**Date**: 2025-11-30

## Overview

This feature does not introduce new database entities. It operates with existing Supabase Auth concepts:

- **Reset Code**: Managed entirely by Supabase Auth
- **User Session**: Managed by Supabase Auth via cookies

## Key Entities

### Reset Code (External - Supabase Auth)

A one-time use token sent via email for password reset.

| Property | Type | Description |
|----------|------|-------------|
| code | string | PKCE authorization code from email link |
| expires_at | timestamp | Expiration time (managed by Supabase) |
| used | boolean | Whether code has been exchanged |
| user_id | uuid | Associated user account |

**Lifecycle**:
1. Created when `resetPasswordForEmail()` is called
2. Sent to user via email with redirect URL
3. Exchanged for session via `exchangeCodeForSession()`
4. Invalidated after successful exchange or expiration

### User Session (External - Supabase Auth)

An authenticated context established after code exchange.

| Property | Type | Description |
|----------|------|-------------|
| access_token | string | JWT for API authentication |
| refresh_token | string | Token for session renewal |
| expires_at | timestamp | Session expiration time |
| user | User | Associated user object |

**Storage**: HTTP-only cookies set by Supabase SSR client.

## State Transitions

### Reset Password Page States

```
┌─────────────────────────────────────────────────────────────────┐
│                    INITIAL PAGE LOAD                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Has code param? │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │ YES                         │ NO
              ▼                             ▼
    ┌──────────────────┐         ┌──────────────────┐
    │ Exchange code    │         │ Check session    │
    │ for session      │         │                  │
    └────────┬─────────┘         └────────┬─────────┘
             │                            │
    ┌────────┴────────┐          ┌────────┴────────┐
    │ Success Failure │          │ Has    No       │
    ▼         ▼       │          │ session session │
┌───────┐ ┌───────────┤          ▼        ▼        │
│ FORM  │ │ Is code   │      ┌───────┐ ┌─────────┐ │
│ STATE │ │ expired?  │      │ FORM  │ │ ACCESS  │ │
└───┬───┘ └─────┬─────┘      │ STATE │ │ DENIED  │ │
    │           │            └───┬───┘ └─────────┘ │
    │     ┌─────┴─────┐          │                 │
    │     │YES     NO │          │                 │
    │     ▼        ▼  │          │                 │
    │  ┌───────┐ ┌───────┐       │                 │
    │  │EXPIRED│ │INVALID│       │                 │
    │  │ ERROR │ │ ERROR │       │                 │
    │  └───────┘ └───────┘       │                 │
    │                            │                 │
    └────────────────────────────┴─────────────────┘
                    │
                    ▼
          ┌────────────────┐
          │ FORM SUBMITTED │
          └────────┬───────┘
                   │
          ┌────────┴────────┐
          │ Valid   Invalid │
          ▼         ▼       │
      ┌───────┐ ┌───────────┤
      │SUCCESS│ │VALIDATION │
      │       │ │ ERROR     │
      └───┬───┘ └───────────┘
          │
          ▼
    ┌───────────┐
    │ SIGN OUT  │
    │ REDIRECT  │
    │ TO LOGIN  │
    └───────────┘
```

### Page State Definitions

| State | Condition | UI Display |
|-------|-----------|------------|
| FORM | Valid session exists | Password reset form |
| EXPIRED_ERROR | Code exchange failed with expiry | Error + link to forgot-password |
| INVALID_ERROR | Code exchange failed (not expired) | Error + link to forgot-password |
| ACCESS_DENIED | No code, no session | Error + link to forgot-password |
| SUCCESS | Password updated | Success message + link to login |
| VALIDATION_ERROR | Form validation failed | Form with field errors |

## Validation Rules

### Password (reused from signupSchema)

| Rule | Requirement |
|------|-------------|
| Minimum length | 12 characters |
| Uppercase | At least 1 character |
| Lowercase | At least 1 character |
| Digit | At least 1 number |
| Special character | At least 1 special character |

### Password Confirmation

| Rule | Requirement |
|------|-------------|
| Match | Must match password field |

## No New Database Changes

This feature operates entirely within Supabase Auth's existing infrastructure. No schema migrations or database changes are required.
