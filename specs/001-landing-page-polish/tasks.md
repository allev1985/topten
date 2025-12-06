# Tasks: Landing Page Polish & Accessibility

**Input**: Design documents from `/specs/001-landing-page-polish/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete), quickstart.md (complete)

**Feature Summary**: Polish the responsive design of the landing page across all breakpoints (mobile, tablet, desktop), enhance accessibility for keyboard navigation and assistive technologies, and implement comprehensive E2E test coverage for all critical user flows (signup, login, error handling). This feature makes **minimal surgical changes** to existing components while ensuring they meet modern accessibility and performance standards.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment verification

- [X] T001 Verify Node.js ≥ 20.0.0 and pnpm ≥ 8.0.0 installed on development environment
- [X] T002 Checkout feature branch `001-landing-page-polish` from repository
- [X] T003 Install project dependencies via `pnpm install`
- [X] T004 Start development server via `pnpm dev` and verify landing page loads at http://localhost:3000
- [X] T005 Start Supabase local environment via `pnpm supabase:start` for authentication testing
- [X] T006 Verify existing E2E tests pass via `pnpm test:e2e` (baseline verification)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Review existing component structure in `src/components/shared/` to identify files requiring changes
- [X] T008 Review existing E2E test patterns in `tests/e2e/landing-page.spec.ts` and `tests/e2e/login-modal.spec.ts`
- [X] T009 Verify Playwright configuration in `playwright.config.ts` supports viewport testing at 375px, 768px, 1440px
- [X] T010 Verify shadcn/ui Dialog component in `src/components/ui/dialog.tsx` has `max-h-[90vh] overflow-y-auto` for modal scroll

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Mobile User Signup Journey (Priority: P1) 🎯 MVP

**Goal**: Enable visitors on mobile devices (375px width) to complete the entire signup flow without horizontal scrolling or UI breaking

**Independent Test**: Visit landing page on iPhone SE (375px width), click "Start Curating", fill signup form, verify success confirmation - all without horizontal scroll

**Why MVP**: Mobile-first users represent the largest segment. If landing page doesn't work on mobile, we lose majority of potential users.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [P] [US1] Create E2E test file `tests/e2e/signup-modal.spec.ts` with test suite structure
- [X] T012 [P] [US1] Add test "complete signup flow from landing page" in `tests/e2e/signup-modal.spec.ts` (click "Start Curating", fill form, verify success)
- [X] T013 [P] [US1] Add test "shows error for existing email" in `tests/e2e/signup-modal.spec.ts` (submit duplicate email, verify error message)
- [X] T014 [P] [US1] Add test "mobile viewport - no horizontal scroll" in `tests/e2e/signup-modal.spec.ts` (375px width, verify scrollWidth === clientWidth)
- [X] T015 [P] [US1] Add test "mobile viewport - modal fits in viewport" in `tests/e2e/signup-modal.spec.ts` (375px width, verify modal doesn't overflow)
- [X] T016 [P] [US1] Add test "all buttons meet 44x44px touch targets" in `tests/e2e/signup-modal.spec.ts` (check bounding boxes of all buttons)
- [X] T017 [US1] Run new signup modal tests and verify they FAIL (baseline - tests written before implementation)

### Implementation for User Story 1

- [X] T018 [P] [US1] Add responsive utility classes to `src/components/shared/LandingPageClient.tsx` (mobile spacing with md:, lg:, xl: prefixes)
- [X] T019 [P] [US1] Ensure "Start Curating" button meets 44×44px minimum in `src/components/shared/Header.tsx` (use Button size="lg" variant)
- [X] T020 [P] [US1] Verify SignupModal DialogContent has `max-h-[90vh] overflow-y-auto` in `src/components/shared/SignupModal.tsx`
- [X] T021 [US1] Test signup flow on 375px viewport manually (DevTools) - verify no horizontal scroll
- [X] T022 [US1] Test signup modal on very small viewport (320px × 568px) - verify internal scroll works
- [X] T023 [US1] Run E2E test suite for User Story 1 and verify all tests pass
- [X] T024 [US1] Manual accessibility check with Lighthouse (target: ≥95 score) for mobile viewport

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Mobile signup flow works without issues.

---

## Phase 4: User Story 2 - Desktop User Login Journey (Priority: P1)

**Goal**: Enable returning visitors on desktop (1440px width) to log into their accounts reliably with proper error handling

**Independent Test**: Visit landing page on desktop viewport, click "Log In", enter credentials, verify redirect to dashboard. Test invalid credentials show clear error.

**Why P1**: Existing users need reliable access. Login is critical path that must work flawlessly.

### Tests for User Story 2

- [X] T025 [P] [US2] Add test "complete login flow from landing page" to `tests/e2e/login-modal.spec.ts` (verify redirect to /dashboard)
- [X] T026 [P] [US2] Add test "shows error for invalid credentials" to `tests/e2e/login-modal.spec.ts` (submit wrong password, verify error message)
- [X] T027 [P] [US2] Add test "desktop viewport - optimal layout" to `tests/e2e/login-modal.spec.ts` (1440px width, verify spacing and centering)
- [X] T028 [P] [US2] Add test "modal centers properly on desktop" to `tests/e2e/login-modal.spec.ts` (verify modal position)
- [X] T029 [US2] Run new login modal tests and verify they FAIL (baseline)

### Implementation for User Story 2

- [X] T030 [P] [US2] Add responsive utility classes for desktop layout in `src/components/shared/LandingPageClient.tsx` (xl: prefix for 1440px+)
- [X] T031 [P] [US2] Ensure "Log In" button meets 44×44px minimum in `src/components/shared/Header.tsx` (use Button size="lg" variant)
- [X] T032 [P] [US2] Verify LoginModal DialogContent has proper centering and max-height in `src/components/shared/LoginModal.tsx`
- [X] T033 [US2] Test login flow on 1440px viewport manually - verify proper spacing and layout
- [X] T034 [US2] Test error message display for invalid credentials - verify message is clear and accessible
- [X] T035 [US2] Run E2E test suite for User Story 2 and verify all tests pass
- [X] T036 [US2] Manual accessibility check with Lighthouse for desktop viewport

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Mobile signup and desktop login flows are solid.

---

## Phase 5: User Story 3 - Tablet User Browse and Explore (Priority: P2)

**Goal**: Optimize viewing experience for tablet users (768px width) who are browsing and exploring the landing page

**Independent Test**: Visit landing page on iPad (768px width), navigate through all visual elements, verify optimal layout and readability

**Why P2**: Tablet users represent significant browsing segment. Experience should be comfortable for exploration.

### Tests for User Story 3

- [X] T037 [P] [US3] Add test "tablet viewport - optimal image grid layout" to `tests/e2e/landing-page.spec.ts` (768px width, verify grid heights)
- [X] T038 [P] [US3] Add test "tablet viewport - no horizontal scroll" to `tests/e2e/landing-page.spec.ts` (768px width, scrollWidth === clientWidth)
- [X] T039 [P] [US3] Add test "tablet viewport - proper text readability" to `tests/e2e/landing-page.spec.ts` (768px width, verify font sizes)
- [X] T040 [US3] Run new tablet viewport tests and verify they FAIL (baseline)

### Implementation for User Story 3

- [X] T041 [P] [US3] Add tablet-specific responsive classes to `src/components/shared/LandingPageClient.tsx` (md: prefix for 768px+)
- [X] T042 [P] [US3] Verify HeroImageGrid displays optimally at 768px in `src/components/shared/HeroImageGrid.tsx` (no changes expected per research)
- [X] T043 [US3] Test landing page on 768px viewport manually - verify image grid heights are optimal
- [X] T044 [US3] Test scrolling behavior on tablet - verify smooth experience without layout shift
- [X] T045 [US3] Run E2E test suite for User Story 3 and verify all tests pass

**Checkpoint**: All primary viewports (mobile, desktop, tablet) now have optimized experiences.

---

## Phase 6: User Story 4 - Keyboard-Only Navigation (Priority: P2)

**Goal**: Enable visitors using only keyboard to access all landing page functionality (Tab, Enter, Space, Escape)

**Independent Test**: Navigate entire landing page and complete signup/login flows using only keyboard (no mouse)

**Why P2**: Essential for users with motor disabilities and power users. Ensures inclusive platform.

### Tests for User Story 4

- [X] T046 [P] [US4] Add test "keyboard navigation - tab through header" to `tests/e2e/landing-page.spec.ts` (Tab order: logo → Log In → Start Curating)
- [X] T047 [P] [US4] Add test "keyboard navigation - activate signup with Enter" to `tests/e2e/landing-page.spec.ts` (focus button, press Enter, modal opens)
- [X] T048 [P] [US4] Add test "keyboard navigation - tab through signup form" to `tests/e2e/signup-modal.spec.ts` (Tab cycles through form fields)
- [X] T049 [P] [US4] Add test "keyboard navigation - close modal with Escape" to `tests/e2e/signup-modal.spec.ts` (modal closes, focus returns)
- [X] T050 [P] [US4] Add test "focus indicators visible on all elements" to `tests/e2e/landing-page.spec.ts` (verify focus-visible ring present)
- [X] T051 [US4] Run new keyboard navigation tests and verify they FAIL (baseline)

### Implementation for User Story 4

- [X] T052 [P] [US4] Verify focus indicators on Header buttons in `src/components/shared/Header.tsx` (ensure focus-visible:ring-2 present)
- [X] T053 [P] [US4] Verify focus management in SignupModal in `src/components/shared/SignupModal.tsx` (focus returns to trigger on close)
- [X] T054 [P] [US4] Verify focus management in LoginModal in `src/components/shared/LoginModal.tsx` (focus returns to trigger on close)
- [X] T055 [US4] Add global focus indicator styles to `src/app/globals.css` if Tailwind defaults insufficient (2px ring minimum)
- [X] T056 [US4] Test complete keyboard navigation flow manually - Tab through all elements, activate with Enter/Space
- [X] T057 [US4] Test modal keyboard interactions - Escape closes, focus returns, Tab stays within modal
- [X] T058 [US4] Run E2E test suite for User Story 4 and verify all tests pass

**Checkpoint**: Keyboard navigation fully functional. All interactive elements accessible without mouse.

---

## Phase 7: User Story 5 - Performance-Conscious User (Priority: P3)

**Goal**: Ensure landing page loads quickly and performs smoothly even on slower connections

**Independent Test**: Measure page load speed, visual stability, and interaction responsiveness using performance monitoring tools

**Why P3**: Performance impacts conversion rates. Critical for user satisfaction.

### Tests for User Story 5

- [X] T059 [P] [US5] Add test "performance - Largest Contentful Paint ≤ 2.5s" to `tests/e2e/landing-page.spec.ts` (use Performance API)
- [X] T060 [P] [US5] Add test "performance - Cumulative Layout Shift ≤ 0.1" to `tests/e2e/landing-page.spec.ts` (measure CLS with PerformanceObserver)
- [X] T061 [P] [US5] Add test "performance - page visible within 2 seconds" to `tests/e2e/landing-page.spec.ts` (enhance existing test)
- [X] T062 [P] [US5] Add test "performance - no console errors during load" to `tests/e2e/landing-page.spec.ts` (already exists - verify)
- [X] T063 [US5] Run new performance tests and verify baselines

### Implementation for User Story 5

- [X] T064 [US5] Verify image priority strategy in `src/components/shared/HeroImageGrid.tsx` (first 2 priority, last 2 lazy - no changes needed per research)
- [X] T065 [US5] Verify explicit image dimensions prevent layout shift in `src/components/shared/HeroImageGrid.tsx` (width/height attributes present)
- [X] T066 [US5] Run Lighthouse audit manually - verify LCP ≤ 2.5s, CLS ≤ 0.1, FID < 100ms
- [X] T067 [US5] Run E2E performance tests and verify all pass with acceptable thresholds

**Checkpoint**: Performance targets met. Landing page loads quickly and remains stable.

---

## Phase 8: User Story 6 - Accessibility-Focused User (Priority: P2)

**Goal**: Ensure full accessibility for users with assistive technologies (screen readers, keyboard navigation)

**Independent Test**: Verify keyboard navigation works and automated accessibility testing passes (Lighthouse ≥95)

**Why P2**: Legal requirement and moral imperative. Platform must be usable by everyone.

### Tests for User Story 6

- [X] T068 [P] [US6] Add test "accessibility - all buttons have aria-labels" to `tests/e2e/landing-page.spec.ts` (verify getByRole locators work)
- [X] T069 [P] [US6] Add test "accessibility - form inputs have associated labels" to `tests/e2e/signup-modal.spec.ts` (verify getByLabel locators work)
- [X] T070 [P] [US6] Add test "accessibility - modal has dialog role and aria attributes" to `tests/e2e/signup-modal.spec.ts` (verify getByRole('dialog'))
- [X] T071 [P] [US6] Add test "accessibility - error messages announced" to `tests/e2e/signup-modal.spec.ts` (verify error text visible and accessible)
- [X] T072 [US6] Run new accessibility tests and verify they FAIL (baseline)

### Implementation for User Story 6

- [X] T073 [US6] Verify ARIA attributes on modals in `src/components/shared/SignupModal.tsx` and `src/components/shared/LoginModal.tsx` (role="dialog", aria-modal="true" - Radix UI handles this)
- [X] T074 [US6] Verify form labels in signup/login forms are properly associated with inputs (use getByLabel in tests)
- [X] T075 [US6] Verify error messages are accessible and announced to screen readers
- [X] T076 [US6] Run Lighthouse accessibility audit - target ≥95 score
- [X] T077 [US6] Run E2E accessibility tests and verify all pass

**Checkpoint**: Accessibility compliance achieved. Platform usable by assistive technologies.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements and validation across all user stories

- [X] T078 [P] Update documentation in `specs/001-landing-page-polish/quickstart.md` with any new testing procedures discovered during implementation
- [X] T079 [P] Review all component changes to ensure only minimal surgical changes were made (no logic modifications, only styling/ARIA)
- [X] T080 [P] Verify no modifications were made to `src/components/ui/*` (shadcn/ui components - forbidden by constitution)
- [X] T081 Run complete E2E test suite across all user stories - verify 100% pass rate
- [X] T082 Run Lighthouse audit on all three viewports (375px, 768px, 1440px) - verify ≥95 accessibility score
- [X] T083 Manual validation checklist from `specs/001-landing-page-polish/quickstart.md` (responsive, accessibility, performance)
- [X] T084 Calculate test coverage - verify ≥60% of landing page flows covered
- [X] T085 Review code for any potential security issues (XSS in form inputs, etc.)
- [X] T086 Verify no console errors or hydration warnings in browser DevTools
- [X] T087 Final code review - ensure all changes align with Constitution principles (minimal, maintainable, tested)
- [X] T088 Prepare deployment summary with performance metrics and test coverage results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel if multiple developers available
  - OR sequentially in priority order: US1 (P1) → US2 (P1) → US3 (P2) → US4 (P2) → US6 (P2) → US5 (P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 - Mobile Signup (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 - Desktop Login (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 - Tablet Browse (P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 4 - Keyboard Nav (P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 5 - Performance (P3)**: Can start after Foundational - No dependencies on other stories
- **User Story 6 - Accessibility (P2)**: Can start after Foundational - No dependencies on other stories

**All user stories are INDEPENDENT and can be implemented in parallel**

### Within Each User Story

1. **Tests FIRST** - Write E2E tests and verify they FAIL
2. **Implementation** - Make minimal surgical changes to components
3. **Validation** - Run tests and verify they PASS
4. **Manual Check** - Browser testing and Lighthouse audits

Tasks marked [P] within a user story can run in parallel (different files, no dependencies)

### Parallel Opportunities

**Setup Phase**: Tasks T001-T006 can all run in parallel (different verification steps)

**Foundational Phase**: Tasks T007-T010 can all run in parallel (different review activities)

**User Story 1**: 
- All tests (T011-T016) can be written in parallel
- All implementations (T018-T020) can be done in parallel (different files)

**User Story 2**:
- All tests (T025-T028) can be written in parallel
- All implementations (T030-T032) can be done in parallel (different files)

**User Story 3**:
- All tests (T037-T039) can be written in parallel
- Implementations (T041-T042) can be done in parallel

**User Story 4**:
- All tests (T046-T050) can be written in parallel
- All implementations (T052-T054) can be done in parallel (different files)

**User Story 5**:
- All tests (T059-T062) can be written in parallel

**User Story 6**:
- All tests (T068-T071) can be written in parallel

**Polish Phase**: Tasks T078-T080 can run in parallel (different review activities)

---

## Parallel Example: User Story 1 (Mobile Signup)

```bash
# Step 1: Write all tests in parallel
Parallel Task Group A:
- T011: Create test file structure
- T012: Add "complete signup flow" test
- T013: Add "error for existing email" test
- T014: Add "no horizontal scroll" test
- T015: Add "modal fits viewport" test
- T016: Add "44px touch targets" test

# Step 2: Verify tests fail
Sequential Task:
- T017: Run tests, confirm failures

# Step 3: Implement all fixes in parallel
Parallel Task Group B:
- T018: Update LandingPageClient.tsx (responsive classes)
- T019: Update Header.tsx (button sizes)
- T020: Update SignupModal.tsx (max-height)

# Step 4: Validate (sequential)
Sequential Tasks:
- T021: Manual test 375px viewport
- T022: Manual test 320px viewport
- T023: Run E2E tests (should pass)
- T024: Lighthouse audit
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

**Recommended for fastest time-to-value:**

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T010) - **CRITICAL GATE**
3. Complete Phase 3: User Story 1 - Mobile Signup (T011-T024)
4. **STOP and VALIDATE**: Test US1 independently on mobile devices
5. Complete Phase 4: User Story 2 - Desktop Login (T025-T036)
6. **STOP and VALIDATE**: Test US1 + US2 together across viewports
7. Deploy/demo if ready

**Value delivered**: Core user journeys (signup + login) work flawlessly on mobile and desktop - the two most critical platforms.

### Full Feature Delivery (All User Stories P1 + P2)

1. Complete Phases 1-2 (Setup + Foundational)
2. Complete Phases 3-4 (US1 + US2) - P1 stories
3. **Checkpoint**: MVP functionality complete
4. Complete Phases 5, 6, 8 (US3, US4, US6) - P2 stories (can be done in parallel)
5. Complete Phase 7 (US5) - P3 story (performance measurements)
6. Complete Phase 9 (Polish)

**Value delivered**: Complete, production-ready landing page with full accessibility, responsive design, and performance optimization.

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

- **Developer A**: User Story 1 (Mobile Signup) + User Story 4 (Keyboard Nav)
- **Developer B**: User Story 2 (Desktop Login) + User Story 6 (Accessibility)
- **Developer C**: User Story 3 (Tablet Browse) + User Story 5 (Performance)

All stories integrate seamlessly as they are independently testable and touch different aspects of the same components.

---

## Test Coverage Summary

### Target: ≥60% of critical landing page flows

**Critical Flows Covered**:
1. ✅ Mobile signup journey (US1)
2. ✅ Desktop login journey (US2)
3. ✅ Tablet browsing experience (US3)
4. ✅ Keyboard-only navigation (US4)
5. ✅ Performance benchmarks (US5)
6. ✅ Accessibility compliance (US6)

**Test File Breakdown**:
- `tests/e2e/landing-page.spec.ts` - Extended with responsive, keyboard, performance, accessibility tests (~20 total tests)
- `tests/e2e/signup-modal.spec.ts` - NEW file with signup flow tests (~8 tests)
- `tests/e2e/login-modal.spec.ts` - Extended with error scenarios and desktop layout (~8 total tests)

**Total Test Count**: ~36 E2E tests covering all user stories

**Coverage Calculation**: 
- Landing page user flows: Signup, Login, Browse, Keyboard Nav, Performance, Accessibility = 6 major flows
- All 6 flows have comprehensive test coverage = 100% of identified flows
- Target of 60% exceeded ✅

---

## Success Criteria Validation

### From spec.md - All requirements must be met:

**Responsive Design** (FR-001 through FR-010):
- ✅ Tested at 375px, 768px, 1440px (US1, US2, US3)
- ✅ No horizontal scroll verified (US1, US3)
- ✅ 44×44px touch targets verified (US1)
- ✅ Modals fit in viewport (US1)

**Authentication Flows** (FR-011 through FR-017):
- ✅ Signup flow tested (US1)
- ✅ Login flow tested (US2)
- ✅ Error scenarios tested (US1, US2)

**Performance** (FR-018 through FR-023):
- ✅ LCP ≤ 2.5s tested (US5)
- ✅ CLS ≤ 0.1 tested (US5)
- ✅ FID < 100ms tested (US5)
- ✅ Image lazy loading verified (US5)

**Accessibility** (FR-024 through FR-033):
- ✅ Keyboard navigation tested (US4)
- ✅ Focus indicators verified (US4)
- ✅ ARIA attributes verified (US6)
- ✅ Lighthouse score ≥95 verified (US6)

**Testing Coverage** (FR-040 through FR-045):
- ✅ Signup flow automated (US1)
- ✅ Login flow automated (US2)
- ✅ Error scenarios automated (US1, US2)
- ✅ Responsive tests automated (US1, US2, US3)
- ✅ Keyboard tests automated (US4)
- ✅ 60%+ coverage achieved

---

## File Modification Summary

**Files to Modify** (minimal surgical changes only):

1. `src/components/shared/LandingPageClient.tsx` - Add responsive utility classes (md:, lg:, xl: prefixes)
2. `src/components/shared/Header.tsx` - Ensure Button size="lg" for 44×44px touch targets
3. `src/components/shared/SignupModal.tsx` - Verify DialogContent max-h-[90vh] overflow-y-auto
4. `src/components/shared/LoginModal.tsx` - Verify DialogContent max-h-[90vh] overflow-y-auto
5. `src/app/globals.css` - Add global focus indicator styles if needed (conditional)

**Files to Create**:

1. `tests/e2e/signup-modal.spec.ts` - NEW E2E test file for signup flow

**Files to Extend**:

1. `tests/e2e/landing-page.spec.ts` - Add responsive, keyboard, performance, accessibility tests
2. `tests/e2e/login-modal.spec.ts` - Add error scenarios and desktop layout tests

**Files NOT to Modify** (forbidden):

❌ `src/components/ui/*` - shadcn/ui generated components (Constitution violation)
❌ Component logic or state management
❌ Authentication API calls
❌ Image content or sources

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story] Description with file path`
- Tasks marked [P] can run in parallel (different files, no dependencies within phase)
- Tasks marked [Story] map to user stories: US1, US2, US3, US4, US5, US6
- Each user story is independently completable and testable
- Tests written FIRST (TDD approach), verify FAIL before implementation
- Commit after each logical task group
- Stop at checkpoints to validate story independently
- All changes are minimal and surgical - no framework code modifications
- Focus on composition over modification for shadcn/ui components

---

**Tasks Status**: ✅ **READY FOR IMPLEMENTATION**

**Recommended Start**: Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (User Story 1 - MVP)

**Total Tasks**: 88 tasks across 9 phases

**Estimated Effort**: 
- MVP (US1 + US2): ~24 tasks, ~2-3 days
- Full Feature (All US): ~88 tasks, ~5-7 days
- With 3 developers in parallel: ~2-3 days for full feature
