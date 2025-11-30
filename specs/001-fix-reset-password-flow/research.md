# Research: Fix Reset Password Flow

**Date**: 2025-11-30  
**Status**: Complete

## Research Questions

### 1. How does Supabase PKCE flow work for password reset?

**Decision**: Use `supabase.auth.exchangeCodeForSession(code)` server-side to exchange the reset code for a valid session.

**Rationale**: 
- Supabase Auth uses PKCE (Proof Key for Code Exchange) for secure authentication flows
- The password reset email contains a code parameter that must be exchanged for a session
- The existing `/api/auth/verify/route.ts` demonstrates the correct pattern for code exchange
- Server-side exchange is required because the server client can set cookies to establish the session

**Alternatives Considered**:
1. **Client-side code exchange**: Rejected because browser client cannot properly set HTTP-only session cookies
2. **Pass code through form submission**: Rejected per FR-006 - code must be exchanged before displaying form

### 2. What is the correct page architecture for code exchange?

**Decision**: Perform code exchange in the server component (page.tsx) before rendering the form component.

**Rationale**:
- Next.js App Router server components can perform async operations during render
- Code exchange must happen before the form is displayed (FR-006)
- Server component has access to `createClient()` from `@/lib/supabase/server`
- Errors can be caught and appropriate error states rendered
- Network failures during async code exchange are handled by try/catch, rendering a generic error state with retry guidance

**Alternatives Considered**:
1. **API Route + Client-side redirect**: Rejected - adds unnecessary complexity and extra network hop
2. **Route handler middleware**: Rejected - code exchange is page-specific, not a cross-cutting concern

### 3. How should error states be handled?

**Decision**: Display error states inline on the reset-password page with appropriate guidance.

**Rationale**:
- Consistent with existing error handling in `/api/auth/verify/route.ts`
- Users should see clear messages distinguishing invalid vs expired codes
- Include link to request new reset email (FR-011)

**Error State Mapping**:
| Supabase Error | User Message | Action |
|----------------|--------------|--------|
| Code expired | "This reset link has expired" | Link to /forgot-password |
| Code invalid | "This reset link is invalid" | Link to /forgot-password |
| Code already used | "This reset link has already been used" | Link to /forgot-password |
| Network error | "Unable to verify your reset link" | Retry guidance |

### 4. How should authenticated users without a code be handled?

**Decision**: Allow authenticated users to access the password reset form without a code (User Story 2).

**Rationale**:
- The `passwordUpdateAction` already checks for an authenticated session via `supabase.auth.getUser()`
- Authenticated users may want to change their password directly
- This provides a fallback mechanism for logged-in users

**Flow Logic**:
```
1. Check for code parameter
   - If code: Exchange for session
     - Success: Render form
     - Failure: Render error state
   - If no code: Check for existing session
     - Has session: Render form
     - No session: Render access denied
```

### 5. What testing patterns should be used?

**Decision**: Follow existing test patterns in `tests/integration/auth/` with Vitest mocks for Supabase client.

**Rationale**:
- Existing tests in `password-reset.test.ts` and `password-update.test.ts` demonstrate the pattern
- Mock `createClient` from `@/lib/supabase/server`
- Test all code exchange scenarios: success, expired, invalid, network error

**Test Coverage Required**:
1. Unit tests: Code exchange logic
2. Integration tests: Full page render with various states
3. Component tests: Form behavior with different initial states

## Technical Findings

### Existing Code Patterns

**Code Exchange Pattern** (from `/api/auth/verify/route.ts`):
```typescript
const { error } = await supabase.auth.exchangeCodeForSession(code);

if (error) {
  const errorType = error.message.toLowerCase().includes("expired")
    ? "expired_token"
    : "invalid_token";
  // Handle error
}
```

**Session Check Pattern** (from `auth-actions.ts`):
```typescript
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  // Handle no session
}
```

### Dependencies

No new dependencies required. All functionality uses existing:
- `@supabase/ssr` - Server client creation
- `next/navigation` - App Router utilities
- `@/components/ui/*` - shadcn/ui components

### Security Considerations

1. **Code must be exchanged server-side**: Ensures session cookies are properly set as HTTP-only
2. **One-time use**: Supabase automatically invalidates codes after successful exchange
3. **Sign out after reset**: Per FR-009, user is signed out after successful password update
4. **No code in logs**: Reset codes should not be logged for security

## Summary

The fix requires modifying `src/app/(auth)/reset-password/page.tsx` to:
1. Extract the `code` parameter from URL
2. If code present: Exchange for session using `supabase.auth.exchangeCodeForSession(code)`
3. If no code: Check for existing authenticated session
4. Render appropriate state: form, invalid code error, expired code error, or access denied

This follows established patterns in the codebase and aligns with all constitution principles.
