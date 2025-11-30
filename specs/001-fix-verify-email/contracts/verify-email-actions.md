# API Contracts: Verify-Email Server Actions

**Feature**: Fix Verify-Email Page to Handle Verification Code  
**Date**: 2025-11-30

## Overview

This document defines the server action contracts for email verification functionality. These actions follow the existing patterns in `auth-actions.ts`.

---

## verifyEmailAction

Server action to verify a user's email using Supabase verification tokens.

### Signature

```typescript
export async function verifyEmailAction(
  params: VerifyEmailParams
): Promise<ActionState<VerifyEmailSuccessData>>
```

### Input Parameters

```typescript
interface VerifyEmailParams {
  // PKCE flow
  code?: string;
  // OTP flow  
  token_hash?: string;
  type?: 'email';
}
```

### Response Types

#### Success Response

```typescript
interface VerifyEmailSuccessData {
  message: string;
  redirectTo: string;
}

// Example
{
  data: {
    message: "Email verified successfully",
    redirectTo: "/dashboard"
  },
  error: null,
  fieldErrors: {},
  isSuccess: true
}
```

#### Error Response - Invalid Token

```typescript
{
  data: null,
  error: "This verification link is invalid. Please request a new one.",
  fieldErrors: {},
  isSuccess: false
}
```

#### Error Response - Expired Token

```typescript
{
  data: null,
  error: "This verification link has expired. Please request a new one.",
  fieldErrors: {},
  isSuccess: false
}
```

#### Error Response - Missing Token

```typescript
{
  data: null,
  error: "No verification code provided.",
  fieldErrors: {},
  isSuccess: false
}
```

#### Error Response - Server Error

```typescript
{
  data: null,
  error: "An unexpected error occurred. Please try again.",
  fieldErrors: {},
  isSuccess: false
}
```

### Behavior

1. Validates input parameters (code OR token_hash + type)
2. Calls appropriate Supabase method:
   - `verifyOtp()` for token_hash + type
   - `exchangeCodeForSession()` for code
3. On success: Returns success data with redirect URL
4. On error: Returns appropriate error message
5. Logs verification attempt and result

### Error Mapping

| Supabase Error | Action Response |
|----------------|-----------------|
| Contains "expired" | "This verification link has expired..." |
| Other auth error | "This verification link is invalid..." |
| Network/server error | "An unexpected error occurred..." |

---

## resendVerificationAction

Server action to resend a verification email to a user.

### Signature

```typescript
export async function resendVerificationAction(
  _prevState: ActionState<ResendVerificationSuccessData>,
  formData: FormData
): Promise<ActionState<ResendVerificationSuccessData>>
```

### Input (FormData)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |

### Response Types

#### Success Response

```typescript
interface ResendVerificationSuccessData {
  message: string;
}

// Example (same message regardless of email existence)
{
  data: {
    message: "If an account exists with this email, a verification link has been sent."
  },
  error: null,
  fieldErrors: {},
  isSuccess: true
}
```

#### Validation Error Response

```typescript
{
  data: null,
  error: null,
  fieldErrors: {
    email: ["Email is required"] // or "Invalid email format"
  },
  isSuccess: false
}
```

### Behavior

1. Validates email format using existing email schema pattern
2. Calls `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } })`
3. Always returns success message (user enumeration protection)
4. Logs resend attempt (without email for privacy)

### Security

- **User enumeration protection**: Always returns success message
- **Rate limiting**: Handled by Supabase
- **Email validation**: Prevents invalid requests

---

## Existing Action Reference

These new actions complement the existing auth actions in `auth-actions.ts`:

| Action | Purpose |
|--------|---------|
| `signupAction` | Create new user account |
| `loginAction` | Authenticate user |
| `passwordResetRequestAction` | Request password reset email |
| `passwordUpdateAction` | Update password (reset flow) |
| `passwordChangeAction` | Change password (authenticated) |
| **`verifyEmailAction`** | Verify email from link (NEW) |
| **`resendVerificationAction`** | Resend verification email (NEW) |

---

## Usage Examples

### Page Component Usage

```typescript
// In verify-email/page.tsx
// Note: redirect is imported from 'next/navigation'
import { redirect } from "next/navigation";

const params = await searchParams;

if (params.code || params.token_hash) {
  const result = await verifyEmailAction({
    code: params.code,
    token_hash: params.token_hash,
    type: params.type as 'email' | undefined
  });
  
  if (result.isSuccess) {
    // Return success component which handles client-side redirect after displaying message
    return <VerificationSuccess message={result.data.message} redirectTo={result.data.redirectTo} />;
  }
  
  // Show error state
  return <VerificationError error={result.error} />;
}

// Show pending state
return <VerificationPending />;
```

### Resend Form Usage

```typescript
// In resend-form.tsx (client component)
"use client";

import { useFormState } from "@/hooks/use-form-state";
import { resendVerificationAction } from "@/actions/auth-actions";

export function ResendForm() {
  const { state, formAction } = useFormState(resendVerificationAction);
  
  return (
    <form action={formAction}>
      <Input name="email" type="email" required />
      <Button type="submit" disabled={state.isPending}>
        {state.isPending ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}
```

---

## Test Scenarios

### verifyEmailAction Tests

1. **Valid PKCE code** → Success with redirect URL
2. **Valid OTP token** → Success with redirect URL
3. **Expired code** → Error: "link has expired"
4. **Invalid code** → Error: "link is invalid"
5. **Missing parameters** → Error: "No verification code"
6. **Already verified user** → Success (graceful handling)

### resendVerificationAction Tests

1. **Valid email** → Success message
2. **Non-existent email** → Success message (enumeration protection)
3. **Invalid email format** → Field error
4. **Empty email** → Field error
