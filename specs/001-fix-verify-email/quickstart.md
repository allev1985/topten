# Quickstart Guide: Verify-Email Implementation

**Feature**: Fix Verify-Email Page to Handle Verification Code  
**Date**: 2025-11-30

## Overview

This guide provides implementation steps for enhancing the verify-email page to accept and process verification codes from Supabase verification emails.

---

## Prerequisites

- Understanding of Next.js App Router (server components, server actions)
- Familiarity with Supabase Auth API
- Access to existing codebase patterns in `auth-actions.ts`

---

## Implementation Steps

### Step 1: Add Server Actions

Add two new server actions to `src/actions/auth-actions.ts`:

#### 1.1 verifyEmailAction

Note: This code is added to the existing `auth-actions.ts` file which already imports `VERIFICATION_TYPE_EMAIL` from `@/lib/config`.

```typescript
/**
 * Verify email server action
 * Processes verification code from email link
 */
export interface VerifyEmailSuccessData {
  message: string;
  redirectTo: string;
}

export interface VerifyEmailParams {
  code?: string;
  token_hash?: string;
  type?: 'email';
}

export async function verifyEmailAction(
  params: VerifyEmailParams
): Promise<ActionState<VerifyEmailSuccessData>> {
  const supabase = await createClient();

  try {
    // Handle OTP-based verification
    if (params.token_hash && params.type === VERIFICATION_TYPE_EMAIL) {
      const { error } = await supabase.auth.verifyOtp({
        type: VERIFICATION_TYPE_EMAIL,
        token_hash: params.token_hash,
      });

      if (error) {
        const message = error.message.toLowerCase().includes("expired")
          ? "This verification link has expired. Please request a new one."
          : "This verification link is invalid. Please request a new one.";
        return { data: null, error: message, fieldErrors: {}, isSuccess: false };
      }
    }
    // Handle PKCE code exchange
    else if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);

      if (error) {
        const message = error.message.toLowerCase().includes("expired")
          ? "This verification link has expired. Please request a new one."
          : "This verification link is invalid. Please request a new one.";
        return { data: null, error: message, fieldErrors: {}, isSuccess: false };
      }
    }
    // No valid parameters
    else {
      return {
        data: null,
        error: "No verification code provided.",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    return {
      data: {
        message: "Email verified successfully",
        redirectTo: REDIRECT_ROUTES.auth.success,
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch {
    return {
      data: null,
      error: "An unexpected error occurred. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
}
```

#### 1.2 resendVerificationAction

```typescript
/**
 * Resend verification email success data
 */
export interface ResendVerificationSuccessData {
  message: string;
}

/**
 * Resend verification email server action
 */
export async function resendVerificationAction(
  _prevState: ActionState<ResendVerificationSuccessData>,
  formData: FormData
): Promise<ActionState<ResendVerificationSuccessData>> {
  const email = formData.get("email");

  // Validate email using existing pattern
  const result = passwordResetSchema.safeParse({ email });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  const supabase = await createClient();
  const siteUrl = getAppUrl() || process.env.NEXT_PUBLIC_SITE_URL || "";

  // Always return success for user enumeration protection
  await supabase.auth.resend({
    type: "signup",
    email: result.data.email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/verify`,
    },
  });

  return {
    data: {
      message: "If an account exists with this email, a verification link has been sent.",
    },
    error: null,
    fieldErrors: {},
    isSuccess: true,
  };
}
```

---

### Step 2: Update Page Component

Update `src/app/(auth)/verify-email/page.tsx`:

```typescript
import type { JSX } from "react";
import { redirect } from "next/navigation";
import { verifyEmailAction } from "@/actions/auth-actions";
import { VerificationPending } from "./verification-pending";
import { VerificationError } from "./verification-error";
import { VerificationSuccess } from "./verification-success";

interface VerifyEmailPageProps {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
  }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const { code, token_hash, type } = params;

  // If no verification parameters, show pending state
  if (!code && !token_hash) {
    return <VerificationPending />;
  }

  // Attempt verification
  const result = await verifyEmailAction({
    code,
    token_hash,
    type: type as "email" | undefined,
  });

  // On success, redirect to dashboard
  if (result.isSuccess && result.data) {
    return <VerificationSuccess message={result.data.message} redirectTo={result.data.redirectTo} />;
  }

  // Show error state with resend option
  return <VerificationError error={result.error || "Verification failed"} />;
}
```

---

### Step 3: Create Client Components

#### 3.1 VerificationPending Component

Create `src/app/(auth)/verify-email/verification-pending.tsx`:

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function VerificationPending() {
  return (
    <main>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Please check your inbox and click the verification link to complete
            your registration.
          </p>
          <p>
            <strong>Didn&apos;t receive the email?</strong>
          </p>
          <ul>
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes and try again</li>
          </ul>
        </CardContent>
        <CardFooter>
          <p>
            <a href="/login">Back to sign in</a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
```

#### 3.2 VerificationError Component

Create `src/app/(auth)/verify-email/verification-error.tsx`:

```typescript
"use client";

import { useFormState } from "@/hooks/use-form-state";
import { resendVerificationAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VerificationErrorProps {
  error: string;
}

export function VerificationError({ error }: VerificationErrorProps) {
  const { state, formAction } = useFormState(resendVerificationAction);

  if (state.isSuccess) {
    return (
      <main>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>Verification email sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p role="status">{state.data?.message}</p>
          </CardContent>
          <CardFooter>
            <p>
              <a href="/login">Back to sign in</a>
            </p>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Verification Failed</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Enter your email to receive a new verification link:</p>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                aria-invalid={state.fieldErrors.email?.[0] ? "true" : undefined}
                aria-describedby={
                  state.fieldErrors.email?.[0] ? "email-error" : undefined
                }
              />
              {state.fieldErrors.email?.[0] && (
                <span id="email-error" role="alert" className="text-destructive text-sm">
                  {state.fieldErrors.email[0]}
                </span>
              )}
            </div>
            <Button type="submit" disabled={state.isPending}>
              {state.isPending ? "Sending..." : "Resend verification email"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p>
            <a href="/login">Back to sign in</a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
```

#### 3.3 VerificationSuccess Component

Create `src/app/(auth)/verify-email/verification-success.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VerificationSuccessProps {
  message: string;
  redirectTo: string;
}

export function VerificationSuccess({ message, redirectTo }: VerificationSuccessProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectTo);
    }, 2000);
    return () => clearTimeout(timer);
  }, [router, redirectTo]);

  return (
    <main>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Email Verified!</CardTitle>
          <CardDescription>Your account is now active</CardDescription>
        </CardHeader>
        <CardContent>
          <p role="status">{message}</p>
          <p className="text-muted-foreground text-sm">
            Redirecting to dashboard...
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
```

---

### Step 4: Update Tests

Extend `tests/component/auth/verify-email-page.test.tsx` to cover new states:

```typescript
// Add test cases for:
// - Verification success state
// - Verification error state
// - Resend form functionality
// - Loading states
```

---

## File Checklist

| File | Action | Description |
|------|--------|-------------|
| `src/actions/auth-actions.ts` | Modify | Add verifyEmailAction, resendVerificationAction |
| `src/app/(auth)/verify-email/page.tsx` | Modify | Update to handle URL params |
| `src/app/(auth)/verify-email/verification-pending.tsx` | Create | Pending state component |
| `src/app/(auth)/verify-email/verification-error.tsx` | Create | Error state with resend form |
| `src/app/(auth)/verify-email/verification-success.tsx` | Create | Success state with redirect |
| `tests/component/auth/verify-email-page.test.tsx` | Modify | Add tests for new states |

---

## Testing

### Manual Testing Steps

1. **Pending state**: Navigate to `/verify-email` - should show check email instructions
2. **Success flow**: Use valid verification link - should show success, redirect to dashboard
3. **Expired link**: Use expired link - should show error with resend form
4. **Invalid link**: Use malformed link - should show error with resend form
5. **Resend email**: Submit email in error state - should show success message

### Automated Tests

Run existing and new tests:
```bash
pnpm test tests/component/auth/verify-email-page.test.tsx
```

---

## Dependencies

No new dependencies required. Uses existing:
- `@supabase/ssr` for auth methods
- `shadcn/ui` for UI components
- `zod` for validation
- `next/navigation` for routing
