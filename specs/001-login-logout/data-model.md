# Data Model: Login & Logout Endpoints

**Feature**: 001-login-logout  
**Date**: 2025-11-29  
**Status**: Complete

## Overview

This feature does not introduce new database entities. It operates on existing Supabase Auth user sessions. The data model focuses on request/response types, validation schemas, and error codes.

## Entities

### 1. LoginRequest

**Description**: Input payload for the login endpoint.

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| email | string | Yes | Valid email format, trimmed, lowercased | Used for authentication lookup |
| password | string | Yes | Non-empty | Verified against stored hash |
| redirectTo | string | No | Valid relative path starting with `/` | Destination after successful login |

**Validation Rules**:
- Email: Preprocessed to trim whitespace and convert to lowercase
- Password: Must be present (no strength validation for login)
- redirectTo: Optional, validated by `isValidRedirect()` function

### 2. LoginResponse (Success)

**Description**: Response payload for successful login.

| Field | Type | Notes |
|-------|------|-------|
| success | boolean | Always `true` for success |
| redirectTo | string | Validated redirect URL (defaults to `/dashboard`) |

**Example**:
```json
{
  "success": true,
  "redirectTo": "/dashboard"
}
```

### 3. LoginResponse (Error)

**Description**: Response payload for failed login.

| Field | Type | Notes |
|-------|------|-------|
| success | boolean | Always `false` |
| error.code | AuthErrorCode | `"VALIDATION_ERROR"`, `"AUTH_ERROR"`, or `"SERVER_ERROR"` |
| error.message | string | User-facing error message |
| error.details | AuthErrorDetail[] | Field-specific errors (validation only) |

**Example (Auth Error)**:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_ERROR",
    "message": "Invalid email or password"
  }
}
```

### 4. LogoutResponse (Success)

**Description**: Response payload for logout (always success).

| Field | Type | Notes |
|-------|------|-------|
| success | boolean | Always `true` |
| message | string | Confirmation message |

**Example**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Error Codes

### Extended AuthErrorCode Type

```typescript
export type AuthErrorCode =
  | "VALIDATION_ERROR"  // Input validation failed
  | "INVALID_TOKEN"     // Existing - invalid verification token
  | "EXPIRED_TOKEN"     // Existing - expired verification token
  | "AUTH_ERROR"        // NEW - authentication failed (login)
  | "SERVER_ERROR";     // Internal server error
```

### Error Response Matrix

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Missing email | 400 | VALIDATION_ERROR | Field-specific details |
| Invalid email format | 400 | VALIDATION_ERROR | Field-specific details |
| Missing password | 400 | VALIDATION_ERROR | Field-specific details |
| Wrong password | 401 | AUTH_ERROR | "Invalid email or password" |
| Unknown email | 401 | AUTH_ERROR | "Invalid email or password" |
| Unverified email | 401 | AUTH_ERROR | "Please verify your email before logging in" |
| Invalid JSON body | 400 | VALIDATION_ERROR | Generic validation error |
| Server error | 500 | SERVER_ERROR | "An unexpected error occurred" |

## Validation Schemas

### loginSchema

```typescript
export const loginSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z.string({ message: "Email is required" })
      .min(1, "Email is required")
      .email("Invalid email format")
  ),
  password: z.string({ message: "Password is required" })
    .min(1, "Password is required"),
  redirectTo: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

## Redirect Validation

### isValidRedirect Function

**Purpose**: Prevents open redirect attacks by validating redirect URLs.

**Rules**:
1. Must be a non-empty string
2. Must start with `/` (relative path)
3. Must NOT start with `//` (protocol-relative URL)
4. Must NOT contain `:` before the first `/` after the initial `/` (blocks `javascript:`, `data:`, etc.)
5. URL-decoded version must also pass validation

**Valid Examples**:
- `/dashboard`
- `/lists/123`
- `/@username/coffee-cafes/my-list`
- `/search?q=test`

**Invalid Examples** (default to `/dashboard`):
- `https://evil.com`
- `//evil.com`
- `javascript:alert(1)`
- `data:text/html,<script>alert(1)</script>`
- `\x00javascript:alert(1)` (null byte injection)
- Empty string or null

### getValidatedRedirect Function

**Purpose**: Returns the validated redirect URL or the default.

```typescript
function getValidatedRedirect(url: string | undefined | null): string {
  const DEFAULT_REDIRECT = "/dashboard";
  if (!url || !isValidRedirect(url)) {
    return DEFAULT_REDIRECT;
  }
  return url;
}
```

## State Transitions

### Login Flow

```
[Unauthenticated] ---(valid credentials)---> [Authenticated + Session Created]
[Unauthenticated] ---(invalid credentials)---> [Unauthenticated + Error Response]
```

### Logout Flow

```
[Authenticated] ---(logout request)---> [Unauthenticated + Cookies Cleared]
[Unauthenticated] ---(logout request)---> [Unauthenticated + Success Response]
```

Note: Logout is idempotent - calling it without a session still returns success.

## Session Management

### Session Cookies (Managed by Supabase SSR)

| Cookie | Description | Attributes |
|--------|-------------|------------|
| `sb-<project>-auth-token` | Access token | HttpOnly, Secure, SameSite=Lax |

**Notes**:
- Supabase SSR client handles all cookie operations
- No manual cookie manipulation required
- Cookies are automatically cleared on signOut()

## Relationships

```
LoginRequest --> Supabase Auth --> Session
                                      |
                                      v
                              Session Cookies
                                      |
                                      v
LogoutRequest --> Supabase Auth --> Clear Cookies
```

## Security Considerations

1. **User Enumeration**: Login always returns "Invalid email or password" regardless of whether email exists
2. **Timing Attacks**: Consider adding small random delay to normalize response times (future enhancement)
3. **Rate Limiting**: Hooks prepared for future rate limiting implementation (FR-021)
4. **Logging**: Failed attempts logged with masked emails, passwords never logged
