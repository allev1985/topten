# Research: Verify-Email Code Acceptance

**Feature**: Fix Verify-Email Page to Handle Verification Code  
**Date**: 2025-11-30

## Research Tasks

### 1. Supabase Email Verification Flows

**Task**: Research Supabase email verification patterns for the two supported flows.

**Findings**:

Supabase supports two verification methods:

1. **OTP-based (token_hash + type)**: 
   - Uses `verifyOtp({ type: 'email', token_hash })` method
   - Token is embedded in the verification email link
   - Returns session on success

2. **PKCE-based (code)**: 
   - Uses `exchangeCodeForSession(code)` method
   - Authorization code flow
   - More secure for cross-origin scenarios

**Decision**: Support both methods as the existing `/api/auth/verify` route does.

**Rationale**: The signup flow already uses `emailRedirectTo` which may result in either flow depending on Supabase configuration. Both patterns are already implemented in the API route.

**Alternatives Considered**:
- Support only PKCE: Rejected - would break OTP-based verification links
- Support only OTP: Rejected - PKCE is increasingly preferred for security

---

### 2. Page vs API Route Verification

**Task**: Research whether to process verification in the page component or redirect to the existing API route.

**Findings**:

Two approaches exist:
1. **Direct page verification**: Process verification in the async server component
2. **API route redirect**: Redirect to `/api/auth/verify` with parameters

**Decision**: Process verification directly in the page component using server actions.

**Rationale**:
- Better UX: Avoid extra redirect hop
- Cleaner code: Page manages its own state
- DRY violation avoidance: The API route is designed for external redirects from email links, not internal page use
- Pattern consistency: Matches reset-password page which handles code directly

**Alternatives Considered**:
- Redirect to API route: Rejected - adds unnecessary redirect, harder to show error state
- Client-side verification: Rejected - security concern, violates server-first pattern

---

### 3. Error State Handling

**Task**: Research error handling patterns for verification failures.

**Findings**:

The project uses:
- `AuthError` class in `lib/auth/errors.ts` for error types
- `ActionState<T>` type in `types/forms.ts` for server action responses
- Alert component from shadcn/ui for error display

Error types to handle:
1. **Invalid token**: Malformed or non-existent token
2. **Expired token**: Token past expiration time
3. **Already verified**: User already verified (handle gracefully)
4. **Server error**: Unexpected backend failures

**Decision**: Use existing `ActionState` pattern with specific error messages.

**Rationale**: Consistent with auth-actions.ts error handling pattern.

**Alternatives Considered**:
- Custom error component: Rejected - overkill for this feature
- Toast notifications: Rejected - Card-based error UI is more appropriate for verification

---

### 4. Resend Verification Email

**Task**: Research how to implement resend verification email functionality.

**Findings**:

Supabase provides `resend()` method on auth:
```typescript
await supabase.auth.resend({
  type: 'signup',
  email: userEmail,
  options: { emailRedirectTo: 'url' }
})
```

Challenge: User's email is not available on the verify-email page without a session.

**Decision**: Require user to enter their email to resend, similar to forgot-password flow.

**Rationale**:
- No user enumeration risk (return same message regardless of email existence)
- Consistent with forgot-password pattern
- Simple UX: single input field

**Alternatives Considered**:
- Store email in session storage: Rejected - not reliable across browsers/tabs
- Link to signup page: Rejected - user must re-enter all details
- Use URL parameter for email: Rejected - security concern

---

### 5. UI State Management

**Task**: Research UI state patterns for the verify-email page.

**Findings**:

Page states needed:
1. **Pending**: No code in URL - show instructions (current behavior)
2. **Verifying**: Code present, processing - show loading state
3. **Success**: Verification successful - show success, then redirect
4. **Error**: Verification failed - show error with resend option

**Decision**: Use async server component with search params, client components for interactive states.

**Rationale**:
- Server component determines initial state from URL params
- Client component handles form interactions (resend)
- Matches reset-password page pattern

**Alternatives Considered**:
- Full client component: Rejected - loses SSR benefits
- Full server component: Rejected - can't handle resend form interaction

---

### 6. Redirect After Verification

**Task**: Research redirect patterns after successful verification.

**Findings**:

Existing patterns:
- `REDIRECT_ROUTES.auth.success` = `/dashboard`
- `REDIRECT_ROUTES.default` = `/dashboard`
- Login action uses `redirect()` from next/navigation

**Decision**: Show brief success message, then client-side redirect to `/dashboard`.

**Rationale**: 
- Better UX than immediate redirect - user sees confirmation
- 2-second delay provides visual feedback that verification succeeded
- Client component handles redirect after success state display
- Consistent with FR-003 (success state displayed regardless of redirect status)

**Alternatives Considered**:
- Immediate server redirect: Rejected - user doesn't see confirmation message
- No redirect (manual navigation): Rejected - poor UX, requires user action

---

## Summary

All research tasks completed. Key decisions:

| Area | Decision |
|------|----------|
| Verification flow | Support both OTP and PKCE methods |
| Processing location | Direct in page component, not API redirect |
| Error handling | Use ActionState pattern with specific messages |
| Resend email | Form with email input, follows forgot-password pattern |
| UI states | Server component + client components for interaction |
| Redirect | To /dashboard after success |

No items require additional clarification.
