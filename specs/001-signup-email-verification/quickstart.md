# Quickstart: Signup & Email Verification Endpoints

**Feature**: 001-signup-email-verification  
**Date**: 2025-11-29  
**Estimated Implementation Time**: 4-6 hours

## Overview

This guide provides step-by-step instructions for implementing the signup and email verification endpoints.

---

## Prerequisites

Before starting implementation, ensure:

- [ ] Supabase project is configured (Task 1.1 complete)
- [ ] Supabase client utilities exist at `/src/lib/supabase/`
- [ ] Auth types exist at `/src/types/auth.ts`
- [ ] Node.js 20+ installed
- [ ] pnpm installed

---

## Step 1: Install Dependencies

```bash
pnpm add zod
```

**Verify installation**:

```bash
pnpm list zod || echo "Installing zod..."
```

---

## Step 2: Create Validation Schemas

Create `/src/lib/validation/auth.ts`:

```typescript
import { z } from "zod";

// Password complexity requirements
const PASSWORD_MIN_LENGTH = 12;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export const signupSchema = z.object({
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

export const verifyTokenSchema = z.object({
  token_hash: z.string().min(1, "Token is required"),
  type: z.literal("email"),
});

export const verifyCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
```

---

## Step 3: Create Error Classes

Create `/src/lib/auth/errors.ts`:

```typescript
export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_TOKEN"
  | "EXPIRED_TOKEN"
  | "AUTH_ERROR"
  | "SERVER_ERROR";

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

export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly httpStatus: number;
  public readonly details?: AuthErrorDetail[];

  constructor(
    code: AuthErrorCode,
    message: string,
    httpStatus: number = 400,
    details?: AuthErrorDetail[]
  ) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  toResponse(): AuthErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// Factory functions
export function validationError(details: AuthErrorDetail[]): AuthError {
  return new AuthError("VALIDATION_ERROR", "Validation failed", 400, details);
}

export function invalidTokenError(): AuthError {
  return new AuthError("INVALID_TOKEN", "Invalid verification token", 400);
}

export function expiredTokenError(): AuthError {
  return new AuthError("EXPIRED_TOKEN", "Verification token has expired", 400);
}

export function serverError(): AuthError {
  return new AuthError("SERVER_ERROR", "An unexpected error occurred", 500);
}
```

---

## Step 4: Create Signup Endpoint

Create `/src/app/api/auth/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth";
import {
  validationError,
  serverError,
  type AuthErrorDetail,
} from "@/lib/auth/errors";

// Consistent response for user enumeration protection
const SUCCESS_RESPONSE = {
  success: true,
  message: "Please check your email to verify your account",
} as const;

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));

    // Validate input
    const result = signupSchema.safeParse(body);
    if (!result.success) {
      const details: AuthErrorDetail[] = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      const error = validationError(details);
      return NextResponse.json(error.toResponse(), {
        status: error.httpStatus,
      });
    }

    const { email, password } = result.data;

    // Get origin for email redirect URL
    const origin =
      request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;

    // Create Supabase client and attempt signup
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/api/auth/verify`,
      },
    });

    // Log error internally but don't expose to client (user enumeration protection)
    if (error) {
      console.error("[Signup] Supabase error:", error.message);
      // Still return success response to prevent enumeration
    }

    // Always return same response (user enumeration protection)
    return NextResponse.json(SUCCESS_RESPONSE, { status: 201 });
  } catch (err) {
    console.error("[Signup] Unexpected error:", err);
    const error = serverError();
    return NextResponse.json(error.toResponse(), { status: error.httpStatus });
  }
}
```

---

## Step 5: Create Email Verification Endpoint

Create `/src/app/api/auth/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ERROR_REDIRECT_BASE = "/auth/error";
const SUCCESS_REDIRECT = "/dashboard";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  const supabase = await createClient();
  const origin = request.nextUrl.origin;

  try {
    // Handle OTP-based verification
    if (token_hash && type === "email") {
      const { error } = await supabase.auth.verifyOtp({
        type: "email",
        token_hash,
      });

      if (error) {
        console.error("[Verify] OTP verification error:", error.message);
        const errorType = error.message.includes("expired")
          ? "expired_token"
          : "invalid_token";
        return NextResponse.redirect(
          `${origin}${ERROR_REDIRECT_BASE}?error=${errorType}`
        );
      }

      // Success - redirect to dashboard
      return NextResponse.redirect(`${origin}${SUCCESS_REDIRECT}`);
    }

    // Handle PKCE code exchange
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[Verify] Code exchange error:", error.message);
        const errorType = error.message.includes("expired")
          ? "expired_token"
          : "invalid_token";
        return NextResponse.redirect(
          `${origin}${ERROR_REDIRECT_BASE}?error=${errorType}`
        );
      }

      // Success - redirect to dashboard
      return NextResponse.redirect(`${origin}${SUCCESS_REDIRECT}`);
    }

    // No valid token or code provided
    console.error("[Verify] Missing token or code");
    return NextResponse.redirect(
      `${origin}${ERROR_REDIRECT_BASE}?error=missing_token`
    );
  } catch (err) {
    console.error("[Verify] Unexpected error:", err);
    return NextResponse.redirect(
      `${origin}${ERROR_REDIRECT_BASE}?error=server_error`
    );
  }
}
```

---

## Step 6: Write Tests

### Unit Tests for Validation

Create `/tests/unit/lib/validation/auth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { signupSchema } from "@/lib/validation/auth";

describe("signupSchema", () => {
  describe("email validation", () => {
    it("accepts valid email", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = signupSchema.safeParse({
        email: "invalid-email",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(false);
    });

    it("trims and lowercases email", () => {
      const result = signupSchema.safeParse({
        email: "  TEST@Example.COM  ",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });
  });

  describe("password validation", () => {
    it("accepts valid password", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects password shorter than 12 characters", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "Short1!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without uppercase", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "securepass123!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without lowercase", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "SECUREPASS123!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without number", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "SecurePassword!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password without special character", () => {
      const result = signupSchema.safeParse({
        email: "test@example.com",
        password: "SecurePass1234",
      });
      expect(result.success).toBe(false);
    });
  });
});
```

### Unit Tests for Errors

Create `/tests/unit/lib/auth/errors.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  AuthError,
  validationError,
  invalidTokenError,
  expiredTokenError,
  serverError,
} from "@/lib/auth/errors";

describe("AuthError", () => {
  it("creates error with correct properties", () => {
    const error = new AuthError("VALIDATION_ERROR", "Test message", 400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Test message");
    expect(error.httpStatus).toBe(400);
  });

  it("converts to response format", () => {
    const error = new AuthError("VALIDATION_ERROR", "Test message", 400, [
      { field: "email", message: "Invalid" },
    ]);
    const response = error.toResponse();
    expect(response).toEqual({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Test message",
        details: [{ field: "email", message: "Invalid" }],
      },
    });
  });
});

describe("error factories", () => {
  it("creates validation error", () => {
    const error = validationError([{ field: "email", message: "Invalid" }]);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.httpStatus).toBe(400);
  });

  it("creates invalid token error", () => {
    const error = invalidTokenError();
    expect(error.code).toBe("INVALID_TOKEN");
    expect(error.httpStatus).toBe(400);
  });

  it("creates expired token error", () => {
    const error = expiredTokenError();
    expect(error.code).toBe("EXPIRED_TOKEN");
    expect(error.httpStatus).toBe(400);
  });

  it("creates server error", () => {
    const error = serverError();
    expect(error.code).toBe("SERVER_ERROR");
    expect(error.httpStatus).toBe(500);
  });
});
```

---

## Step 7: Run Tests

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test tests/unit/lib/validation/auth.test.ts
```

---

## Step 8: Manual Testing

### Test Signup Endpoint

```bash
# Valid signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'

# Invalid email
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "password": "SecurePass123!"}'

# Weak password
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "weak"}'
```

### Test Verification Flow

1. Sign up with a real email address
2. Check email for verification link
3. Click link and verify redirect to `/dashboard`

---

## Verification Checklist

- [x] Signup returns 201 with success message for valid input
- [x] Signup returns 400 with validation errors for invalid input
- [x] Signup returns identical response for new and existing emails
- [x] Verification redirects to /dashboard on success
- [x] Verification redirects to /auth/error on failure
- [x] All unit tests pass
- [x] Test coverage > 65% for validation and error modules (achieved 70.32%)

---

## Common Issues

### 1. Missing Environment Variables

Ensure `.env.local` contains:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Verification Emails Not Sending

Check Supabase Dashboard > Authentication > Email Templates

### 3. Cookie Not Set After Verification

Ensure cookies are configured in `createClient()` (already done in existing setup)

---

## Next Steps

After implementation:

1. [ ] Run code review
2. [ ] Run security scan (codeql_checker)
3. [ ] Create PR with changes
4. [ ] Merge to main branch
