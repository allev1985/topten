# Research: Multi-Auth Password Reset

**Feature Branch**: `002-multi-auth-password-reset`
**Date**: 2025-11-30

## Research Tasks

### 1. Supabase Auth Methods for Password Reset

**Question**: What Supabase Auth methods support password reset authentication?

**Findings**:

1. **PKCE Code Exchange** (`exchangeCodeForSession(code)`)
   - Used when password reset email contains an authorization code
   - Single-use, time-limited (typically 5-10 minutes)
   - Establishes a session for the user
   - Already used in `verify/route.ts` for email verification

2. **OTP Token Verification** (`verifyOtp({ type: 'email', token_hash })`)
   - Used when email contains a token_hash parameter
   - Requires `type` parameter (e.g., 'email', 'recovery')
   - Already used in `verify/route.ts` for email verification

3. **Session-based Authentication** (`getUser()`)
   - Validates existing session from cookies
   - Already implemented in current `password/route.ts`

**Decision**: Use all three methods in priority order: PKCE code → OTP token → existing session.

**Rationale**: PKCE code is most common for "forgot password" flows. OTP token provides fallback for alternative email configurations. Existing session supports authenticated password changes.

---

### 2. Sign-Out After Password Reset

**Question**: How to sign out a user after successful password update?

**Findings**:

Supabase provides `signOut()` method:
```typescript
const { error } = await supabase.auth.signOut();
```

This invalidates the current session. Per spec FR-006, sign-out must occur after successful password update.

**Decision**: Call `signOut()` after successful `updateUser()` call.

**Rationale**: Security requirement (SC-002) - ensures all sessions are invalidated after password change.

**Edge Case**: If sign-out fails, the password is still updated. The failure should be logged but not cause the operation to fail (per spec edge case).

---

### 3. Schema Extension for Multi-Auth

**Question**: How to extend `passwordUpdateSchema` for additional auth parameters?

**Findings**:

Current schema only validates `password` field. Need to add:
- `code` (optional string): PKCE authorization code
- `token_hash` (optional string): OTP token hash
- `type` (optional literal 'email'): Token type for OTP verification

**Decision**: Extend `passwordUpdateSchema` with optional fields.

**Rationale**: Maintains backward compatibility (existing session auth still works). Optional fields allow flexible authentication.

---

### 4. Error Handling for Authentication Failures

**Question**: What error responses should be returned for different auth failures?

**Findings**:

Per FR-007: "System MUST return a generic authentication error for invalid or expired codes/tokens (not revealing which)."

Error types to handle:
- Invalid code → Generic auth error
- Expired code → Generic auth error (or "expired_token" per verify pattern)
- Invalid token → Generic auth error
- Expired token → Generic auth error (or "expired_token" per verify pattern)
- No valid auth → Auth error "Authentication required"

**Decision**: Follow existing pattern from `verify/route.ts` with clear rule:
- If Supabase error message contains "expired" → return error with "Authentication link has expired. Please request a new one."
- Otherwise → return generic "Authentication failed" message

This provides a better user experience (expired link gets actionable message) while maintaining security (invalid vs expired not revealed for non-expired cases).

**Rationale**: Consistent with existing auth flows. Provides useful feedback for expired links (user should request new one) while not revealing specific validation failures for security.

---

### 5. Logging Requirements

**Question**: What should be logged for password reset operations?

**Findings**:

Per SC-006: "Zero sensitive data (passwords, tokens, codes) is logged in system logs."
Per FR-010: "System MUST log password reset operations for security auditing (without logging sensitive data)."

Current logging pattern (from `password/route.ts`):
```typescript
console.info("[PasswordUpdate]", `Password update requested for: ${maskEmail(user.email ?? "unknown")}`);
```

**Decision**: Log authentication method used (PKCE/OTP/session) and masked email. Never log password, code, or token values.

**Rationale**: Provides audit trail while protecting sensitive data.

---

## Alternatives Considered

### Alternative 1: Separate Endpoints for Each Auth Method

**Rejected because**: Would create multiple endpoints doing similar work, violating DRY principle. Single endpoint with multi-auth is cleaner and follows existing verify endpoint pattern.

### Alternative 2: Middleware-based Authentication

**Rejected because**: Password reset has specific auth requirements (PKCE code, OTP token) that differ from standard session auth. Inline authentication in the route handler provides clearer control flow.

### Alternative 3: Not Signing Out After Password Reset

**Rejected because**: Security requirement (SC-002, FR-006). Must invalidate sessions after password change to protect against compromised credentials.

---

## Dependencies & Patterns Reference

### Existing Patterns Used

1. **`src/app/api/auth/verify/route.ts`**: Reference for PKCE code exchange and OTP verification
2. **`src/lib/auth/errors.ts`**: Error handling utilities
3. **`src/lib/utils/api/response.ts`**: Response utilities
4. **`src/lib/utils/formatting/email.ts`**: Email masking for logs
5. **`src/schemas/auth.ts`**: Existing auth schemas and password validation

### Supabase Auth SDK Methods

- `exchangeCodeForSession(code)` - PKCE flow
- `verifyOtp({ type, token_hash })` - OTP verification
- `getUser()` - Session validation
- `updateUser({ password })` - Password update
- `signOut()` - Session invalidation

---

## Summary

All NEEDS CLARIFICATION items have been resolved:

| Item | Decision |
|------|----------|
| PKCE Code Auth | Use `exchangeCodeForSession(code)` |
| OTP Token Auth | Use `verifyOtp({ type: 'email', token_hash })` |
| Sign-out behavior | Call `signOut()` after successful update, log failures but don't fail operation |
| Schema extension | Add optional `code`, `token_hash`, `type` fields |
| Error handling | Generic auth errors, detect "expired" for expired_token type |
| Logging | Log auth method and masked email, never log sensitive data |
