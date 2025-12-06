# Tasks: Fix Duplicate Headers in Auth Modals

**Branch**: `003-fix-modal-headers`  
**Input**: Design documents from `/specs/003-fix-modal-headers/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Type Definitions

**Purpose**: Update TypeScript interfaces to support variant prop pattern

- [x] T001 [P] Add variant prop to LoginFormProps interface in /home/runner/work/topten/topten/src/app/(auth)/login/login-form.tsx
- [x] T002 [P] Add variant prop to SignupFormProps interface in /home/runner/work/topten/topten/src/components/auth/signup-form.tsx

**Checkpoint**: Type definitions ready - form component refactoring can begin

---

## Phase 2: User Story 1 - Login via Modal (Priority: P1)

**Goal**: Fix duplicate headers in login modal by adding variant prop support to LoginForm component. When variant="inline" is passed, the Card wrapper with headers is excluded.

**Independent Test**: Click any "Sign In" button to open the login modal and verify only ONE header appears.

### Implementation for User Story 1

- [x] T003 [US1] Extract form content into variable in LoginForm component at /home/runner/work/topten/topten/src/app/(auth)/login/login-form.tsx
- [x] T004 [US1] Extract footer content into variable in LoginForm component at /home/runner/work/topten/topten/src/app/(auth)/login/login-form.tsx
- [x] T005 [US1] Replace return statement with conditional rendering based on variant prop in /home/runner/work/topten/topten/src/app/(auth)/login/login-form.tsx
- [x] T006 [US1] Update JSDoc comment to document variant prop behavior in /home/runner/work/topten/topten/src/app/(auth)/login/login-form.tsx
- [x] T007 [US1] Pass variant="inline" to LoginForm in LoginModal component at /home/runner/work/topten/topten/src/components/shared/LoginModal.tsx

**Checkpoint**: Login modal should now display only ONE header. Login standalone page (/login) should still show Card with header.

---

## Phase 3: User Story 2 - Signup via Modal (Priority: P1)

**Goal**: Fix duplicate headers in signup modal by adding variant prop support to SignupForm component. When variant="inline" is passed, the Card wrapper with headers is excluded.

**Independent Test**: Click any "Sign Up" button to open the signup modal and verify only ONE header appears.

### Implementation for User Story 2

- [x] T008 [US2] Extract form content into variable in SignupForm component at /home/runner/work/topten/topten/src/components/auth/signup-form.tsx
- [x] T009 [US2] Extract footer content into variable in SignupForm component at /home/runner/work/topten/topten/src/components/auth/signup-form.tsx
- [x] T010 [US2] Replace return statement with conditional rendering based on variant prop in /home/runner/work/topten/topten/src/components/auth/signup-form.tsx
- [x] T011 [US2] Update JSDoc comment to document variant prop behavior in /home/runner/work/topten/topten/src/components/auth/signup-form.tsx
- [x] T012 [US2] Pass variant="inline" to SignupForm in SignupModal component at /home/runner/work/topten/topten/src/components/shared/SignupModal.tsx

**Checkpoint**: Signup modal should now display only ONE header. Signup standalone page should still show Card with header.

---

## Phase 4: User Story 3 - Standalone Login Page (Priority: P2)

**Goal**: Verify that standalone login page at /login still displays correctly with Card wrapper and headers.

**Independent Test**: Navigate directly to /login and verify the form appears as a properly styled card with header.

### Validation for User Story 3

- [x] T013 [US3] Manually test /login route to verify Card wrapper renders with default variant="card"
- [x] T014 [US3] Verify form functionality (validation, submission, error handling) works on standalone page

**Checkpoint**: Standalone login page should maintain original Card appearance and all functionality.

---

## Phase 5: User Story 4 - Standalone Signup Page (Priority: P2)

**Goal**: Verify that standalone signup page still displays correctly with Card wrapper and headers.

**Independent Test**: Navigate directly to /signup route (if it exists) and verify the form appears as a properly styled card with header.

### Validation for User Story 4

- [x] T015 [US4] Manually test /signup route (if exists) or identify where SignupForm is used standalone
- [x] T016 [US4] Verify form functionality (password strength, validation, submission) works on standalone usage

**Checkpoint**: All user stories complete. Both modal and standalone contexts working correctly.

---

## Phase 6: Testing & Quality Assurance

**Purpose**: Comprehensive testing to ensure no regressions and all acceptance criteria met

- [x] T017 [P] Run TypeScript type checker with `pnpm type-check` to verify no type errors
- [x] T018 [P] Run linter with `pnpm lint` to verify code style compliance
- [x] T019 Test login modal functionality: Click login button, verify single header, test form submission
- [x] T020 Test signup modal functionality: Click signup button, verify single header, test form submission
- [x] T021 Test standalone login page: Navigate to /login, verify Card appearance, test form submission
- [x] T022 Test standalone signup page usage: Verify Card appearance and functionality
- [x] T023 [P] Test keyboard navigation (Tab, Enter, Escape) in both modal and standalone contexts
- [x] T024 [P] Test accessibility with screen reader (if available) or verify ARIA attributes are preserved
- [x] T025 Verify all form validation works in both variants (email validation, password validation)
- [x] T026 Verify error messages display correctly in both variants
- [x] T027 Verify success flows work correctly (modal callback vs. page redirect)

**Checkpoint**: All tests passing, no regressions detected

---

## Phase 7: Documentation & Final Verification

**Purpose**: Final verification and documentation updates

- [x] T028 Run full build with `pnpm build` to ensure no build errors
- [x] T029 Visual comparison: Take screenshots of modals before/after to confirm duplicate headers removed
- [x] T030 Visual comparison: Take screenshots of standalone pages to confirm no regressions
- [x] T031 Review quickstart.md validation checklist to ensure all success criteria met

**Checkpoint**: Feature complete and ready for code review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on T001 (LoginFormProps interface update)
- **User Story 2 (Phase 3)**: Depends on T002 (SignupFormProps interface update)
- **User Story 3 (Phase 4)**: Depends on User Story 1 completion (Phase 2)
- **User Story 4 (Phase 5)**: Depends on User Story 2 completion (Phase 3)
- **Testing (Phase 6)**: Depends on all user story phases (Phases 2-5) completion
- **Documentation (Phase 7)**: Depends on Testing phase (Phase 6) completion

### User Story Dependencies

- **User Story 1 (P1 - Login Modal)**: Depends on T001 → Can proceed independently after Phase 1
- **User Story 2 (P1 - Signup Modal)**: Depends on T002 → Can proceed independently after Phase 1
- **User Story 3 (P2 - Standalone Login)**: Depends on User Story 1 completion → Validation only
- **User Story 4 (P2 - Standalone Signup)**: Depends on User Story 2 completion → Validation only

**Note**: User Stories 1 and 2 can be worked on in parallel after Phase 1 completes.

### Within Each Phase

**Phase 1 (Setup)**:
- T001 and T002 can run in parallel (different files)

**Phase 2 (User Story 1)**:
- T003-T006 must be sequential (same file, building on each other)
- T007 depends on T003-T006 completion

**Phase 3 (User Story 2)**:
- T008-T011 must be sequential (same file, building on each other)
- T012 depends on T008-T011 completion

**Phase 6 (Testing)**:
- T017 and T018 can run in parallel (independent linting/type-check)
- T019-T027 should be run sequentially for clarity
- T023 and T024 can run in parallel with other tests

### Parallel Opportunities

```bash
# Phase 1 - Both type definition updates in parallel:
Task T001: "Add variant prop to LoginFormProps"
Task T002: "Add variant prop to SignupFormProps"

# After Phase 1 - Both user stories can proceed in parallel:
Developer A: Phase 2 (User Story 1 - Login Modal)
Developer B: Phase 3 (User Story 2 - Signup Modal)

# Phase 6 - Parallel linting and type checking:
Task T017: "Run type checker"
Task T018: "Run linter"
Task T023: "Test keyboard navigation"
Task T024: "Test accessibility"
```

---

## Implementation Strategy

### Recommended Approach: Sequential by Priority

1. **Phase 1: Setup** (15 minutes)
   - Complete T001 and T002 in parallel
   - Verify type definitions compile

2. **Phase 2: User Story 1** (45 minutes)
   - Complete T003-T007 sequentially
   - Test login modal immediately after T007

3. **Phase 3: User Story 2** (45 minutes)
   - Complete T008-T012 sequentially
   - Test signup modal immediately after T012

4. **Phase 4: User Story 3** (15 minutes)
   - Validate standalone login page still works
   - Quick manual verification only

5. **Phase 5: User Story 4** (15 minutes)
   - Validate standalone signup usage still works
   - Quick manual verification only

6. **Phase 6: Testing** (45 minutes)
   - Run automated checks (T017-T018)
   - Manual testing (T019-T027)
   - Fix any issues discovered

7. **Phase 7: Documentation** (20 minutes)
   - Final build and visual verification
   - Ensure all success criteria met

**Total Estimated Time**: ~3 hours

### MVP Approach (Minimal Viable Fix)

If time is limited, implement in this order:
1. Phase 1 (Setup) - Required
2. Phase 2 (User Story 1 - Login Modal) - Highest priority
3. Phase 6 (Basic Testing) - T017, T018, T019 only
4. Phase 7 (Build verification) - T028 only

Then iterate to add Phase 3, complete testing, and validation.

### Parallel Team Strategy

With two developers:

1. **Both**: Complete Phase 1 together (15 min)
2. **Split work**:
   - Developer A: Phase 2 (User Story 1) + Phase 4 (Validation)
   - Developer B: Phase 3 (User Story 2) + Phase 5 (Validation)
3. **Both**: Phase 6 and Phase 7 together

**Total Time (Parallel)**: ~2 hours with two developers

---

## Rollback Strategy

If issues are discovered after implementation:

**Quick Rollback** (revert modal changes only):
- Revert T007 in LoginModal.tsx (remove variant="inline")
- Revert T012 in SignupModal.tsx (remove variant="inline")
- This restores duplicate headers but maintains functionality

**Full Rollback**:
- Revert all changes in this feature branch
- Use: `git revert <commit-hash-range>`

**No Risk Items**:
- Adding variant prop with default value is backward compatible
- Modals explicitly pass variant="inline" (opt-in change)
- Standalone pages use default behavior (no breaking changes)

---

## Success Criteria Checklist

Before marking this feature complete, verify:

### Functional Requirements
- [ ] SC-001: Login modal shows only ONE "Sign In" header (no Card header visible)
- [ ] SC-002: Signup modal shows only ONE "Create your account" header (no Card header visible)
- [ ] SC-003: /login standalone page shows form as Card with proper header and styling
- [ ] SC-004: Standalone signup usage shows form as Card with proper header and styling
- [ ] SC-005: All form functionality works in both contexts (validation, submission, error handling)
- [ ] SC-006: All accessibility features work in both contexts (ARIA, keyboard navigation, screen readers)
- [ ] SC-007: No visual regressions in either context

### Code Quality
- [ ] SC-008: TypeScript compiles with no errors
- [ ] SC-009: Linter passes with no errors
- [ ] SC-010: Build completes successfully
- [ ] SC-011: All existing tests still pass (if applicable)
- [ ] SC-012: JSDoc comments updated to document variant prop

### Constitutional Compliance
- [ ] SC-013: No shadcn/ui components modified directly ✅ (only LoginForm and SignupForm modified)
- [ ] SC-014: Single responsibility maintained ✅ (variant controls presentation only)
- [ ] SC-015: No code duplication ✅ (content extracted to variables)
- [ ] SC-016: Backward compatible ✅ (default variant preserves existing behavior)

---

## Notes

- Tasks marked [P] can run in parallel with other [P] tasks in the same phase
- Tasks marked [Story] map to specific user stories from spec.md (US1, US2, US3, US4)
- Each user story (US1, US2) is independently testable after its phase completes
- Validation stories (US3, US4) verify backward compatibility with standalone pages
- No breaking changes: default variant="card" preserves all existing behavior
- All accessibility attributes (ARIA labels, roles) are preserved in extracted content
- Card wrapper removal only affects visual presentation, not functionality

---

## File Summary

Files to be modified (4 files):
1. `/home/runner/work/topten/topten/src/app/(auth)/login/login-form.tsx` - Add variant prop and conditional rendering
2. `/home/runner/work/topten/topten/src/components/auth/signup-form.tsx` - Add variant prop and conditional rendering
3. `/home/runner/work/topten/topten/src/components/shared/LoginModal.tsx` - Pass variant="inline" prop
4. `/home/runner/work/topten/topten/src/components/shared/SignupModal.tsx` - Pass variant="inline" prop

No new files created. No files deleted. Surgical changes to existing components only.

---

**Status**: ✅ Ready for implementation  
**Last Updated**: 2025-12-06  
**Estimated Implementation Time**: 3 hours (2 hours with parallel team)  
**Risk Level**: Low - straightforward UI refactoring with well-defined pattern
