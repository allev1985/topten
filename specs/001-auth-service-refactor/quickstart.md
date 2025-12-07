# Auth Service Refactor - Implementation Quickstart

**Feature**: Auth Service Refactor - Direct Service Integration  
**Branch**: `001-auth-service-refactor`  
**Date**: 2025-12-07

## Overview

This guide provides step-by-step instructions for refactoring `signupAction` and `signOutAction` server actions to call auth service methods directly instead of making HTTP fetch calls.

## Prerequisites

- Working knowledge of Next.js Server Actions
- Understanding of Supabase auth service API (see `src/lib/auth/service.ts`)
- Familiarity with the existing test infrastructure (Vitest)

## Implementation Steps

### Phase 1: Refactor `signupAction`

**File**: `src/actions/auth-actions.ts`

#### Step 1.1: Add Import for Auth Service

**Location**: Top of file, after existing imports

**Add**:
```typescript
import { signup } from "@/lib/auth/service";
```

#### Step 1.2: Replace HTTP Fetch with Direct Service Call

**Current code** (lines 98-146):
```typescript
export async function signupAction(
  _prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>> {
  // ... validation code (keep unchanged) ...
  
  const baseUrl = getAppUrl();

  try {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: result.data.email,
        password: result.data.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as AuthErrorResponse;
      console.error("[Signup] Error:", errorData.error.message);
    }
  } catch (err) {
    console.error(
      "[Signup] Network error:",
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  redirect("/verify-email");
}
```

**New code**:
```typescript
export async function signupAction(
  _prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>> {
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate input (for immediate feedback - service will re-validate)
  const result = signupSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    await signup(result.data.email, result.data.password);
  } catch (err) {
    // Log errors but still redirect for enumeration protection
    console.error(
      "[Signup] Error:",
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  // Always redirect to verify-email page (user enumeration protection)
  redirect("/verify-email");
}
```

**Key changes**:
- Remove `getAppUrl()` import usage (no longer needed)
- Replace `fetch()` call with direct `signup()` service call
- Simplify error handling (no HTTP status codes to check)
- Preserve enumeration protection (always redirect regardless of outcome)
- Remove `AuthErrorResponse` type handling (not needed)

### Phase 2: Refactor `signOutAction`

**File**: `src/actions/auth-actions.ts`

#### Step 2.1: Add Import for Auth Service

**Location**: Top of file (if not already added in Step 1.1)

**Add**:
```typescript
import { logout } from "@/lib/auth/service";
```

#### Step 2.2: Replace HTTP Fetch with Direct Service Call

**Current code** (lines 615-650):
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
    const isRedirect =
      (typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof (err as { digest: string }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) ||
      (err instanceof Error && err.message.startsWith("REDIRECT:"));

    if (isRedirect) {
      throw err;
    }

    console.error("[SignOut] Error:", err);
    // Don't redirect on error - let component handle it
  }
}
```

**New code**:
```typescript
export async function signOutAction(): Promise<void> {
  try {
    await logout();
    redirect("/");
  } catch (err) {
    // Check if this is a redirect (Next.js throws for redirect)
    const isRedirect =
      (typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof (err as { digest: string }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) ||
      (err instanceof Error && err.message.startsWith("REDIRECT:"));

    if (isRedirect) {
      throw err;
    }

    console.error("[SignOut] Error:", err);
    // Don't redirect on error - let component handle it
  }
}
```

**Key changes**:
- Remove `getAppUrl()` usage (no longer needed)
- Replace `fetch()` call with direct `logout()` service call
- Remove HTTP response checking (service handles errors internally)
- Preserve idempotent behavior (logout service succeeds even without session)
- Keep redirect handling (Next.js throws for redirects)

### Phase 3: Remove Unused Helper Function

**File**: `src/actions/auth-actions.ts`

#### Step 3.1: Remove `getCookieHeader()` Function

**Location**: Lines 18-27

**Remove**:
```typescript
/**
 * Helper to get cookies as a string for forwarding to API routes
 */
async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}
```

**Also remove import** (if not used elsewhere):
```typescript
import { cookies } from "next/headers";  // Remove if only used by getCookieHeader
```

**Note**: Check if `cookies` import is still needed by other functions in the file (e.g., `passwordUpdateAction`, `passwordChangeAction`). Only remove if not used.

### Phase 4: Update Unit Tests

**File**: `tests/unit/actions/auth-actions.test.ts`

#### Step 4.1: Replace Global Fetch Mock with Auth Service Mock

**Current mock** (lines 42-44):
```typescript
// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;
```

**New mock**:
```typescript
// Mock auth service
const mockSignup = vi.fn();
const mockLogout = vi.fn();

vi.mock("@/lib/auth/service", () => ({
  signup: mockSignup,
  logout: mockLogout,
}));
```

**Location**: After other mocks, before test suites

#### Step 4.2: Update `signupAction` Tests

**Changes needed** for each test in `describe("signupAction", ...)`:

1. **Test: "redirects to verify-email on successful signup"** (lines 144-174)
   - **Remove**: `mockFetch.mockResolvedValue(...)` setup
   - **Add**: `mockSignup.mockResolvedValue({ requiresEmailConfirmation: true, user: { id: "123" }, session: null })`
   - **Remove**: `expect(mockFetch).toHaveBeenCalledWith(...)` assertion
   - **Add**: `expect(mockSignup).toHaveBeenCalledWith("test@example.com", "ValidPass123!@#")`

2. **Test: "redirects even when email already exists"** (lines 176-198)
   - **Remove**: `mockFetch.mockResolvedValue(...)` setup with error
   - **Add**: `mockSignup.mockRejectedValue(new Error("User already exists"))`
   - Keep redirect expectation (still redirects for enumeration protection)

#### Step 4.3: Update `signOutAction` Test (if exists)

**Note**: Current test file doesn't include `signOutAction` tests. If tests exist elsewhere or are added:

**Setup**:
```typescript
mockLogout.mockResolvedValue({ success: true });
```

**Assertion**:
```typescript
expect(mockLogout).toHaveBeenCalled();
```

#### Step 4.4: Update Test Cleanup

**Current cleanup** (lines 84-91):
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
  // ... other mocks ...
});
```

**New cleanup**:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  mockSignup.mockReset();
  mockLogout.mockReset();
  // ... other mocks ...
});
```

## Validation Steps

### 1. Type Checking

```bash
npm run type-check
# or
npx tsc --noEmit
```

**Expected**: Zero TypeScript errors

### 2. Linting

```bash
npm run lint
```

**Expected**: Zero ESLint warnings/errors

### 3. Unit Tests

```bash
# Run auth-actions tests specifically
npm test -- tests/unit/actions/auth-actions.test.ts

# Or run all unit tests
npm test
```

**Expected**: All tests pass

### 4. Build Verification

```bash
npm run build
```

**Expected**: Build succeeds without errors

### 5. Integration/E2E Tests (if available)

```bash
# Run E2E auth tests
npm run test:e2e -- --grep "auth"
```

**Expected**: All auth flows work (signup, logout, email verification)

## Rollback Plan

If issues are discovered:

1. **Immediate**: Revert the branch
   ```bash
   git reset --hard origin/main
   ```

2. **Partial rollback**: Revert specific files
   ```bash
   git checkout origin/main -- src/actions/auth-actions.ts
   git checkout origin/main -- tests/unit/actions/auth-actions.test.ts
   ```

## Common Issues & Solutions

### Issue 1: Import Errors

**Symptom**: TypeScript error `Cannot find module '@/lib/auth/service'`

**Solution**: Verify the import path matches the actual file location. Check `tsconfig.json` path aliases.

### Issue 2: Test Failures - "signup is not a function"

**Symptom**: Tests fail with TypeError

**Solution**: Ensure mock is set up correctly:
```typescript
vi.mock("@/lib/auth/service", () => ({
  signup: vi.fn(),
  logout: vi.fn(),
}));
```

### Issue 3: Enumeration Protection Broken

**Symptom**: Signup returns error instead of redirecting

**Solution**: Ensure `redirect()` is called outside try/catch or redirect is re-thrown:
```typescript
try {
  await signup(...);
} catch (err) {
  // Log but don't throw
  console.error(err);
}
redirect("/verify-email"); // Always executes
```

## Performance Verification

### Before Refactoring

1. Check current logs for signup/logout timing
2. Note average response times

### After Refactoring

1. Deploy to staging
2. Test signup and logout actions
3. Compare logs to verify improvement:
   - Signup: Should be same or faster
   - Logout: Should be <500ms

## Success Criteria

- ✅ `signupAction` calls `signup()` service method
- ✅ `signOutAction` calls `logout()` service method
- ✅ `getCookieHeader()` function removed
- ✅ All unit tests pass
- ✅ TypeScript compiles without errors
- ✅ ESLint passes without warnings
- ✅ Build succeeds
- ✅ User enumeration protection maintained (signup always redirects)
- ✅ Idempotent logout maintained (succeeds without session)
- ✅ All existing E2E tests pass

## References

- Feature Spec: [spec.md](./spec.md)
- Implementation Plan: [plan.md](./plan.md)
- Auth Service: `src/lib/auth/service.ts`
- Auth Service Types: `src/lib/auth/service/types.ts`
- Server Actions: `src/actions/auth-actions.ts`
