# Data Model: Multi-Auth Password Reset

**Feature Branch**: `002-multi-auth-password-reset`
**Date**: 2025-11-30

## Overview

This feature does not introduce new database entities. It extends the existing authentication flow by supporting multiple authentication methods for password reset operations. The entities below are conceptual (handled by Supabase Auth) rather than database tables.

## Entities

### 1. Password Update Request

Represents a request to update a user's password.

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `password` | string | ✅ | min 12 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char | New password |
| `code` | string | ❌ | non-empty if provided | PKCE authorization code from reset email |
| `token_hash` | string | ❌ | non-empty if provided | OTP token hash from reset email |
| `type` | literal 'email' | ❌ | must be 'email' if provided | Token type for OTP verification |

**Validation Rules**:
- At least one authentication method must be present (code, token_hash, or existing session)
- Password must meet all complexity requirements simultaneously
- If `token_hash` is provided, `type` must also be provided

### 2. PKCE Code (Supabase-managed)

Authorization code from password reset email link.

| Property | Description |
|----------|-------------|
| Format | Opaque string provided by Supabase |
| Lifetime | Typically 5-10 minutes |
| Usage | Single-use, consumed on exchange |
| Storage | Managed by Supabase Auth |

### 3. OTP Token (Supabase-managed)

Token hash from password reset email verification.

| Property | Description |
|----------|-------------|
| Format | Hash string provided by Supabase |
| Lifetime | Per Supabase configuration |
| Usage | Single-use, consumed on verification |
| Storage | Managed by Supabase Auth |

### 4. User Session (Supabase-managed)

Authenticated session representing a logged-in user.

| Property | Description |
|----------|-------------|
| Creation | After successful auth (login, PKCE exchange, OTP verify) |
| Validation | Via `getUser()` call to Supabase |
| Invalidation | Via `signOut()` after password update |

## State Transitions

### Authentication State

```
┌─────────────────────────────────────────────────────────────────┐
│                    Password Update Request                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Check                         │
│                  (Priority: code → token → session)              │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │  PKCE   │         │   OTP   │         │ Session │
    │  Code   │         │  Token  │         │  Auth   │
    └─────────┘         └─────────┘         └─────────┘
          │                   │                   │
          ▼                   ▼                   ▼
    exchangeCode        verifyOtp            getUser
    ForSession()        ()                   ()
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
                  ┌───────────────────┐
                  │ Auth Failed?      │───Yes──▶ Return Auth Error
                  └───────────────────┘
                              │ No
                              ▼
                  ┌───────────────────┐
                  │ Validate Password │
                  └───────────────────┘
                              │
                              ▼
                  ┌───────────────────┐
                  │ Validation Failed?│───Yes──▶ Return Validation Error
                  └───────────────────┘
                              │ No
                              ▼
                  ┌───────────────────┐
                  │ updateUser()      │
                  └───────────────────┘
                              │
                              ▼
                  ┌───────────────────┐
                  │ Update Failed?    │───Yes──▶ Return Auth/Server Error
                  └───────────────────┘
                              │ No
                              ▼
                  ┌───────────────────┐
                  │ signOut()         │───Fail──▶ Log error, return success anyway
                  └───────────────────┘
                              │ Success
                              ▼
                  ┌───────────────────┐
                  │ Return Success    │
                  └───────────────────┘
```

## Schema Extension

### Current Schema (`src/schemas/auth.ts`)

```typescript
export const passwordUpdateSchema = z.object({
  password: z.string()
    .min(1, "Password is required")
    .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(PASSWORD_REQUIREMENTS.specialCharRegex, "Password must contain at least one special character"),
});
```

### Extended Schema

```typescript
export const passwordUpdateSchema = z.object({
  password: z.string()
    .min(1, "Password is required")
    .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(PASSWORD_REQUIREMENTS.specialCharRegex, "Password must contain at least one special character"),
  // PKCE authorization code from password reset email
  code: z.string().min(1, "Code cannot be empty").optional(),
  // OTP token hash from password reset email
  token_hash: z.string().min(1, "Token cannot be empty").optional(),
  // Token type for OTP verification
  type: z.literal(VERIFICATION_TYPE_EMAIL).optional(),
});
```

## Related Entities (No Changes Required)

### User (Supabase Auth)
Managed by Supabase Auth. No direct database changes required.

### Password Reset Email (Supabase Auth)
Generated by Supabase when `resetPasswordForEmail()` is called. Contains PKCE code or OTP token in URL.
