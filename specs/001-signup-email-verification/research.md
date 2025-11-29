# Research: Signup & Email Verification Endpoints

**Feature**: 001-signup-email-verification  
**Date**: 2025-11-29  
**Status**: Complete

## Overview

This document captures research findings and technology decisions for implementing the signup and email verification endpoints.

---

## Research Areas

### 1. Input Validation Library

**Task**: Research best validation library for Next.js + TypeScript auth forms

**Decision**: Zod

**Rationale**:

- Native TypeScript support with excellent type inference
- Runtime validation with compile-time type safety
- Rich error messages that are user-friendly out of the box
- Already widely adopted in Next.js ecosystem (recommended by Vercel)
- Lightweight (~12KB gzipped)
- No additional runtime dependencies
- Works seamlessly with both client and server-side validation

**Alternatives Considered**:
| Library | Pros | Cons | Why Rejected |
|---------|------|------|--------------|
| Yup | Mature, popular | Heavier bundle size, less TypeScript-native | Less idiomatic for TypeScript-first projects |
| Joi | Feature-rich, well-documented | Designed for Node.js, larger bundle | Not optimized for frontend/edge runtime |
| Superstruct | Small, composable | Less ecosystem support | Smaller community, fewer examples |
| Valibot | Tiny, modular | Newer, less mature | Less ecosystem support for production use |

**Integration Pattern**:

```typescript
// src/lib/validation/auth.ts
import { z } from "zod";

// Password validation constants (shared across validation files)
const PASSWORD_MIN_LENGTH = 12;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export const signupSchema = z.object({
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  password: z
    .string()
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
```

---

### 2. User Enumeration Protection Patterns

**Task**: Research best practices for preventing user enumeration attacks

**Decision**: Consistent response + optional timing padding

**Rationale**:

1. **Consistent Response**: Always return 201 Created with identical message structure
2. **Consistent Timing**: Add deliberate delay to normalize response times
3. **Email-based notification**: Send appropriate email based on account status
   - New users: Verification email
   - Existing users: "Account already exists" notification

**Implementation Pattern**:

```typescript
// Always respond identically regardless of account status
const SIGNUP_SUCCESS_RESPONSE = {
  success: true,
  message: "Please check your email to verify your account",
};

// Add timing normalization (optional, for extra security)
const MIN_RESPONSE_TIME_MS = 500;
```

**Security Considerations**:

- Response bodies must be byte-identical
- Response times should be normalized (not faster for existing users)
- HTTP status codes must be consistent (always 201)
- Error messages must not leak account existence

**References**:

- OWASP Authentication Cheat Sheet
- Supabase Auth documentation on signUp behavior

---

### 3. Supabase Auth Integration Patterns

**Task**: Research Supabase Auth best practices for signup and verification

**Decision**: Use @supabase/ssr with server-side client

**Rationale**:

- Server-side operations keep auth tokens secure
- Cookie-based session management handled automatically
- Consistent with existing client utilities in `/src/lib/supabase/`

**Signup Flow**:

```typescript
// Using existing server client from src/lib/supabase/server.ts
const supabase = await createClient();
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${origin}/api/auth/verify`,
  },
});
```

**Verification Flow**:

```typescript
// Token exchange for email verification
const { data, error } = await supabase.auth.verifyOtp({
  type: "email",
  token_hash: token,
});

// Alternative: Use exchangeCodeForSession for redirect-based flow
const { data, error } = await supabase.auth.exchangeCodeForSession(code);
```

**Key Findings**:

- Supabase `signUp` returns the same structure for new and existing unverified users
- For existing verified users, no new user is created (good for enumeration protection)
- Email verification uses either OTP or code exchange depending on email template configuration
- Session is automatically created upon successful verification

---

### 4. Error Handling Patterns

**Task**: Research error handling patterns for auth APIs

**Decision**: Custom error classes with consistent response format

**Rationale**:

- Clear separation between internal errors and user-facing messages
- Consistent JSON structure for all error responses
- Easy to extend for future auth operations

**Error Response Format**:

```typescript
// Success response
{
  "success": true,
  "message": "Human-readable success message",
  "data": { /* optional payload */ }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [ /* optional field-level errors */ ]
  }
}
```

**Error Categories**:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| INVALID_TOKEN | 400 | Verification token invalid or expired |
| AUTH_ERROR | 401 | Authentication failed |
| SERVER_ERROR | 500 | Internal server error |

---

### 5. Password Validation Best Practices

**Task**: Research password complexity requirements and implementation

**Decision**: Multi-rule validation with specific error messages

**Requirements** (from spec):

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Implementation Pattern** (using Zod - see data-model.md for full implementation):

```typescript
// Zod schema handles all validation with clear error messages
// See signupSchema in data-model.md for the recommended implementation
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

// The Zod schema will automatically return all validation errors at once
// when using .safeParse(), making it easy to show multiple issues to users
```

**User Experience**:

- Return all failed rules at once (not just first failure)
- Format as: "Password must contain: at least 12 characters, at least one uppercase letter"
- Consider showing password strength indicator on frontend (future task)

---

### 6. Next.js App Router API Route Patterns

**Task**: Research API route best practices for Next.js 14+ App Router

**Decision**: Use Route Handlers with proper typing and error handling

**Route Handler Pattern**:

```typescript
// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate and process
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // Handle error
    return NextResponse.json(errorResponse, { status: 400 });
  }
}
```

**Key Patterns**:

- Use `NextRequest` and `NextResponse` from `next/server`
- Return proper HTTP status codes
- Handle JSON parsing errors gracefully
- Use structured logging for debugging

---

### 7. Testing Strategy

**Task**: Research testing patterns for auth endpoints

**Decision**: Layered testing with mocked Supabase client

**Test Layers**:

1. **Unit Tests** (Vitest)
   - Validation schemas (pure functions, no mocking needed)
   - Error class behavior
   - Utility functions

2. **Integration Tests** (Vitest + mocks)
   - API route handlers with mocked Supabase
   - Request/response cycle validation
   - Error handling paths

3. **E2E Tests** (Playwright - deferred to Task 5.3)
   - Full signup flow with real email
   - Verification redirect flow

**Mocking Pattern**:

```typescript
// tests/unit/lib/validation/auth.test.ts
import { describe, it, expect } from "vitest";
import { signupSchema } from "@/lib/validation/auth";

describe("signupSchema", () => {
  it("validates correct email and password", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass123!",
    });
    expect(result.success).toBe(true);
  });
});
```

---

## Dependencies to Add

| Package | Version | Purpose          |
| ------- | ------- | ---------------- |
| zod     | ^3.23.0 | Input validation |

**Note**: No security advisories found for zod@3.23.x as of 2025-11-29.

---

## Outstanding Questions

All research questions resolved. No outstanding clarifications needed.

---

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Documentation](https://zod.dev/)
