# Tasks: Login Modal Panel Component

**Input**: Design documents from `/specs/001-login-modal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature specification includes comprehensive testing requirements covering unit, integration, and E2E tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project infrastructure is ready for implementation

- [x] T001 Verify Next.js 16.0.5, React 19.2.0, and TypeScript 5.x are installed
- [x] T002 Verify shadcn/ui Dialog component exists at src/components/ui/dialog.tsx (DO NOT MODIFY)
- [x] T003 Verify LoginForm component exists at src/app/(auth)/login/login-form.tsx
- [x] T004 Verify Header component exists at src/components/shared/Header.tsx with onLogin prop
- [x] T005 Verify LandingPageClient component exists at src/components/shared/LandingPageClient.tsx
- [x] T006 [P] Verify testing framework setup (Vitest, React Testing Library, Playwright)
- [x] T007 [P] Run existing tests to establish baseline (pnpm test)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core modifications that MUST be complete before modal implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Add onSuccess prop to LoginFormProps interface in src/app/(auth)/login/login-form.tsx
- [x] T009 Modify redirect logic in LoginForm useEffect to conditionally call onSuccess or router.push in src/app/(auth)/login/login-form.tsx
- [x] T010 Update LoginForm function signature to destructure onSuccess prop in src/app/(auth)/login/login-form.tsx
- [x] T011 [P] Add onSuccess to useEffect dependency array in src/app/(auth)/login/login-form.tsx
- [x] T012 Run TypeScript type checking to verify LoginForm changes (pnpm typecheck)
- [x] T013 Manually verify standalone login page still works at /login

**Checkpoint**: Foundation ready - LoginForm is now reusable in both modal and standalone contexts

---

## Phase 3: User Story 1 - Quick Login from Landing Page (Priority: P1) 🎯 MVP

**Goal**: Enable users to authenticate from the landing page via modal without navigation, redirecting to dashboard upon success

**Independent Test**: Click "Log In" on landing page → modal opens → enter valid credentials → submit → redirect to dashboard → modal closes

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T014 [P] [US1] Create unit test file tests/unit/components/shared/LoginModal.test.tsx
- [x] T015 [P] [US1] Write LoginModal rendering tests (isOpen true/false, LoginForm presence) in tests/unit/components/shared/LoginModal.test.tsx
- [x] T016 [P] [US1] Write LoginModal accessibility tests (dialog role, ARIA attributes, title/description) in tests/unit/components/shared/LoginModal.test.tsx
- [x] T017 [P] [US1] Create integration test file tests/integration/auth/login-modal.test.tsx
- [x] T018 [US1] Write integration test for opening modal from landing page in tests/integration/auth/login-modal.test.tsx
- [x] T019 [US1] Write integration test for successful authentication and redirect in tests/integration/auth/login-modal.test.tsx
- [x] T020 [P] [US1] Create E2E test file tests/e2e/login-modal.spec.ts
- [x] T021 [US1] Write E2E test for complete login flow via modal in tests/e2e/login-modal.spec.ts
- [x] T022 [US1] Run tests to verify they fail (pnpm test && pnpm test:e2e)

### Implementation for User Story 1

- [x] T023 [US1] Create LoginModal component file src/components/shared/LoginModal.tsx with "use client" directive
- [x] T024 [US1] Define LoginModalProps interface (isOpen, onClose, redirectTo) in src/components/shared/LoginModal.tsx
- [x] T025 [US1] Implement LoginModal component structure with Dialog wrapper in src/components/shared/LoginModal.tsx
- [x] T026 [US1] Add DialogHeader with DialogTitle and DialogDescription in src/components/shared/LoginModal.tsx
- [x] T027 [US1] Implement handleSuccess callback that calls onClose then router.push in src/components/shared/LoginModal.tsx
- [x] T028 [US1] Render LoginForm inside DialogContent with onSuccess callback in src/components/shared/LoginModal.tsx
- [x] T029 [US1] Add isLoginModalOpen state to LandingPageClient component in src/components/shared/LandingPageClient.tsx
- [x] T030 [US1] Update handleLogin to set isLoginModalOpen to true in src/components/shared/LandingPageClient.tsx
- [x] T031 [US1] Import and render LoginModal with state props in src/components/shared/LandingPageClient.tsx
- [x] T032 [US1] Pass onClose callback that sets isLoginModalOpen to false in src/components/shared/LandingPageClient.tsx
- [x] T033 [US1] Pass redirectTo="/dashboard" to LoginModal in src/components/shared/LandingPageClient.tsx
- [x] T034 [US1] Run TypeScript type checking (pnpm typecheck)
- [x] T035 [US1] Run unit tests for LoginModal (pnpm test LoginModal.test.tsx)
- [x] T036 [US1] Run integration tests (pnpm test login-modal.test.tsx)
- [x] T037 [US1] Run E2E tests (pnpm test:e2e login-modal.spec.ts)
- [x] T038 [US1] Manually test: click Log In → modal opens → enter credentials → verify redirect

**Checkpoint**: At this point, User Story 1 should be fully functional - users can authenticate via modal from landing page

---

## Phase 4: User Story 2 - Dismissing the Login Modal (Priority: P2)

**Goal**: Provide users with standard modal dismissal methods (Escape, outside click, close button) that close modal and return focus

**Independent Test**: Open modal → press Escape → modal closes and focus returns to Log In button. Repeat with outside click.

### Tests for User Story 2

- [x] T039 [P] [US2] Write LoginModal onClose callback test in tests/unit/components/shared/LoginModal.test.tsx
- [x] T040 [P] [US2] Write LoginModal Escape key test in tests/unit/components/shared/LoginModal.test.tsx
- [x] T041 [P] [US2] Write integration test for closing modal via Escape in tests/integration/auth/login-modal.test.tsx
- [x] T042 [P] [US2] Write integration test for closing modal via outside click in tests/integration/auth/login-modal.test.tsx
- [x] T043 [P] [US2] Write E2E test for Escape key dismissal in tests/e2e/login-modal.spec.ts
- [x] T044 [P] [US2] Write E2E test for outside click dismissal in tests/e2e/login-modal.spec.ts
- [x] T045 [P] [US2] Write E2E test for focus return to Log In button in tests/e2e/login-modal.spec.ts
- [x] T046 [US2] Run tests to verify they fail (pnpm test && pnpm test:e2e)

### Implementation for User Story 2

- [x] T047 [US2] Verify Dialog onOpenChange prop handles Escape key (already implemented via Radix Dialog in src/components/shared/LoginModal.tsx)
- [x] T048 [US2] Verify Dialog handles outside click dismissal (already implemented via Radix Dialog in src/components/shared/LoginModal.tsx)
- [x] T049 [US2] Verify Dialog handles focus return (already implemented via Radix Dialog in src/components/shared/LoginModal.tsx)
- [x] T050 [US2] Run unit tests for dismissal behavior (pnpm test LoginModal.test.tsx)
- [x] T051 [US2] Run integration tests for dismissal (pnpm test login-modal.test.tsx)
- [ ] T052 [US2] Run E2E tests for dismissal (pnpm test:e2e login-modal.spec.ts)
- [x] T053 [US2] Manually test: open modal → press Escape → verify close and focus return
- [x] T054 [US2] Manually test: open modal → click outside → verify close
- [x] T055 [US2] Manually test: close modal → reopen → verify form state is reset

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - authentication works and dismissal is user-friendly

---

## Phase 5: User Story 3 - Accessible Modal Interaction (Priority: P2)

**Goal**: Ensure modal is fully accessible with proper focus management, ARIA labels, keyboard navigation, and screen reader support

**Independent Test**: Use keyboard-only navigation to open modal, tab through form, submit, and verify focus trap and announcements with screen reader

### Tests for User Story 3

- [x] T056 [P] [US3] Write test for dialog role attribute in tests/unit/components/shared/LoginModal.test.tsx
- [x] T057 [P] [US3] Write test for aria-modal attribute in tests/unit/components/shared/LoginModal.test.tsx
- [x] T058 [P] [US3] Write test for accessible title in tests/unit/components/shared/LoginModal.test.tsx
- [x] T059 [P] [US3] Write test for accessible description in tests/unit/components/shared/LoginModal.test.tsx
- [x] T060 [P] [US3] Write E2E test for keyboard navigation (Tab cycles through elements) in tests/e2e/login-modal.spec.ts
- [x] T061 [P] [US3] Write E2E test for focus trap within modal in tests/e2e/login-modal.spec.ts
- [x] T062 [US3] Run tests to verify they fail (pnpm test && pnpm test:e2e)

### Implementation for User Story 3

- [x] T063 [US3] Verify DialogTitle is present for screen reader announcements in src/components/shared/LoginModal.tsx
- [x] T064 [US3] Verify DialogDescription is present for context in src/components/shared/LoginModal.tsx
- [x] T065 [US3] Verify Dialog role and aria-modal attributes (provided by Radix Dialog) in src/components/shared/LoginModal.tsx
- [x] T066 [US3] Verify focus moves to email input on modal open (LoginForm auto-focuses first field) in src/components/shared/LoginModal.tsx
- [x] T067 [US3] Run unit tests for accessibility (pnpm test LoginModal.test.tsx)
- [ ] T068 [US3] Run E2E tests for keyboard navigation (pnpm test:e2e login-modal.spec.ts)
- [x] T069 [US3] Manually test keyboard navigation: Tab through all elements, Shift+Tab reverse
- [x] T070 [US3] Manually test with screen reader (NVDA/JAWS) to verify announcements
- [x] T071 [US3] Manually test focus trap: verify Tab cycles within modal only
- [x] T072 [US3] Manually test focus return: close modal and verify focus on Log In button

**Checkpoint**: At this point, User Story 1 should be fully functional - users can authenticate via modal from landing page

---

## Phase 4: User Story 2 - Dismissing the Login Modal (Priority: P2)

**Goal**: Provide users with standard modal dismissal methods (Escape, outside click, close button) that close modal and return focus

**Independent Test**: Open modal → press Escape → modal closes and focus returns to Log In button. Repeat with outside click.

### Tests for User Story 2

- [ ] T039 [P] [US2] Write LoginModal onClose callback test in tests/unit/components/shared/LoginModal.test.tsx
- [ ] T040 [P] [US2] Write LoginModal Escape key test in tests/unit/components/shared/LoginModal.test.tsx
- [ ] T041 [P] [US2] Write integration test for closing modal via Escape in tests/integration/auth/login-modal.test.tsx
- [ ] T042 [P] [US2] Write integration test for closing modal via outside click in tests/integration/auth/login-modal.test.tsx
- [ ] T043 [P] [US2] Write E2E test for Escape key dismissal in tests/e2e/login-modal.spec.ts
- [ ] T044 [P] [US2] Write E2E test for outside click dismissal in tests/e2e/login-modal.spec.ts
- [ ] T045 [P] [US2] Write E2E test for focus return to Log In button in tests/e2e/login-modal.spec.ts
- [ ] T046 [US2] Run tests to verify they fail (pnpm test && pnpm test:e2e)

### Implementation for User Story 2

- [ ] T047 [US2] Verify Dialog onOpenChange prop handles Escape key (already implemented via Radix Dialog in src/components/shared/LoginModal.tsx)
- [ ] T048 [US2] Verify Dialog handles outside click dismissal (already implemented via Radix Dialog in src/components/shared/LoginModal.tsx)
- [ ] T049 [US2] Verify Dialog handles focus return (already implemented via Radix Dialog in src/components/shared/LoginModal.tsx)
- [ ] T050 [US2] Run unit tests for dismissal behavior (pnpm test LoginModal.test.tsx)
- [ ] T051 [US2] Run integration tests for dismissal (pnpm test login-modal.test.tsx)
- [ ] T052 [US2] Run E2E tests for dismissal (pnpm test:e2e login-modal.spec.ts)
- [ ] T053 [US2] Manually test: open modal → press Escape → verify close and focus return
- [ ] T054 [US2] Manually test: open modal → click outside → verify close
- [ ] T055 [US2] Manually test: close modal → reopen → verify form state is reset

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - authentication works and dismissal is user-friendly

---

## Phase 5: User Story 3 - Accessible Modal Interaction (Priority: P2)

**Goal**: Ensure modal is fully accessible with proper focus management, ARIA labels, keyboard navigation, and screen reader support

**Independent Test**: Use keyboard-only navigation to open modal, tab through form, submit, and verify focus trap and announcements with screen reader

### Tests for User Story 3

- [ ] T056 [P] [US3] Write test for dialog role attribute in tests/unit/components/shared/LoginModal.test.tsx
- [ ] T057 [P] [US3] Write test for aria-modal attribute in tests/unit/components/shared/LoginModal.test.tsx
- [ ] T058 [P] [US3] Write test for accessible title in tests/unit/components/shared/LoginModal.test.tsx
- [ ] T059 [P] [US3] Write test for accessible description in tests/unit/components/shared/LoginModal.test.tsx
- [ ] T060 [P] [US3] Write E2E test for keyboard navigation (Tab cycles through elements) in tests/e2e/login-modal.spec.ts
- [ ] T061 [P] [US3] Write E2E test for focus trap within modal in tests/e2e/login-modal.spec.ts
- [ ] T062 [US3] Run tests to verify they fail (pnpm test && pnpm test:e2e)

### Implementation for User Story 3

- [ ] T063 [US3] Verify DialogTitle is present for screen reader announcements in src/components/shared/LoginModal.tsx
- [ ] T064 [US3] Verify DialogDescription is present for context in src/components/shared/LoginModal.tsx
- [ ] T065 [US3] Verify Dialog role and aria-modal attributes (provided by Radix Dialog) in src/components/shared/LoginModal.tsx
- [ ] T066 [US3] Verify focus moves to email input on modal open (LoginForm auto-focuses first field) in src/components/shared/LoginModal.tsx
- [ ] T067 [US3] Run unit tests for accessibility (pnpm test LoginModal.test.tsx)
- [ ] T068 [US3] Run E2E tests for keyboard navigation (pnpm test:e2e login-modal.spec.ts)
- [ ] T069 [US3] Manually test keyboard navigation: Tab through all elements, Shift+Tab reverse
- [ ] T070 [US3] Manually test with screen reader (NVDA/JAWS) to verify announcements
- [ ] T071 [US3] Manually test focus trap: verify Tab cycles within modal only
- [ ] T072 [US3] Manually test focus return: close modal and verify focus on Log In button

**Checkpoint**: All user stories should now be independently functional with full accessibility compliance

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [X] T073 [P] Run full test suite with coverage (pnpm test:coverage)
- [X] T074 Verify test coverage meets 65% minimum requirement
- [X] T075 [P] Run linter and fix any issues (pnpm lint)
- [X] T076 [P] Run code formatter (pnpm format)
- [X] T077 Run TypeScript type checking for entire project (pnpm typecheck)
- [X] T078 Run production build to verify no build errors (pnpm build)
- [X] T079 Test on mobile viewport (320px width) - verify modal is scrollable and usable
- [X] T080 Test on tablet viewport (768px width) - verify modal displays correctly
- [X] T081 Test on desktop viewport (1920px width) - verify modal centered and sized appropriately
- [X] T082 Verify standalone /login page still works correctly (regression test)
- [X] T083 Test error handling: enter invalid credentials → verify error displays in modal
- [X] T084 Test error handling: enter invalid email format → verify field error
- [X] T085 Test performance: measure modal open response time (<500ms target)
- [X] T086 [P] Document any deviations from quickstart.md in implementation notes
- [X] T087 Run quickstart.md validation checklist from Step 6
- [ ] T088 Create pull request with comprehensive description referencing spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1 (Dialog handles dismissal automatically)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1/US2 (Dialog provides accessibility automatically)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- LoginModal component before LandingPageClient integration
- Unit tests before integration tests before E2E tests
- Implementation before manual testing
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: Tasks T001-T007 can all run in parallel
- **Phase 2**: Tasks T008-T011 are sequential (same file), but T012-T013 can run in parallel
- **US1 Tests**: Tasks T014-T021 can run in parallel (different test files)
- **US1 Implementation**: Tasks T023-T028 are sequential (same file), T029-T033 are sequential (same file)
- **US2 Tests**: Tasks T039-T045 can run in parallel (different files or sections)
- **US3 Tests**: Tasks T056-T061 can run in parallel (different files or sections)
- **Polish**: Tasks T073-T078 can run in parallel, T079-T087 are sequential

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all test file creation for User Story 1 together:
Task T014: "Create unit test file tests/unit/components/shared/LoginModal.test.tsx"
Task T017: "Create integration test file tests/integration/auth/login-modal.test.tsx"
Task T020: "Create E2E test file tests/e2e/login-modal.spec.ts"

# Write tests in parallel within each file:
Task T015: "Write LoginModal rendering tests"
Task T016: "Write LoginModal accessibility tests"
Task T018: "Write integration test for opening modal"
Task T021: "Write E2E test for complete login flow"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify existing infrastructure)
2. Complete Phase 2: Foundational (modify LoginForm for reusability) **CRITICAL**
3. Complete Phase 3: User Story 1 (core modal login functionality)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - **This is the MVP!**

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~30 min)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! ~1.5 hrs)
3. Add User Story 2 → Test independently → Deploy/Demo (~45 min)
4. Add User Story 3 → Test independently → Deploy/Demo (~45 min)
5. Polish → Final validation → Deploy (~30 min)
6. **Total estimate: ~4 hours** (includes comprehensive testing)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (tests + implementation)
   - Developer B: User Story 2 (tests + implementation) - can start in parallel
   - Developer C: User Story 3 (tests + implementation) - can start in parallel
3. Stories complete and integrate independently
4. Team validates together in Polish phase

---

## Success Criteria Verification

**From spec.md:**

- [ ] **SC-001**: Users can open login modal in under 0.5 seconds (measure in T085)
- [ ] **SC-002**: Complete login flow without page navigation until redirect (verify in T038)
- [ ] **SC-003**: 100% of dismissal methods work (Escape, outside click) (verify in T053-T055)
- [ ] **SC-004**: Modal is fully accessible to keyboard/screen reader users (verify in T069-T072)
- [ ] **SC-005**: Clear error guidance when authentication fails (verify in T083-T084)
- [ ] **SC-006**: Responsive behavior on all viewports 320px-4K (verify in T079-T081)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **DO NOT modify** src/components/ui/dialog.tsx (shadcn/ui component)
- Maintain backward compatibility for standalone /login page throughout
- Focus on simplicity - leverage Radix Dialog's built-in features
- Total estimated time: ~4 hours for experienced developer following quickstart.md
