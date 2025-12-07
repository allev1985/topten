# Specification: Refactor Authentication from API Routes to Auth Service

**Status:** Draft
**Created:** 2025-12-07
**Author:** System
**Epic:** Authentication Architecture Improvement

## Overview

Refactor the authentication system from a three-layer architecture (UI → Server Actions → API Routes → Supabase) to a two-layer architecture (UI → Server Actions → Auth Service → Supabase). This will improve performance, reduce complexity, and align with Next.js 14+ App Router best practices.

## Motivation

### Current Architecture Problems

1. **Performance Overhead**: Server Actions make HTTP fetch calls to the same server, adding unnecessary serialization/deserialization
2. **Cookie Forwarding Complexity**: Server Actions must manually forward cookies to API routes
3. **Duplicate Validation**: Input validation occurs in both Server Actions and API Routes
4. **Complex Error Handling**: HTTP status codes must be mapped back to ActionState objects
5. **Inconsistent Patterns**: Middleware calls Supabase directly, while Server Actions use API routes

### Benefits of Auth Service

1. **Better Performance**: Direct function calls eliminate HTTP overhead
2. **Simpler Architecture**: Fewer layers, clearer call stack
3. **Full Type Safety**: End-to-end TypeScript without HTTP boundary
4. **Code Reuse**: Service can be called from Server Actions, middleware, or future API routes
5. **Single Validation Layer**: No duplication between layers
6. **Easier Debugging**: Simpler stack traces
7. **Modern Next.js Pattern**: Aligns with App Router best practices

## Architecture Comparison

### Before (Current)
```
UI Components (Client)
    ↓
Server Actions (Server)
    ↓ HTTP fetch
API Routes (Server)
    ↓
Supabase SDK
```

### After (Target)
```
UI Components (Client)
    ↓
Server Actions (Server)
    ↓ Direct import
Auth Service (Server)
    ↓
Supabase SDK
```

## Scope

### In Scope
- Create centralized Auth Service module
- Refactor all Server Actions to use Auth Service
- Update email verification flow to use service
- Comprehensive testing of new service layer
- Update documentation and architecture diagrams
- **Remove obsolete API routes** (except `/api/auth/verify`)

### Out of Scope
- Changes to UI components (no client-side changes)
- Changes to middleware (already uses Supabase directly)
- Changes to Supabase configuration
- New authentication features
- Rate limiting implementation
- MFA implementation

## Implementation Tasks

All tasks follow the SpecKit workflow:
1. Create specification
2. Implement according to spec
3. Test against acceptance criteria
4. Review and merge

---

## Task 1: Create Auth Service Foundation

**Epic:** Authentication Service Refactor
**Story Points:** 5
**Estimated Lines:** ~350 lines
**Priority:** P0 (Blocking)

### Description

Create the foundational Auth Service module with core authentication functions: signup, login, and logout. This module will centralize all Supabase authentication operations and provide a clean API for Server Actions to consume.

### File Structure

```
src/lib/auth/
├── service.ts              # NEW: Main auth service (250 lines)
├── service/
│   ├── types.ts           # NEW: Service-specific types (50 lines)
│   └── errors.ts          # NEW: Service error handling (50 lines)
└── errors.ts              # EXISTING: Keep for backward compatibility
```

### Implementation Details

#### `src/lib/auth/service.ts`

Create the main service module with these functions:

```typescript
/**
 * Authentication Service
 *
 * Centralized service for all authentication operations.
 * Used by Server Actions and other server-side code.
 *
 * @module auth/service
 */

export async function signup(
  email: string,
  password: string
): Promise<AuthServiceResult<void>>

export async function login(
  email: string,
  password: string
): Promise<AuthServiceResult<Session>>

export async function logout(): Promise<AuthServiceResult<void>>
```

**Implementation Requirements:**

1. **Logging**: Use consistent logging format with masked emails
   - Log all attempts (success and failure)
   - Use `maskEmail()` from `@/lib/utils/formatting/email`
   - Include operation name in log prefix (e.g., `[Auth:Signup]`)

2. **Error Handling**:
   - Catch Supabase errors and normalize them
   - Return consistent error objects
   - Never throw exceptions (return errors in result object)

3. **User Enumeration Protection**:
   - Signup: Always return success (log errors internally)
   - Login: Return generic "Invalid credentials" message
   - Log actual Supabase errors for debugging

4. **Email Redirect Configuration**:
   - Signup: Use `emailRedirectTo: ${getAppUrl()}/api/auth/verify`
   - Use `getAppUrl()` from `@/lib/config`

#### `src/lib/auth/service/types.ts`

Define service-specific types:

```typescript
export interface AuthServiceResult<T = void> {
  data: T | null;
  error: AuthServiceError | null;
  success: boolean;
}

export interface AuthServiceError {
  code: string;
  message: string;
  details?: unknown;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
  };
}
```

#### `src/lib/auth/service/errors.ts`

Create error normalization utilities:

```typescript
export function normalizeSupabaseError(error: AuthError): AuthServiceError

export function createAuthError(
  code: string,
  message: string,
  details?: unknown
): AuthServiceError
```

### Acceptance Criteria

#### Functional Requirements
- [ ] `signup()` function creates user account via Supabase
- [ ] `signup()` always returns success (user enumeration protection)
- [ ] `signup()` sends verification email with correct redirect URL
- [ ] `login()` authenticates user with email/password
- [ ] `login()` returns session data on success
- [ ] `login()` returns generic error message on failure
- [ ] `login()` detects unverified email and returns specific message
- [ ] `logout()` invalidates current session via Supabase

#### Non-Functional Requirements
- [ ] All functions use `async/await` (no promises in signatures)
- [ ] All functions return `AuthServiceResult<T>` type
- [ ] All errors logged with masked email addresses
- [ ] No console.log (use console.info/console.error)
- [ ] TypeScript strict mode passes with no errors
- [ ] All public functions have JSDoc comments

#### Error Handling
- [ ] Supabase errors caught and normalized
- [ ] No uncaught exceptions thrown from service functions
- [ ] Error codes follow consistent naming (e.g., `AUTH_ERROR`, `VALIDATION_ERROR`)
- [ ] Sensitive error details not exposed to callers

#### Testing
- [ ] Unit tests for `signup()` - success case
- [ ] Unit tests for `signup()` - existing user case (enumeration protection)
- [ ] Unit tests for `login()` - success case
- [ ] Unit tests for `login()` - invalid credentials case
- [ ] Unit tests for `login()` - unverified email case
- [ ] Unit tests for `logout()` - success case
- [ ] All tests mock Supabase client
- [ ] Test coverage ≥ 90% for service.ts

### Testing Strategy

```typescript
// Example test structure
describe('Auth Service - signup()', () => {
  it('should create new user and return success', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ data: {...}, error: null });
    const result = await signup('test@example.com', 'password123');
    expect(result.success).toBe(true);
  });

  it('should return success even when user exists (enumeration protection)', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'User already exists' }
    });
    const result = await signup('existing@example.com', 'password123');
    expect(result.success).toBe(true); // Still returns success!
  });
});
```

### Dependencies
- None (foundational task)

### Migration Notes
- API routes remain unchanged (backward compatible)
- Server Actions not yet updated (will use service in Task 3)
- Can be deployed without breaking existing functionality

---

## Task 2: Add Password and Session Management to Service

**Epic:** Authentication Service Refactor
**Story Points:** 5
**Estimated Lines:** ~300 lines
**Priority:** P0 (Blocking)

### Description

Extend the Auth Service with password management (reset, update, change) and session management (get, refresh) functions. These functions handle both authenticated and token-based flows.

### Implementation Details

Add to `src/lib/auth/service.ts`:

```typescript
/**
 * Password reset request - sends email with reset link
 */
export async function resetPassword(
  email: string
): Promise<AuthServiceResult<void>>

/**
 * Update password using reset token or active session
 */
export async function updatePassword(
  password: string,
  options?: {
    tokenHash?: string;
    type?: string;
  }
): Promise<AuthServiceResult<void>>

/**
 * Change password for authenticated user (requires current password verification)
 * Note: Current password verification must be done by caller (via login attempt)
 */
export async function changePassword(
  userId: string,
  newPassword: string
): Promise<AuthServiceResult<void>>

/**
 * Get current session
 */
export async function getSession(): Promise<AuthServiceResult<Session | null>>

/**
 * Refresh expiring session
 */
export async function refreshSession(): Promise<AuthServiceResult<Session>>

/**
 * Verify email with OTP token
 */
export async function verifyEmail(
  tokenHash: string,
  type: string
): Promise<AuthServiceResult<Session>>
```

### Implementation Requirements

#### Password Reset (`resetPassword`)
1. Use `supabase.auth.resetPasswordForEmail()`
2. Set `redirectTo: ${getAppUrl()}/reset-password`
3. **Always return success** (user enumeration protection)
4. Log actual errors internally

#### Update Password (`updatePassword`)
1. If `tokenHash` and `type` provided:
   - First verify OTP via `supabase.auth.verifyOtp()`
   - If verification fails, return error
2. Then call `supabase.auth.updateUser({ password })`
3. Return success/error based on update result

#### Change Password (`changePassword`)
1. Assumes caller has verified current password
2. Simply calls `supabase.auth.updateUser({ password })`
3. Used by authenticated password change flow

#### Get Session (`getSession`)
1. Call `supabase.auth.getSession()`
2. Return session or null (not an error if no session)
3. Used by session status checks

#### Refresh Session (`refreshSession`)
1. Call `supabase.auth.refreshSession()`
2. Return new session or error
3. Used by middleware and refresh endpoint

#### Verify Email (`verifyEmail`)
1. Call `supabase.auth.verifyOtp()` with token and type
2. Return session if successful
3. Return error if token invalid/expired

### Acceptance Criteria

#### Password Reset
- [ ] `resetPassword()` sends email via Supabase
- [ ] Always returns success (enumeration protection)
- [ ] Email contains correct redirect URL
- [ ] Errors logged but not exposed to caller
- [ ] Works with non-existent email (no error returned)

#### Update Password
- [ ] `updatePassword()` with token verifies OTP first
- [ ] `updatePassword()` without token uses active session
- [ ] Returns error if OTP verification fails
- [ ] Returns error if password update fails
- [ ] Successfully updates password in Supabase

#### Change Password
- [ ] `changePassword()` updates password for user ID
- [ ] Returns error if user not found
- [ ] Returns error if update fails

#### Session Management
- [ ] `getSession()` returns current session if exists
- [ ] `getSession()` returns null if no session (not error)
- [ ] `refreshSession()` returns new session tokens
- [ ] `refreshSession()` returns error if refresh fails

#### Email Verification
- [ ] `verifyEmail()` validates OTP token
- [ ] `verifyEmail()` returns session on success
- [ ] `verifyEmail()` returns error on invalid token
- [ ] `verifyEmail()` returns error on expired token

#### Testing
- [ ] Unit tests for all new functions (happy path)
- [ ] Unit tests for all error cases
- [ ] Test OTP verification flow
- [ ] Test token-based vs session-based password update
- [ ] Mock Supabase calls appropriately
- [ ] Test coverage ≥ 90%

### Dependencies
- **Depends on:** Task 1 (Auth Service Foundation)

### Migration Notes
- Backward compatible with existing API routes
- Server Actions not yet updated

---

## Task 3: Refactor Core Server Actions to Use Auth Service

**Epic:** Authentication Service Refactor
**Story Points:** 3
**Estimated Lines:** ~250 lines
**Priority:** P1

### Description

Refactor `signupAction` and `signOutAction` to use the Auth Service instead of making HTTP fetch calls to API routes. This eliminates HTTP overhead and simplifies the code.

**Note:** `loginAction` has already been refactored (as of commit 952f233) to call Supabase directly. This task completes the migration for the remaining core actions.

### Files Modified

- `src/actions/auth-actions.ts` (modify ~200 lines, remove ~150 lines)

### Implementation Details

#### Remove Helper Functions

**DELETE** these functions (no longer needed):
```typescript
async function getCookieHeader(): Promise<string>  // Line 19-25
```

No longer needed because service calls don't require HTTP requests.

#### Refactor `signupAction()` (lines 96-144)

**Before:**
```typescript
export async function signupAction(...) {
  // Validation
  const result = signupSchema.safeParse({ email, password });
  if (!result.success) { /* return errors */ }

  // HTTP fetch to API route
  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // Always redirect
  redirect("/verify-email");
}
```

**After:**
```typescript
import { signup } from '@/lib/auth/service';

export async function signupAction(...) {
  // Validation (keep as-is)
  const result = signupSchema.safeParse({ email, password });
  if (!result.success) { /* return errors */ }

  // Direct service call
  await signup(result.data.email, result.data.password);

  // Always redirect (user enumeration protection)
  redirect("/verify-email");
}
```

**Key Changes:**
- Remove HTTP fetch
- Remove try/catch (enumeration protection handled by service)
- Call `signup()` directly
- Still always redirect to `/verify-email`

#### `loginAction()` - Already Completed ✅

**Status:** This action was already refactored in commit 952f233.

**Current Implementation** (lines 153-239):
```typescript
export async function loginAction(...) {
  // Validation
  const result = loginSchema.safeParse({ email, password, redirectTo });
  if (!result.success) { /* return errors */ }

  // Direct Supabase call (no HTTP fetch)
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return {
      error: isEmailNotVerifiedError(error)
        ? "Please verify your email before logging in"
        : "Invalid email or password",
      // ...
    };
  }

  redirect(targetUrl);
}
```

**What's Already Done:**
- ✅ No HTTP fetch call
- ✅ Direct Supabase client usage
- ✅ Email masking in logs
- ✅ Email verification error detection helper

**Note:** The implementation directly calls Supabase instead of using the service layer pattern we're creating. In Task 3, we can optionally refactor it to use the service for consistency, but it's functionally complete.

#### Refactor `signOutAction()` (lines 610-640)

**Before:**
```typescript
export async function signOutAction(): Promise<void> {
  const baseUrl = getAppUrl();

  try {
    const response = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    redirect("/");
  } catch (err) {
    // Handle redirect vs error
  }
}
```

**After:**
```typescript
import { logout } from '@/lib/auth/service';

export async function signOutAction(): Promise<void> {
  await logout();
  redirect("/");
}
```

**Key Changes:**
- Remove HTTP fetch
- Remove error handling (logout always succeeds)
- Simplified to 3 lines

### Acceptance Criteria

#### Signup Action
- [ ] Uses `signup()` from `@/lib/auth/service`
- [ ] No HTTP fetch calls
- [ ] Validation logic unchanged
- [ ] Always redirects to `/verify-email`
- [ ] User enumeration protection maintained
- [ ] Error handling removed (service handles it)

#### Login Action
- [ ] Uses `login()` from `@/lib/auth/service`
- [ ] No HTTP fetch calls
- [ ] Validation logic unchanged
- [ ] Returns error state if login fails
- [ ] Redirect URL validation still performed
- [ ] Redirects to target URL on success
- [ ] Generic error message shown on failure

#### Sign Out Action
- [ ] Uses `logout()` from `@/lib/auth/service`
- [ ] No HTTP fetch calls
- [ ] Redirects to home page
- [ ] Simplified error handling

#### Code Quality
- [ ] No `getCookieHeader()` function (removed)
- [ ] No `fetch()` calls in refactored actions
- [ ] No try/catch for redirect detection (Next.js 14+ handles this)
- [ ] Imports from `@/lib/auth/service` added
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no warnings

#### Testing
- [ ] Existing tests updated to mock service instead of fetch
- [ ] Tests pass for signup success case
- [ ] Tests pass for login success case
- [ ] Tests pass for login failure case
- [ ] Tests pass for sign out case
- [ ] Integration tests still pass (E2E unchanged)

#### Behavior Verification
- [ ] User can sign up successfully
- [ ] User receives verification email
- [ ] User redirected to `/verify-email` after signup
- [ ] User can log in with valid credentials
- [ ] User sees error message with invalid credentials
- [ ] User redirected to dashboard after login
- [ ] User can sign out successfully
- [ ] User redirected to home after sign out

### Testing Strategy

Update existing tests to mock service instead of fetch:

```typescript
// Before
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ session: {...} })
});

// After
import * as authService from '@/lib/auth/service';
jest.mock('@/lib/auth/service');

(authService.login as jest.Mock).mockResolvedValue({
  data: { session: {...} },
  error: null,
  success: true
});
```

### Dependencies
- **Depends on:** Task 1, Task 2
- **Blocks:** Task 5 (verification flow)

### Migration Notes
- API routes still exist (not removed yet)
- No client-side changes required
- Can be deployed incrementally (one action at a time if needed)

---

## Task 4: Refactor Password Server Actions to Use Auth Service

**Epic:** Authentication Service Refactor
**Story Points:** 5
**Estimated Lines:** ~350 lines
**Priority:** P1

### Description

Refactor `passwordResetRequestAction`, `passwordUpdateAction`, and `passwordChangeAction` to use the Auth Service instead of making HTTP fetch calls. This completes the Server Actions migration.

### Files Modified

- `src/actions/auth-actions.ts` (modify ~300 lines, remove ~50 lines)

### Implementation Details

#### Refactor `passwordResetRequestAction()` (lines 242-315)

**Before:**
```typescript
export async function passwordResetRequestAction(...) {
  const result = passwordResetSchema.safeParse({ email });
  if (!result.success) { /* return errors */ }

  const response = await fetch(`${baseUrl}/api/auth/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  // Always return success (enumeration protection)
  return { data: { message: "..." }, ... };
}
```

**After:**
```typescript
import { resetPassword } from '@/lib/auth/service';

export async function passwordResetRequestAction(...) {
  const result = passwordResetSchema.safeParse({ email });
  if (!result.success) { /* return errors */ }

  await resetPassword(result.data.email);

  // Always return success (enumeration protection)
  return {
    data: { message: "If an account exists, a password reset email has been sent" },
    error: null,
    fieldErrors: {},
    isSuccess: true,
  };
}
```

**Key Changes:**
- Remove HTTP fetch
- Call `resetPassword()` directly
- Service handles enumeration protection
- Simplified error handling

#### Refactor `passwordUpdateAction()` (lines 324-446)

**Before:**
```typescript
export async function passwordUpdateAction(...) {
  // Validation
  const result = passwordUpdateSchema.safeParse({ password });
  if (!result.success) { /* return errors */ }

  const cookieHeader = await getCookieHeader();
  const token_hash = ...;
  const type = ...;

  const response = await fetch(`${baseUrl}/api/auth/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,  // Manual cookie forwarding
    },
    body: JSON.stringify({ password, token_hash, type }),
  });

  const data = await response.json();
  if (!response.ok) { /* handle errors */ }

  redirect("/login");
}
```

**After:**
```typescript
import { updatePassword } from '@/lib/auth/service';

export async function passwordUpdateAction(...) {
  // Validation (keep as-is)
  const result = passwordUpdateSchema.safeParse({ password });
  if (!result.success) { /* return errors */ }

  // Extract token if provided
  const token_hash = typeof tokenHashValue === "string" ? tokenHashValue : undefined;
  const type = typeof typeValue === "string" ? typeValue : undefined;

  // Direct service call (cookies handled by Supabase client automatically)
  const { error } = await updatePassword(result.data.password, {
    tokenHash: token_hash,
    type,
  });

  if (error) {
    // Check for session/auth errors
    if (error.code === 'AUTH_ERROR' || error.message.includes('session')) {
      return {
        data: null,
        error: "Session has expired. Please request a new reset link.",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    return {
      data: null,
      error: "Failed to update password. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  redirect("/login");
}
```

**Key Changes:**
- Remove `getCookieHeader()` call (no longer needed)
- Remove HTTP fetch
- Call `updatePassword()` directly
- Service handles cookies via Supabase client
- Simplified error handling

#### Refactor `passwordChangeAction()` (lines 453-603)

**Before:**
```typescript
export async function passwordChangeAction(...) {
  // Validation

  const cookieHeader = await getCookieHeader();

  // Get session
  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  });

  // Verify current password via login
  const verifyResponse = await fetch(`${baseUrl}/api/auth/login`, {
    body: JSON.stringify({ email, password: currentPassword }),
  });

  // Update password
  const updateResponse = await fetch(`${baseUrl}/api/auth/password`, {
    body: JSON.stringify({ password }),
  });

  return { data: { message: "Password updated" }, ... };
}
```

**After:**
```typescript
import { getSession, login, updatePassword } from '@/lib/auth/service';

export async function passwordChangeAction(...) {
  // Validation (keep as-is)

  // Get current session
  const { data: sessionData, error: sessionError } = await getSession();

  if (sessionError || !sessionData?.user?.email) {
    return {
      data: null,
      error: "Authentication required",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  // Verify current password
  const { error: verifyError } = await login(
    sessionData.user.email,
    currentPassword as string
  );

  if (verifyError) {
    return {
      data: null,
      error: "Current password is incorrect",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  // Update password
  const { error: updateError } = await updatePassword(result.data.password);

  if (updateError) {
    return {
      data: null,
      error: "Failed to update password. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  return {
    data: { message: "Password updated successfully" },
    error: null,
    fieldErrors: {},
    isSuccess: true,
  };
}
```

**Key Changes:**
- Remove all HTTP fetch calls (3 total)
- Call `getSession()`, `login()`, `updatePassword()` directly
- No cookie forwarding needed
- Cleaner error handling
- Sequential service calls instead of sequential HTTP calls

### Acceptance Criteria

#### Password Reset Request Action
- [ ] Uses `resetPassword()` from service
- [ ] No HTTP fetch calls
- [ ] Always returns success (enumeration protection)
- [ ] Validation logic unchanged
- [ ] Error handling simplified

#### Password Update Action
- [ ] Uses `updatePassword()` from service
- [ ] No HTTP fetch calls
- [ ] No manual cookie forwarding
- [ ] Token-based flow works (reset password)
- [ ] Session-based flow works (authenticated update)
- [ ] Returns appropriate error messages
- [ ] Redirects to login on success

#### Password Change Action
- [ ] Uses `getSession()`, `login()`, `updatePassword()` from service
- [ ] No HTTP fetch calls
- [ ] Current password verification works
- [ ] Password update succeeds after verification
- [ ] Returns error if current password wrong
- [ ] Returns error if session invalid
- [ ] Returns success message on completion

#### Code Quality
- [ ] All `fetch()` calls removed from password actions
- [ ] No `getCookieHeader()` usage
- [ ] Imports from `@/lib/auth/service` added
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes

#### Testing
- [ ] Tests updated to mock service instead of fetch
- [ ] Password reset request tests pass
- [ ] Password update with token tests pass
- [ ] Password change with verification tests pass
- [ ] Error cases handled correctly

#### Behavior Verification
- [ ] User can request password reset
- [ ] User receives reset email
- [ ] User can reset password via email link
- [ ] User can change password when authenticated
- [ ] Current password verification works
- [ ] All error messages display correctly

### Testing Strategy

```typescript
import * as authService from '@/lib/auth/service';
jest.mock('@/lib/auth/service');

describe('passwordChangeAction', () => {
  it('should verify current password before updating', async () => {
    (authService.getSession as jest.Mock).mockResolvedValue({
      data: { user: { email: 'test@example.com' } },
      error: null,
    });

    (authService.login as jest.Mock).mockResolvedValue({
      data: {...},
      error: null,
    });

    (authService.updatePassword as jest.Mock).mockResolvedValue({
      error: null,
    });

    const result = await passwordChangeAction(initialState, formData);

    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'currentPass');
    expect(authService.updatePassword).toHaveBeenCalledWith('newPass');
    expect(result.isSuccess).toBe(true);
  });
});
```

### Dependencies
- **Depends on:** Task 1, Task 2, Task 3
- **Blocks:** Task 6 (testing)

### Migration Notes
- Completes Server Actions migration
- No client-side changes
- API routes remain for backward compatibility

---

## Task 5: Update Email Verification Flow

**Epic:** Authentication Service Refactor
**Story Points:** 3
**Estimated Lines:** ~200 lines
**Priority:** P1

### Description

Update the email verification flow to use the Auth Service. The verification endpoint must remain as an API route because it handles redirects from email links, but it should use the service internally.

### Files Modified

- `src/app/api/auth/verify/route.ts` (refactor ~100 lines)
- `src/lib/auth/service.ts` (already has `verifyEmail()` from Task 2)

### Current Architecture

```
Email Link → GET /api/auth/verify?token_hash=xxx&type=recovery
           → API route calls supabase.auth.verifyOtp()
           → Redirect to dashboard with session cookie
```

This must remain an **API route** (not a Server Action) because:
1. Email links are direct HTTP GET requests
2. Needs to handle query parameters
3. Must set cookies and redirect

### Implementation Details

#### Refactor `src/app/api/auth/verify/route.ts`

**Before:**
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Validation

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as any,
    token_hash: token_hash,
  });

  if (error) {
    // Handle error
  }

  // Redirect to dashboard
}
```

**After:**
```typescript
import { verifyEmail } from '@/lib/auth/service';
import { errorResponse, successResponse } from '@/lib/utils/api/response';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Validation (keep as-is)
  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_verification_link', request.url)
    );
  }

  // Use service
  const { data, error } = await verifyEmail(token_hash, type);

  if (error) {
    console.error('[Verify]', `Verification failed: ${error.message}`);
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', request.url)
    );
  }

  // Success - session created by service
  console.info('[Verify]', 'Email verified successfully');
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

**Key Changes:**
- Import and use `verifyEmail()` from service
- Remove direct Supabase calls
- Keep redirect logic (required for email verification flow)
- Simplified error handling

### Alternative Approaches Considered

#### Option A: Keep as API Route (Chosen)
✅ Simple refactor
✅ No breaking changes
✅ Handles redirects naturally

#### Option B: Convert to Page with Server Component
❌ More complex
❌ Requires client-side redirect
❌ Less clean for simple verification

#### Option C: Use Middleware
❌ Middleware shouldn't handle business logic
❌ Can't easily show error states

### Acceptance Criteria

#### Functionality
- [ ] Uses `verifyEmail()` from auth service
- [ ] No direct Supabase calls in route handler
- [ ] Validates `token_hash` and `type` query params
- [ ] Redirects to `/dashboard` on success
- [ ] Redirects to `/login?error=...` on failure
- [ ] Session cookie set correctly (handled by service)

#### Error Handling
- [ ] Missing parameters → redirect with error
- [ ] Invalid token → redirect with error
- [ ] Expired token → redirect with error
- [ ] All errors logged server-side

#### Code Quality
- [ ] Imports from `@/lib/auth/service`
- [ ] No `createClient()` call in route
- [ ] TypeScript compiles
- [ ] ESLint passes

#### Testing
- [ ] Test successful verification
- [ ] Test invalid token
- [ ] Test missing parameters
- [ ] Test expired token
- [ ] Verify session created
- [ ] Verify redirects work

#### Behavior Verification
- [ ] User clicks verification link in email
- [ ] User redirected to dashboard with active session
- [ ] User can access protected routes after verification
- [ ] Invalid links show error message on login page

### Testing Strategy

```typescript
import { verifyEmail } from '@/lib/auth/service';
jest.mock('@/lib/auth/service');

describe('GET /api/auth/verify', () => {
  it('should verify email and redirect to dashboard', async () => {
    (verifyEmail as jest.Mock).mockResolvedValue({
      data: { session: {...} },
      error: null,
    });

    const request = new NextRequest(
      'http://localhost/api/auth/verify?token_hash=abc&type=signup'
    );

    const response = await GET(request);

    expect(verifyEmail).toHaveBeenCalledWith('abc', 'signup');
    expect(response.status).toBe(307); // Redirect
    expect(response.headers.get('Location')).toContain('/dashboard');
  });

  it('should redirect to login on invalid token', async () => {
    (verifyEmail as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    });

    // ... test error redirect
  });
});
```

### Dependencies
- **Depends on:** Task 2 (verifyEmail function)
- **Blocks:** Task 6 (testing)

### Migration Notes
- API route remains (not removed)
- Verification flow unchanged from user perspective
- Service call instead of direct Supabase call

---

## Task 6: Comprehensive Testing and Validation

**Epic:** Authentication Service Refactor
**Story Points:** 8
**Estimated Lines:** ~450 lines
**Priority:** P1

### Description

Create comprehensive test coverage for the new Auth Service and update existing tests for refactored Server Actions. Ensure all authentication flows work correctly after the refactor.

### Test Files to Create/Update

```
src/lib/auth/
├── __tests__/
│   ├── service.test.ts           # NEW: Service unit tests (200 lines)
│   └── service-integration.test.ts # NEW: Service integration tests (150 lines)
└── service.ts

src/actions/
├── __tests__/
│   └── auth-actions.test.ts      # UPDATE: Refactor to mock service (100 lines)
```

### Implementation Details

#### Unit Tests: `src/lib/auth/__tests__/service.test.ts`

Test all service functions in isolation with mocked Supabase:

```typescript
import { signup, login, logout, resetPassword, updatePassword } from '../service';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup()', () => {
    it('should create user and return success');
    it('should return success even when user exists (enumeration protection)');
    it('should send verification email with correct redirect URL');
    it('should log errors internally without exposing to caller');
    it('should mask email in logs');
  });

  describe('login()', () => {
    it('should authenticate user and return session');
    it('should return generic error for invalid credentials');
    it('should detect unverified email');
    it('should return generic error for non-existent user');
    it('should log all attempts');
  });

  describe('logout()', () => {
    it('should invalidate session');
    it('should handle logout errors gracefully');
  });

  describe('resetPassword()', () => {
    it('should send reset email');
    it('should return success even for non-existent email (enumeration protection)');
    it('should use correct redirect URL');
  });

  describe('updatePassword()', () => {
    it('should update password with valid token');
    it('should verify OTP before updating');
    it('should return error for invalid token');
    it('should update password for authenticated user without token');
  });

  describe('getSession()', () => {
    it('should return current session if exists');
    it('should return null if no session (not error)');
  });

  describe('refreshSession()', () => {
    it('should return new session tokens');
    it('should return error if refresh fails');
  });

  describe('verifyEmail()', () => {
    it('should verify OTP and return session');
    it('should return error for invalid token');
    it('should return error for expired token');
  });
});
```

**Coverage Target:** ≥ 90% for service.ts

#### Integration Tests: `src/lib/auth/__tests__/service-integration.test.ts`

Test service with real Supabase test instance (or realistic mocks):

```typescript
describe('Auth Service Integration', () => {
  describe('Complete signup flow', () => {
    it('should signup → send email → verify → login');
  });

  describe('Complete password reset flow', () => {
    it('should request reset → receive email → update password → login');
  });

  describe('Session management', () => {
    it('should login → get session → refresh session → logout');
  });

  describe('Password change flow', () => {
    it('should login → verify current password → change password → login with new');
  });
});
```

#### Refactor Existing Tests: `src/actions/__tests__/auth-actions.test.ts`

Update to mock service instead of fetch:

```typescript
import * as authService from '@/lib/auth/service';

jest.mock('@/lib/auth/service', () => ({
  signup: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  getSession: jest.fn(),
}));

describe('Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signupAction', () => {
    it('should call signup service and redirect', async () => {
      (authService.signup as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
        success: true,
      });

      const formData = new FormData();
      formData.set('email', 'test@example.com');
      formData.set('password', 'SecurePass123!');

      await expect(signupAction(initialState, formData)).rejects.toThrow('NEXT_REDIRECT');

      expect(authService.signup).toHaveBeenCalledWith('test@example.com', 'SecurePass123!');
    });
  });

  describe('loginAction', () => {
    it('should call login service and redirect on success');
    it('should return error state on invalid credentials');
    it('should validate redirect URL');
  });

  describe('passwordChangeAction', () => {
    it('should call getSession, login, updatePassword in sequence');
    it('should return error if current password incorrect');
  });

  // ... more tests
});
```

### E2E Test Updates

Update E2E tests to verify user-facing behavior unchanged:

```typescript
// tests/e2e/auth.spec.ts

describe('Authentication E2E', () => {
  test('User can sign up and verify email', async ({ page }) => {
    // Navigate to signup
    // Fill form
    // Submit
    // Verify redirect to /verify-email
    // (Email verification would need mock email service)
  });

  test('User can log in and access dashboard', async ({ page }) => {
    // Navigate to login
    // Enter credentials
    // Submit
    // Verify redirect to /dashboard
    // Verify can access protected routes
  });

  test('User can reset password', async ({ page }) => {
    // Navigate to forgot password
    // Enter email
    // Submit
    // Verify success message
  });

  test('User can change password when authenticated', async ({ page }) => {
    // Log in
    // Navigate to settings
    // Change password
    // Verify success
    // Log out and log in with new password
  });
});
```

### Acceptance Criteria

#### Unit Tests
- [ ] All service functions have unit tests
- [ ] Happy path tests pass for all functions
- [ ] Error cases tested for all functions
- [ ] User enumeration protection verified in tests
- [ ] Logging behavior verified (masked emails)
- [ ] Mock Supabase calls correctly
- [ ] Test coverage ≥ 90% for service.ts
- [ ] All tests pass in CI/CD

#### Integration Tests
- [ ] Complete signup flow tested
- [ ] Complete password reset flow tested
- [ ] Session management flow tested
- [ ] Password change flow tested
- [ ] Tests use realistic Supabase mocks
- [ ] All integration tests pass

#### Server Action Tests
- [ ] All actions updated to mock service (not fetch)
- [ ] signupAction tests pass
- [ ] loginAction tests pass
- [ ] signOutAction tests pass
- [ ] passwordResetRequestAction tests pass
- [ ] passwordUpdateAction tests pass
- [ ] passwordChangeAction tests pass
- [ ] All action tests pass in CI/CD

#### E2E Tests
- [ ] Signup flow works end-to-end
- [ ] Login flow works end-to-end
- [ ] Password reset flow works end-to-end
- [ ] Password change flow works end-to-end
- [ ] Protected routes still protected
- [ ] Redirects work correctly
- [ ] All E2E tests pass

#### Test Infrastructure
- [ ] Jest configuration supports service mocks
- [ ] Test utilities created for common mocks
- [ ] CI/CD pipeline runs all tests
- [ ] Test coverage report generated
- [ ] No flaky tests

#### Performance
- [ ] Tests run faster than before (no HTTP mocking overhead)
- [ ] All tests complete in < 30 seconds
- [ ] No timeout issues

### Testing Strategy

**Test Pyramid:**
```
         E2E Tests (5-10 tests)
              ↑
     Integration Tests (15-20 tests)
              ↑
      Unit Tests (40-50 tests)
```

**Mock Strategy:**
- Unit tests: Mock Supabase completely
- Integration tests: Use realistic Supabase mocks or test instance
- E2E tests: Real application, potentially mocked email service

**Test Data:**
- Use factories for test user data
- Consistent test emails (test@example.com)
- Predictable passwords (SecurePass123!)

### Dependencies
- **Depends on:** All previous tasks (1-5)
- **Blocks:** Task 7 (documentation)

### Migration Notes
- Run tests before and after refactor to ensure behavior unchanged
- All tests should pass before merging

---

## Task 7: Remove Obsolete API Routes and Update Documentation

**Epic:** Authentication Service Refactor
**Story Points:** 3
**Estimated Lines:** ~200 lines (net negative - removing code)
**Priority:** P2

### Description

Remove obsolete authentication API routes that have been replaced by the Auth Service. Update architecture documentation to reflect the new service-based approach. Only keep `/api/auth/verify` which is required for email verification links.

### Files Modified/Created

```
src/app/api/auth/
├── signup/route.ts           # DELETE (obsolete)
├── login/route.ts            # DELETE (obsolete)
├── logout/route.ts           # DELETE (obsolete)
├── password/
│   ├── route.ts              # DELETE (obsolete)
│   └── reset/route.ts        # DELETE (obsolete)
├── session/route.ts          # DELETE (obsolete)
├── refresh/route.ts          # DELETE (obsolete)
└── verify/route.ts           # KEEP (required for email verification links)

docs/
├── decisions/
│   └── authentication.md     # UPDATE architecture section
└── specifications/
    └── auth-service-refactor.md  # This document
```

### Implementation Details

#### Remove Obsolete API Routes

**Delete these files** (no longer needed):

```bash
# Remove authentication API routes replaced by service
rm -rf src/app/api/auth/signup/
rm -rf src/app/api/auth/login/
rm -rf src/app/api/auth/logout/
rm -rf src/app/api/auth/password/reset/
rm -rf src/app/api/auth/password/route.ts
rm -rf src/app/api/auth/session/
rm -rf src/app/api/auth/refresh/
```

**Keep these files** (still required):

- `src/app/api/auth/verify/route.ts` - Required for email verification links from Supabase emails

#### Update Architecture Documentation

Update `docs/decisions/authentication.md`:

**Replace "API Architecture" section** (around line 1032) with:

```markdown
## Architecture

### Current Architecture (As of 2025-12-07)

The application uses a **two-layer authentication architecture**:

```
UI Components (Client)
    ↓
Server Actions (Server)
    ↓
Auth Service (Server)
    ↓
Supabase SDK
```

**Auth Service** (`/src/lib/auth/service.ts`):
- Centralized authentication logic
- Called directly by Server Actions
- Handles all Supabase auth operations
- Provides consistent error handling
- No HTTP overhead

**Server Actions** (`/src/actions/auth-actions.ts`):
- Thin wrappers around Auth Service
- Handle validation and redirects
- Manage form state
- Return user-friendly errors

**API Routes** (`/src/app/api/auth/*`) - **Removed**:
- All removed except `/api/auth/verify`
- `/api/auth/verify` remains active (required for email verification links)

### Previous Architecture (Before 2025-12-07)

Previously used three-layer architecture:
```
UI → Server Actions → API Routes → Supabase
```

Migrated to service-based architecture for:
- Better performance (no HTTP overhead)
- Simpler code (fewer layers)
- Type safety (no HTTP boundary)
- Easier testing

See: `/docs/specifications/auth-service-refactor.md`
```

#### Document API Route Removal

Add to documentation that explains the changes:

**Changes Summary:**

The following API routes have been **removed** and replaced with the Auth Service:

| Removed Route | Replacement |
|--------------|-------------|
| `POST /api/auth/signup` | `import { signup } from '@/lib/auth/service'` |
| `POST /api/auth/login` | Direct Supabase call in Server Actions |
| `POST /api/auth/logout` | `import { logout } from '@/lib/auth/service'` |
| `POST /api/auth/password/reset` | `import { resetPassword } from '@/lib/auth/service'` |
| `PUT /api/auth/password` | `import { updatePassword } from '@/lib/auth/service'` |
| `GET /api/auth/session` | `import { getSession } from '@/lib/auth/service'` |
| `POST /api/auth/refresh` | `import { refreshSession } from '@/lib/auth/service'` |

**Retained Route:**
- `GET /api/auth/verify` - Required for email verification links (direct HTTP GET requests from email)

#### Update README

Update main README.md with architecture section:

```markdown
## Authentication Architecture

This application uses **Supabase Auth** with a service-based architecture:

- **Auth Service** (`src/lib/auth/service.ts`) - Centralized auth logic
- **Server Actions** - Call service directly (no HTTP overhead)
- **Middleware** - Protects routes, manages sessions

See [Authentication Documentation](docs/decisions/authentication.md) for details.
```

### Acceptance Criteria

#### API Route Removal
- [ ] `src/app/api/auth/signup/` directory deleted
- [ ] `src/app/api/auth/login/` directory deleted
- [ ] `src/app/api/auth/logout/` directory deleted
- [ ] `src/app/api/auth/password/reset/` directory deleted
- [ ] `src/app/api/auth/password/route.ts` file deleted
- [ ] `src/app/api/auth/session/` directory deleted
- [ ] `src/app/api/auth/refresh/` directory deleted
- [ ] `/api/auth/verify` route remains (not deleted)

#### Documentation Updates
- [ ] `authentication.md` updated with new architecture
- [ ] Architecture diagram reflects service-based approach
- [ ] Previous architecture documented for reference
- [ ] Migration guide created
- [ ] Migration guide includes examples
- [ ] Migration guide includes timeline
- [ ] README.md updated
- [ ] All docs use correct terminology

#### Code Quality
- [ ] No broken links in documentation
- [ ] Markdown renders correctly
- [ ] Code examples are accurate
- [ ] TypeScript examples compile
- [ ] Consistent formatting

#### Completeness
- [ ] All API routes addressed (deprecated or kept)
- [ ] All benefits of refactor documented
- [ ] Migration path clear
- [ ] External API usage addressed
- [ ] Timeline for removal specified

### Testing Strategy

**Route Removal Verification:**
- [ ] Verify removed routes return 404
- [ ] Verify `/api/auth/verify` still works
- [ ] Test email verification flow end-to-end
- [ ] Confirm no broken references to deleted routes in codebase

**Documentation Testing:**
- [ ] All code examples copy-paste and run
- [ ] All links resolve correctly
- [ ] Markdown renders without errors
- [ ] Diagrams display correctly

**Code Search:**
```bash
# Verify no code references deleted routes
grep -r "/api/auth/login" src/
grep -r "/api/auth/signup" src/
grep -r "/api/auth/logout" src/
# etc.
```

### Dependencies
- **Depends on:** All previous tasks
- **Blocks:** None (final task)

### Migration Notes
- API routes will be completely removed (not deprecated)
- Only `/api/auth/verify` will remain for email verification
- All Server Actions must use Auth Service before this task
- Breaking change: External API consumers will need to adapt (if any exist)

---

## Rollout Plan

### Phase 1: Development (Week 1-2)
- [ ] Complete Tasks 1-2 (Auth Service creation)
- [ ] Complete Task 3 (Core actions refactor)
- [ ] Run tests locally
- [ ] Code review

### Phase 2: Testing (Week 2)
- [ ] Complete Tasks 4-5 (Password actions, verification)
- [ ] Complete Task 6 (Comprehensive testing)
- [ ] Run full test suite
- [ ] Manual QA testing

### Phase 3: Documentation (Week 3)
- [ ] Complete Task 7 (Deprecation, docs)
- [ ] Review all documentation
- [ ] Prepare deployment plan

### Phase 4: Deployment (Week 3)
- [ ] Deploy to staging
- [ ] Smoke tests in staging
- [ ] Monitor for errors
- [ ] Deploy to production
- [ ] Monitor production metrics

### Phase 5: Validation (Week 4)
- [ ] Verify all flows work in production
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather feedback

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback**: Revert Server Actions to use API routes
   - Keep service code (not breaking)
   - Restore `fetch()` calls in actions
   - Re-deploy

2. **Partial Rollback**: Revert specific actions
   - Identify problematic action
   - Restore just that action to API route
   - Investigate issue

3. **Data Safety**: No database changes, rollback is code-only

## Success Metrics

### Performance
- [ ] Average auth operation latency reduced by ≥20%
- [ ] Fewer failed requests (no HTTP timeouts)
- [ ] Lower server CPU usage for auth operations

### Code Quality
- [ ] Fewer lines of code (estimated -200 lines)
- [ ] Reduced cyclomatic complexity
- [ ] Better test coverage (≥90%)

### Developer Experience
- [ ] Faster test execution
- [ ] Clearer stack traces
- [ ] Easier to debug auth issues

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking auth flows | Low | High | Comprehensive testing (Task 6) |
| Session issues | Low | High | Keep middleware unchanged |
| Missing edge cases | Medium | Medium | Thorough E2E testing |
| Performance regression | Low | Low | Monitor metrics post-deploy |
| External API consumers broken | Low | High | Verify no external consumers before Task 7 |
| Email verification broken | Medium | High | Keep `/api/auth/verify` route, test thoroughly |

## Open Questions

1. **Email Verification Route**: Should this also use service internally?
   - Current: Keep as API route (GET requests from email need redirect)
   - Implementation: Route calls Auth Service internally
   - Future: Could potentially convert to page with server component

2. **External API Consumers**: Are there any mobile apps or third-party integrations?
   - If yes: May need to provide alternative API or versioning strategy
   - If no: Proceed with removal as planned
   - **Action Required**: Confirm no external consumers before Task 7

## References

- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [SpecKit Workflow](https://github.com/anthropics/speckit)

---

## Appendix: File Change Summary

### New Files (6)
- `src/lib/auth/service.ts` (~350 lines)
- `src/lib/auth/service/types.ts` (~50 lines)
- `src/lib/auth/service/errors.ts` (~50 lines)
- `src/lib/auth/__tests__/service.test.ts` (~200 lines)
- `src/lib/auth/__tests__/service-integration.test.ts` (~150 lines)
- `docs/specifications/auth-service-refactor.md` (this file)

### Modified Files (4)
- `src/actions/auth-actions.ts` (~400 lines modified)
- `src/app/api/auth/verify/route.ts` (~100 lines modified)
- `src/actions/__tests__/auth-actions.test.ts` (~100 lines modified)
- `docs/decisions/authentication.md` (~50 lines modified)
- `README.md` (~10 lines added)

### Deleted Files (7 route files)
- `src/app/api/auth/signup/route.ts` (~90 lines removed)
- `src/app/api/auth/login/route.ts` (~90 lines removed)
- `src/app/api/auth/logout/route.ts` (~60 lines removed)
- `src/app/api/auth/password/route.ts` (~150 lines removed)
- `src/app/api/auth/password/reset/route.ts` (~100 lines removed)
- `src/app/api/auth/session/route.ts` (~80 lines removed)
- `src/app/api/auth/refresh/route.ts` (~70 lines removed)

### Total Lines Changed
- **Added**: ~1,200 lines (service + tests)
- **Modified**: ~650 lines (actions, tests, docs)
- **Removed**: ~640 lines (7 API route files)
- **Net**: ~+210 lines (significant simplification through deletion)

---

**End of Specification**
