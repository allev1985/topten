# Data Model: Signup & Email Verification Endpoints

**Feature**: 001-signup-email-verification  
**Date**: 2025-11-29  
**Status**: Complete

## Overview

This document defines the entities, validation rules, and state transitions for the signup and email verification endpoints.

---

## Entities

### 1. SignupRequest

**Description**: Input payload for the signup endpoint.

| Field    | Type   | Required | Validation Rules                                                 |
| -------- | ------ | -------- | ---------------------------------------------------------------- |
| email    | string | Yes      | Valid email format, trimmed, lowercased                          |
| password | string | Yes      | Min 12 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char |

**Zod Schema**:

```typescript
// Password validation constants
const PASSWORD_MIN_LENGTH = 12;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export const signupRequestSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    )
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      SPECIAL_CHAR_REGEX,
      "Password must contain at least one special character"
    ),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;
```

---

### 2. SignupResponse

**Description**: Response payload for successful signup requests.

| Field   | Type    | Description                                           |
| ------- | ------- | ----------------------------------------------------- |
| success | boolean | Always `true` for successful requests                 |
| message | string  | Generic success message (user enumeration protection) |

**TypeScript Type**:

```typescript
export interface SignupResponse {
  success: true;
  message: string;
}

// Standard response (identical for new and existing users)
export const SIGNUP_SUCCESS_RESPONSE: SignupResponse = {
  success: true,
  message: "Please check your email to verify your account",
};
```

---

### 3. VerifyRequest

**Description**: Query parameters for the email verification endpoint.

| Field      | Type   | Required    | Validation Rules                       |
| ---------- | ------ | ----------- | -------------------------------------- |
| token_hash | string | Conditional | Required if using OTP verification     |
| type       | string | Conditional | Must be 'email' for email verification |
| code       | string | Conditional | Required if using PKCE code exchange   |

**Zod Schema**:

```typescript
export const verifyRequestSchema = z.union([
  // OTP-based verification
  z.object({
    token_hash: z.string().min(1, "Token is required"),
    type: z.literal("email"),
  }),
  // PKCE code exchange
  z.object({
    code: z.string().min(1, "Code is required"),
  }),
]);

export type VerifyRequest = z.infer<typeof verifyRequestSchema>;
```

---

### 4. VerifyResponse

**Description**: Redirect response for successful verification (no JSON body - redirects to dashboard).

**Behavior**:

- On success: HTTP 302 redirect to `/dashboard` with session cookie set
- On error: HTTP 302 redirect to `/auth/error` with error query parameter

---

### 5. AuthErrorResponse

**Description**: Standard error response format for all auth endpoints.

| Field         | Type    | Description                        |
| ------------- | ------- | ---------------------------------- |
| success       | boolean | Always `false` for error responses |
| error         | object  | Error details                      |
| error.code    | string  | Machine-readable error code        |
| error.message | string  | Human-readable error message       |
| error.details | array   | Optional field-level errors        |

**TypeScript Types**:

```typescript
export interface AuthErrorDetail {
  field: string;
  message: string;
}

export interface AuthErrorResponse {
  success: false;
  error: {
    code: AuthErrorCode;
    message: string;
    details?: AuthErrorDetail[];
  };
}

export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_TOKEN"
  | "EXPIRED_TOKEN"
  | "AUTH_ERROR"
  | "SERVER_ERROR";
```

---

## Validation Rules

### Email Validation

| Rule         | Implementation                 | Error Message          |
| ------------ | ------------------------------ | ---------------------- |
| Required     | `z.string({ required_error })` | "Email is required"    |
| Valid format | `.email()`                     | "Invalid email format" |
| Normalize    | `.trim().toLowerCase()`        | N/A (transforms input) |

### Password Validation

| Rule         | Regex                            | Error Message                                         |
| ------------ | -------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| Min length   | `/.{12,}/`                       | "Password must be at least 12 characters"             |
| Uppercase    | `/[A-Z]/`                        | "Password must contain at least one uppercase letter" |
| Lowercase    | `/[a-z]/`                        | "Password must contain at least one lowercase letter" |
| Number       | `/[0-9]/`                        | "Password must contain at least one number"           |
| Special char | `/[!@#$%^&\*()\_+\-=\[\]{};':"\\ | ,.<>\/?]/`                                            | "Password must contain at least one special character" |

### Token Validation

| Rule         | Implementation      | Error Message                    |
| ------------ | ------------------- | -------------------------------- |
| Present      | `z.string().min(1)` | "Token is required"              |
| Valid format | Supabase validates  | "Invalid verification token"     |
| Not expired  | Supabase validates  | "Verification token has expired" |

---

## State Transitions

### User Account States

```
[No Account]
    │
    ▼ (signup with new email)
[Unverified Account] ──────────────────────┐
    │                                       │
    ▼ (click verification link)             │ (verification token expires)
[Verified Account]                          │
    │                                       │
    ▼ (session created)                     ▼
[Authenticated Session] ◄─────────── [Resend verification needed]
```

### Signup Flow States

```
Request Received
    │
    ▼
Validate Input ──── Invalid ──► Return 400 with validation errors
    │
    ▼ Valid
Check Supabase
    │
    ├── New User ──► Create account, send verification email
    │
    └── Existing User ──► Send "account exists" notification email
    │
    ▼ (both paths)
Return 201 with generic success message
```

### Verification Flow States

```
Request Received
    │
    ▼
Extract Token ──── Missing ──► Return 400 (missing token)
    │
    ▼ Present
Validate with Supabase
    │
    ├── Valid ──► Mark email verified, create session
    │             └──► Redirect to /dashboard (302)
    │
    ├── Expired ──► Redirect to /auth/error?error=expired_token (302)
    │
    └── Invalid ──► Redirect to /auth/error?error=invalid_token (302)
```

---

## Error Codes Reference

| Code             | HTTP Status | When Used                           |
| ---------------- | ----------- | ----------------------------------- |
| VALIDATION_ERROR | 400         | Input fails Zod validation          |
| INVALID_TOKEN    | 400         | Token is malformed or doesn't exist |
| EXPIRED_TOKEN    | 400         | Token has passed expiration time    |
| AUTH_ERROR       | 401         | Authentication failed (internal)    |
| SERVER_ERROR     | 500         | Unexpected server error             |

---

## Supabase Auth Integration

### User Record (Managed by Supabase Auth)

Supabase Auth manages the user table in the `auth` schema. Relevant fields:

| Field              | Type      | Description                                  |
| ------------------ | --------- | -------------------------------------------- |
| id                 | uuid      | Unique user identifier                       |
| email              | string    | User's email address                         |
| email_confirmed_at | timestamp | When email was verified (null if unverified) |
| created_at         | timestamp | Account creation time                        |
| updated_at         | timestamp | Last update time                             |

### Session Record (Managed by Supabase Auth)

| Field         | Type   | Description               |
| ------------- | ------ | ------------------------- |
| access_token  | string | JWT for API access        |
| refresh_token | string | Token for session refresh |
| expires_at    | number | Expiration timestamp      |
| user          | object | User object               |

---

## Relationships

```
SignupRequest ──validates──► User (creates if new)
                               │
                               ▼
                        VerificationToken (Supabase managed)
                               │
VerifyRequest ──validates──────┘
                               │
                               ▼
                        AuthSession (created on success)
```

---

## Notes

1. **User Enumeration Protection**: Response format and timing must be identical for new and existing users during signup
2. **Token Management**: Verification tokens are fully managed by Supabase Auth
3. **Session Storage**: Sessions are stored in HTTP-only cookies, managed by `@supabase/ssr`
4. **No Custom User Table**: This task uses only Supabase Auth's built-in user management
