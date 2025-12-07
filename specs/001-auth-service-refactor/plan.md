# Implementation Plan: Auth Service Refactor - Direct Service Integration

**Branch**: `001-auth-service-refactor` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-service-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor `signupAction` and `signOutAction` server actions to call auth service methods directly instead of making HTTP fetch calls to API routes. This eliminates unnecessary HTTP overhead while maintaining identical user-facing behavior including validation, error handling, redirects, and security properties (user enumeration protection, idempotent logout).

## Technical Context

**Language/Version**: TypeScript (Next.js 15+ with App Router)  
**Primary Dependencies**: Next.js, React, Supabase Auth, Drizzle ORM, Vitest, React Testing Library  
**Storage**: Supabase (PostgreSQL via Drizzle ORM)  
**Testing**: Vitest (unit tests), React Testing Library (component tests), Playwright (E2E tests)  
**Target Platform**: Web (Next.js server-side rendering, Vercel deployment)
**Project Type**: Web application (Next.js App Router with server actions)  
**Performance Goals**: 
- Signup action: Same or faster than current HTTP-based approach (baseline: current average response time)
- Sign out action: <500ms (improvement over HTTP roundtrip)
**Constraints**: 
- Must maintain user enumeration protection (signup always redirects to /verify-email)
- Must maintain idempotent logout (succeeds even without active session)
- Must preserve all existing behavior (validation, error messages, redirects)
- Zero TypeScript errors, zero ESLint warnings
**Scale/Scope**: 2 server actions modified, ~150 lines of code refactored, existing test suite updated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability ✅
- **DRY Principle**: ✅ PASS - Refactoring eliminates duplicate HTTP handling code (fetch calls, try/catch blocks, cookie forwarding). Auth service already exists and provides reusable `signup()` and `logout()` methods.
- **Framework Code Integrity**: ✅ PASS - No framework-generated code is modified. Changes are limited to application server actions.
- **Single Responsibility**: ✅ PASS - Server actions maintain their responsibility (form validation, calling auth service, handling redirects). Auth service maintains its responsibility (Supabase interaction).
- **Simplicity**: ✅ PASS - Removing HTTP layer simplifies code by ~150 lines (eliminating fetch calls, cookie handling, network error handling).

### II. Testing Discipline & Safety Nets ✅
- **Test Coverage**: ✅ PASS - All existing tests will be updated to mock auth service instead of global fetch. No user-facing behavior changes, so test expectations remain the same.
- **Test Strategy**: 
  - Unit tests: Update mocks from `global.fetch` to auth service methods (`signup`, `logout`)
  - Integration tests: No changes needed (E2E tests use real HTTP routes)
  - E2E tests: No changes needed (test user-facing flows, not implementation)
- **Regression Prevention**: ✅ PASS - All existing tests must pass. Any failures indicate behavioral regression.

### III. User Experience Consistency ✅
- **No UX Changes**: ✅ PASS - This is an internal refactoring. User-facing behavior (validation, error messages, redirects, timing) is identical.
- **Security Properties Preserved**: ✅ PASS
  - User enumeration protection maintained (signup always redirects to /verify-email)
  - Idempotent logout preserved (succeeds even without session)

### IV. Performance & Resource Efficiency ✅
- **Performance Goals**: ✅ PASS
  - Signup: Same or faster (eliminates HTTP roundtrip overhead)
  - Logout: Target <500ms (eliminates HTTP roundtrip)
- **Measurement Strategy**: Compare response times before/after refactoring using existing logging

### V. Observability & Debuggability ✅
- **Logging Preserved**: ✅ PASS - Auth service already includes comprehensive logging (maskEmail, success/failure logs). No changes needed.
- **Error Messages**: ✅ PASS - Error handling behavior unchanged. Same error messages returned to users.

### Summary
**All gates PASS** - No constitution violations. Refactoring improves code quality (removes duplication, simplifies), maintains all safety nets (tests updated), preserves UX consistency, and improves performance.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-service-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (input)
├── research.md          # Phase 0 output - NOT NEEDED (all technical context known)
├── data-model.md        # Phase 1 output - NOT NEEDED (no data model changes)
├── quickstart.md        # Phase 1 output - Implementation guide
└── contracts/           # Phase 1 output - NOT NEEDED (no API contract changes)
```

### Source Code (repository root)

```text
src/
├── actions/
│   └── auth-actions.ts           # MODIFIED: signupAction, signOutAction refactored
├── lib/
│   └── auth/
│       ├── service.ts             # USED: signup(), logout() methods
│       └── service/
│           ├── types.ts           # USED: SignupResult, LogoutResult types
│           └── errors.ts          # USED: AuthServiceError types

tests/
├── unit/
│   └── actions/
│       └── auth-actions.test.ts   # MODIFIED: Update mocks from fetch to auth service
└── integration/                   # NO CHANGES: E2E tests unchanged
    └── e2e/
        └── auth/                  # NO CHANGES: Tests user-facing flows

# Files to be REMOVED (no longer needed)
src/actions/auth-actions.ts:
  - getCookieHeader() function (lines 18-27)
```

**Structure Decision**: This is a focused code refactoring within the existing Next.js App Router web application. Changes are limited to:
1. Server actions (`src/actions/auth-actions.ts`)
2. Unit tests (`tests/unit/actions/auth-actions.test.ts`)

No new files created. No data model changes. No API contract changes (API routes remain but unused by these actions).

## Complexity Tracking

> **No violations identified** - All Constitution Check gates pass. No complexity justification needed.

## Detailed Implementation Breakdown

### Phase 0: Research & Discovery

**Status**: ✅ COMPLETE - All technical context is known. No research needed.

**Findings**:
- Auth service already exists with `signup()` and `logout()` methods
- Service methods have identical behavior to API endpoints
- Test infrastructure supports mocking service methods
- No client-side code directly calls the API routes

### Phase 1: Code Changes

#### 1.1 Refactor `signupAction`

**File**: `src/actions/auth-actions.ts` (lines 98-146)

**Changes Required**:

1. **Add import** (top of file):
   ```typescript
   import { signup } from "@/lib/auth/service";
   ```

2. **Replace HTTP fetch logic** (lines 117-142) with direct service call:
   ```typescript
   // REMOVE:
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
   
   // REPLACE WITH:
   try {
     await signup(result.data.email, result.data.password);
   } catch (err) {
     console.error(
       "[Signup] Error:",
       err instanceof Error ? err.message : "Unknown error"
     );
   }
   ```

3. **Remove unused imports** (if not used elsewhere):
   - Remove `import { AuthErrorResponse } from "@/lib/auth/errors";` (only if not used by other functions)
   - Remove `getAppUrl()` usage

**Lines Changed**: ~26 lines removed, ~6 lines added = **-20 lines net**

**Behavior Preserved**:
- ✅ Validation with `signupSchema` unchanged
- ✅ Field errors returned for invalid input
- ✅ Always redirects to `/verify-email` (enumeration protection)
- ✅ Errors logged but not exposed to user
- ✅ FormData extraction unchanged

#### 1.2 Refactor `signOutAction`

**File**: `src/actions/auth-actions.ts` (lines 615-650)

**Changes Required**:

1. **Add import** (top of file, if not already added):
   ```typescript
   import { logout } from "@/lib/auth/service";
   ```

2. **Replace HTTP fetch logic** (lines 620-649) with direct service call:
   ```typescript
   // REMOVE:
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
     // redirect handling code...
   }
   
   // REPLACE WITH:
   try {
     await logout();
     redirect("/");
   } catch (err) {
     // Keep redirect handling unchanged
     const isRedirect = /* ... same logic ... */;
     
     if (isRedirect) {
       throw err;
     }
     
     console.error("[SignOut] Error:", err);
   }
   ```

**Lines Changed**: ~10 lines removed, ~2 lines added = **-8 lines net**

**Behavior Preserved**:
- ✅ Redirects to `/` on success
- ✅ Handles Next.js redirect throws correctly
- ✅ Idempotent (succeeds even without session)
- ✅ Errors logged but not thrown (component handles)

#### 1.3 Remove Unused Helper Function

**File**: `src/actions/auth-actions.ts` (lines 18-27)

**Changes Required**:

1. **Remove `getCookieHeader()` function**:
   ```typescript
   // REMOVE ENTIRE FUNCTION:
   async function getCookieHeader(): Promise<string> {
     const cookieStore = await cookies();
     return cookieStore
       .getAll()
       .map((c) => `${c.name}=${c.value}`)
       .join("; ");
   }
   ```

2. **Check if `cookies` import still needed**:
   - Used by `passwordUpdateAction` (line 366)
   - Used by `passwordChangeAction` (line 504)
   - **DO NOT REMOVE** `import { cookies } from "next/headers";`

**Lines Changed**: ~10 lines removed = **-10 lines net**

**Total Code Changes**: ~38 lines removed, ~8 lines added = **-30 lines net reduction**

### Phase 2: Test Updates

#### 2.1 Update Test Mocks

**File**: `tests/unit/actions/auth-actions.test.ts`

**Changes Required**:

1. **Replace global fetch mock** (lines 42-44) with auth service mock:
   ```typescript
   // REMOVE:
   const mockFetch = vi.fn();
   global.fetch = mockFetch;
   
   // ADD:
   const mockSignup = vi.fn();
   const mockLogout = vi.fn();
   
   vi.mock("@/lib/auth/service", () => ({
     signup: mockSignup,
     logout: mockLogout,
   }));
   ```

2. **Update beforeEach cleanup** (lines 84-91):
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
     mockSignup.mockReset();    // ADD
     mockLogout.mockReset();    // ADD
     // Remove: mockFetch.mockReset();
     // ... other mocks unchanged ...
   });
   ```

**Lines Changed**: ~5 lines modified

#### 2.2 Update `signupAction` Tests

**Tests to Modify**: Lines 93-199

1. **Test: "redirects to verify-email on successful signup"** (lines 144-174):
   ```typescript
   // REMOVE:
   mockFetch.mockResolvedValue({
     ok: true,
     json: () => Promise.resolve({
       success: true,
       message: "Please check your email to verify your account",
     }),
   });
   
   // REMOVE assertion:
   expect(mockFetch).toHaveBeenCalledWith(
     "http://localhost:3000/api/auth/signup",
     expect.objectContaining({...})
   );
   
   // ADD:
   mockSignup.mockResolvedValue({
     requiresEmailConfirmation: true,
     user: { id: "123", email: "test@example.com" },
     session: null,
   });
   
   // ADD assertion:
   expect(mockSignup).toHaveBeenCalledWith(
     "test@example.com",
     "ValidPass123!@#"
   );
   ```

2. **Test: "redirects even when email already exists"** (lines 176-198):
   ```typescript
   // REMOVE:
   mockFetch.mockResolvedValue({
     ok: false,
     json: () => Promise.resolve({
       success: false,
       error: { code: "AUTH_ERROR", message: "User already exists" },
     }),
   });
   
   // ADD:
   mockSignup.mockRejectedValue(new Error("User already exists"));
   
   // Keep redirect expectation unchanged
   ```

**Lines Changed**: ~20 lines modified

**Tests Unchanged**:
- ✅ "returns fieldErrors for invalid email" - no mocks needed
- ✅ "returns fieldErrors for weak password" - no mocks needed
- ✅ "returns fieldErrors for missing email" - no mocks needed
- ✅ "returns fieldErrors for missing password" - no mocks needed

#### 2.3 Add `signOutAction` Tests (Optional)

**Note**: Current test file doesn't include `signOutAction` tests. If tests are added later:

```typescript
describe("signOutAction", () => {
  it("redirects to homepage on successful logout", async () => {
    mockLogout.mockResolvedValue({ success: true });
    
    await expect(signOutAction()).rejects.toThrow("REDIRECT:/");
    
    expect(mockLogout).toHaveBeenCalled();
  });
  
  it("succeeds even without active session (idempotent)", async () => {
    mockLogout.mockResolvedValue({ success: true });
    
    await expect(signOutAction()).rejects.toThrow("REDIRECT:/");
  });
});
```

**Decision**: NOT REQUIRED for this feature. Existing E2E tests cover logout functionality.

### Phase 3: Validation & Verification

#### 3.1 Type Checking

**Command**: `npm run type-check` or `npx tsc --noEmit`

**Expected Result**: Zero TypeScript errors

**Critical Checks**:
- ✅ `signup` and `logout` imports resolve correctly
- ✅ Function signatures match expected types
- ✅ No unused imports warnings

#### 3.2 Linting

**Command**: `npm run lint`

**Expected Result**: Zero ESLint warnings/errors

**Critical Checks**:
- ✅ No unused variables
- ✅ No unused imports
- ✅ Code style consistent

#### 3.3 Unit Tests

**Command**: `npm test -- tests/unit/actions/auth-actions.test.ts`

**Expected Result**: All tests pass

**Critical Tests**:
- ✅ signupAction validation tests (invalid email, weak password, missing fields)
- ✅ signupAction redirect tests (success, enumeration protection)
- ✅ loginAction tests (unchanged - should still pass)
- ✅ Other auth action tests (unchanged - should still pass)

#### 3.4 Build Verification

**Command**: `npm run build`

**Expected Result**: Build succeeds

**Critical Checks**:
- ✅ No TypeScript compilation errors
- ✅ No missing dependencies
- ✅ Build artifacts generated successfully

#### 3.5 Integration/E2E Tests

**Command**: `npm run test:e2e` (if available)

**Expected Result**: All auth flows work

**Critical Flows**:
- ✅ User can sign up with valid credentials
- ✅ User receives verification email
- ✅ User is redirected to /verify-email
- ✅ User can log out from authenticated pages
- ✅ User is redirected to homepage after logout

**Note**: E2E tests should NOT require changes since they test user-facing behavior, not implementation details.

### Phase 4: Performance Verification

#### 4.1 Baseline Measurement (Before Refactoring)

**Method**: Check application logs

**Metrics to Capture**:
- Signup action average response time (from logs)
- Logout action average response time (from logs)

**Example Log Search**:
```bash
# Search for signup timing
grep "[Signup]" logs/app.log | grep "successful"

# Search for logout timing  
grep "[SignOut]" logs/app.log
```

#### 4.2 Post-Refactoring Measurement

**Method**: Deploy to staging, test, compare logs

**Expected Improvements**:
- ✅ Signup: Same or faster (eliminates HTTP roundtrip)
- ✅ Logout: <500ms (eliminates HTTP roundtrip)

**Measurement Approach**:
1. Deploy refactored code to staging
2. Execute 10 signup operations
3. Execute 10 logout operations
4. Compare average response times to baseline

### Phase 5: Documentation Updates

**Files to Update**: None required

**Reasoning**:
- Internal refactoring, no API contract changes
- No new developer-facing APIs
- Quickstart guide created for implementation reference
- Implementation plan documents changes thoroughly

### Phase 6: Deployment & Rollback

#### 6.1 Deployment Checklist

- ✅ All unit tests pass
- ✅ TypeScript compilation succeeds
- ✅ ESLint passes
- ✅ Build succeeds
- ✅ E2E tests pass (if available)
- ✅ Code review completed
- ✅ PR approved

#### 6.2 Rollback Plan

**If issues discovered post-deployment**:

1. **Immediate rollback** (critical issues):
   ```bash
   git revert <commit-sha>
   git push origin main
   ```

2. **Partial rollback** (specific file issues):
   ```bash
   git checkout <previous-commit> -- src/actions/auth-actions.ts
   git commit -m "Rollback auth-actions refactoring"
   git push origin main
   ```

3. **Emergency hotfix** (production issues):
   - Revert PR merge
   - Redeploy previous version
   - Investigate issue in separate branch

## Implementation Timeline

**Total Estimated Time**: 4-6 hours

| Phase | Task | Estimated Time | Dependencies |
|-------|------|----------------|--------------|
| 1.1 | Refactor `signupAction` | 30 min | None |
| 1.2 | Refactor `signOutAction` | 20 min | None |
| 1.3 | Remove `getCookieHeader()` | 10 min | 1.1, 1.2 |
| 2.1 | Update test mocks | 20 min | 1.1, 1.2 |
| 2.2 | Update `signupAction` tests | 30 min | 2.1 |
| 3.1 | Type checking | 10 min | 1.1-1.3 |
| 3.2 | Linting | 10 min | 1.1-1.3 |
| 3.3 | Unit tests | 20 min | 2.1-2.2 |
| 3.4 | Build verification | 10 min | 3.1-3.3 |
| 3.5 | E2E tests | 30 min | 3.4 |
| 4 | Performance verification | 60 min | 3.5 |
| 5 | Code review | 60 min | All above |

**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4

**Parallelizable**:
- Type checking (3.1) and Linting (3.2) can run concurrently
- Documentation (5) can be written during development

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Behavioral regression in signup | Low | High | Comprehensive unit tests, E2E tests, enumeration protection validation |
| Behavioral regression in logout | Low | Medium | Unit tests, E2E tests, idempotent behavior validation |
| Type errors from service imports | Very Low | Low | TypeScript compilation, IDE type checking |
| Test failures from mock changes | Medium | Low | Careful mock replacement, test validation |
| Performance degradation | Very Low | Medium | Performance verification, logging comparison |
| Production incident | Very Low | High | Staged rollout, rollback plan, monitoring |

**Overall Risk**: **LOW** - Well-contained refactoring with strong test coverage and clear rollback path.

## Success Metrics

### Code Quality Metrics

- ✅ Lines of code reduced by ~30 lines
- ✅ Cyclomatic complexity reduced (fewer nested conditionals)
- ✅ Import dependencies reduced (no HTTP client needed)
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings

### Functional Metrics

- ✅ All 40+ existing auth tests pass
- ✅ User enumeration protection maintained
- ✅ Idempotent logout preserved
- ✅ Error handling unchanged
- ✅ Redirect behavior unchanged

### Performance Metrics

- ✅ Signup response time: Same or better
- ✅ Logout response time: <500ms
- ✅ No increase in error rates

### Delivery Metrics

- ✅ Implementation completed in 4-6 hours
- ✅ Zero production incidents in first week
- ✅ Code review completed with no major feedback
- ✅ Documentation updated and accurate

## References

- Feature Specification: [spec.md](./spec.md)
- Quickstart Guide: [quickstart.md](./quickstart.md)
- Auth Service Implementation: `src/lib/auth/service.ts`
- Auth Service Types: `src/lib/auth/service/types.ts`
- Server Actions: `src/actions/auth-actions.ts`
- Unit Tests: `tests/unit/actions/auth-actions.test.ts`
- Constitution: `.specify/memory/constitution.md`
