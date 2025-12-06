---
description: "Task list for Landing Page implementation"
---

# Tasks: Landing Page

**Input**: Design documents from `/specs/001-landing-page/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/, quickstart.md

**Tests**: YES - This feature requires test creation to achieve 70% code coverage as specified in the requirements (SC-004).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project structure**: Single Next.js app with `src/` and `tests/` at repository root
- All paths are absolute from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure preparation and validation

- [x] T001 Verify existing project structure matches plan.md requirements
- [x] T002 Verify Next.js App Router configuration and dependencies are correct

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create `src/app/_components/` directory for collocated private components
- [x] T004 [P] Create test directory structure: `tests/component/landing-page/`, `tests/integration/landing-page/`
- [x] T005 [P] Verify test infrastructure (Vitest, React Testing Library, Playwright) is configured correctly

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - First-Time Visitor Loads Homepage (Priority: P1) 🎯 MVP

**Goal**: Enable first-time visitors to load the YourFavs landing page at the root URL with fast initial render, proper branding display, and zero hydration errors.

**Independent Test**: Navigate to `http://localhost:3000/` in a browser and verify:

- Page renders within 2 seconds
- "YourFavs" heading is visible
- "Curate and share your favorite places" tagline is visible
- No console errors (especially no hydration errors)
- Page works without JavaScript enabled (core content visible)

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US1] Create component test for LandingPageClient rendering in tests/component/landing-page/landing-page-client.test.tsx
- [x] T007 [P] [US1] Create component test for accessibility requirements in tests/component/landing-page/landing-page-client.test.tsx
- [x] T008 [P] [US1] Create E2E test for page load and performance in tests/e2e/landing-page.spec.ts

### Implementation for User Story 1

- [x] T009 [US1] Create LandingPageClient component in src/app/\_components/landing-page-client.tsx
- [x] T010 [US1] Update src/app/page.tsx to use Server Component pattern with metadata and LandingPageClient import
- [x] T011 [US1] Verify no hydration errors by running dev server and checking browser console
- [x] T012 [US1] Run component tests and verify 70%+ coverage for landing page components

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. The landing page loads fast, displays branding correctly, and has no hydration errors.

---

## Phase 4: User Story 2 - Authenticated User Visits Homepage (Priority: P2)

**Goal**: Ensure authenticated users can access the landing page without errors and the page renders appropriately for logged-in users.

**Independent Test**:

1. Log in as a test user
2. Navigate to `http://localhost:3000/`
3. Verify page renders without errors
4. Verify appropriate content displays for logged-in users
5. Verify client-side interactions work smoothly

### Tests for User Story 2

- [x] T013 [P] [US2] Create component test for authenticated user state in tests/component/landing-page/landing-page-auth.test.tsx
- [ ] T014 [P] [US2] Create E2E test for authenticated user flow in tests/e2e/landing-page.spec.ts

### Implementation for User Story 2

- [x] T015 [US2] Enhance LandingPageClient to handle authenticated user state in src/app/\_components/landing-page-client.tsx
- [x] T016 [US2] Add integration test for navigation from landing page when authenticated in tests/integration/landing-page/navigation.test.ts
- [x] T017 [US2] Verify all tests pass for authenticated user scenarios

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Both anonymous and authenticated users can access the landing page successfully.

---

## Phase 5: User Story 3 - User on Different Devices and Browsers (Priority: P3)

**Goal**: Ensure the landing page renders correctly and consistently across various devices (mobile, tablet, desktop) and browsers (Chrome, Firefox, Safari, Edge).

**Independent Test**:

1. Load landing page in multiple browsers (Chrome, Firefox, Safari, Edge)
2. Test on different viewport sizes (mobile: 375px, tablet: 768px, desktop: 1280px)
3. Verify consistent rendering across all platforms
4. Test with JavaScript disabled - core content should still be visible

### Tests for User Story 3

- [x] T018 [P] [US3] Create E2E test for mobile viewport in tests/e2e/landing-page.spec.ts
- [x] T019 [P] [US3] Create E2E test for tablet viewport in tests/e2e/landing-page.spec.ts
- [x] T020 [P] [US3] Create E2E test for desktop viewport in tests/e2e/landing-page.spec.ts
- [x] T021 [P] [US3] Create E2E test for cross-browser compatibility in tests/e2e/landing-page.spec.ts

### Implementation for User Story 3

- [x] T022 [US3] Add responsive design utilities to LandingPageClient in src/app/\_components/landing-page-client.tsx
- [x] T023 [US3] Create component test for responsive breakpoints in tests/component/landing-page/landing-page-responsive.test.tsx
- [x] T024 [US3] Run cross-browser E2E tests and verify all pass
- [x] T025 [US3] Test progressive enhancement (JavaScript disabled scenario)

**Checkpoint**: All user stories should now be independently functional. Landing page works for all user types, on all target devices, and in all target browsers.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure production readiness

- [x] T026 [P] Run full test suite and verify minimum 70% code coverage achieved
- [ ] T027 [P] Run Lighthouse audit and verify performance targets met (< 2s initial render, < 1.5s FCP)
- [ ] T028 [P] Verify WCAG 2.1 Level AA accessibility compliance using automated tools
- [x] T029 [P] Run ESLint and Prettier to ensure code quality standards
- [x] T030 Verify quickstart.md examples work correctly
- [x] T031 Create integration test for navigation to/from landing page in tests/integration/landing-page/navigation.test.ts
- [x] T032 Final E2E test run across all browsers to ensure no regressions
- [x] T033 Verify zero console errors/warnings in production build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after User Story 1 complete - Extends US1 with authenticated state
- **User Story 3 (P3)**: Can start after User Story 1 complete - Adds responsive/cross-browser support to US1

### Within Each User Story

1. Tests MUST be written and FAIL before implementation (TDD approach)
2. Component implementation follows test creation
3. Integration tests verify component works in context
4. E2E tests verify complete user flows
5. Story complete and validated before moving to next priority

### Parallel Opportunities

- **Phase 1**: All tasks can run in parallel (marked [P])
- **Phase 2**: Tasks marked [P] can run in parallel
- **Within User Stories**: All test tasks marked [P] can run in parallel
- **Across User Stories**: After US1 is complete, US2 and US3 can potentially be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all component tests together (after test files created):
Task T006: "Component test for LandingPageClient rendering"
Task T007: "Component test for accessibility requirements"

# Run implementation and testing in quick iterations:
1. Create test file → Run test (should FAIL)
2. Implement component → Run test (should PASS)
3. Add more test cases → Run tests → Refine implementation
```

---

## Parallel Example: User Story 3

```bash
# Launch all viewport tests together:
Task T018: "E2E test for mobile viewport"
Task T019: "E2E test for tablet viewport"
Task T020: "E2E test for desktop viewport"
Task T021: "E2E test for cross-browser compatibility"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (tests → implementation → verification)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Run coverage report, performance audit, accessibility check
6. Ready for review/demo

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Coverage check → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Verify US1 still works → Deploy/Demo
4. Add User Story 3 → Test independently → Verify US1 & US2 still work → Deploy/Demo
5. Polish phase → Final validation → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (tests + implementation)
   - After US1 complete:
     - Developer B: User Story 2 (enhances US1)
     - Developer C: User Story 3 (adds responsive/browser support)
3. Stories complete and integrate independently

---

## Verification Steps

### After Each Task

- [ ] Run relevant tests (unit/component/E2E)
- [ ] Check for TypeScript errors (`pnpm typecheck`)
- [ ] Run linter (`pnpm lint`)
- [ ] Verify in browser (no console errors)

### After Each User Story

- [ ] Run full test suite for that story
- [ ] Check code coverage (should contribute to 70% target)
- [ ] Manual testing of acceptance scenarios from spec.md
- [ ] Verify no regressions in previous stories

### Before Final Completion

- [ ] Full test suite passes (component + integration + E2E)
- [ ] Code coverage ≥ 70%
- [ ] Lighthouse performance score meets targets
- [ ] WCAG accessibility compliance verified
- [ ] Zero console errors/warnings
- [ ] All browsers tested (Chrome, Firefox, Safari, Edge)
- [ ] All viewports tested (mobile, tablet, desktop)
- [ ] Progressive enhancement verified (works without JavaScript)

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD approach**: Write tests first, watch them fail, then implement
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- **Coverage target**: Minimum 70% for landing page components
- **Performance target**: < 2s initial render, < 1.5s FCP
- **Accessibility target**: WCAG 2.1 Level AA compliance
- **Browser support**: Latest 2 versions of Chrome, Firefox, Safari, Edge

---

## Task Count Summary

- **Phase 1 (Setup)**: 2 tasks
- **Phase 2 (Foundational)**: 3 tasks
- **Phase 3 (User Story 1)**: 7 tasks (3 tests + 4 implementation)
- **Phase 4 (User Story 2)**: 5 tasks (2 tests + 3 implementation)
- **Phase 5 (User Story 3)**: 8 tasks (4 tests + 4 implementation)
- **Phase 6 (Polish)**: 8 tasks
- **Total**: 33 tasks

**Test Tasks**: 9 test tasks (27% of total) to achieve 70% code coverage
**Implementation Tasks**: 24 non-test tasks
**Parallel Opportunities**: 15 tasks marked [P] can be parallelized within their phase

---

## File Modifications Summary

### Files to Create

- `src/app/_components/landing-page-client.tsx` - Client Component
- `tests/component/landing-page/landing-page-client.test.tsx` - Component rendering tests
- `tests/component/landing-page/landing-page-auth.test.tsx` - Authenticated user tests
- `tests/component/landing-page/landing-page-responsive.test.tsx` - Responsive design tests
- `tests/e2e/landing-page.spec.ts` - E2E tests for all scenarios
- `tests/integration/landing-page/navigation.test.ts` - Navigation integration tests

### Files to Modify

- `src/app/page.tsx` - Transform to Server Component with metadata and client component import

### Directories to Create

- `src/app/_components/` - Private collocated components
- `tests/component/landing-page/` - Component test directory
- `tests/integration/landing-page/` - Integration test directory

---

**Status**: Ready for implementation
**Estimated Effort**: 2-3 days (1 day MVP with US1, +0.5 day each for US2/US3, +0.5 day polish)
**Risk Level**: Low - straightforward component refactoring with comprehensive testing
