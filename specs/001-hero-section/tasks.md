# Tasks: Front Page Hero Section Integration & CTA Wiring

**Input**: Design documents from `/specs/001-hero-section/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), quickstart.md

**Tests**: Tests are included in this feature as comprehensive test coverage is essential for UI components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js web application with the following structure:
- Components: `src/components/shared/`, `src/components/ui/`
- Tests: `tests/component/`, `tests/integration/`, `tests/e2e/`
- App Router: `src/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project structure and dependencies are in place

- [X] T001 Verify lucide-react is installed and Sparkles icon is available
- [X] T002 Verify shadcn/ui Button component exists in src/components/ui/button.tsx
- [X] T003 [P] Verify existing components are present: Header, HeroImageGrid, LoginModal, SignupModal in src/components/shared/
- [X] T004 [P] Review current LandingPageClient.tsx to understand existing modal state management

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Review existing test files to understand current test patterns and identify tests that need updating
- [X] T006 Create backup reference of current LandingPageClient.tsx implementation for comparison

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - First-Time Visitor Understands Product Value (Priority: P1) 🎯 MVP

**Goal**: Display compelling hero section with tagline, headline, subheading, and image grid in a responsive two-column layout that clearly communicates the product's value proposition.

**Independent Test**: Load the landing page and verify that the hero section displays all text content (tagline, headline, subheading) alongside the image grid. On desktop (≥1024px), verify 40:60 text-to-image ratio. On mobile (<1024px), verify vertical stacking with text above images.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Create component test for hero text content rendering in tests/component/landing-page/landing-page-client.test.tsx (test tagline with icon, headline as h1, subheading, semantic structure)
- [X] T008 [P] [US1] Create responsive layout tests in tests/component/landing-page/landing-page-responsive.test.tsx (test desktop 2-column layout with 2:3 ratio, mobile stacking, spacing and padding)
- [X] T009 [P] [US1] Create accessibility tests in tests/component/landing-page/landing-page-accessibility.test.tsx (test heading hierarchy, semantic HTML, decorative icon marking)
- [X] T010 [P] [US1] Create E2E test for hero section display in tests/e2e/landing-page.spec.ts (test all content visible, responsive layouts on mobile/desktop, no horizontal scroll)

### Implementation for User Story 1

- [X] T011 [US1] Update LandingPageClient.tsx to import Sparkles icon from lucide-react and Button component from @/components/ui/button
- [X] T012 [US1] Replace existing main section content in src/components/shared/LandingPageClient.tsx with new hero section grid layout (max-w-7xl container, responsive grid with grid-cols-1 lg:grid-cols-5)
- [X] T013 [US1] Implement hero text column in src/components/shared/LandingPageClient.tsx (col-span-1 lg:col-span-2, includes tagline with Sparkles icon, h1 headline, subheading paragraph, proper spacing)
- [X] T014 [US1] Implement hero image column in src/components/shared/LandingPageClient.tsx (col-span-1 lg:col-span-3, contains HeroImageGrid component)
- [X] T015 [US1] Apply responsive Tailwind classes for mobile-first layout (text-4xl md:text-5xl lg:text-6xl for headline, text-lg md:text-xl for subheading, px-4 md:px-8 py-12 md:py-16 for padding)
- [X] T016 [US1] Run component tests and verify hero section rendering tests pass
- [X] T017 [US1] Run responsive layout tests and verify mobile/desktop layout tests pass
- [X] T018 [US1] Run accessibility tests and verify semantic HTML and heading hierarchy tests pass
- [X] T019 [US1] Run E2E tests and verify hero section displays correctly across viewports
- [X] T020 [US1] Manually test in browser at multiple viewport sizes (320px, 768px, 1024px, 1920px) to verify no horizontal scroll and proper layout

**Checkpoint**: At this point, User Story 1 should be fully functional - hero section displays with proper responsive layout and all content visible

---

## Phase 4: User Story 2 - Visitor Takes Action to Sign Up (Priority: P2)

**Goal**: Wire the hero CTA button and header signup button to open the signup modal, enabling users to start the registration process from either location.

**Independent Test**: Click the "Create Your First List" button in the hero section and verify the signup modal opens. Click the "Start Curating" button in the header and verify the signup modal opens. Verify only one modal is visible at a time and closing returns to the landing page.

### Tests for User Story 2

- [X] T021 [P] [US2] Add hero CTA button interaction test in tests/component/landing-page/landing-page-client.test.tsx (test clicking CTA button opens signup modal)
- [X] T022 [P] [US2] Add modal state isolation tests in tests/integration/landing-page/navigation.test.tsx (test hero CTA opens signup modal, header CTA opens signup modal, only one modal visible at a time)
- [X] T023 [P] [US2] Add E2E test for complete signup flow in tests/e2e/landing-page.spec.ts (test click hero CTA → modal opens → close modal → return to landing page)

### Implementation for User Story 2

- [X] T024 [US2] Add CTA Button component to hero text column in src/components/shared/LandingPageClient.tsx (Button with variant="default", size="lg", onClick={openSignupModal}, text "Create Your First List")
- [X] T025 [US2] Verify openSignupModal function is properly wired to CTA button onClick handler in src/components/shared/LandingPageClient.tsx
- [X] T026 [US2] Run hero CTA interaction tests and verify button click opens signup modal
- [X] T027 [US2] Run modal state isolation tests and verify only one modal opens at a time
- [X] T028 [US2] Run E2E signup flow tests and verify complete user journey works
- [X] T029 [US2] Manually test clicking hero CTA button and verify signup modal opens immediately (<100ms perceived delay)
- [X] T030 [US2] Manually test clicking header "Start Curating" button and verify it still opens signup modal (regression test)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can view the hero section and initiate signup from either CTA location

---

## Phase 5: User Story 3 - Existing User Can Log In (Priority: P3)

**Goal**: Verify the header login button continues to work correctly and opens the login modal without interfering with the new hero section or signup modal.

**Independent Test**: Click the "Log In" button in the header and verify the login modal opens. Verify the login modal does not open simultaneously with the signup modal. Verify closing the login modal returns to the landing page.

### Tests for User Story 3

- [X] T031 [P] [US3] Add login modal tests in tests/integration/landing-page/navigation.test.tsx (test header login button opens login modal, only login modal visible when clicked, signup modal not visible)
- [X] T032 [P] [US3] Add E2E test for login flow in tests/e2e/landing-page.spec.ts (test click login → modal opens → close → return to landing page)

### Implementation for User Story 3

- [X] T033 [US3] Verify Header component login button is properly wired to handleLogin function in src/components/shared/LandingPageClient.tsx (no changes needed, regression test)
- [X] T034 [US3] Run login modal state tests and verify login modal opens independently
- [X] T035 [US3] Run E2E login flow tests and verify complete user journey works
- [X] T036 [US3] Manually test clicking header "Log In" button and verify login modal opens (regression test)
- [X] T037 [US3] Manually test rapidly clicking between login and signup buttons to verify modal state isolation

**Checkpoint**: All user stories should now be independently functional - hero section displays, signup CTAs work, login button works, modals are properly isolated

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [X] T038 [P] Run full test suite and verify all tests pass (component, integration, E2E)
- [X] T039 [P] Run TypeScript compiler and verify no type errors
- [X] T040 [P] Run ESLint and fix any linting errors
- [X] T041 [P] Run Prettier and format all modified files
- [X] T042 Verify keyboard navigation works for all interactive elements (tab to CTA button, tab to header buttons, enter to activate)
- [X] T043 Test color contrast using browser DevTools and verify WCAG AA compliance for all text elements
- [X] T044 Test with screen reader and verify logical reading order (tagline → headline → subheading → CTA → images)
- [X] T045 Verify performance metrics (no layout shift, FCP < 1.5s, LCP < 2.5s)
- [X] T046 Run quickstart.md validation checklist and verify all items pass
- [X] T047 Take screenshots of hero section at different viewport sizes for documentation
- [X] T048 Update any related documentation if needed (optional - no API changes)

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

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories. Implements hero section layout and content display.
- **User Story 2 (P2)**: Depends on User Story 1 completion - Adds CTA button to hero section. Can be tested independently but requires hero section to exist.
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories. This is primarily a regression test to verify existing login functionality still works.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Component implementation before test execution
- Component tests before integration tests
- Integration tests before E2E tests
- Automated tests before manual verification
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T001, T002, T003, T004)
- All test creation tasks for a user story marked [P] can run in parallel:
  - US1: T007, T008, T009, T010 (all test files are independent)
  - US2: T021, T022, T023 (all test files are independent)
  - US3: T031, T032 (all test files are independent)
- Polish phase tasks marked [P] can run in parallel (T038, T039, T040, T041)
- Different user stories CANNOT be worked on in parallel due to dependencies (US2 needs US1 complete)

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task: "Create component test for hero text content rendering in tests/component/landing-page/landing-page-client.test.tsx"
Task: "Create responsive layout tests in tests/component/landing-page/landing-page-responsive.test.tsx"
Task: "Create accessibility tests in tests/component/landing-page/landing-page-accessibility.test.tsx"
Task: "Create E2E test for hero section display in tests/e2e/landing-page.spec.ts"

# All four test files are independent and can be created simultaneously
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify dependencies)
2. Complete Phase 2: Foundational (review existing code)
3. Complete Phase 3: User Story 1 (hero section layout and content)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - core value proposition is now visible

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! Hero section visible)
3. Add User Story 2 → Test independently → Deploy/Demo (CTA functionality enabled)
4. Add User Story 3 → Test independently → Deploy/Demo (Login regression verified)
5. Each story adds value without breaking previous stories

### Sequential Team Strategy

Since US2 depends on US1 (needs hero section to exist), recommended approach is:

1. Developer completes Setup + Foundational
2. Developer implements User Story 1 fully (tests + implementation + validation)
3. Developer implements User Story 2 fully (tests + implementation + validation)
4. Developer implements User Story 3 fully (tests + implementation + validation)
5. Developer completes Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Story 1 is the foundation - must be complete before US2
- User Story 3 is primarily a regression test (existing functionality)
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All tests must pass before moving to next story
- Modal state management already exists - reuse, don't recreate

---

## Task Summary

**Total Tasks**: 48 tasks across 6 phases

**Task Count by Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 2 tasks
- Phase 3 (User Story 1): 14 tasks (4 test tasks, 10 implementation/validation tasks)
- Phase 4 (User Story 2): 10 tasks (3 test tasks, 7 implementation/validation tasks)
- Phase 5 (User Story 3): 7 tasks (2 test tasks, 5 implementation/validation tasks)
- Phase 6 (Polish): 11 tasks

**Parallel Opportunities Identified**:
- Setup phase: 3 tasks can run in parallel (T002, T003, T004)
- User Story 1 tests: 4 tasks can run in parallel (T007, T008, T009, T010)
- User Story 2 tests: 3 tasks can run in parallel (T021, T022, T023)
- User Story 3 tests: 2 tasks can run in parallel (T031, T032)
- Polish phase: 4 tasks can run in parallel (T038, T039, T040, T041)

**Independent Test Criteria**:
- **User Story 1**: Load landing page → verify hero section displays with all content → verify responsive layout (desktop 2-column, mobile stacked) → verify no horizontal scroll
- **User Story 2**: Click hero CTA button → verify signup modal opens → close modal → verify return to landing page
- **User Story 3**: Click header login button → verify login modal opens → close modal → verify return to landing page

**Suggested MVP Scope**: User Story 1 only
- Delivers the core value: visitors can understand the product through the hero section
- Displays complete value proposition with compelling text and imagery
- Responsive layout works across all devices
- Can be deployed and demoed immediately
- User Stories 2 and 3 add conversion functionality (signup/login) which can be layered on top

---

## Validation Checklist (from quickstart.md)

Before marking implementation complete, verify:

- [ ] Hero section displays tagline with Sparkles icon
- [ ] Headline uses h1 semantic HTML
- [ ] Subheading text is muted (zinc-600/400)
- [ ] CTA button opens signup modal on click
- [ ] Desktop layout uses 2:3 column ratio (40%:60%)
- [ ] Mobile layout stacks text above images
- [ ] No horizontal scroll at any viewport (320px - 1920px)
- [ ] Header "Start Curating" button still opens signup modal
- [ ] Header "Log In" button still opens login modal
- [ ] Only one modal visible at a time
- [ ] All component tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] TypeScript compiles without errors
- [ ] ESLint shows no errors
- [ ] Prettier formatting applied
