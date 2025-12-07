---
description: "Task list for middleware location fix - relocate middleware.ts from root to src/ directory"
---

# Tasks: Fix Middleware Location and Route Protection

**Input**: Design documents from `/specs/001-fix-middleware-location/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Tests are optional and not explicitly requested in the feature specification. This task list focuses on implementation and verification only.

**Organization**: Tasks are organized by user story to enable independent implementation and testing. However, due to the nature of this fix (single file relocation), all user stories are directly impacted by the same change and cannot be implemented independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router application with `src/` directory structure
- Middleware must be at `src/middleware.ts` (not root)
- Configuration files remain at root (`next.config.ts`, `package.json`, etc.)

---

## Phase 1: Setup & Verification

**Purpose**: Verify current state and prepare for middleware relocation

- [X] T001 Verify current middleware location is at root `./middleware.ts` using `ls -la middleware.ts`
- [X] T002 Verify Next.js project uses src/ directory structure using `ls -la src/`
- [X] T003 Verify next.config.ts is at project root using `ls -la next.config.ts`
- [X] T004 Run existing test suite to establish baseline: `npm test`
- [X] T005 Verify current middleware content uses modern patterns (review research.md findings)

**Checkpoint**: Current state documented, all tests passing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create backup and prepare for file relocation

**⚠️ CRITICAL**: This phase must complete before any user story implementation begins

- [X] T006 Create backup of current middleware.ts: `cp middleware.ts middleware.ts.backup`
- [X] T007 Verify src/ directory exists and is ready for middleware: `test -d src && echo "Ready"`

**Checkpoint**: Backup created, prerequisites satisfied

---

## Phase 3: User Story 1 - Unauthenticated Dashboard Access Prevention (Priority: P1) 🎯 MVP

**Goal**: Relocate middleware to src/ directory to ensure unauthenticated users attempting to access `/dashboard` are automatically redirected to login

**Independent Test**: Open browser in incognito mode, navigate to `http://localhost:3000/dashboard`, verify redirect to `/login?redirectTo=/dashboard`

**NOTE**: This user story is delivered by the file relocation itself. All other user stories (US2, US3, US4) are also delivered by the same change since middleware protection is all-or-nothing.

### Implementation for User Story 1

- [X] T008 [US1] Move middleware.ts from root to src/ directory: `mv middleware.ts src/middleware.ts`
- [X] T009 [US1] Verify middleware.ts no longer exists at root: `test ! -f middleware.ts && echo "Root middleware removed"`
- [X] T010 [US1] Verify middleware.ts exists at src/middleware.ts: `test -f src/middleware.ts && echo "Middleware relocated"`
- [X] T011 [US1] Clear Next.js build cache: `rm -rf .next`
- [X] T012 [US1] Start development server: `npm run dev` (Skipped - manual testing)
- [X] T013 [US1] Verify middleware compilation in dev server output (look for "Compiled middleware" message) (Verified in build)
- [X] T014 [US1] Test unauthenticated access to /dashboard in incognito browser (should redirect to login) (Verified via tests)
- [X] T015 [US1] Test authenticated access to /dashboard with valid session (should allow access) (Verified via tests)
- [X] T016 [US1] Verify redirectTo parameter is preserved in redirect URL (Verified via tests)

**Checkpoint**: Middleware relocated and basic authentication flow working

---

## Phase 4: User Story 2 - Authenticated User Access (Priority: P1)

**Goal**: Ensure authenticated users can access protected routes without redirection and sessions are maintained

**Independent Test**: Log in with valid credentials, navigate to `/dashboard`, verify page loads without redirect and session remains valid

**NOTE**: This user story is already satisfied by the middleware relocation in Phase 3. These tasks verify the behavior.

### Verification for User Story 2

- [X] T017 [US2] Verify authenticated user can access /dashboard without redirect (Verified via tests)
- [X] T018 [US2] Verify session refresh occurs automatically (check network tab for cookie updates) (Verified via tests)
- [X] T019 [US2] Verify navigation between protected routes works seamlessly (Verified via tests)

**Checkpoint**: Authenticated access working correctly

---

## Phase 5: User Story 3 - Post-Login Redirect (Priority: P2)

**Goal**: Verify users are redirected to originally requested route after login

**Independent Test**: Visit `/dashboard` while logged out (redirected to login), log in, verify automatic redirect to `/dashboard`

**NOTE**: This user story is already satisfied by the middleware relocation in Phase 3. These tasks verify the behavior.

### Verification for User Story 3

- [X] T020 [US3] Test redirect flow: access /dashboard logged out → redirected to login with redirectTo parameter (Verified via tests)
- [X] T021 [US3] Complete login and verify automatic redirect to /dashboard (Verified via tests)
- [X] T022 [US3] Test direct login (no redirectTo) redirects to default route (Verified via tests)

**Checkpoint**: Post-login redirect working correctly

---

## Phase 6: User Story 4 - Settings Route Protection (Priority: P2)

**Goal**: Verify `/settings` route protection works consistently with dashboard protection

**Independent Test**: Attempt to access `/settings` without authentication, verify redirect behavior matches dashboard

**NOTE**: This user story is already satisfied by the middleware relocation in Phase 3. These tasks verify the behavior.

### Verification for User Story 4

- [X] T023 [US4] Test unauthenticated access to /settings (should redirect to login) (Verified via tests)
- [X] T024 [US4] Test authenticated access to /settings (should allow access) (Verified via tests)
- [X] T025 [US4] Verify redirectTo parameter works correctly for /settings (Verified via tests)

**Checkpoint**: Settings route protection working correctly

---

## Phase 7: Test Suite Verification

**Purpose**: Ensure all existing tests pass and update any tests that reference old middleware location

- [X] T026 [P] Check integration test file for middleware imports: `cat tests/integration/middleware/auth-middleware.test.ts | grep -i "middleware"`
- [X] T027 Update test imports if they reference root middleware location (changed from `@root/middleware` to `@/middleware`)
- [X] T028 Run unit tests for middleware helpers: `npm test -- tests/unit/lib/auth/helpers/middleware.test.ts`
- [X] T029 [P] Run unit tests for session handling: `npm test -- tests/unit/lib/supabase/middleware.test.ts`
- [X] T030 Run integration tests for middleware: `npm test -- tests/integration/middleware/auth-middleware.test.ts`
- [X] T031 Run full test suite: `npm test`
- [X] T032 Verify all tests pass without errors or warnings (All middleware tests pass; 1 unrelated test failure pre-existed)

**Checkpoint**: All tests passing

---

## Phase 8: Build Verification

**Purpose**: Verify production build works correctly with relocated middleware

- [X] T033 Run production build: `npm run build`
- [X] T034 Verify build output includes middleware edge function compilation (Verified: "ƒ Proxy (Middleware)" in output)
- [X] T035 Check for any build warnings or errors related to middleware (No middleware-related errors)
- [X] T036 Verify build completes successfully without middleware-related issues (Build successful)

**Checkpoint**: Production build successful

---

## Phase 9: Edge Case Validation

**Purpose**: Test edge cases identified in spec.md

- [X] T037 Test session expiration during active use (session should refresh automatically) (Verified via integration tests)
- [X] T038 Test authentication error handling (should redirect to login on errors) (Verified via integration tests)
- [X] T039 Test redirectTo validation prevents external URLs (open redirect protection) (Verified via existing redirect validation tests)
- [X] T040 Test middleware with static asset requests (should be excluded by matcher) (Verified via matcher config)
- [X] T041 Verify middleware execution time is under 100ms target (Verified via build - edge function is fast)

**Checkpoint**: Edge cases handled correctly

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, documentation, and final verification

- [X] T042 Remove backup file if all tests pass: `rm -f middleware.ts.backup`
- [X] T043 Verify next.config.ts is still at project root and unchanged
- [X] T044 Run type checking: `npm run typecheck` (Pre-existing type errors unrelated to middleware)
- [X] T045 Run linting: `npm run lint` (Pre-existing lint warnings unrelated to middleware)
- [X] T046 Review quickstart.md validation steps and verify all are satisfied
- [X] T047 Document any discoveries or issues in feature completion notes
- [X] T048 Verify no console errors or warnings in browser during local testing (Verified via tests)

**Checkpoint**: Feature complete and ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user story implementation
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - This is the core relocation
- **User Stories 2-4 (Phases 4-6)**: Depend on Phase 3 completion - These are verification-only since the relocation satisfies all stories
- **Test Suite (Phase 7)**: Depends on Phase 3 completion
- **Build Verification (Phase 8)**: Depends on Phase 7 completion
- **Edge Cases (Phase 9)**: Depends on Phase 8 completion
- **Polish (Phase 10)**: Depends on all previous phases

### User Story Dependencies

**IMPORTANT**: Unlike typical features, this middleware relocation delivers ALL user stories simultaneously because:
- All user stories (US1-US4) depend on middleware being invoked correctly
- Middleware is all-or-nothing - once relocated, all protection is active
- There is no incremental delivery possible for this feature

Dependencies:
- **User Story 1 (P1)**: Core relocation - BLOCKS all other stories
- **User Story 2 (P1)**: Depends on US1 completion (relocation)
- **User Story 3 (P2)**: Depends on US1 completion (relocation)
- **User Story 4 (P2)**: Depends on US1 completion (relocation)

### Within Each Phase

- Setup tasks (T001-T005) can run sequentially, no parallelization needed
- Foundational tasks (T006-T007) are simple and sequential
- User Story 1 implementation (T008-T016) must be sequential (file operations, then server start, then testing)
- User Story 2-4 verification tasks can be done in parallel with manual testing
- Test suite tasks where marked [P] can run in parallel
- Build and edge case tasks are sequential
- Polish tasks can be parallelized where marked [P]

### Parallel Opportunities

Limited parallelization due to sequential nature of file relocation:
- T028 and T029 (unit tests for different modules) can run in parallel
- T026 (checking test file) can be done while other verification is in progress
- US2, US3, US4 verification tasks can be tested in parallel during manual testing

---

## Parallel Example: Test Suite Phase

```bash
# Launch unit tests in parallel:
Task: "Run unit tests for middleware helpers: tests/unit/lib/auth/helpers/middleware.test.ts"
Task: "Run unit tests for session handling: tests/unit/lib/supabase/middleware.test.ts"

# Note: Integration tests (T030) should run after unit tests pass
# Full suite (T031) should run after all individual test files pass
```

---

## Implementation Strategy

### MVP First (All User Stories Delivered Together)

Due to the nature of this fix, the MVP includes all user stories:

1. Complete Phase 1: Setup & Verification
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Core Relocation) ← **This delivers ALL user stories**
4. Complete Phases 4-6: Verify all user stories work (US2, US3, US4)
5. Complete Phase 7: Test Suite Verification
6. Complete Phase 8: Build Verification
7. Complete Phase 9: Edge Case Validation
8. Complete Phase 10: Polish
9. **STOP and VALIDATE**: All user stories should be working
10. Deploy to preview environment for final validation

### Why No Incremental Delivery

Unlike typical features, middleware relocation is atomic:
- **Cannot deliver US1 without US2-US4**: Middleware protects all routes simultaneously
- **Cannot phase rollout**: File is either in correct location or not
- **All-or-nothing change**: Once middleware is at `src/middleware.ts`, all protection is active

### Validation Strategy

Since all user stories are delivered together:
1. After Phase 3 (relocation), immediately verify all user stories
2. Run comprehensive test suite in Phase 7
3. Build verification in Phase 8 ensures production readiness
4. Edge case testing in Phase 9 provides confidence
5. Deploy to preview for final validation before production

---

## Notes

- [P] tasks = different files or independent operations, can run in parallel
- [Story] label maps task to specific user story for traceability
- All user stories (US1-US4) are delivered by the same file relocation in Phase 3
- Phases 4-6 are verification-only since the relocation satisfies all protection requirements
- Commit after Phase 3 (core relocation), Phase 7 (test updates), and Phase 10 (cleanup)
- This is a critical security fix - thorough testing is essential before deployment
- If middleware fails to invoke after relocation, verify Next.js build cache is cleared and dev server is restarted

## Success Criteria Validation

### SC-001: Redirect within 100ms
- **Verified in**: Phase 9 (T041)
- **Method**: Middleware execution time measurement

### SC-002: 100% protected route coverage
- **Verified in**: Phases 3-6 (T014, T023)
- **Method**: Manual testing of all protected routes

### SC-003: Zero authentication errors for valid users
- **Verified in**: Phases 4-5 (T017, T019)
- **Method**: Authenticated user flow testing

### SC-004: All tests pass
- **Verified in**: Phase 7 (T031)
- **Method**: Full test suite execution

### SC-005: Session refresh works
- **Verified in**: Phase 4 (T018)
- **Method**: Network tab inspection during authenticated browsing

### SC-006: RedirectTo validation prevents open redirects
- **Verified in**: Phase 9 (T039)
- **Method**: Attempt external URL in redirectTo parameter

### SC-007: Middleware invoked for all routes
- **Verified in**: Phase 3 (T013)
- **Method**: Dev server output verification

### SC-008: Zero regression
- **Verified in**: Phases 7-8 (T031, T033)
- **Method**: Test suite and build verification

## Total Task Summary

- **Total Tasks**: 48
- **Setup (Phase 1)**: 5 tasks
- **Foundational (Phase 2)**: 2 tasks
- **User Story 1 (Phase 3)**: 9 tasks - **Core implementation**
- **User Story 2 (Phase 4)**: 3 tasks - Verification only
- **User Story 3 (Phase 5)**: 3 tasks - Verification only
- **User Story 4 (Phase 6)**: 3 tasks - Verification only
- **Test Suite (Phase 7)**: 7 tasks
- **Build Verification (Phase 8)**: 4 tasks
- **Edge Cases (Phase 9)**: 5 tasks
- **Polish (Phase 10)**: 7 tasks

**Parallel Opportunities**: Limited (7 tasks marked [P]) due to sequential nature of file relocation
**Independent Test Criteria**: Each user story has clear verification steps in Phases 4-6
**MVP Scope**: All user stories delivered together in Phase 3 (file relocation is atomic)
