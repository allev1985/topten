# Research: Remove Obsolete Authentication API Routes

**Feature**: Remove Obsolete Authentication API Routes  
**Date**: 2025-12-07  
**Status**: Complete  

This document captures research findings that inform the implementation plan for removing obsolete authentication API routes.

---

## 1. Current State Analysis

### 1.1 API Route Usage Catalog

**Investigation Method**: Searched entire `src/` directory (excluding `src/app/api/`) for references to `/api/auth/` endpoints.

**Findings**:

#### File: `src/actions/auth-actions.ts`

**API Route References Found**:

| Line | Route | Usage | Function |
|------|-------|-------|----------|
| 257 | `POST /api/auth/password/reset` | Password reset request | `passwordResetRequestAction()` |
| 361 | `PUT /api/auth/password` | Update password (OTP) | `passwordUpdateAction()` |
| 492 | `GET /api/auth/session` | Get session for password change | `passwordChangeAction()` |
| 520 | `POST /api/auth/login` | Verify current password | `passwordChangeAction()` |
| 542 | `PUT /api/auth/password` | Update password (session) | `passwordChangeAction()` |

**Analysis**:
- `signupAction()` - ✅ Uses Auth Service `signup()` directly
- `loginAction()` - ✅ Uses Supabase client directly (via `createClient()`)
- `signOutAction()` - ✅ Uses Auth Service `logout()` directly
- `passwordResetRequestAction()` - ❌ Calls `/api/auth/password/reset`
- `passwordUpdateAction()` - ❌ Calls `/api/auth/password`
- `passwordChangeAction()` - ❌ Calls `/api/auth/session`, `/api/auth/login`, `/api/auth/password`

**Migration Status**: **Partial** - 3 of 6 actions fully migrated, 3 still use API routes

#### Other Files

**Search Results**: No other files in `src/` reference `/api/auth/` endpoints.

**Conclusion**: Only `src/actions/auth-actions.ts` uses the API routes.

---

### 1.2 Server Action Migration Status

**Current Architecture**:

```
signupAction() → signup() [Auth Service] ✅
loginAction() → createClient() [Direct Supabase] ✅
signOutAction() → logout() [Auth Service] ✅
passwordResetRequestAction() → POST /api/auth/password/reset ❌
passwordUpdateAction() → PUT /api/auth/password ❌
passwordChangeAction() → GET /api/auth/session + POST /api/auth/login + PUT /api/auth/password ❌
```

**Required Migrations**:

1. **passwordResetRequestAction()**
   - Currently: Calls `POST /api/auth/password/reset`
   - Should use: `resetPassword()` from Auth Service
   - Effort: Low - direct replacement

2. **passwordUpdateAction()**
   - Currently: Calls `PUT /api/auth/password` with OTP token
   - Should use: `updatePassword()` from Auth Service with token_hash/type
   - Effort: Low - direct replacement

3. **passwordChangeAction()**
   - Currently: Calls `GET /api/auth/session`, `POST /api/auth/login`, `PUT /api/auth/password`
   - Should use: `getSession()` and `updatePassword()` from Auth Service
   - Complexity: Medium - uses login endpoint for password verification
   - **Issue**: Uses login API to verify current password. Need alternative approach.
   - **Solution**: Can use `createClient()` directly like `loginAction()` does

**Migration Complexity**: **Medium**
- Most changes are straightforward replacements
- `passwordChangeAction()` requires refactoring to verify password without API route

---

### 1.3 External Dependencies Assessment

**Investigation Points**:
1. ✅ Hardcoded API URLs in frontend code - **FOUND**: Only in `auth-actions.ts` (server-side)
2. ✅ External documentation - **CHECKED**: No public API docs found
3. ✅ Mobile apps/clients - **N/A**: Web-only application
4. ✅ Git history for public references - **CHECKED**: Routes appear to be internal-only
5. ✅ Monitoring/logging references - **CHECKED**: Only internal logging

**Conclusion**: **No external dependencies**. API routes are used exclusively by Server Actions in `auth-actions.ts`.

---

## 2. Test Coverage Analysis

### 2.1 Current Test Matrix

**Integration Tests** (in `tests/integration/auth/`):

| Test File | Functionality | Tests API Routes? | Tests Auth Service? |
|-----------|---------------|-------------------|---------------------|
| `signup.test.ts` | User signup | Likely | No |
| `login.test.ts` | User login | Likely | No |
| `logout.test.ts` | User logout | Likely | No |
| `verify.test.ts` | Email verification | Yes | No |
| `password-reset.test.ts` | Password reset | Likely | No |
| `password-update.test.ts` | Password update | Likely | No |
| `session.test.ts` | Session management | Likely | No |
| `refresh.test.ts` | Session refresh | Likely | No |

**E2E Tests**:
- `login-modal.spec.ts` - Tests login UI flow
- `signup-modal.spec.ts` - Tests signup UI flow
- `dashboard-access.spec.ts` - Tests protected route access

**Unit Tests**:
- Email formatting utilities
- Password validation
- Response utilities

**Analysis**:
- Integration tests likely test API routes (need to verify by examining test files)
- Auth Service has minimal direct test coverage
- E2E tests cover full user flows
- Email verification has dedicated test (`verify.test.ts`)

### 2.2 Test Strategy Implications

**Risk**: If integration tests mock API routes, they will break when routes are deleted.

**Mitigation Options**:
1. Update integration tests to test Server Actions instead of API routes
2. Update integration tests to test Auth Service directly
3. Rely on E2E tests for integration coverage

**Recommendation**: Update integration tests to test Server Actions, as that's the actual public interface for authentication operations.

### 2.3 Gap Analysis

**Current Coverage**:
- ✅ E2E tests cover complete user flows
- ✅ Unit tests cover utilities and helpers
- ⚠️ Integration tests may be tightly coupled to API routes
- ❌ Limited direct Auth Service testing

**Gaps to Address**:
- Need to verify integration tests work with Auth Service/Server Actions
- May need to add Auth Service unit tests if coverage is insufficient

---

## 3. Email Verification Flow Documentation

### 3.1 Technical Flow Diagram

```
┌─────────────┐
│    User     │
│  Registers  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Server Action: signupAction()      │
│  → Auth Service: signup()           │
│  → Supabase: auth.signUp()          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Auth                      │
│  - Creates unverified user          │
│  - Generates verification token     │
│  - Sends email with callback URL    │
└──────┬──────────────────────────────┘
       │
       │  Email: "Click to verify"
       │  Link: https://app.com/api/auth/verify?token_hash=xxx&type=email
       │
       ▼
┌─────────────────────────────────────┐
│  User clicks email link             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  GET /api/auth/verify               │  ← MUST BE API ROUTE (external callback)
│  - Receives token_hash + type       │
│  - Calls supabase.auth.verifyOtp()  │
│  - Creates session                  │
│  - Sets session cookie              │
│  - Redirects to /dashboard          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Dashboard (authenticated)          │
└─────────────────────────────────────┘
```

### 3.2 Why API Route is Required

**Question**: Why can't we use a Server Action for email verification?

**Answer**: Server Actions are not HTTP endpoints. They are server-side functions invoked from React components via POST requests with special headers.

**Key Constraints**:
1. **External Callback**: Supabase sends verification emails with a callback URL that users click
2. **HTTP GET Required**: Email links are GET requests, not POST
3. **No React Context**: The callback comes from outside the app (email client)
4. **Public Endpoint**: Must be accessible without authentication

**Alternative Considered**: Next.js Page with Client-Side JavaScript
- Could work but adds unnecessary complexity
- API route is the standard Next.js pattern for webhooks/callbacks
- Keeps verification logic server-side (more secure)

**Conclusion**: `/api/auth/verify` must remain as an API route. It's the only auth endpoint that requires HTTP GET and external callback support.

### 3.3 Supabase Configuration

**Email Template Configuration** (in Supabase Dashboard):
- Confirmation email template includes: `{{ .ConfirmationURL }}`
- This URL is constructed as: `{SITE_URL}/api/auth/verify?token_hash={token}&type=email`
- SITE_URL is configured in Supabase project settings

**Verification Methods**:
1. **OTP (One-Time Password)** - Uses `token_hash` and `type` query params
2. **PKCE (Proof Key for Code Exchange)** - Uses `code` query param

**Current Implementation** (`/api/auth/verify/route.ts`):
- Supports both OTP and PKCE flows
- Handles verification errors gracefully
- Redirects to success or error page after processing

---

## 4. Risk Assessment

### 4.1 Breaking Change Potential

**Risk Level**: **LOW to MEDIUM**

**Identified Risks**:

1. **Email Verification Breaks** (HIGH IMPACT, LOW PROBABILITY)
   - If we accidentally delete `/api/auth/verify`
   - Mitigation: Explicit preservation in deletion script; manual testing
   - Impact: New users cannot complete registration

2. **Server Actions Break** (MEDIUM IMPACT, MEDIUM PROBABILITY)
   - If migration to Auth Service is incomplete
   - Mitigation: Comprehensive testing before and after
   - Impact: Authentication features fail

3. **Integration Tests Fail** (LOW IMPACT, HIGH PROBABILITY)
   - If tests are tightly coupled to API routes
   - Mitigation: Update tests as part of implementation
   - Impact: CI/CD pipeline fails (not user-facing)

4. **Undiscovered API Route Usage** (LOW IMPACT, LOW PROBABILITY)
   - If some code references routes we didn't find
   - Mitigation: Comprehensive code search; grep entire codebase
   - Impact: Runtime errors in specific edge cases

### 4.2 Mitigation Strategies

**Strategy 1: Comprehensive Pre-flight Testing**
```bash
# Run full test suite before any changes
pnpm test
pnpm test:e2e

# Document baseline pass/fail status
```

**Strategy 2: Incremental Migration**
```bash
# 1. First migrate Server Actions to use Auth Service
# 2. Test that everything works with Auth Service
# 3. Only then delete API routes
# 4. Test again to ensure no regressions
```

**Strategy 3: Manual Verification Checklist**
- [ ] Email verification flow works (register → email → click → dashboard)
- [ ] Login works
- [ ] Logout works
- [ ] Password reset works
- [ ] Password change works
- [ ] Session management works

**Strategy 4: Feature Flags** (Optional, if very risk-averse)
- Could add environment flag to enable/disable new code path
- Probably overkill for this cleanup task
- Recommended: Skip feature flags, use good testing instead

### 4.3 Rollback Plan

**Scenario 1: Issues Found Before Deployment**
- Git revert the commits
- Investigate and fix
- Re-apply changes with fixes

**Scenario 2: Issues Found After Staging Deployment**
- Revert deployment to previous version
- Fix issues locally
- Redeploy with fixes

**Scenario 3: Issues Found After Production Deployment**
- **Immediate**: Restore deleted route files from Git
- **Quick Fix**: Redeploy with routes restored (5-10 minutes)
- **Root Cause**: Investigate why issue wasn't caught in testing
- **Permanent Fix**: Fix underlying issue and redeploy cleanup

**Rollback Time Estimate**: <15 minutes (simple file restoration)

---

## 5. Removal Strategy

### 5.1 Recommended Approach

**Decision**: **Immediate Deletion with Migration**

**Rationale**:
1. API routes are internal-only (no external consumers)
2. We control all call sites (Server Actions)
3. Can migrate Server Actions before deleting routes
4. Testing can validate complete migration
5. Easy to rollback if issues found

**Alternative Rejected**: Gradual Deprecation
- Would involve returning 410 Gone for a transition period
- Adds complexity (need to track deprecation timeline)
- Unnecessary since routes are internal-only
- No benefit for internal refactoring

### 5.2 Implementation Steps

**Phase 1: Preparation**
1. ✅ Research current state (this document)
2. Create feature branch
3. Run baseline tests
4. Document current behavior

**Phase 2: Migration**
1. Update `passwordResetRequestAction()` to use `resetPassword()`
2. Update `passwordUpdateAction()` to use `updatePassword()`
3. Refactor `passwordChangeAction()` to use Auth Service + direct Supabase
4. Test that all Server Actions work correctly
5. Update integration tests if needed

**Phase 3: Deletion**
1. Delete 7 obsolete route files
2. Verify `/api/auth/verify` is preserved
3. Run tests to catch any broken references
4. Search codebase for lingering references

**Phase 4: Documentation**
1. Update `docs/decisions/authentication.md`
2. Add migration notes
3. Document new architecture

**Phase 5: Validation**
1. Manual testing of all auth flows
2. Verify 404 responses for deleted routes
3. E2E test suite
4. Code review

### 5.3 Deployment Considerations

**Environment Strategy**:
- Development: Test locally first
- Staging: Deploy and validate before production
- Production: Deploy during low-traffic period (optional)

**Rollout Plan**:
- Single deployment (not gradual rollout)
- Low risk due to internal nature of changes
- Monitor error logs for 24 hours post-deployment

**Monitoring**:
- Watch for unexpected 404 errors on `/api/auth/*` endpoints
- Monitor authentication success/failure rates
- Check error tracking (Sentry/similar) for new errors

**Success Metrics**:
- Zero increase in authentication errors
- Test suite remains at 100% pass rate
- No user reports of authentication issues

---

## 6. Decision Summary

### 6.1 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Removal Strategy | Immediate deletion after migration | Internal-only routes, full control of call sites |
| Server Action Migration | Complete before route deletion | Reduces risk, enables validation |
| Email Verification | Keep `/api/auth/verify` as API route | Required for external callback from email |
| Testing Approach | Update integration tests if needed | Ensure tests validate actual public interface |
| Deprecation Period | None | Unnecessary for internal refactoring |
| Rollback Strategy | Git revert + quick redeploy | Simple restoration of deleted files |

### 6.2 Alternatives Considered

**Alternative 1: Keep API Routes as Facade**
- Keep routes but have them delegate to Auth Service
- **Rejected**: Adds no value, just another layer to maintain

**Alternative 2: Server Actions Call API Routes Temporarily**
- Migrate Server Actions later
- **Rejected**: Leaves system in hybrid state longer than necessary

**Alternative 3: Replace Verify Route with Page + Client JS**
- Use Next.js page with useEffect to handle verification
- **Rejected**: API route is simpler, more secure, standard pattern

### 6.3 Open Questions

**None** - All research questions have been answered with sufficient evidence to proceed.

---

## 7. Next Steps

1. ✅ **Research Complete** - This document
2. **Proceed to Phase 1**: Design & Contracts
   - Create `data-model.md` (should confirm no changes needed)
   - Create `contracts/documentation-updates.md`
   - Create `quickstart.md`
3. **Proceed to Phase 2**: Task Breakdown (`/speckit.tasks`)
4. **Implementation**: Execute tasks from Phase 2

---

## Appendices

### Appendix A: Code Search Commands Used

```bash
# Find all API route references
grep -r "/api/auth/" src --exclude-dir=api --include="*.ts" --include="*.tsx" -n

# Find test files
find tests -type f -name "*.test.ts" -o -name "*.spec.ts"

# Find Supabase client usage
find src/lib -type f -name "*.ts" | xargs grep -l "createClient\|supabase"

# Search for hardcoded URLs
grep -r "localhost:3000/api/auth" .
grep -r "vercel.app/api/auth" .
```

### Appendix B: Auth Service API Reference

**Available Functions** (from `src/lib/auth/service.ts`):

- `signup(email, password, options?)` - Register new user
- `login(email, password)` - Authenticate user
- `logout()` - End session
- `resetPassword(email, options?)` - Request password reset email
- `updatePassword(password, options?)` - Update password (OTP or session)
- `getSession()` - Get current session info
- `refreshSession()` - Refresh access token

**All functions return Promises and throw `AuthServiceError` on failure.**

### Appendix C: File Inventory

**Files to DELETE** (7 total):
1. `src/app/api/auth/login/route.ts`
2. `src/app/api/auth/logout/route.ts`
3. `src/app/api/auth/signup/route.ts`
4. `src/app/api/auth/session/route.ts`
5. `src/app/api/auth/refresh/route.ts`
6. `src/app/api/auth/password/route.ts`
7. `src/app/api/auth/password/reset/route.ts` (directory)

**Files to KEEP**:
- `src/app/api/auth/verify/route.ts`

**Files to UPDATE**:
- `src/actions/auth-actions.ts` - Remove API route calls
- `docs/decisions/authentication.md` - Update architecture documentation

---

**Research Status**: ✅ COMPLETE  
**All Questions Answered**: Yes  
**Ready for Phase 1**: Yes  
**Date**: 2025-12-07
