---
description: "Task list for Header component implementation"
---

# Tasks: Landing Page Header Component

**Input**: Design documents from `/specs/001-header-component/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, contracts/header-component-api.md, quickstart.md

**Tests**: This feature includes comprehensive component tests as specified in the user stories and success criteria. Tests will be written alongside implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js web application with:
- Components: `src/components/shared/` and `src/components/ui/`
- Tests: `tests/component/header/`
- Integration tests: `tests/component/landing-page/`

---

## Phase 1: Setup (Component Infrastructure)

**Purpose**: Prepare the environment for Header component development

- [x] T001 Create test directory structure at tests/component/header/
- [x] T002 Verify lucide-react package is available (MapPin icon dependency)
- [x] T003 Verify shadcn/ui Button component exists at src/components/ui/button.tsx

---

## Phase 2: Foundational (N/A)

**Purpose**: No foundational tasks required - all dependencies already exist in the codebase

**Status**: SKIPPED - All required infrastructure (Next.js, React, Button component, icons) already available

---

## Phase 3: User Story 1 - View Brand Identity and Navigation (Priority: P1) 🎯 MVP

**Goal**: Display professional header with YourFavs logo (MapPin icon in orange circle + text) and two action buttons ("Log In" subtle, "Start Curating" prominent)

**Independent Test**: Load landing page and verify header renders with all visual elements (logo, buttons) visible and properly styled

### Implementation for User Story 1

- [x] T004 [US1] Create Header component with props interface in src/components/shared/Header.tsx
- [x] T005 [US1] Implement logo section with Next.js Link, MapPin icon in orange circle, and "YourFavs" text in src/components/shared/Header.tsx
- [x] T006 [US1] Implement action buttons section with "Log In" (ghost variant) and "Start Curating" (default variant) in src/components/shared/Header.tsx
- [x] T007 [US1] Apply responsive layout with flexbox and horizontal padding in src/components/shared/Header.tsx

### Tests for User Story 1

- [x] T008 [P] [US1] Create rendering test file to verify brand identity elements in tests/component/header/header-rendering.test.tsx
- [x] T009 [P] [US1] Add test: renders YourFavs logo with MapPin icon and text in tests/component/header/header-rendering.test.tsx
- [x] T010 [P] [US1] Add test: displays both action buttons with correct labels in tests/component/header/header-rendering.test.tsx
- [x] T011 [P] [US1] Add test: renders header as banner landmark element in tests/component/header/header-rendering.test.tsx
- [x] T012 [P] [US1] Add test: applies correct styling for visual hierarchy in tests/component/header/header-rendering.test.tsx

**Checkpoint**: Header component renders with brand identity and buttons. Tests verify visual structure and styling.

---

## Phase 4: User Story 2 - Navigate Home (Priority: P2)

**Goal**: Logo functions as clickable link to homepage with visual feedback

**Independent Test**: Click logo and verify navigation to root path ('/'), independent of authentication functionality

### Implementation for User Story 2

- [x] T013 [US2] Add aria-label and hover styling to logo Link in src/components/shared/Header.tsx
- [x] T014 [US2] Verify Link href points to "/" for homepage navigation in src/components/shared/Header.tsx

### Tests for User Story 2

- [x] T015 [P] [US2] Create navigation test file for logo click behavior in tests/component/header/header-navigation.test.tsx
- [x] T016 [P] [US2] Add test: logo renders as clickable link to homepage in tests/component/header/header-navigation.test.tsx
- [x] T017 [P] [US2] Add test: provides visual feedback when logo is hovered in tests/component/header/header-navigation.test.tsx
- [x] T018 [P] [US2] Add test: logo link is keyboard accessible in tests/component/header/header-navigation.test.tsx

**Checkpoint**: Logo navigation works with visual hover feedback and accessibility support.

---

## Phase 5: User Story 3 - Initiate Authentication Flow (Priority: P1)

**Goal**: Buttons trigger appropriate callbacks when clicked (login or signup)

**Independent Test**: Simulate button clicks and verify appropriate callbacks are invoked

### Implementation for User Story 3

- [x] T019 [US3] Wire onClick handlers to onLogin and onSignup props for respective buttons in src/components/shared/Header.tsx

### Tests for User Story 3

- [x] T020 [P] [US3] Create actions test file for button click behavior in tests/component/header/header-actions.test.tsx
- [x] T021 [P] [US3] Add test: triggers login action when Log In button is clicked in tests/component/header/header-actions.test.tsx
- [x] T022 [P] [US3] Add test: triggers signup action when Start Curating button is clicked in tests/component/header/header-actions.test.tsx
- [x] T023 [P] [US3] Add test: triggers login action with Enter key on Log In button in tests/component/header/header-actions.test.tsx
- [x] T024 [P] [US3] Add test: triggers signup action with Enter key on Start Curating button in tests/component/header/header-actions.test.tsx

**Checkpoint**: Authentication buttons successfully trigger appropriate callbacks with mouse and keyboard.

---

## Phase 6: User Story 4 - Accessible Navigation (Priority: P2)

**Goal**: All header elements are keyboard accessible and properly labeled for screen readers

**Independent Test**: Navigate header using only keyboard (Tab, Enter) and verify all elements are reachable and properly announced

### Implementation for User Story 4

- [x] T025 [US4] Add aria-hidden="true" to MapPin icon (decorative) in src/components/shared/Header.tsx
- [x] T026 [US4] Verify proper semantic HTML (header element, proper ARIA labels) in src/components/shared/Header.tsx

### Tests for User Story 4

- [x] T027 [P] [US4] Create accessibility test file for keyboard navigation in tests/component/header/header-accessibility.test.tsx
- [x] T028 [P] [US4] Add test: all interactive elements keyboard accessible in logical order in tests/component/header/header-accessibility.test.tsx
- [x] T029 [P] [US4] Add test: logo link has descriptive accessible label in tests/component/header/header-accessibility.test.tsx
- [x] T030 [P] [US4] Add test: buttons have clear accessible labels in tests/component/header/header-accessibility.test.tsx
- [x] T031 [P] [US4] Add test: header identified as banner landmark in tests/component/header/header-accessibility.test.tsx
- [x] T032 [P] [US4] Add test: activating buttons with Space key triggers actions in tests/component/header/header-accessibility.test.tsx

**Checkpoint**: All accessibility requirements met - keyboard navigation, screen reader support, focus management.

---

## Phase 7: Integration & Polish

**Purpose**: Integrate Header into landing page and finalize implementation

### Integration Tasks

- [x] T033 Import Header component in src/components/shared/LandingPageClient.tsx
- [x] T034 Create handleLogin placeholder function in src/components/shared/LandingPageClient.tsx
- [x] T035 Create handleSignup placeholder function in src/components/shared/LandingPageClient.tsx
- [x] T036 Render Header at top of page layout in src/components/shared/LandingPageClient.tsx

### Existing Test Updates

- [x] T037 [P] Update landing page auth tests to verify Header presence in tests/component/landing-page/landing-page-auth.test.tsx
- [x] T038 [P] Update landing page responsive tests if needed in tests/component/landing-page/landing-page-responsive.test.tsx
- [x] T039 [P] Update landing page accessibility tests to account for Header in tests/component/landing-page/landing-page-accessibility.test.tsx

### Final Validation

- [x] T040 Run all header component tests: pnpm test tests/component/header
- [x] T041 Run test coverage check (verify >65% coverage): pnpm test:coverage tests/component/header
- [x] T042 Run full test suite to ensure no regressions: pnpm test
- [x] T043 Run TypeScript type check: pnpm typecheck
- [x] T044 Run linter: pnpm lint
- [ ] T045 Manual testing using quickstart.md checklist (visual, interaction, keyboard, responsive, accessibility)
- [ ] T046 Verify all success criteria from spec.md are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: SKIPPED - no foundational tasks needed
- **User Story 1 (Phase 3)**: Depends on Setup completion - Core header structure
- **User Story 2 (Phase 4)**: Depends on User Story 1 - Logo must exist to add navigation
- **User Story 3 (Phase 5)**: Depends on User Story 1 - Buttons must exist to add click handlers
- **User Story 4 (Phase 6)**: Depends on User Story 1 - Elements must exist to add accessibility
- **Integration (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) - FOUNDATIONAL for all other stories
- **User Story 2 (P2)**: Depends on User Story 1 (logo must exist) - Can run in parallel with US3, US4
- **User Story 3 (P1)**: Depends on User Story 1 (buttons must exist) - Can run in parallel with US2, US4
- **User Story 4 (P2)**: Depends on User Story 1 (interactive elements must exist) - Can run in parallel with US2, US3

### Within Each User Story

- Implementation tasks before test tasks is acceptable (tests can be written alongside)
- Test files can be created in parallel (marked with [P])
- Individual test cases within a file are sequential
- User Story 1 MUST complete before User Stories 2, 3, 4 can begin

### Parallel Opportunities

- **Setup Phase**: T001, T002, T003 can run in parallel (different validation tasks)
- **User Story 1 Tests**: T008-T012 can be created in parallel (different test files/concerns)
- **User Story 2 Tests**: T015-T018 can be created in parallel (same file but independent tests)
- **User Story 3 Tests**: T020-T024 can be created in parallel (same file but independent tests)
- **User Story 4 Tests**: T027-T032 can be created in parallel (same file but independent tests)
- **After US1 Complete**: User Stories 2, 3, and 4 can be worked on in parallel by different developers
- **Integration Phase**: T037-T039 can run in parallel (updating different test files)

---

## Parallel Example: User Story 1 (MVP Foundation)

```bash
# After Setup Phase completes, implement core header structure:
# Sequential (single developer):
1. T004 - Create component structure
2. T005 - Add logo section
3. T006 - Add button section
4. T007 - Apply layout/styling

# Then launch all tests in parallel:
Task T008: "Create rendering test file" (new file)
Task T009: "Add test: renders logo" (same file as T008)
Task T010: "Add test: displays buttons" (same file as T008)
Task T011: "Add test: header landmark" (same file as T008)
Task T012: "Add test: visual hierarchy" (same file as T008)
```

## Parallel Example: After User Story 1 Complete

```bash
# Once US1 is complete, these can run in parallel:
Developer A: User Story 2 (T013-T018) - Logo navigation
Developer B: User Story 3 (T019-T024) - Button actions
Developer C: User Story 4 (T025-T032) - Accessibility
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 3: User Story 1 (T004-T012)
3. **STOP and VALIDATE**: Test User Story 1 independently (header renders with all elements)
4. Demo header in isolation before proceeding

### Incremental Delivery

1. Complete Setup → Foundation ready
2. Add User Story 1 (P1) → Test independently → Visual header with buttons ✅ MVP!
3. Add User Story 2 (P2) → Test independently → Logo navigation works
4. Add User Story 3 (P1) → Test independently → Authentication buttons functional
5. Add User Story 4 (P2) → Test independently → Full accessibility support
6. Integration (Phase 7) → Complete feature deployed

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup together (T001-T003)
2. Single developer completes User Story 1 (T004-T012) - BLOCKS other stories
3. Once US1 is done, parallelize:
   - Developer A: User Story 2 (Logo navigation)
   - Developer B: User Story 3 (Button actions)
   - Developer C: User Story 4 (Accessibility)
4. Team converges for Integration (Phase 7)
5. Stories integrate cleanly since they modify different aspects of same component

---

## Success Criteria Validation

Each task maps to success criteria from spec.md:

- **SC-001** (Brand visible in 1s): T004-T007, T008-T012
- **SC-002** (Buttons locatable in 2s): T006, T010
- **SC-003** (100% keyboard accessible): T025-T032
- **SC-004** (Cross-browser consistency): T007, T012 (Tailwind CSS)
- **SC-005** (100% button reliability): T019, T021-T024
- **SC-006** (100% logo navigation): T013-T014, T016-T018
- **SC-007** (>65% test coverage): All test tasks T008-T032, validated by T041
- **SC-008** (Screen reader accessible): T025-T026, T029-T031

---

## Notes

- [P] tasks = different files or independent concerns, no sequential dependencies
- [Story] label maps task to specific user story for traceability
- User Story 1 is foundational - all other stories depend on it completing first
- User Stories 2, 3, 4 can run in parallel after US1 completes
- Tests are comprehensive (4 test files, ~15+ test cases) to achieve >85% coverage
- Commit after each user story phase or logical grouping
- Stop at any checkpoint to validate story independently
- Integration phase is straightforward - just wire up the completed component

## Estimated Timeline

- **Phase 1 (Setup)**: 10 minutes
- **Phase 3 (User Story 1)**: 90-120 minutes (core component + tests)
- **Phase 4 (User Story 2)**: 30-40 minutes (navigation + tests)
- **Phase 5 (User Story 3)**: 30-40 minutes (actions + tests)
- **Phase 6 (User Story 4)**: 30-40 minutes (accessibility + tests)
- **Phase 7 (Integration)**: 30-40 minutes (wire up + validation)

**Total**: 3.5-5 hours for complete implementation with comprehensive testing

**MVP (US1 only)**: 1.5-2 hours for basic header rendering
