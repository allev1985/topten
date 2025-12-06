# Quickstart: Login & Logout Endpoints

**Feature**: 001-login-logout  
**Date**: 2025-11-29

## Overview

This guide provides implementation instructions for the login and logout authentication endpoints in YourFavs.

## Prerequisites

- Node.js 20+
- pnpm
- Supabase local development environment running
- Existing signup and verify endpoints working

## File Structure

Create/modify these files:

```
src/
├── app/api/auth/
│   ├── login/route.ts          # NEW - Login endpoint
│   └── logout/route.ts         # NEW - Logout endpoint
├── lib/auth/
│   ├── errors.ts               # MODIFY - Add authError factory
│   └── redirect-validation.ts  # NEW - Redirect URL validation
├── lib/config/
│   └── index.ts                # MODIFY - Add DEFAULT_REDIRECT constant
└── schemas/
    └── auth.ts                 # MODIFY - Add loginSchema

tests/
├── integration/auth/
│   ├── login.test.ts           # NEW - Login integration tests
│   └── logout.test.ts          # NEW - Logout integration tests
└── unit/lib/auth/
    └── redirect-validation.test.ts  # NEW - Redirect validation unit tests
```

## Implementation Steps

### Step 1: Add Configuration Constant

**File**: `src/lib/config/index.ts`

Add the default redirect constant:

```typescript
export const DEFAULT_REDIRECT = "/dashboard";
```

### Step 2: Create Redirect Validation

**File**: `src/lib/auth/redirect-validation.ts`

```typescript
import { DEFAULT_REDIRECT } from "@/lib/config";

/**
 * Validates that a URL is safe for redirection.
 * Prevents open redirect attacks by only allowing relative paths.
 */
export function isValidRedirect(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;

  const trimmed = url.trim();

  // Must start with / but not //
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return false;
  }

  // Block protocol handlers (javascript:, data:, etc.)
  // Check for : before the first / after the initial /
  const pathPart = trimmed.slice(1); // Remove leading /
  const colonIndex = pathPart.indexOf(":");
  const slashIndex = pathPart.indexOf("/");

  if (colonIndex !== -1 && (slashIndex === -1 || colonIndex < slashIndex)) {
    return false;
  }

  // Try decoding and re-validating (with depth limit to prevent DoS)
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded !== trimmed) {
      // Re-validate decoded version (single decode only to prevent infinite recursion)
      // Additional decoding attempts would indicate malicious input
      const reDecoded = decodeURIComponent(decoded);
      if (reDecoded !== decoded) {
        // Double-encoded URL - reject as potentially malicious
        return false;
      }
      // Check the decoded version with basic validation
      if (!decoded.startsWith("/") || decoded.startsWith("//")) return false;
      const decodedPath = decoded.slice(1);
      const decodedColon = decodedPath.indexOf(":");
      const decodedSlash = decodedPath.indexOf("/");
      if (
        decodedColon !== -1 &&
        (decodedSlash === -1 || decodedColon < decodedSlash)
      ) {
        return false;
      }
    }
  } catch {
    // Invalid URL encoding
    return false;
  }

  return true;
}

/**
 * Returns a validated redirect URL or the default.
 */
export function getValidatedRedirect(url: string | undefined | null): string {
  return isValidRedirect(url) ? url!.trim() : DEFAULT_REDIRECT;
}
```

### Step 3: Add Login Schema

**File**: `src/schemas/auth.ts`

Add to existing file:

```typescript
/**
 * Schema for validating login requests
 * Password validation is minimal (presence only) unlike signup
 */
export const loginSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z
      .string({ message: "Email is required" })
      .min(1, "Email is required")
      .email("Invalid email format")
  ),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
  redirectTo: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

### Step 4: Add Auth Error Factory

**File**: `src/lib/auth/errors.ts`

Add to existing file:

```typescript
/**
 * Factory function for authentication errors
 * Used when login credentials are invalid
 */
export function authError(
  message: string = "Invalid email or password"
): AuthError {
  return new AuthError("AUTH_ERROR", message, 401);
}
```

### Step 5: Create Login Endpoint

**File**: `src/app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/schemas/auth";
import {
  validationError,
  authError,
  serverError,
  type AuthErrorDetail,
} from "@/lib/auth/errors";
import { getValidatedRedirect } from "@/lib/auth/redirect-validation";
import { maskEmail } from "@/lib/utils/email";

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Returns session tokens in cookies and a validated redirect URL.
 *
 * User Enumeration Protection:
 * - Returns identical error message for wrong email and wrong password
 * - Error details logged internally, not exposed to client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const details: AuthErrorDetail[] = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      const error = validationError(details);
      return NextResponse.json(error.toResponse(), {
        status: error.httpStatus,
      });
    }

    const { email, password, redirectTo } = result.data;

    console.info("[Login]", `Login attempt for email: ${maskEmail(email)}`);

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(
        "[Login]",
        `Login failed for ${maskEmail(email)}: ${error.message}`
      );

      // Check for unverified email using Supabase error status/code
      // Supabase returns status 400 with code 'email_not_confirmed' for unverified emails
      // Fallback to message check for broader compatibility
      const isUnverified =
        error.code === "email_not_confirmed" ||
        (error.status === 400 &&
          error.message.toLowerCase().includes("not confirmed"));

      const authErr = authError(
        isUnverified
          ? "Please verify your email before logging in"
          : "Invalid email or password"
      );
      return NextResponse.json(authErr.toResponse(), {
        status: authErr.httpStatus,
      });
    }

    console.info("[Login]", `Login successful for ${maskEmail(email)}`);

    const validRedirect = getValidatedRedirect(redirectTo);

    return NextResponse.json({
      success: true,
      redirectTo: validRedirect,
    });
  } catch (err) {
    console.error(
      "[Login]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    const error = serverError();
    return NextResponse.json(error.toResponse(), { status: error.httpStatus });
  }
}
```

### Step 6: Create Logout Endpoint

**File**: `src/app/api/auth/logout/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serverError } from "@/lib/auth/errors";

/**
 * POST /api/auth/logout
 *
 * Invalidates the current user session and clears cookies.
 * This endpoint is idempotent - returns success even if no session exists.
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Get current user for logging (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[Logout]", `Logout error: ${error.message}`);
      // Still return success for idempotency
    }

    console.info(
      "[Logout]",
      user
        ? `User logged out: ${user.id}`
        : "Logout request (no active session)"
    );

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error(
      "[Logout]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    const error = serverError();
    return NextResponse.json(error.toResponse(), { status: error.httpStatus });
  }
}
```

## Testing

### Run Unit Tests

```bash
pnpm test tests/unit/lib/auth/redirect-validation.test.ts
```

### Run Integration Tests

```bash
pnpm test tests/integration/auth/login.test.ts
pnpm test tests/integration/auth/logout.test.ts
```

### Run All Auth Tests

```bash
pnpm test -- --filter auth
```

### Manual Testing

1. **Login with valid credentials**:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```

2. **Login with redirect**:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!", "redirectTo": "/lists"}'
```

3. **Logout**:

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: <session-cookie>"
```

## Security Checklist

- [ ] Login returns generic error for invalid credentials
- [ ] Passwords are never logged
- [ ] Emails are masked in logs
- [ ] Redirect URLs are validated against open redirect attacks
- [ ] Cookies are HTTP-only, Secure, and SameSite=Lax
- [ ] Logout clears all session cookies
- [ ] Tests cover edge cases and attack vectors

## Troubleshooting

### "Email not confirmed" error

User needs to verify their email first via the signup verification flow.

### Cookies not being set

Ensure HTTPS is used in production. In development, Supabase SSR may use different cookie settings.

### Redirect validation too strict

If legitimate paths are being rejected, review the `isValidRedirect` function and add necessary patterns.
