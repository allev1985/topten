# Implementation Plan: Refactor Password Actions to Use Auth Service

**Branch**: `001-refactor-auth-service` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-refactor-auth-service/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor three password-related server actions (`passwordResetRequestAction`, `passwordUpdateAction`, and `passwordChangeAction`) to use the centralized Auth Service instead of making HTTP fetch calls to internal API routes. This improves maintainability, reduces code complexity, eliminates cookie forwarding overhead, and aligns with the existing pattern used by `signupAction` and `signOutAction`. The refactoring will remove all HTTP-related boilerplate while preserving existing validation, error handling, and user-facing behavior.

## Technical Context

**Language/Version**: TypeScript (Next.js App Router with Server Actions)  
**Primary Dependencies**: Next.js 14+, Supabase Client SDK, Zod (validation)  
**Storage**: Supabase PostgreSQL (via Supabase Auth service)  
**Testing**: Vitest (unit tests for server actions)  
**Target Platform**: Server-side Next.js (Node.js runtime)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Reduce overhead by eliminating HTTP round-trips (direct SDK calls vs internal API fetch)  
**Constraints**: Must maintain exact same user-facing behavior, error messages, and validation rules  
**Scale/Scope**: 3 server actions, ~200 lines of code to refactor, corresponding test updates

### Current Implementation Analysis

**Files to Modify:**
- `src/actions/auth-actions.ts` - Contains all three password actions that need refactoring
- `tests/unit/actions/auth-actions.test.ts` - Test file that needs mock updates

**Current Pattern (to be replaced):**
```typescript
// Pattern 1: Direct HTTP fetch to internal API routes
const response = await fetch(`${baseUrl}/api/auth/password/reset`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});

// Pattern 2: Cookie header forwarding
const cookieHeader = await getCookieHeader();
const response = await fetch(`${baseUrl}/api/auth/password`, {
  headers: { Cookie: cookieHeader },
  ...
});

// Pattern 3: Multiple HTTP calls in sequence
const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, ...);
const verifyResponse = await fetch(`${baseUrl}/api/auth/login`, ...);
const updateResponse = await fetch(`${baseUrl}/api/auth/password`, ...);
```

**Target Pattern (Auth Service):**
```typescript
// Direct Auth Service method calls (already used by signupAction and signOutAction)
import { resetPassword, updatePassword, login, getSession } from "@/lib/auth/service";

// Example refactored call
await resetPassword(email, { redirectTo });
```

### Available Auth Service Methods

From `src/lib/auth/service.ts`:
- `resetPassword(email, options?)` - Sends password reset email
- `updatePassword(password, options?)` - Updates password (supports OTP token or session)
- `login(email, password)` - Authenticates user (needed for current password verification)
- `getSession()` - Gets current session info (for password change action)

### Available Error Helpers

From `src/lib/auth/service/errors.ts`:
- `isEmailNotVerifiedError(error)` - Already imported and used
- `isExpiredTokenError(error)` - For detecting expired reset tokens
- `isSessionError(error)` - For detecting session-related errors
- `AuthServiceError` class with codes: `INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED`, `SERVICE_ERROR`

### Dependencies Already in Scope

The following are already imported in `auth-actions.ts`:
- ✅ `isEmailNotVerifiedError` from `@/lib/auth/service/errors`
- ✅ `signup, logout` from `@/lib/auth/service`

Need to add:
- `resetPassword, updatePassword, login, getSession` from `@/lib/auth/service`
- `isExpiredTokenError, isSessionError, AuthServiceError` from `@/lib/auth/service/errors`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability ✅

**Status**: PASS

**DRY Compliance**: 
- ✅ This refactoring **eliminates code duplication** by replacing custom HTTP fetch logic with centralized Auth Service methods
- ✅ The Auth Service already exists and is proven (used by `signupAction` and `signOutAction`)
- ✅ Removes duplicated cookie handling, error parsing, and HTTP status code checking across three actions

**Framework Code Integrity**:
- ✅ No framework-generated code will be modified
- ✅ All changes are to application-level server actions

**Simplicity & Maintainability**:
- ✅ Refactoring **reduces complexity** by removing HTTP-related boilerplate
- ✅ Makes code more readable by using declarative service methods instead of imperative fetch calls
- ✅ Consolidates error handling using Auth Service error helpers

**Rationale**: This refactoring is a **net improvement** to code quality, reducing duplication and complexity while improving maintainability.

### II. Testing Discipline & Safety Nets ✅

**Status**: PASS

**Test Coverage**:
- ✅ All three password actions already have comprehensive unit tests in `tests/unit/actions/auth-actions.test.ts`
- ✅ Tests will be updated to mock Auth Service methods instead of `fetch`
- ✅ All existing test scenarios will be preserved (validation, error cases, success flows)
- ✅ Test approach follows existing pattern used for `signupAction` tests (already mocks Auth Service)

**Test Strategy**:
1. Update mocks to use Auth Service methods instead of `fetch`
2. Verify all existing assertions still pass
3. Add new assertions to verify Auth Service methods are called with correct parameters
4. Ensure error helper functions are called appropriately

### III. User Experience Consistency ✅

**Status**: PASS

**UX Preservation**:
- ✅ **Zero user-facing changes** - all error messages preserved exactly
- ✅ All validation rules remain identical
- ✅ All redirect behavior unchanged
- ✅ Enumeration protection maintained
- ✅ Form field error mapping logic preserved

**Rationale**: This is an internal refactoring with no user-visible changes. Success criterion SC-004 explicitly requires "all existing user-facing behavior is preserved."

### IV. Performance & Resource Efficiency ✅

**Status**: PASS - **Performance Improvement Expected**

**Performance Impact**:
- ✅ **Reduces overhead** by eliminating internal HTTP calls
- ✅ Removes cookie header serialization/parsing overhead
- ✅ Eliminates JSON serialization/deserialization for internal communication
- ✅ Direct SDK calls to Supabase are more efficient than HTTP routing through internal API

**Measurable Improvement**:
- Removes ~3 HTTP round-trips for `passwordChangeAction` (session + login verify + update)
- Removes ~1 HTTP round-trip for `passwordResetRequestAction` and `passwordUpdateAction`
- Success criterion SC-008 tracks code reduction as a quality metric

### V. Observability & Debuggability ✅

**Status**: PASS

**Logging**:
- ✅ Auth Service already includes comprehensive logging (visible in existing service.ts)
- ✅ Error messages remain actionable and user-friendly
- ✅ Internal errors logged by Auth Service for debugging
- ✅ Success criterion SC-010 requires correct use of Auth Service error helpers

**Error Handling**:
- ✅ Auth Service provides typed error classes and helper functions
- ✅ More consistent error handling across all auth operations
- ✅ Better separation of concerns (service handles logging, actions handle user messaging)

### Summary

**Overall Status**: ✅ **ALL GATES PASS**

This refactoring aligns perfectly with all constitution principles:
- **Improves** code quality by reducing duplication and complexity
- **Maintains** comprehensive test coverage with updated mocks
- **Preserves** exact user experience (zero user-facing changes)
- **Enhances** performance by eliminating internal HTTP overhead
- **Maintains** observability through Auth Service logging

**No violations or trade-offs required.** This is a straightforward code quality improvement that makes the codebase more maintainable while improving performance.

## Project Structure

### Documentation (this feature)

```text
specs/001-refactor-auth-service/
├── plan.md              # This file (implementation plan)
├── spec.md              # Feature specification (already exists)
├── research.md          # Phase 0 output - NOT NEEDED (no unknowns)
├── data-model.md        # Phase 1 output - NOT NEEDED (no schema changes)
├── quickstart.md        # Phase 1 output - refactoring guide
└── contracts/           # Phase 1 output - NOT NEEDED (no API changes)
```

**Note**: This is a refactoring task, so we don't need data-model.md or contracts/ since there are no schema or API contract changes. The quickstart.md will document the refactoring approach and validation steps.

### Source Code (repository root)

```text
src/
├── actions/
│   └── auth-actions.ts                      # [MODIFY] Three password actions to refactor
├── lib/
│   └── auth/
│       ├── service.ts                       # [REFERENCE] Auth Service methods to use
│       └── service/
│           ├── errors.ts                    # [REFERENCE] Error helpers to use
│           └── types.ts                     # [REFERENCE] Type definitions

tests/
└── unit/
    └── actions/
        └── auth-actions.test.ts             # [MODIFY] Update mocks and assertions
```

**Files to Modify (2 files total)**:
1. `src/actions/auth-actions.ts` - Refactor 3 password actions, remove `getCookieHeader` helper
2. `tests/unit/actions/auth-actions.test.ts` - Update test mocks and assertions

**Files to Reference (read-only)**:
1. `src/lib/auth/service.ts` - Auth Service methods and signatures
2. `src/lib/auth/service/errors.ts` - Error helpers and AuthServiceError class
3. `src/lib/auth/service/types.ts` - Return type definitions

**Structure Decision**: 

This is a standard Next.js web application using the App Router pattern with server actions. The project follows a single-project structure with clear separation between application code (`src/`) and tests (`tests/`). 

The refactoring follows the established Auth Service pattern already used by `signupAction` and `signOutAction` in the same file. This maintains architectural consistency and leverages the existing centralized authentication service that abstracts Supabase Auth operations.

## Complexity Tracking

**No violations to justify** - All constitution checks pass without trade-offs.

This refactoring improves code quality by:
- Removing code duplication (HTTP boilerplate in 3 actions)
- Reducing complexity (fewer lines of code, simpler error handling)
- Following existing patterns (Auth Service already used by other actions)
- Maintaining all existing behavior and test coverage

---

## Phase 0: Research & Analysis ⏭️ SKIPPED

**Status**: Not required for this refactoring task

**Rationale**: 
- No unknowns to research - all Auth Service methods and error helpers already exist and are documented
- No new dependencies - using existing Auth Service (`@/lib/auth/service`)
- No architectural decisions - following established pattern from `signupAction` and `signOutAction`
- All technical context is clear from existing codebase analysis

**Technical questions already answered**:
1. ✅ Which Auth Service methods to use? → `resetPassword()`, `updatePassword()`, `login()`, `getSession()`
2. ✅ How to handle errors? → Use existing error helpers: `isExpiredTokenError()`, `isSessionError()`
3. ✅ How to preserve behavior? → Map Auth Service responses to existing ActionState return types
4. ✅ How to update tests? → Follow pattern from `signupAction` tests (mock Auth Service instead of fetch)

**Proceeding directly to Phase 1: Implementation Planning**

---

## Phase 1: Implementation Design

**Prerequisites**: Constitution Check ✅ PASSED

### 1.1 Code Analysis

**Current State Mapping**:

| Action | Current Pattern | Target Pattern | Lines to Replace |
|--------|----------------|----------------|------------------|
| `passwordResetRequestAction` | 1x fetch to `/api/auth/password/reset` | `resetPassword(email, options)` | ~60 lines → ~20 lines |
| `passwordUpdateAction` | 1x fetch to `/api/auth/password` + cookie forwarding | `updatePassword(password, { token_hash, type })` | ~80 lines → ~30 lines |
| `passwordChangeAction` | 3x fetch (session + login + update) + cookie forwarding | `getSession()` + `login()` + `updatePassword()` | ~100 lines → ~40 lines |

**Expected Code Reduction**: ~240 lines → ~90 lines (62% reduction via removal of HTTP boilerplate)

### 1.2 Import Updates

**Add to `src/actions/auth-actions.ts`**:
```typescript
import {
  resetPassword,
  updatePassword,
  login,
  getSession,
} from "@/lib/auth/service";

import {
  isExpiredTokenError,
  isSessionError,
  AuthServiceError,
} from "@/lib/auth/service/errors";
```

**Remove from `src/actions/auth-actions.ts`**:
```typescript
// Remove getCookieHeader helper function (lines 19-28)
// Remove imports: getAppUrl (if only used by password actions)
```

### 1.3 Action Refactoring Details

#### Action 1: `passwordResetRequestAction`

**Current behavior to preserve**:
- ✅ Zod validation before service call
- ✅ Always return success (enumeration protection)
- ✅ Log errors internally but return success to user
- ✅ Same success message

**Refactoring steps**:
1. Keep existing Zod validation (lines 240-252)
2. Replace fetch call with: `await resetPassword(result.data.email)`
3. Wrap in try-catch to maintain enumeration protection
4. Return same success message on both success and error
5. Remove HTTP response parsing logic

**Before** (60 lines):
```typescript
const baseUrl = getAppUrl();
try {
  const response = await fetch(`${baseUrl}/api/auth/password/reset`, {...});
  const data = await response.json();
  if (!response.ok) { /* error handling */ }
  return { data: { message: data.message || "..." }, ... };
} catch (err) { /* network error */ }
```

**After** (~20 lines):
```typescript
try {
  await resetPassword(result.data.email);
} catch (err) {
  // Log but don't expose (enumeration protection)
  console.error("[PasswordResetRequest] Error:", ...);
}
return {
  data: { message: "If an account exists, a password reset email has been sent" },
  error: null,
  fieldErrors: {},
  isSuccess: true,
};
```

#### Action 2: `passwordUpdateAction`

**Current behavior to preserve**:
- ✅ Password match validation
- ✅ Zod password validation
- ✅ Support for OTP token parameters (token_hash, type)
- ✅ Expired token detection → specific error message
- ✅ Redirect to /login on success
- ✅ Sign out user after password update (Auth Service handles this automatically)

**Refactoring steps**:
1. Keep existing validation (lines 328-347)
2. Replace fetch call with: `await updatePassword(result.data.password, { token_hash, type })`
3. Replace HTTP error checking with AuthServiceError handling
4. Use `isExpiredTokenError()` helper instead of checking error code
5. Keep redirect to /login
6. Remove cookie header logic

**Before** (~80 lines):
```typescript
const baseUrl = getAppUrl();
const cookieHeader = await getCookieHeader();
try {
  const response = await fetch(`${baseUrl}/api/auth/password`, {
    headers: { Cookie: cookieHeader, ... },
    body: JSON.stringify({ password, token_hash, type }),
  });
  const data = await response.json();
  if (!response.ok) {
    // Check error codes for session/auth errors
    if (errorData.error.code === "AUTH_ERROR" || ...) { ... }
  }
  redirect("/login");
}
```

**After** (~30 lines):
```typescript
try {
  await updatePassword(result.data.password, {
    ...(token_hash && { token_hash }),
    ...(type && { type: type as "recovery" | "email" }),
  });
  redirect("/login");
} catch (err) {
  if (err instanceof AuthServiceError) {
    if (isExpiredTokenError(err.originalError)) {
      return { error: "Session has expired. Please request a new reset link.", ... };
    }
    return { error: "Failed to update password. Please try again.", ... };
  }
  // Handle redirect throws
  throw err;
}
```

#### Action 3: `passwordChangeAction`

**Current behavior to preserve**:
- ✅ Current password required validation
- ✅ Password match validation
- ✅ Zod password validation
- ✅ Session authentication check
- ✅ Current password verification via login
- ✅ Specific error for incorrect current password
- ✅ Success message (no redirect)

**Refactoring steps**:
1. Keep existing validation (lines 456-485)
2. Replace session fetch with: `const session = await getSession()`
3. Replace login verify fetch with: `await login(session.user.email, currentPassword)`
4. Replace update fetch with: `await updatePassword(result.data.password)`
5. Use AuthServiceError handling instead of HTTP status codes
6. Remove all cookie header logic

**Before** (~100 lines with 3 fetch calls):
```typescript
const cookieHeader = await getCookieHeader();
// Fetch 1: Get session
const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {...});
const sessionData = await sessionResponse.json();
if (!sessionResponse.ok) { return { error: "Authentication required", ... }; }

// Fetch 2: Verify current password
const verifyResponse = await fetch(`${baseUrl}/api/auth/login`, {
  body: JSON.stringify({ email: sessionData.user.email, password: currentPassword }),
});
if (!verifyResponse.ok) { return { error: "Current password is incorrect", ... }; }

// Fetch 3: Update password
const updateResponse = await fetch(`${baseUrl}/api/auth/password`, {...});
if (!updateResponse.ok) { /* error handling */ }
return { data: { message: "Password updated successfully" }, ... };
```

**After** (~40 lines):
```typescript
try {
  // Get session
  const session = await getSession();
  if (!session.authenticated || !session.user?.email) {
    return { error: "Authentication required", ... };
  }

  // Verify current password
  try {
    await login(session.user.email, currentPassword);
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return { error: "Current password is incorrect", ... };
    }
    throw err;
  }

  // Update password
  await updatePassword(result.data.password);
  
  return { data: { message: "Password updated successfully" }, ... };
} catch (err) {
  return { error: "Failed to update password. Please try again.", ... };
}
```

### 1.4 Cleanup Tasks

**Remove `getCookieHeader` helper**:
- Function defined at lines 19-28 in `src/actions/auth-actions.ts`
- Only used by password actions (verified via grep)
- Safe to remove after refactoring

**Check `getAppUrl` import**:
- Only needed if other actions use it
- Can be removed if only password actions used it

### 1.5 Test Updates

**File**: `tests/unit/actions/auth-actions.test.ts`

**Mock updates needed**:

1. **Add Auth Service method mocks** (already partially done for signup):
```typescript
const mockResetPassword = vi.fn();
const mockUpdatePassword = vi.fn();
const mockLogin = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/lib/auth/service", () => ({
  signup: mockSignup,
  logout: mockLogout,
  resetPassword: mockResetPassword,
  updatePassword: mockUpdatePassword,
  login: mockLogin,
  getSession: mockGetSession,
}));
```

2. **Update test assertions**:

For `passwordResetRequestAction` tests (~3 tests):
- ✅ Replace `mockFetch` assertions with `mockResetPassword` assertions
- ✅ Verify `mockResetPassword` called with correct email
- ✅ Verify success returned even on error (enumeration protection)

For `passwordUpdateAction` tests (~4 tests):
- ✅ Replace `mockFetch` assertions with `mockUpdatePassword` assertions
- ✅ Mock AuthServiceError with expired token error
- ✅ Verify `mockUpdatePassword` called with password and optional token params
- ✅ Verify redirect on success

For `passwordChangeAction` tests (~5 tests):
- ✅ Replace `mockFetch` assertions with service method assertions
- ✅ Mock `getSession` to return authenticated session
- ✅ Mock `login` success/failure for current password verification
- ✅ Mock `updatePassword` success/failure
- ✅ Verify all three methods called in sequence
- ✅ Verify error handling for unauthenticated state

**Test count**: ~12 existing tests to update (no new tests needed, behavior unchanged)

---

## Phase 2: Task Breakdown & Execution Plan

**This section will be completed by the `/speckit.tasks` command** (not part of `/speckit.plan`).

The tasks.md file will contain:
1. Detailed step-by-step implementation tasks
2. Verification steps after each change
3. Test execution strategy
4. Build and lint verification
5. Code review checklist

**Next Steps**:
1. ✅ Complete this plan (current step)
2. Run `/speckit.tasks` to generate detailed task breakdown
3. Execute implementation following the task list
4. Verify all tests pass
5. Run linter and type checker
6. Request code review

---

## Quick Start Guide

See [quickstart.md](./quickstart.md) for:
- Step-by-step refactoring workflow
- Code examples for each action
- Testing validation steps
- Common pitfalls to avoid

---

## Success Criteria Checklist

From spec.md Success Criteria:

- [ ] **SC-001**: Zero HTTP fetch calls in the three password actions
- [ ] **SC-002**: All actions use Auth Service methods (verified via code review)
- [ ] **SC-003**: Zero `getCookieHeader()` calls (helper removed)
- [ ] **SC-004**: All user-facing behavior preserved (verified via tests)
- [ ] **SC-005**: TypeScript compilation passes
- [ ] **SC-006**: ESLint passes with zero errors
- [ ] **SC-007**: 100% of existing tests pass
- [ ] **SC-008**: Code reduction achieved (~240 lines → ~90 lines)
- [ ] **SC-009**: Tests verify Auth Service method calls with correct params
- [ ] **SC-010**: Error handling uses Auth Service error helpers correctly

---

## Approval & Sign-off

**Constitution Re-check**: ✅ PASS (post-design)

All principles remain satisfied:
- ✅ Code quality improved (less duplication, simpler logic)
- ✅ Test coverage maintained (all tests updated)
- ✅ UX unchanged (zero user-facing changes)
- ✅ Performance improved (no internal HTTP calls)
- ✅ Observability maintained (Auth Service logging)

**Ready for Phase 2**: ✅ YES

This plan provides sufficient detail to proceed with task breakdown and implementation.
