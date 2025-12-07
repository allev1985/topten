# Tasks: Remove Obsolete Authentication API Routes

**Input**: Design documents from `/specs/001-remove-obsolete-auth-routes/`
**Prerequisites**: plan.md, research.md (spec.md not present - cleanup task)

**Organization**: This is a cleanup/refactoring task with sequential dependencies rather than independent user stories. Tasks are organized by logical workflow: preparation → migration → deletion → documentation → validation.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js App Router project with paths at repository root:
- Source code: `src/`
- Tests: `tests/`
- Documentation: `docs/`

---

## Phase 1: Preparation & Pre-flight

**Purpose**: Establish baseline and prepare for changes

- [ ] T001 Create feature branch `001-remove-obsolete-auth-routes` from main
- [ ] T002 Run baseline test suite to document current state: `pnpm test && pnpm test:e2e`
- [ ] T003 [P] Search codebase for all `/api/auth/` references: `grep -r "/api/auth/" src --exclude-dir=api -n`
- [ ] T004 [P] Document current API route usage in temporary notes (for validation later)

**Checkpoint**: Baseline established - ready to begin code changes

---

## Phase 2: Server Action Migration (Critical Path)

**Purpose**: Migrate Server Actions from API routes to Auth Service before deleting routes

**⚠️ CRITICAL**: Must complete before Phase 3 (deletion). These changes ensure Server Actions work independently of API routes.

### T005: Migrate passwordResetRequestAction()

- [ ] T005 Update `passwordResetRequestAction()` in `src/actions/auth-actions.ts` (line ~257)
  - Replace `POST /api/auth/password/reset` with direct call to `resetPassword()` from Auth Service
  - Import `resetPassword` from `@/lib/auth/service`
  - Update error handling to use AuthServiceError
  - Test function works with Auth Service

### T006: Migrate passwordUpdateAction()

- [ ] T006 Update `passwordUpdateAction()` in `src/actions/auth-actions.ts` (line ~361)
  - Replace `PUT /api/auth/password` with direct call to `updatePassword()` from Auth Service
  - Pass `token_hash` and `type` parameters correctly
  - Import `updatePassword` from `@/lib/auth/service`
  - Update error handling to use AuthServiceError
  - Test OTP-based password update flow

### T007-T009: Migrate passwordChangeAction()

**Note**: This action currently calls 3 API routes and requires more complex refactoring

- [ ] T007 Refactor `passwordChangeAction()` in `src/actions/auth-actions.ts` (line ~492-542) - Part 1: Session handling
  - Replace `GET /api/auth/session` with direct call to `getSession()` from Auth Service
  - Import `getSession` from `@/lib/auth/service`
  - Handle session retrieval errors

- [ ] T008 Refactor `passwordChangeAction()` in `src/actions/auth-actions.ts` (line ~520) - Part 2: Password verification
  - Replace `POST /api/auth/login` with direct Supabase client call (same pattern as `loginAction()`)
  - Use `createClient()` from `@/lib/supabase/server`
  - Call `supabase.auth.signInWithPassword()` to verify current password
  - Handle authentication errors appropriately

- [ ] T009 Refactor `passwordChangeAction()` in `src/actions/auth-actions.ts` (line ~542) - Part 3: Password update
  - Replace `PUT /api/auth/password` with direct call to `updatePassword()` from Auth Service
  - Import `updatePassword` from `@/lib/auth/service`
  - Update error handling to use AuthServiceError

### T010: Validation Testing

- [ ] T010 Run targeted tests for auth actions: `pnpm test src/actions/auth-actions.test.ts` (if exists)
  - Verify all Server Actions work without API routes
  - Test password reset request flow
  - Test password update with OTP flow
  - Test password change with current password flow
  - All tests should pass

**Checkpoint**: All Server Actions now use Auth Service directly - API routes are no longer called

---

## Phase 3: API Route Deletion

**Purpose**: Remove obsolete API route files (preserve `/api/auth/verify`)

**⚠️ CRITICAL**: Double-check that `/api/auth/verify` is NOT deleted - it's required for email verification callbacks

- [ ] T011 Delete obsolete login route: `rm src/app/api/auth/login/route.ts`
- [ ] T012 Delete obsolete logout route: `rm src/app/api/auth/logout/route.ts`
- [ ] T013 Delete obsolete signup route: `rm src/app/api/auth/signup/route.ts`
- [ ] T014 Delete obsolete session route: `rm src/app/api/auth/session/route.ts`
- [ ] T015 Delete obsolete refresh route: `rm src/app/api/auth/refresh/route.ts`
- [ ] T016 Delete obsolete password route: `rm src/app/api/auth/password/route.ts`
- [ ] T017 Delete obsolete password reset directory: `rm -r src/app/api/auth/password/reset/`
- [ ] T018 Verify `/api/auth/verify/route.ts` still exists and is intact

**Checkpoint**: 7 routes deleted, 1 route (verify) preserved

---

## Phase 4: Test Updates

**Purpose**: Update integration tests to test Server Actions instead of API routes (if tests are coupled to routes)

**Note**: Based on research.md, integration tests may be testing API routes directly. These need to be updated to test Server Actions or Auth Service.

- [ ] T019 Audit integration test files in `tests/integration/auth/` directory
  - Check if tests import/mock API routes
  - Identify which tests need updates
  - Document findings

- [ ] T020 Update signup integration tests in `tests/integration/auth/signup.test.ts` (if needed)
  - Test `signupAction()` instead of `/api/auth/signup`
  - Verify test still validates signup flow
  - Ensure test passes

- [ ] T021 Update login integration tests in `tests/integration/auth/login.test.ts` (if needed)
  - Test `loginAction()` instead of `/api/auth/login`
  - Verify test still validates login flow
  - Ensure test passes

- [ ] T022 Update logout integration tests in `tests/integration/auth/logout.test.ts` (if needed)
  - Test `signOutAction()` instead of `/api/auth/logout`
  - Verify test still validates logout flow
  - Ensure test passes

- [ ] T023 Update password reset integration tests in `tests/integration/auth/password-reset.test.ts` (if needed)
  - Test `passwordResetRequestAction()` and `passwordUpdateAction()` instead of API routes
  - Verify test still validates password reset flow
  - Ensure test passes

- [ ] T024 Update session integration tests in `tests/integration/auth/session.test.ts` (if needed)
  - Test Auth Service `getSession()` instead of `/api/auth/session`
  - Verify test still validates session management
  - Ensure test passes

- [ ] T025 Update refresh integration tests in `tests/integration/auth/refresh.test.ts` (if needed)
  - Test Auth Service `refreshSession()` instead of `/api/auth/refresh`
  - Verify test still validates session refresh
  - Ensure test passes

- [ ] T026 Verify email verification test in `tests/integration/auth/verify.test.ts` still passes
  - This should continue testing `/api/auth/verify` endpoint (the only remaining route)
  - Ensure test passes without changes

**Checkpoint**: All integration tests updated and passing

---

## Phase 5: Documentation Updates

**Purpose**: Update architectural documentation to reflect new service-based architecture

- [ ] T027 Update `docs/decisions/authentication.md` - Part 1: API Architecture Section
  - Locate API architecture section (around line 1032 based on plan.md)
  - Replace three-layer architecture description with two-layer architecture
  - Document: UI → Server Actions → Auth Service → Supabase
  - Add exception note for `/api/auth/verify` (required for email verification callbacks)

- [ ] T028 Update `docs/decisions/authentication.md` - Part 2: Add Removed Routes Section
  - Create new section titled "Removed API Routes (2025-12-07)"
  - List all 7 removed routes with their Auth Service replacements:
    - `/api/auth/signup` → `signup()` in Auth Service
    - `/api/auth/login` → Direct Supabase client call in `loginAction()`
    - `/api/auth/logout` → `logout()` in Auth Service
    - `/api/auth/session` → `getSession()` in Auth Service
    - `/api/auth/refresh` → `refreshSession()` in Auth Service
    - `/api/auth/password` → `updatePassword()` in Auth Service
    - `/api/auth/password/reset` → `resetPassword()` in Auth Service
  - Explain rationale: eliminating redundant layer, improving maintainability

- [ ] T029 Update `docs/decisions/authentication.md` - Part 3: Historical Reference
  - Add section "Legacy Architecture (Pre-2025-12-07)"
  - Preserve description of old three-layer architecture for context
  - Mark clearly as historical/removed
  - Document migration timeline and reasons

- [ ] T030 Update `docs/decisions/authentication.md` - Part 4: Email Verification Section
  - Update email verification flow documentation
  - Clarify `/api/auth/verify` is the ONLY remaining auth API route
  - Explain why it must remain (external callback from Supabase emails)
  - Document both OTP and PKCE verification flows
  - Include technical flow diagram from research.md

**Checkpoint**: Documentation reflects current architecture accurately

---

## Phase 6: Validation & Testing

**Purpose**: Comprehensive validation that all changes work correctly

### Automated Testing

- [ ] T031 Run full unit test suite: `pnpm test`
  - All tests should pass
  - Document any failures and fix before proceeding

- [ ] T032 Run full E2E test suite: `pnpm test:e2e`
  - All E2E tests should pass (login, signup, dashboard access)
  - Document any failures and fix before proceeding

### Manual Validation

- [ ] T033 Manual test: Email verification flow (critical!)
  - Start dev server: `pnpm dev`
  - Register new account with real email
  - Check email for verification link
  - Click verification link
  - Verify redirect to dashboard works
  - Confirm user is authenticated
  - **THIS IS CRITICAL** - email verification is the only remaining API route

- [ ] T034 Manual test: User signup flow
  - Use signup modal/form
  - Create new account
  - Verify account created successfully
  - Verify using `signupAction()` (not API route)

- [ ] T035 Manual test: User login flow
  - Use login modal/form
  - Login with credentials
  - Verify login successful
  - Verify using `loginAction()` (not API route)

- [ ] T036 Manual test: User logout flow
  - Click logout button
  - Verify logout successful
  - Verify redirect to login page
  - Verify using `signOutAction()` (not API route)

- [ ] T037 Manual test: Password reset request
  - Use "Forgot password" flow
  - Request password reset
  - Check email for reset link
  - Verify email received
  - Verify using `passwordResetRequestAction()` (not API route)

- [ ] T038 Manual test: Password update via reset link
  - Click password reset link from email
  - Enter new password
  - Verify password updated successfully
  - Verify using `passwordUpdateAction()` (not API route)

- [ ] T039 Manual test: Password change (authenticated user)
  - Login as existing user
  - Navigate to password change form
  - Enter current password and new password
  - Verify password changed successfully
  - Verify using `passwordChangeAction()` (not API route)

### API Route Verification

- [ ] T040 Verify deleted routes return 404
  - Test each deleted endpoint with curl or browser:
    - `curl http://localhost:3000/api/auth/login` → 404
    - `curl http://localhost:3000/api/auth/logout` → 404
    - `curl http://localhost:3000/api/auth/signup` → 404
    - `curl http://localhost:3000/api/auth/session` → 404
    - `curl http://localhost:3000/api/auth/refresh` → 404
    - `curl http://localhost:3000/api/auth/password` → 404
    - `curl http://localhost:3000/api/auth/password/reset` → 404
  - All should return 404 Not Found

- [ ] T041 Verify `/api/auth/verify` endpoint still works
  - This endpoint should still be accessible (200 or redirect)
  - Test with verify link from signup email
  - Should NOT return 404

### Code Quality Checks

- [ ] T042 Search for broken API route references
  - Run: `grep -r "/api/auth/" src --exclude-dir=api -n`
  - Should only find references to `/api/auth/verify` (in tests or config)
  - Should NOT find references to deleted routes
  - Document and fix any unexpected findings

- [ ] T043 Run linter: `pnpm lint`
  - All linting should pass
  - Fix any new linting errors introduced

- [ ] T044 Review TypeScript compilation: `pnpm build` or `tsc --noEmit`
  - Build should succeed with no errors
  - Fix any type errors introduced

**Checkpoint**: All validation passed - changes are safe to deploy

---

## Phase 7: Final Review & Deployment Prep

**Purpose**: Final checks before merge and deployment

- [ ] T045 Review all changed files in git
  - Run: `git status` and `git diff`
  - Verify only expected files changed:
    - `src/actions/auth-actions.ts` (updated)
    - Deleted route files (7 files)
    - `docs/decisions/authentication.md` (updated)
    - Test files (if updated)
  - No unexpected changes

- [ ] T046 Create comprehensive commit message
  - List all changes made
  - Reference issue/ticket if applicable
  - Include migration notes for team

- [ ] T047 Update README or CHANGELOG (if applicable)
  - Document API route removal
  - Note new Auth Service-based architecture
  - Add migration notes for other developers

- [ ] T048 Code review checklist verification
  - All Server Actions use Auth Service directly ✓
  - All 7 obsolete routes deleted ✓
  - `/api/auth/verify` preserved ✓
  - Documentation updated ✓
  - All tests passing ✓
  - Manual testing completed ✓

- [ ] T049 Create deployment notes
  - Document rollback procedure (restore route files from git)
  - List monitoring items (watch for unexpected 404s)
  - Note success metrics (zero increase in auth errors)

- [ ] T050 Final validation of quickstart.md steps
  - Run through steps in `specs/001-remove-obsolete-auth-routes/quickstart.md`
  - Verify all steps completed successfully
  - Document any deviations

**Checkpoint**: Ready for code review and merge

---

## Dependencies & Execution Order

### Phase Dependencies (Sequential - Must Complete in Order)

1. **Phase 1 (Preparation)**: No dependencies - start here
2. **Phase 2 (Migration)**: Depends on Phase 1 completion - CRITICAL PATH
3. **Phase 3 (Deletion)**: Depends on Phase 2 completion - DO NOT delete routes until migration done
4. **Phase 4 (Test Updates)**: Depends on Phase 3 completion - tests need routes deleted first
5. **Phase 5 (Documentation)**: Can start after Phase 3 (parallel with Phase 4)
6. **Phase 6 (Validation)**: Depends on Phases 2, 3, 4, 5 completion
7. **Phase 7 (Final Review)**: Depends on Phase 6 completion

### Critical Path (Must Be Sequential)

```
Phase 1 → Phase 2 → Phase 3 → Phase 6 → Phase 7
(Prepare) (Migrate) (Delete)  (Validate) (Review)
```

**WHY**: Cannot delete routes before migrating Server Actions. Cannot validate before deletion complete.

### Parallel Opportunities (Limited)

**Within Phase 1**:
- T003 and T004 can run in parallel (different activities)

**Within Phase 2**:
- T005, T006 can run in parallel (different functions in same file - requires coordination)
- T007, T008, T009 must be sequential (same function)

**Within Phase 4**:
- T020-T026 can run in parallel (different test files)

**Within Phase 5**:
- All documentation tasks (T027-T030) can run in parallel IF different sections, but same file requires coordination

**Phase 4 and Phase 5 can overlap**:
- Test updates (Phase 4) and Documentation (Phase 5) can proceed in parallel after Phase 3

**Within Phase 6**:
- T031, T032 can run in parallel (different test suites)
- Manual tests (T033-T039) should be sequential for clarity
- T040, T041 can run in parallel (different endpoints)
- T042, T043, T044 can run in parallel (different tools)

### Task Grouping for Efficiency

**Batch 1** (Preparation):
```
T001 → T002 → [T003, T004 in parallel]
```

**Batch 2** (Migration - Critical):
```
[T005, T006 in parallel] → [T007 → T008 → T009 sequential] → T010
```

**Batch 3** (Deletion):
```
T011 through T018 sequential (deletion is fast, can be single command)
```

**Batch 4** (Parallel):
```
Phase 4: [T019 → T020-T026 in parallel]
Phase 5: [T027-T030 can coordinate or sequence]
```

**Batch 5** (Validation):
```
[T031, T032 in parallel] → T033-T039 sequential → [T040, T041 in parallel] → [T042, T043, T044 in parallel]
```

**Batch 6** (Final):
```
T045 → T046 → T047 → T048 → T049 → T050 sequential
```

---

## Parallel Execution Examples

### Example 1: Phase 1 Preparation

```bash
# Can run these simultaneously:
# Terminal 1:
grep -r "/api/auth/" src --exclude-dir=api -n > api-route-refs.txt

# Terminal 2:
pnpm test > baseline-tests.txt
```

### Example 2: Phase 2 Migration (Different Functions)

```bash
# Can edit these in parallel (different functions in auth-actions.ts):
# Developer A: passwordResetRequestAction() at line ~257
# Developer B: passwordUpdateAction() at line ~361
# Note: Requires merge coordination or pair programming
```

### Example 3: Phase 4 Test Updates

```bash
# Can update these test files in parallel (different files):
# Developer A: tests/integration/auth/signup.test.ts
# Developer B: tests/integration/auth/login.test.ts
# Developer C: tests/integration/auth/password-reset.test.ts
```

### Example 4: Phase 6 Automated Validation

```bash
# Can run these simultaneously:
# Terminal 1:
pnpm test

# Terminal 2:
pnpm test:e2e

# Terminal 3:
pnpm lint
```

---

## Implementation Strategy

### Recommended Approach: Sequential with Strategic Parallelism

This is a **refactoring/cleanup task** with strong dependencies, not independent user stories. Best approach:

1. **Single Developer**: Complete phases sequentially (safest)
   - Phase 1 (30 min)
   - Phase 2 (2-3 hours) - CRITICAL, test thoroughly
   - Phase 3 (10 min) - Simple deletion
   - Phases 4 & 5 in parallel (2 hours)
   - Phase 6 (2-3 hours) - Comprehensive validation
   - Phase 7 (30 min) - Final review

2. **Pair Programming** (Recommended): Two developers collaborating
   - One drives, one reviews in real-time
   - Reduces risk of mistakes during migration
   - Particularly valuable for Phase 2 (Server Action migration)

3. **Team Approach**: Multiple developers (requires coordination)
   - Developer A: Phases 1-3 (migration & deletion)
   - Developer B: Phase 5 (documentation) - can start after Phase 3
   - Developer A: Phase 4 (test updates) - after Phase 3
   - Both: Phase 6 (validation) - requires both streams complete
   - Lead: Phase 7 (final review)

### Risk Mitigation Strategy

**High-Risk Areas**:
1. Phase 2 (T007-T009): `passwordChangeAction()` refactoring - complex, multi-step
2. Phase 3 (T018): Must preserve `/api/auth/verify` - DO NOT DELETE
3. Phase 6 (T033): Email verification must work - CRITICAL

**Mitigation**:
- Test after EACH migration in Phase 2
- Double-check verify route preservation before committing
- Manual email verification test is non-negotiable

### Rollback Plan

**If Issues Found During Implementation**:
- Git reset to previous commit
- Fix issues
- Re-apply changes

**If Issues Found After Deployment**:
- Restore deleted route files from git history
- Redeploy (5-10 minutes)
- Investigate root cause
- Fix and re-remove routes

### Time Estimates

- **Phase 1**: 30 minutes
- **Phase 2**: 2-3 hours (includes testing each migration)
- **Phase 3**: 10 minutes
- **Phase 4**: 1-2 hours (depends on test coupling)
- **Phase 5**: 1-2 hours (documentation updates)
- **Phase 6**: 2-3 hours (comprehensive validation)
- **Phase 7**: 30 minutes

**Total**: 7-11 hours (approximately 1-2 workdays)

### MVP Definition

For this cleanup task, "MVP" means: **Minimum Safe Removal**

**Must Have**:
- All Server Actions migrated (Phase 2) ✓
- All obsolete routes deleted (Phase 3) ✓
- Email verification still works (Phase 6, T033) ✓
- Tests pass (Phase 6, T031-T032) ✓

**Should Have**:
- Updated tests (Phase 4) ✓
- Updated documentation (Phase 5) ✓
- Comprehensive manual validation (Phase 6) ✓

**Could Defer**:
- None - this is all-or-nothing refactoring

---

## Notes

- This is a **refactoring task**, not a feature with user stories
- Tasks have **strong sequential dependencies** (migration before deletion)
- **Limited parallel opportunities** due to same-file edits
- **Email verification** (`/api/auth/verify`) preservation is CRITICAL
- **Test thoroughly** after migration, before deletion
- **Manual validation** is essential (especially email verification)
- Commit frequently: after each phase or logical group
- Stop at any checkpoint if validation fails
- Use git branches to safely experiment if uncertain
- Rollback is simple: restore deleted files from git
- Consider pair programming for Phase 2 (migration) to reduce errors

---

## Success Criteria

**Implementation Complete When**:

✅ All 7 obsolete API routes deleted
✅ `/api/auth/verify` route preserved and functional
✅ All Server Actions use Auth Service directly (no API route calls)
✅ All automated tests pass (unit + E2E)
✅ Email verification flow works end-to-end (manual test)
✅ All authentication flows work (signup, login, logout, password reset/change)
✅ Deleted routes return 404
✅ No broken references in codebase
✅ Documentation reflects new architecture
✅ Code review approved
✅ Ready for deployment

**Deployment Success Metrics**:

- Zero increase in authentication error rates
- Email verification success rate unchanged
- No user-reported authentication issues
- Monitoring shows expected 404s only (no unexpected 404s on verify)
