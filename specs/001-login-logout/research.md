# Research: Login & Logout Endpoints

**Feature**: 001-login-logout  
**Date**: 2025-11-29  
**Status**: Complete

## Research Tasks

### 1. Supabase Auth signInWithPassword Best Practices

**Decision**: Use `supabase.auth.signInWithPassword({ email, password })` for login

**Rationale**:
- Native Supabase method that handles credential verification
- Automatically creates session and sets cookies when using SSR client
- Returns consistent error format for both invalid email and wrong password
- Handles email verification check (returns error if email not verified)

**Alternatives Considered**:
- Custom password verification + JWT: Rejected - reinvents Supabase functionality, security risk
- signInWithOtp: Rejected - requires email, not password-based auth

**Implementation Notes**:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  // Handle specific error codes
  if (error.code === "email_not_confirmed") {
    // User exists but email not verified
  } else if (error.code === "invalid_credentials") {
    // Invalid email or password (generic for security)
  }
  // Log error.message internally, return generic message to client
}

if (data.session) {
  // Session created, cookies automatically set by SSR client
}
```

### 2. Supabase Auth signOut Best Practices

**Decision**: Use `supabase.auth.signOut()` for logout

**Rationale**:
- Native Supabase method that invalidates the current session
- SSR client automatically clears session cookies
- Idempotent - succeeds even if no active session
- Handles global sign-out across all devices when needed

**Alternatives Considered**:
- Manual cookie deletion only: Rejected - doesn't invalidate server-side session
- Token revocation API: Rejected - signOut already handles this internally

**Implementation Notes**:
```typescript
const { error } = await supabase.auth.signOut();
// Cookies are automatically cleared by the SSR client
```

### 3. Open Redirect Prevention Patterns

**Decision**: Implement strict URL validation with allowlist approach

**Rationale**:
- OWASP recommends validating against allowlist patterns
- Only allow relative paths starting with `/` and not `//`
- Block dangerous schemes: `javascript:`, `data:`, `vbscript:`
- URL decode before validation to catch encoded attacks

**Alternatives Considered**:
- Allowlist specific paths: Rejected - too restrictive for dynamic app
- Domain allowlist: Rejected - app is single-domain, relative paths sufficient
- No validation (let browser handle): Rejected - security vulnerability

**Security Patterns to Implement**:
1. Must start with single `/` (not `//`)
2. Reject any URL with `:` before first `/` (blocks `javascript:`, `data:`, etc.)
3. URL decode and re-validate
4. Default to `/dashboard` if validation fails
5. Trim whitespace

**Implementation Notes**:
```typescript
function isValidRedirect(url: string | undefined | null): boolean {
  if (!url) return false;
  const decoded = decodeURIComponent(url).trim();
  // Must start with / but not //
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return false;
  // Block protocol handlers
  if (decoded.includes(':')) return false;
  return true;
}
```

### 4. User Enumeration Protection for Login

**Decision**: Return identical error message and similar response timing for all credential failures

**Rationale**:
- Prevents attackers from discovering valid email addresses
- Follows existing signup pattern in the codebase
- OWASP recommendation for authentication endpoints

**Alternatives Considered**:
- Different messages for "user not found" vs "wrong password": Rejected - enables enumeration
- Rate limiting only: Rejected - still leaks information through response differences

**Implementation Notes**:
- Use generic message: "Invalid email or password"
- Log detailed error internally with masked email
- Return 401 for all auth failures (spec says not to reveal if user exists)

### 5. Session Cookie Security Configuration

**Decision**: Rely on Supabase SSR client's default secure cookie configuration

**Rationale**:
- `@supabase/ssr` createServerClient automatically sets secure cookie options
- Cookies are HTTP-only, Secure (in production), and SameSite=Lax by default
- Follows existing pattern in `src/lib/supabase/server.ts`

**Alternatives Considered**:
- Custom cookie middleware: Rejected - duplicates SSR client functionality
- localStorage tokens: Rejected - XSS vulnerable

**Verification**:
- Supabase SSR sets `httpOnly: true`, `secure: true` (when HTTPS), `sameSite: 'lax'`
- No additional configuration needed beyond existing createClient setup

### 6. Login Schema Design

**Decision**: Create `loginSchema` extending email validation from signupSchema

**Rationale**:
- Reuse existing email preprocessing (trim, lowercase)
- Password validation for login is minimal (just presence check, not strength)
- Add optional `redirectTo` field with string validation

**Implementation Notes**:
```typescript
export const loginSchema = z.object({
  email: z.preprocess(
    (val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
    z.string().min(1, "Email is required").email("Invalid email format")
  ),
  password: z.string().min(1, "Password is required"),
  redirectTo: z.string().optional(),
});
```

### 7. Error Factory for Auth Failures

**Decision**: Add `authError()` factory function to existing errors.ts

**Rationale**:
- Follows existing pattern (validationError, serverError, etc.)
- Provides consistent error format for login failures
- HTTP 401 status for authentication failures

**Implementation Notes**:
```typescript
export function authError(message: string = "Invalid email or password"): AuthError {
  return new AuthError("AUTH_ERROR", message, 401);
}
```

## Summary

All research tasks complete. Key findings:
1. Use Supabase native `signInWithPassword` and `signOut` methods
2. Implement strict redirect URL validation (relative paths only, no protocols)
3. Return generic error messages to prevent user enumeration
4. Rely on Supabase SSR for secure cookie management
5. Extend existing schemas and error utilities following DRY principle
