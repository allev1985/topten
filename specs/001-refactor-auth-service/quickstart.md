# Quick Start: Password Actions Refactoring

**Feature**: Refactor Password Server Actions to Use Auth Service  
**Branch**: `001-refactor-auth-service`  
**Estimated Time**: 2-3 hours

---

## Overview

This guide walks you through refactoring three password-related server actions to use the centralized Auth Service instead of HTTP fetch calls. The refactoring follows the same pattern already used by `signupAction` and `signOutAction`.

**What you'll do**:
1. Update imports in `src/actions/auth-actions.ts`
2. Refactor three password actions
3. Remove the `getCookieHeader` helper
4. Update test mocks in `tests/unit/actions/auth-actions.test.ts`
5. Verify all tests pass

---

## Prerequisites

**Before starting**:
- ✅ Understand the Auth Service API (review `src/lib/auth/service.ts`)
- ✅ Familiarize yourself with existing patterns in `signupAction` (lines 99-130)
- ✅ Review error helpers in `src/lib/auth/service/errors.ts`
- ✅ Have a clean working branch from `main`

**Required knowledge**:
- Next.js Server Actions
- TypeScript
- Vitest testing
- Async/await error handling

---

## Step-by-Step Workflow

### Step 1: Update Imports (5 minutes)

**File**: `src/actions/auth-actions.ts`

**Add new imports** after line 17:

```typescript
import {
  signup,
  logout,
  resetPassword,      // NEW
  updatePassword,     // NEW
  login,              // NEW
  getSession,         // NEW
} from "@/lib/auth/service";
```

**Add error helpers** after line 16:

```typescript
import {
  isEmailNotVerifiedError,
  isExpiredTokenError,    // NEW
  isSessionError,         // NEW
  AuthServiceError,       // NEW
} from "@/lib/auth/service/errors";
```

**Checkpoint**: TypeScript should compile without import errors.

---

### Step 2: Refactor `passwordResetRequestAction` (20 minutes)

**Location**: Lines 236-309

**Original behavior to preserve**:
- Always return success (enumeration protection)
- Same success message
- Log errors internally

**Refactor**:

```typescript
export async function passwordResetRequestAction(
  _prevState: ActionState<PasswordResetRequestSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordResetRequestSuccessData>> {
  const email = formData.get("email");

  // Validate input (for immediate feedback - service will re-validate)
  const result = passwordResetSchema.safeParse({ email });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    await resetPassword(result.data.email);
  } catch (err) {
    // Log errors but still return success for enumeration protection
    console.error(
      "[PasswordResetRequest] Error:",
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  // Always return success for user enumeration protection
  return {
    data: {
      message: "If an account exists, a password reset email has been sent",
    },
    error: null,
    fieldErrors: {},
    isSuccess: true,
  };
}
```

**What changed**:
- ❌ Removed: `getAppUrl()`, fetch call, HTTP response parsing
- ✅ Added: Direct `resetPassword()` call
- ✅ Kept: Validation, enumeration protection, error logging

**Verify**: Run `npm run typecheck` - should pass.

---

### Step 3: Refactor `passwordUpdateAction` (30 minutes)

**Location**: Lines 318-440

**Original behavior to preserve**:
- Password match validation
- Support for OTP token parameters
- Expired token → specific error message
- Redirect to /login on success
- Auto sign-out after password update (Auth Service handles this)

**Refactor**:

```typescript
export async function passwordUpdateAction(
  _prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const tokenHashValue = formData.get("token_hash");
  const typeValue = formData.get("type");

  // Validate password matches
  if (password !== confirmPassword) {
    return {
      data: null,
      error: null,
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
      isSuccess: false,
    };
  }

  // Validate password requirements
  const result = passwordUpdateSchema.safeParse({ password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  // Extract token_hash and type if provided (OTP authentication from reset email)
  const token_hash =
    typeof tokenHashValue === "string" && tokenHashValue
      ? tokenHashValue
      : undefined;
  const type =
    typeof typeValue === "string" && typeValue ? typeValue : undefined;

  try {
    await updatePassword(result.data.password, {
      ...(token_hash && { token_hash }),
      ...(type && { type: type as "recovery" | "email" }),
    });

    // Success - redirect to login
    redirect("/login");
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

    // Handle Auth Service errors
    if (err instanceof AuthServiceError) {
      // Check for expired token
      if (
        err.originalError &&
        isExpiredTokenError(err.originalError as { code?: string; message: string })
      ) {
        return {
          data: null,
          error: "Session has expired. Please request a new reset link.",
          fieldErrors: {},
          isSuccess: false,
        };
      }

      // Other auth errors
      return {
        data: null,
        error: "Failed to update password. Please try again.",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    // Unexpected errors
    console.error(
      "[PasswordUpdate] Error:",
      err instanceof Error ? err.message : "Unknown error"
    );

    return {
      data: null,
      error: "Failed to update password. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
}
```

**What changed**:
- ❌ Removed: `getCookieHeader()`, `getAppUrl()`, fetch call, HTTP error parsing
- ✅ Added: Direct `updatePassword()` call with optional token params
- ✅ Added: `AuthServiceError` and `isExpiredTokenError()` handling
- ✅ Kept: Validation, redirect logic, error messages

**Verify**: Run `npm run typecheck` - should pass.

---

### Step 4: Refactor `passwordChangeAction` (40 minutes)

**Location**: Lines 447-597

**Original behavior to preserve**:
- Current password verification via login
- Session authentication check
- Specific error messages
- No redirect (returns success message)

**Refactor**:

```typescript
export async function passwordChangeAction(
  _prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>> {
  const currentPassword = formData.get("currentPassword");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  // Validate current password is provided
  if (!currentPassword || typeof currentPassword !== "string") {
    return {
      data: null,
      error: null,
      fieldErrors: { currentPassword: ["Current password is required"] },
      isSuccess: false,
    };
  }

  // Validate password matches
  if (password !== confirmPassword) {
    return {
      data: null,
      error: null,
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
      isSuccess: false,
    };
  }

  // Validate password requirements
  const result = passwordUpdateSchema.safeParse({ password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    // Get current session
    const session = await getSession();

    if (!session.authenticated || !session.user?.email) {
      return {
        data: null,
        error: "Authentication required",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    // Verify current password by attempting to log in
    try {
      await login(session.user.email, currentPassword);
    } catch (err) {
      if (err instanceof AuthServiceError) {
        return {
          data: null,
          error: "Current password is incorrect",
          fieldErrors: {},
          isSuccess: false,
        };
      }
      throw err;
    }

    // Update password
    await updatePassword(result.data.password);

    return {
      data: {
        message: "Password updated successfully",
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    console.error(
      "[PasswordChange] Error:",
      err instanceof Error ? err.message : "Unknown error"
    );

    return {
      data: null,
      error: "Failed to update password. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
}
```

**What changed**:
- ❌ Removed: Three separate fetch calls (session, login, update)
- ❌ Removed: `getCookieHeader()`, `getAppUrl()`, HTTP response parsing
- ✅ Added: `getSession()` → `login()` → `updatePassword()` call chain
- ✅ Added: `AuthServiceError` handling
- ✅ Kept: All validation, error messages, success behavior

**Verify**: Run `npm run typecheck` - should pass.

---

### Step 5: Remove `getCookieHeader` Helper (5 minutes)

**Location**: Lines 19-28

**Delete this entire function**:

```typescript
// DELETE THIS:
async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}
```

**Why safe to remove**: Only used by the three password actions we just refactored.

**Check if `getAppUrl` can be removed**:

```bash
grep -n "getAppUrl" src/actions/auth-actions.ts
```

If only used by password actions (we removed those calls), you can also remove the import:
```typescript
// Remove this import if unused:
import { REDIRECT_ROUTES, getAppUrl } from "@/lib/config";
// Becomes:
import { REDIRECT_ROUTES } from "@/lib/config";
```

**Verify**: Run `npm run typecheck` - should pass.

---

### Step 6: Update Test Mocks (45 minutes)

**File**: `tests/unit/actions/auth-actions.test.ts`

#### 6.1 Add Auth Service Mocks

**Find the existing mock** (around line 43):

```typescript
vi.mock("@/lib/auth/service");

// Import after mocking
import { signup, logout } from "@/lib/auth/service";

// Get typed mock references
const mockSignup = vi.mocked(signup);
const mockLogout = vi.mocked(logout);
```

**Update to**:

```typescript
vi.mock("@/lib/auth/service");

// Import after mocking
import {
  signup,
  logout,
  resetPassword,
  updatePassword,
  login,
  getSession,
} from "@/lib/auth/service";

// Get typed mock references
const mockSignup = vi.mocked(signup);
const mockLogout = vi.mocked(logout);
const mockResetPassword = vi.mocked(resetPassword);
const mockUpdatePassword = vi.mocked(updatePassword);
const mockLogin = vi.mocked(login);
const mockGetSession = vi.mocked(getSession);
```

#### 6.2 Update `passwordResetRequestAction` Tests

**Find tests** (around line 319):

**Update test "returns success message regardless of email existence"**:

```typescript
it("returns success message regardless of email existence", async () => {
  mockResetPassword.mockResolvedValue({ success: true });

  const formData = createFormData({
    email: "test@example.com",
  });

  const result = await passwordResetRequestAction(initialState, formData);

  expect(result.isSuccess).toBe(true);
  expect(result.data?.message).toBe(
    "If an account exists, a password reset email has been sent"
  );

  expect(mockResetPassword).toHaveBeenCalledWith("test@example.com");
});
```

**Update test "returns same success message even if email does not exist"**:

```typescript
it("returns same success message even if email does not exist", async () => {
  // Mock resetPassword to throw an error
  mockResetPassword.mockRejectedValue(new Error("User not found"));

  const formData = createFormData({
    email: "nonexistent@example.com",
  });

  const result = await passwordResetRequestAction(initialState, formData);

  // Should still return success for user enumeration protection
  expect(result.isSuccess).toBe(true);
  expect(result.data?.message).toBe(
    "If an account exists, a password reset email has been sent"
  );
});
```

#### 6.3 Update `passwordUpdateAction` Tests

**Update test "returns error when session has expired"**:

```typescript
it("returns error when session has expired", async () => {
  const expiredTokenError = {
    message: "Token has expired",
    code: "otp_expired",
  };

  mockUpdatePassword.mockRejectedValue(
    new AuthServiceError("SERVICE_ERROR", "Token expired", expiredTokenError)
  );

  const formData = createFormData({
    password: "ValidPass123!@#",
    confirmPassword: "ValidPass123!@#",
  });

  const result = await passwordUpdateAction(initialState, formData);

  expect(result.isSuccess).toBe(false);
  expect(result.error).toBe(
    "Session has expired. Please request a new reset link."
  );
});
```

**Update test "redirects to login on successful password update"**:

```typescript
it("redirects to login on successful password update", async () => {
  mockUpdatePassword.mockResolvedValue({ success: true });

  const formData = createFormData({
    password: "ValidPass123!@#",
    confirmPassword: "ValidPass123!@#",
  });

  await expect(
    passwordUpdateAction(initialState, formData)
  ).rejects.toThrow("REDIRECT:/login");

  expect(mockUpdatePassword).toHaveBeenCalledWith("ValidPass123!@#", {});
});
```

**Update test "returns error when update fails"**:

```typescript
it("returns error when update fails", async () => {
  mockUpdatePassword.mockRejectedValue(
    new AuthServiceError("SERVICE_ERROR", "Update failed")
  );

  const formData = createFormData({
    password: "ValidPass123!@#",
    confirmPassword: "ValidPass123!@#",
  });

  const result = await passwordUpdateAction(initialState, formData);

  expect(result.isSuccess).toBe(false);
  expect(result.error).toBe("Failed to update password. Please try again.");
});
```

#### 6.4 Update `passwordChangeAction` Tests

**Import AuthServiceError** at the top:

```typescript
import { AuthServiceError } from "@/lib/auth/service/errors";
```

**Update test "returns error when not authenticated"**:

```typescript
it("returns error when not authenticated", async () => {
  mockGetSession.mockResolvedValue({
    authenticated: false,
    user: null,
    session: null,
  });

  const formData = createFormData({
    currentPassword: "OldPass123!@#",
    password: "NewPass123!@#",
    confirmPassword: "NewPass123!@#",
  });

  const result = await passwordChangeAction(initialState, formData);

  expect(result.isSuccess).toBe(false);
  expect(result.error).toBe("Authentication required");
});
```

**Update test "returns error when current password is incorrect"**:

```typescript
it("returns error when current password is incorrect", async () => {
  mockGetSession.mockResolvedValue({
    authenticated: true,
    user: { id: "123", email: "test@example.com" },
    session: { expiresAt: null, isExpiringSoon: false },
  });

  mockLogin.mockRejectedValue(
    new AuthServiceError("INVALID_CREDENTIALS", "Invalid credentials")
  );

  const formData = createFormData({
    currentPassword: "WrongPass123!@#",
    password: "NewPass123!@#",
    confirmPassword: "NewPass123!@#",
  });

  const result = await passwordChangeAction(initialState, formData);

  expect(result.isSuccess).toBe(false);
  expect(result.error).toBe("Current password is incorrect");
});
```

**Update test "updates password successfully"** (add if not exists):

```typescript
it("updates password successfully", async () => {
  mockGetSession.mockResolvedValue({
    authenticated: true,
    user: { id: "123", email: "test@example.com" },
    session: { expiresAt: null, isExpiringSoon: false },
  });

  mockLogin.mockResolvedValue({
    user: { id: "123", email: "test@example.com" },
    session: { access_token: "token", refresh_token: "refresh" },
  });

  mockUpdatePassword.mockResolvedValue({ success: true });

  const formData = createFormData({
    currentPassword: "OldPass123!@#",
    password: "NewPass123!@#",
    confirmPassword: "NewPass123!@#",
  });

  const result = await passwordChangeAction(initialState, formData);

  expect(result.isSuccess).toBe(true);
  expect(result.data?.message).toBe("Password updated successfully");

  expect(mockGetSession).toHaveBeenCalled();
  expect(mockLogin).toHaveBeenCalledWith("test@example.com", "OldPass123!@#");
  expect(mockUpdatePassword).toHaveBeenCalledWith("NewPass123!@#", {});
});
```

---

### Step 7: Verify All Tests Pass (10 minutes)

**Run the full test suite**:

```bash
npm test src/actions/auth-actions
```

**Expected output**: All tests should pass ✅

**If tests fail**:
1. Check mock setup is correct
2. Verify imports are in the right place
3. Check error object structures match AuthServiceError
4. Review the test output for specific assertion failures

---

### Step 8: Final Verification (10 minutes)

**Run type checking**:

```bash
npm run typecheck
```

**Run linter**:

```bash
npm run lint
```

**Run full test suite** (to catch any integration issues):

```bash
npm test
```

**Verify code reduction**:

```bash
# Count lines in auth-actions.ts
wc -l src/actions/auth-actions.ts

# Should be significantly reduced (expect ~350 lines → ~250 lines)
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting to handle redirect throws

**Problem**: `redirect()` throws an error in Next.js

**Solution**: Always catch and re-throw redirect errors:

```typescript
if (isRedirect) {
  throw err; // Re-throw so redirect works
}
```

### ❌ Pitfall 2: Not preserving enumeration protection

**Problem**: Exposing whether email exists in `passwordResetRequestAction`

**Solution**: Always return success, even on errors:

```typescript
try {
  await resetPassword(email);
} catch (err) {
  // Log but don't expose
}
return { isSuccess: true, data: { message: "..." } };
```

### ❌ Pitfall 3: Incorrect error checking

**Problem**: Not using the error helper functions

**Solution**: Use `isExpiredTokenError()` and `isSessionError()`:

```typescript
if (err instanceof AuthServiceError) {
  if (isExpiredTokenError(err.originalError)) {
    return { error: "Session has expired..." };
  }
}
```

### ❌ Pitfall 4: Not typing optional parameters

**Problem**: TypeScript errors on `type` parameter

**Solution**: Cast to the correct union type:

```typescript
...(type && { type: type as "recovery" | "email" })
```

---

## Success Checklist

Use this checklist to verify your refactoring is complete:

- [ ] All imports updated in `auth-actions.ts`
- [ ] `passwordResetRequestAction` refactored and tested
- [ ] `passwordUpdateAction` refactored and tested
- [ ] `passwordChangeAction` refactored and tested
- [ ] `getCookieHeader` helper removed
- [ ] Unused `getAppUrl` import removed (if applicable)
- [ ] All test mocks updated to use Auth Service
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Code reduction verified (~60% reduction)
- [ ] No HTTP fetch calls in password actions
- [ ] Error messages unchanged from user perspective
- [ ] Enumeration protection preserved

---

## Troubleshooting

### Tests failing with "Cannot read property 'X' of undefined"

**Cause**: Mock not returning the expected object shape

**Fix**: Check mock return values match service return types:

```typescript
// ✅ Correct
mockGetSession.mockResolvedValue({
  authenticated: true,
  user: { id: "123", email: "test@example.com" },
  session: { expiresAt: null, isExpiringSoon: false },
});

// ❌ Incorrect
mockGetSession.mockResolvedValue({ user: { email: "test@example.com" } });
```

### TypeScript error: "Property 'originalError' does not exist"

**Cause**: Not importing `AuthServiceError` type

**Fix**: Add import:

```typescript
import { AuthServiceError } from "@/lib/auth/service/errors";
```

### "Module not found" error for `@/lib/auth/service`

**Cause**: TypeScript path mapping issue or missing file

**Fix**: Verify file exists at `src/lib/auth/service.ts` and `tsconfig.json` has path mappings.

---

## Next Steps

After completing this refactoring:

1. ✅ Commit your changes with a descriptive message
2. ✅ Push to the feature branch
3. ✅ Open a PR with reference to `specs/001-refactor-auth-service/spec.md`
4. ✅ Request code review
5. ✅ Address any review comments
6. ✅ Merge to main after approval

---

## Additional Resources

- [Auth Service Documentation](../../../src/lib/auth/service.ts) - Full Auth Service API
- [Error Helpers](../../../src/lib/auth/service/errors.ts) - Error handling utilities
- [Feature Spec](./spec.md) - Detailed requirements and user stories
- [Implementation Plan](./plan.md) - Complete technical plan
