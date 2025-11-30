# Server Actions Contract: Authentication Pages

**Feature**: 001-auth-pages  
**Date**: 2025-11-29  
**Status**: Complete

This document defines the contract for server actions used in the Authentication Pages feature.

---

## Overview

Server actions provide form handling for authentication flows. They are called via React's `useActionState` hook and return a standardized `ActionState` object.

All server actions:
- Accept `FormData` from native HTML forms
- Validate input using existing Zod schemas
- Return `ActionState<T>` with success data or error information
- Support progressive enhancement (work without JavaScript)

---

## Common Types

### ActionState

```typescript
/**
 * Server action response state
 * @template T - Type of successful response data
 */
interface ActionState<T = unknown> {
  /** Successful response data, null if error */
  data: T | null;
  /** Form-level error message, null if success */
  error: string | null;
  /** Field-level validation errors */
  fieldErrors: Record<string, string[]>;
  /** Whether last submission was successful */
  isSuccess: boolean;
}
```

### Initial State

```typescript
const initialActionState: ActionState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
};
```

---

## Server Actions

### 1. signupAction

Signs up a new user with email and password.

**File**: `src/actions/auth-actions.ts`

**Signature**:
```typescript
export async function signupAction(
  prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>>;
```

**FormData Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 12 chars, uppercase, lowercase, digit, symbol |

**Success Response**:
```typescript
interface SignupSuccessData {
  message: string;    // "Please check your email to verify your account"
  redirectTo: string; // "/verify-email"
}
```

**Error Responses**:

| Scenario | `error` | `fieldErrors` |
|----------|---------|---------------|
| Invalid email format | null | `{ email: ["Invalid email format"] }` |
| Password too short | null | `{ password: ["Password must be at least 12 characters"] }` |
| Multiple validation errors | null | `{ email: [...], password: [...] }` |
| Server error | "An unexpected error occurred" | `{}` |

**Example Usage**:
```tsx
const [state, formAction, isPending] = useActionState(signupAction, initialActionState);

<form action={formAction}>
  <input name="email" type="email" />
  <input name="password" type="password" />
  <button type="submit" disabled={isPending}>Sign Up</button>
</form>
```

---

### 2. loginAction

Authenticates a user with email and password.

**File**: `src/actions/auth-actions.ts`

**Signature**:
```typescript
export async function loginAction(
  prevState: ActionState<LoginSuccessData>,
  formData: FormData
): Promise<ActionState<LoginSuccessData>>;
```

**FormData Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Non-empty |
| `redirectTo` | string | No | Valid internal path |
| `rememberMe` | string | No | "on" if checked |

**Success Response**:
```typescript
interface LoginSuccessData {
  redirectTo: string; // Validated redirect URL or "/dashboard"
}
```

**Error Responses**:

| Scenario | `error` | `fieldErrors` |
|----------|---------|---------------|
| Invalid credentials | "Invalid email or password" | `{}` |
| Email not verified | "Please verify your email before logging in" | `{}` |
| Invalid email format | null | `{ email: ["Invalid email format"] }` |
| Empty password | null | `{ password: ["Password is required"] }` |
| Server error | "An unexpected error occurred" | `{}` |

**Security Notes**:
- Same error message for wrong email and wrong password (user enumeration protection)
- `redirectTo` is validated to prevent open redirect attacks

---

### 3. passwordResetRequestAction

Requests a password reset email.

**File**: `src/actions/auth-actions.ts`

**Signature**:
```typescript
export async function passwordResetRequestAction(
  prevState: ActionState<PasswordResetRequestSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordResetRequestSuccessData>>;
```

**FormData Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |

**Success Response**:
```typescript
interface PasswordResetRequestSuccessData {
  message: string; // "If an account exists, a password reset email has been sent"
}
```

**Error Responses**:

| Scenario | `error` | `fieldErrors` |
|----------|---------|---------------|
| Invalid email format | null | `{ email: ["Invalid email format"] }` |
| Server error | "An unexpected error occurred" | `{}` |

**Security Notes**:
- Always returns success message regardless of whether email exists (user enumeration protection)
- Same response time for existing and non-existing emails

---

### 4. passwordUpdateAction

Updates password using reset token (unauthenticated flow).

**File**: `src/actions/auth-actions.ts`

**Signature**:
```typescript
export async function passwordUpdateAction(
  prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>>;
```

**FormData Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `password` | string | Yes | Min 12 chars, uppercase, lowercase, digit, symbol |
| `confirmPassword` | string | Yes | Must match `password` |

**Success Response**:
```typescript
interface PasswordUpdateSuccessData {
  message: string;    // "Password updated successfully"
  redirectTo: string; // "/login"
}
```

**Error Responses**:

| Scenario | `error` | `fieldErrors` |
|----------|---------|---------------|
| Password mismatch | null | `{ confirmPassword: ["Passwords do not match"] }` |
| Password too weak | null | `{ password: ["Password must be at least 12 characters"] }` |
| Session expired | "Session has expired. Please request a new reset link." | `{}` |
| Invalid token | "Invalid reset link. Please request a new one." | `{}` |
| Server error | "An unexpected error occurred" | `{}` |

**Prerequisites**:
- User must have clicked a valid password reset link
- Session must be established from the reset token exchange

---

### 5. passwordChangeAction

Changes password for authenticated user.

**File**: `src/actions/auth-actions.ts`

**Signature**:
```typescript
export async function passwordChangeAction(
  prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>>;
```

**FormData Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `currentPassword` | string | Yes | Non-empty |
| `password` | string | Yes | Min 12 chars, uppercase, lowercase, digit, symbol |
| `confirmPassword` | string | Yes | Must match `password` |

**Success Response**:
```typescript
interface PasswordUpdateSuccessData {
  message: string; // "Password updated successfully"
}
```

**Error Responses**:

| Scenario | `error` | `fieldErrors` |
|----------|---------|---------------|
| Incorrect current password | "Current password is incorrect" | `{}` |
| Password mismatch | null | `{ confirmPassword: ["Passwords do not match"] }` |
| Password too weak | null | `{ password: ["Password must be at least 12 characters"] }` |
| Not authenticated | "Authentication required" | `{}` |
| Server error | "An unexpected error occurred" | `{}` |

**Prerequisites**:
- User must be authenticated
- Current password must be verified

---

## Validation Rules

### Email Validation
- Must be non-empty
- Must be valid email format (contains @, valid domain)
- Trimmed and lowercased before validation

### Password Validation (New Password)
- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*()_+-=[]{};':"\\|,.<>/?)

### Redirect URL Validation
- Must start with `/` (relative path)
- Must not start with `//` (protocol-relative)
- Must not contain protocol handlers (javascript:, data:, etc.)
- Decoded version must also pass validation
- Double-encoded URLs are rejected

---

## Error Response Mapping

Server actions map API errors to `ActionState` as follows:

```typescript
// API validation error → fieldErrors
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    details: [
      { field: "email", message: "Invalid email format" }
    ]
  }
}
// Maps to:
{
  data: null,
  error: null,
  fieldErrors: { email: ["Invalid email format"] },
  isSuccess: false
}

// API auth error → error message
{
  success: false,
  error: {
    code: "AUTH_ERROR",
    message: "Invalid email or password"
  }
}
// Maps to:
{
  data: null,
  error: "Invalid email or password",
  fieldErrors: {},
  isSuccess: false
}
```

---

## Integration with useFormState Hook

```typescript
// src/hooks/use-form-state.ts

import { useActionState } from 'react';

export function useFormState<T>(
  action: (prevState: ActionState<T>, formData: FormData) => Promise<ActionState<T>>,
  initialState?: Partial<ActionState<T>>
) {
  const [state, formAction, isPending] = useActionState(action, {
    data: null,
    error: null,
    fieldErrors: {},
    isSuccess: false,
    ...initialState,
  });

  return {
    state: { ...state, isPending },
    formAction,
    reset: () => {
      // Reset handled by key prop on form
    },
  };
}
```

---

## Testing Contract

Each server action should be tested for:

1. **Happy path**: Valid input returns success state
2. **Validation errors**: Invalid input returns field errors
3. **Auth errors**: Invalid credentials return error message
4. **Server errors**: Unexpected errors return generic message
5. **Security**: No user enumeration, safe redirects
