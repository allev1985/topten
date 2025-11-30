# Quickstart: Fix Reset Password Flow

**Date**: 2025-11-30

## Overview

This guide explains how to implement the reset password flow fix for email link users.

## Problem Statement

The current reset password page checks for a `code` parameter but does not exchange it for a session before displaying the form. This causes the password update to fail because `passwordUpdateAction` requires an authenticated session.

## Solution

Modify `src/app/(auth)/reset-password/page.tsx` to:
1. Exchange the reset code for a session server-side before rendering
2. Handle error states for invalid/expired codes
3. Fall back to existing session check for authenticated users

## Key Files

| File | Purpose |
|------|---------|
| `src/app/(auth)/reset-password/page.tsx` | Main page component (modify) |
| `src/app/(auth)/reset-password/password-reset-form.tsx` | Form component (no changes) |
| `src/actions/auth-actions.ts` | Server action (no changes) |
| `src/lib/supabase/server.ts` | Supabase server client |

## Implementation Steps

### 1. Update Page Component

```typescript
// src/app/(auth)/reset-password/page.tsx
import type { JSX } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordResetForm } from "./password-reset-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{
    code?: string;
  }>;
}

type PageState = 
  | { type: "form" }
  | { type: "error"; errorType: "expired" | "invalid" | "access_denied" };

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const { code } = params;
  
  const supabase = await createClient();
  let pageState: PageState;

  if (code) {
    // Exchange code for session
    console.info("[ResetPassword]", "Attempting code exchange");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      // Log generic error type, not full message which may contain sensitive info
      const isExpired = error.message.toLowerCase().includes("expired");
      console.error("[ResetPassword]", `Code exchange failed: ${isExpired ? "expired" : "invalid"}`);
      pageState = { type: "error", errorType: isExpired ? "expired" : "invalid" };
    } else {
      console.info("[ResetPassword]", "Code exchange successful");
      pageState = { type: "form" };
    }
  } else {
    // Check for existing session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.info("[ResetPassword]", "User has existing session");
      pageState = { type: "form" };
    } else {
      console.info("[ResetPassword]", "No code and no session - access denied");
      pageState = { type: "error", errorType: "access_denied" };
    }
  }

  // Render based on state
  if (pageState.type === "error") {
    return <ErrorState errorType={pageState.errorType} />;
  }

  return (
    <main>
      <PasswordResetForm />
    </main>
  );
}

function ErrorState({ errorType }: { errorType: "expired" | "invalid" | "access_denied" }) {
  const config = {
    expired: {
      title: "Reset Link Expired",
      description: "This password reset link has expired",
      message: "Password reset links are only valid for a limited time. Please request a new one.",
    },
    invalid: {
      title: "Invalid Reset Link",
      description: "This password reset link is invalid",
      message: "The password reset link you followed is invalid or has already been used. Please request a new one.",
    },
    access_denied: {
      title: "Access Denied",
      description: "You need a valid reset link to access this page",
      message: "To reset your password, please request a password reset email.",
    },
  };

  const { title, description, message } = config[errorType];

  return (
    <main>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{message}</p>
        </CardContent>
        <CardFooter>
          <p>
            <a href="/forgot-password">Request a new password reset link</a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
```

### 2. Testing

Run the test suite:
```bash
pnpm test
```

Run specific tests:
```bash
pnpm test tests/integration/auth/reset-password-flow.test.ts
pnpm test tests/component/auth/reset-password-page.test.tsx
```

### 3. Manual Testing

1. **Email Link Flow**:
   - Request password reset at `/forgot-password`
   - Click link in email
   - Verify form displays
   - Submit new password
   - Verify redirect to login

2. **Authenticated User Flow**:
   - Log in to the app
   - Navigate to `/reset-password` (no code)
   - Verify form displays
   - Submit new password

3. **Error States**:
   - Navigate to `/reset-password` without code while logged out
   - Verify access denied message
   - Use an expired/invalid code
   - Verify appropriate error message

## Reference Pattern

The code exchange pattern follows `/api/auth/verify/route.ts`:

```typescript
// Handle PKCE code exchange
if (code) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Verify]", `Code exchange error: ${error.message}`);
    const errorType = error.message.toLowerCase().includes("expired")
      ? "expired_token"
      : "invalid_token";
    // Handle error
  }
}
```

## Common Issues

### Session Not Being Set

Ensure you're using the server client from `@/lib/supabase/server`, not the browser client. The server client properly sets HTTP-only cookies.

### Code Exchange Failing in Development

Check that your Supabase project settings have the correct redirect URLs configured for local development (e.g., `http://localhost:3000/reset-password`).

### Form Submission Failing After Code Exchange

The code exchange creates a session, but it's stored in cookies. Ensure middleware is properly refreshing session cookies on each request.
