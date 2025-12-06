# Tasks: Hero Image Grid Component

**Feature Branch**: `001-hero-image-grid` | **Date**: 2025-12-06  
**Input**: Design documents from `/specs/001-hero-image-grid/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-interface.md, quickstart.md

## Overview

This task list implements the Hero Image Grid component for the landing page. Tasks are organized by user story to enable independent implementation and testing. The component is a server-rendered, responsive grid of 4 placeholder images with optimized loading.

**Tech Stack**: Next.js 16.0.5 (App Router), React 19.2.0, TypeScript 5.x, Tailwind CSS 4.x, Vitest 4.0.14, Playwright 1.57.0

## Format: `- [ ] [ID] [P?] [Story] Description`

- **Checkbox**: `- [ ]` (required for all tasks)
- **[ID]**: Task ID (T001, T002, etc.) in execution order
- **[P]**: Parallelizable (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3) - only for user story phases

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project configuration and prerequisites

- [x] T001 Verify Next.js Image remotePatterns includes placehold.co in next.config.ts
- [x] T002 [P] Verify Tailwind CSS configuration supports responsive grid classes in tailwind.config.ts
- [x] T003 [P] Create test directory structure at tests/component/landing-page/

**Checkpoint**: Project configuration verified - ready for component implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core component structure that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create ImageConfig TypeScript interface in src/components/shared/HeroImageGrid.tsx
- [x] T005 Define GRID_IMAGES constant array with 4 image configurations in src/components/shared/HeroImageGrid.tsx
- [x] T006 Create HeroImageGrid component skeleton (empty function) in src/components/shared/HeroImageGrid.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Visual Landing Experience (Priority: P1) 🎯 MVP

**Goal**: Display an attractive grid of 4 curated place images that showcases content diversity and establishes platform aesthetic identity

**Independent Test**: Load the landing page and verify that 4 placeholder images display correctly with proper arrangement and distinct colors

### Implementation for User Story 1

- [x] T007 [P] [US1] Implement grid container with responsive Tailwind classes in src/components/shared/HeroImageGrid.tsx
- [x] T008 [P] [US1] Map over GRID_IMAGES array to render 4 Image components in src/components/shared/HeroImageGrid.tsx
- [x] T009 [US1] Apply image wrapper divs with gridClasses for positioning in src/components/shared/HeroImageGrid.tsx
- [x] T010 [US1] Configure Next.js Image components with src, alt, width, height, priority props in src/components/shared/HeroImageGrid.tsx
- [x] T011 [US1] Apply rounded corners and object-cover styling to images in src/components/shared/HeroImageGrid.tsx
- [x] T012 [US1] Integrate HeroImageGrid into LandingPageClient above existing heading in src/components/shared/LandingPageClient.tsx
- [x] T013 [US1] Add spacing classes (gap-12, px-4, py-8) to main container in src/components/shared/LandingPageClient.tsx

### Testing for User Story 1

- [x] T014 [P] [US1] Create component test file with rendering test suite in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T015 [P] [US1] Write test: renders 4 images in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T016 [P] [US1] Write test: applies descriptive alt text to all images in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T017 [P] [US1] Write test: uses correct placeholder URLs with color codes in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T018 [P] [US1] Write test: ensures all images have non-empty alt attributes in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T019 [P] [US1] Write test: applies rounded-lg class to all images in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T020 [P] [US1] Write test: applies object-cover class to all images in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T021 [US1] Run component tests and verify all US1 tests pass with pnpm test

**Checkpoint**: User Story 1 complete - 4 images display correctly with proper styling and accessibility

---

## Phase 4: User Story 2 - Responsive Layout Adaptation (Priority: P2)

**Goal**: Automatically adapt grid layout across different devices for optimal viewing experience

**Independent Test**: View landing page at mobile (<768px), tablet (768px), and desktop (>768px) widths and verify layout transitions from single-column to 2-column grid

### Implementation for User Story 2

- [x] T022 [P] [US2] Add mobile-first grid classes (grid-cols-1, gap-4) to container in src/components/shared/HeroImageGrid.tsx
- [x] T023 [P] [US2] Add desktop breakpoint classes (md:grid-cols-2, md:gap-6) to container in src/components/shared/HeroImageGrid.tsx
- [x] T024 [P] [US2] Configure grid rows for desktop layout (md:grid-rows-[auto_auto]) in src/components/shared/HeroImageGrid.tsx
- [x] T025 [P] [US2] Apply library image row span (md:row-span-2) in GRID_IMAGES configuration in src/components/shared/HeroImageGrid.tsx
- [x] T026 [P] [US2] Apply gallery image column span (md:col-span-2) in GRID_IMAGES configuration in src/components/shared/HeroImageGrid.tsx

### Testing for User Story 2

- [x] T027 [P] [US2] Write test: applies grid-cols-1 for mobile layout in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T028 [P] [US2] Write test: applies md:grid-cols-2 for desktop layout in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T029 [P] [US2] Write test: library image has md:row-span-2 class in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T030 [P] [US2] Write test: gallery image has md:col-span-2 class in tests/component/landing-page/hero-image-grid.test.tsx
- [x] T031 [US2] Create E2E test file for landing page hero grid in tests/e2e/landing-page.spec.ts
- [x] T032 [P] [US2] Write E2E test: displays grid correctly on mobile viewport (375px) in tests/e2e/landing-page.spec.ts
- [x] T033 [P] [US2] Write E2E test: displays grid correctly on desktop viewport (1280px) in tests/e2e/landing-page.spec.ts
- [x] T034 [US2] Run component and E2E tests and verify all US2 tests pass

**Checkpoint**: User Story 2 complete - Grid adapts responsively across all device sizes

---

## Phase 5: User Story 3 - Image Loading Performance (Priority: P3)

**Goal**: Load images efficiently using modern optimization techniques for fast page loads on all connections

**Independent Test**: Monitor page loading behavior to verify images are served in optimized formats, appropriate sizes, and that priority images load before off-screen images

### Implementation for User Story 3

- [x] T035 [P] [US3] Set priority: true for coffee image in GRID_IMAGES configuration in src/components/shared/HeroImageGrid.tsx
- [x] T036 [P] [US3] Set priority: true for library image in GRID_IMAGES configuration in src/components/shared/HeroImageGrid.tsx
- [x] T037 [P] [US3] Set priority: false for market image in GRID_IMAGES configuration in src/components/shared/HeroImageGrid.tsx
- [x] T038 [P] [US3] Set priority: false for gallery image in GRID_IMAGES configuration in src/components/shared/HeroImageGrid.tsx
- [x] T039 [US3] Verify Next.js Image component applies priority prop to Image elements in src/components/shared/HeroImageGrid.tsx

### Testing for User Story 3

- [x] T040 [P] [US3] Write E2E test: priority images load with eager loading in tests/e2e/landing-page.spec.ts
- [x] T041 [P] [US3] Write E2E test: non-priority images use lazy loading in tests/e2e/landing-page.spec.ts
- [x] T042 [P] [US3] Write E2E test: prevents layout shift during image loading (CLS < 0.1) in tests/e2e/landing-page.spec.ts
- [x] T043 [US3] Run E2E tests and verify all US3 performance tests pass with pnpm test:e2e

**Checkpoint**: User Story 3 complete - All images load with optimal performance characteristics

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, validation, and documentation

- [x] T044 [P] Run full component test suite and verify minimum 60% code coverage with pnpm test:coverage
- [x] T045 [P] Run full E2E test suite and verify all tests pass with pnpm test:e2e
- [x] T046 [P] Verify accessibility with automated tools (all images have alt text)
- [x] T047 [P] Test visual appearance on mobile (375px), tablet (768px), and desktop (1280px) viewports
- [ ] T048 [P] Verify no layout shift occurs during image loading in browser DevTools
- [ ] T049 [P] Run Lighthouse audit and verify Performance ≥90, Accessibility 100
- [ ] T050 [P] Verify component renders correctly in dark mode
- [x] T051 [P] Run ESLint and verify no errors or warnings with pnpm lint
- [x] T052 [P] Run TypeScript type checking with pnpm type-check
- [ ] T053 Perform manual smoke test following quickstart.md verification checklist
- [ ] T054 Update project documentation if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion - MVP deliverable
- **User Story 2 (Phase 4)**: Depends on US1 completion (builds on existing grid)
- **User Story 3 (Phase 5)**: Depends on US1 completion (optimizes existing images)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - Core grid rendering functionality
- **User Story 2 (P2)**: Depends on US1 - Adds responsive behavior to existing grid
- **User Story 3 (P3)**: Depends on US1 - Adds performance optimization to existing images

**Note**: US2 and US3 could potentially run in parallel after US1 is complete, but sequential execution (P1→P2→P3) is recommended to ensure stability.

### Within Each User Story

- Implementation tasks before testing tasks
- Component tests before E2E tests
- All tests must pass before moving to next story
- Manual verification after automated tests pass

### Parallel Opportunities

**Setup Phase**:
```
T002 (Tailwind config) || T003 (test directories)
```

**User Story 1 - Implementation**:
```
T007 (grid container) || T008 (map images)
```

**User Story 1 - Testing**:
```
T015 || T016 || T017 || T018 || T019 || T020
(All component tests can run in parallel)
```

**User Story 2 - Implementation**:
```
T022 || T023 || T024 || T025 || T026
(All styling updates to different parts)
```

**User Story 2 - Testing**:
```
T027 || T028 || T029 || T030
(Component tests in parallel)

T032 || T033
(E2E viewport tests in parallel)
```

**User Story 3 - Implementation**:
```
T035 || T036 || T037 || T038
(All priority flag updates)
```

**User Story 3 - Testing**:
```
T040 || T041 || T042
(All E2E performance tests)
```

**Polish Phase**:
```
T044 || T045 || T046 || T047 || T048 || T049 || T050 || T051 || T052
(All verification tasks except T053 and T054)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify configuration)
2. Complete Phase 2: Foundational (component skeleton)
3. Complete Phase 3: User Story 1 (basic grid rendering)
4. **STOP and VALIDATE**: Test that 4 images display correctly
5. Deploy/demo basic grid if ready

**Estimated Time**: 2-3 hours

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready (30 min)
2. Add User Story 1 → Test independently → **MVP Deliverable!** (1.5 hours)
3. Add User Story 2 → Test independently → Responsive enhancement (1 hour)
4. Add User Story 3 → Test independently → Performance optimization (1 hour)
5. Polish Phase → Final verification → Production ready (1 hour)

**Total Estimated Time**: 4-6 hours

### Parallel Team Strategy

With multiple developers:

1. Developer A: Complete Setup + Foundational (30 min)
2. Once Foundational done:
   - Developer A: User Story 1 (core grid) [1.5 hours]
3. Once US1 complete:
   - Developer A: User Story 2 (responsive) [1 hour]
   - Developer B: User Story 3 (performance) [1 hour] *(parallel)*
4. Both: Polish phase together [30 min]

**Total Team Time**: ~3 hours

---

## Success Criteria Summary

### From spec.md - Measurable Outcomes

- **SC-001**: ✅ Component renders all 4 images in <2s on broadband (Tasks T007-T011)
- **SC-002**: ✅ Page layout stability (CLS < 0.1) during image loading (Task T042)
- **SC-003**: ✅ 100% accessibility score (all images have alt text) (Tasks T016, T018, T046)
- **SC-004**: ✅ Visual consistency across 320px-1920px viewports (Tasks T022-T026, T032-T033, T047)
- **SC-005**: ✅ Minimum 60% code coverage, all tests pass (Task T044)
- **SC-006**: ✅ Appropriate image sizes reduce bandwidth by 40% on mobile (Next.js Image optimization)
- **SC-007**: ✅ Priority images load before non-priority 90% of time on 3G (Tasks T035-T038, T040-T041)
- **SC-008**: ✅ Integration without changes to existing layout beyond hero section (Tasks T012-T013)

### Verification Methods

- Component tests verify rendering and styling (Vitest + React Testing Library)
- E2E tests verify responsive behavior and performance (Playwright)
- Lighthouse audit verifies performance and accessibility scores
- Manual testing verifies visual appearance across viewports
- Code coverage ensures comprehensive test coverage

---

## Notes

- **[P] tasks** = Can run in parallel (different files or independent changes)
- **[Story] labels** = Map tasks to specific user stories for traceability
- **No "use client" directive** = This is a server component (generates no client JS)
- **placehold.co** = Already configured in next.config.ts remotePatterns
- **Tailwind CSS** = All styling uses utility classes (no custom CSS needed)
- **Tests are included** = Feature spec requests comprehensive test coverage
- Each user story is independently testable
- Stop at any checkpoint to validate story completion
- Commit after each logical group of tasks

---

## Quick Reference

**Files Created**:
- `src/components/shared/HeroImageGrid.tsx` - Main component
- `tests/component/landing-page/hero-image-grid.test.tsx` - Component tests
- `tests/e2e/landing-page.spec.ts` - E2E tests (added to existing file)

**Files Modified**:
- `src/components/shared/LandingPageClient.tsx` - Integration point

**Configuration Files**:
- `next.config.ts` - Verify placehold.co in remotePatterns (already configured)
- `tailwind.config.ts` - Verify grid classes available (standard Tailwind)

**Testing Commands**:
```bash
# Component tests
pnpm test tests/component/landing-page/hero-image-grid.test.tsx

# E2E tests
pnpm test:e2e tests/e2e/landing-page.spec.ts

# All tests
pnpm test && pnpm test:e2e

# Coverage
pnpm test:coverage

# Linting
pnpm lint

# Type checking
pnpm type-check
```

**Development Commands**:
```bash
# Start dev server
pnpm dev

# Visit landing page
open http://localhost:3000
```

---

**Generated**: 2025-12-06  
**Status**: Ready for implementation  
**Next Action**: Start with Phase 1 (Setup) tasks
