# Tasks: Dashboard Sidebar with Interactive Navigation

**Feature**: Dashboard Sidebar with Interactive Navigation  
**Input**: Design documents from `/specs/001-dashboard-sidebar/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: This feature requires tests (per FR-023 and FR-024 in spec.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js App Router web application with the following structure:
- Source code: `src/` at repository root
- Tests: `tests/` at repository root
- Components: `src/components/dashboard/`
- Server actions: `src/actions/`
- Dashboard pages: `src/app/(dashboard)/dashboard/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No additional setup required - project structure already exists from dashboard foundation feature

- [ ] T001 Verify required dependencies are installed (lucide-react icons, shadcn/ui Button and Sheet components)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Create signOutAction server action in src/actions/auth-actions.ts
- [ ] T003 [P] Verify existing /api/auth/logout endpoint is functional for sign-out flow

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Navigate Between List Views (Priority: P1) 🎯 MVP

**Goal**: Enable users to filter their lists by clicking navigation options in the sidebar (All Lists, Published, Drafts). The active filter is visually indicated and the URL updates with the correct filter parameter.

**Independent Test**: Click each filter option ("All Lists", "Published", "Drafts") and verify the URL updates with the correct filter parameter and that the active state is visually indicated.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T004 [P] [US1] Create test file tests/component/dashboard/DashboardSidebar.test.tsx with test setup and mocks
- [ ] T005 [P] [US1] Write test: sidebar renders all navigation items (All Lists, Published, Drafts) in tests/component/dashboard/DashboardSidebar.test.tsx
- [ ] T006 [P] [US1] Write test: active filter is highlighted based on URL search params in tests/component/dashboard/DashboardSidebar.test.tsx
- [ ] T007 [P] [US1] Write test: clicking filter updates URL with correct parameter in tests/component/dashboard/DashboardSidebar.test.tsx

### Implementation for User Story 1

- [ ] T008 [US1] Update DashboardSidebar component in src/components/dashboard/DashboardSidebar.tsx to add navigation section with collapsible Lists section
- [ ] T009 [US1] Add filter navigation items (All Lists, Published, Drafts) with Link components and icons in src/components/dashboard/DashboardSidebar.tsx
- [ ] T010 [US1] Implement active state detection using useSearchParams in src/components/dashboard/DashboardSidebar.tsx
- [ ] T011 [US1] Add data-active attributes and conditional styling for active filter in src/components/dashboard/DashboardSidebar.tsx
- [ ] T012 [US1] Verify all User Story 1 tests pass with npm test

**Checkpoint**: At this point, User Story 1 should be fully functional - users can navigate between list views with visual feedback

---

## Phase 4: User Story 2 - Expand/Collapse Lists Section (Priority: P2)

**Goal**: Allow users to collapse the Lists section to reduce visual clutter and expand it again when needed. The Lists section is expanded by default for easy access.

**Independent Test**: Click the Lists section header to toggle between expanded and collapsed states. On page load, verify the section is expanded by default.

### Tests for User Story 2

- [ ] T013 [P] [US2] Write test: Lists section is expanded by default on page load in tests/component/dashboard/DashboardSidebar.test.tsx
- [ ] T014 [P] [US2] Write test: clicking Lists header collapses the section in tests/component/dashboard/DashboardSidebar.test.tsx
- [ ] T015 [P] [US2] Write test: clicking collapsed Lists header expands the section in tests/component/dashboard/DashboardSidebar.test.tsx

### Implementation for User Story 2

- [ ] T016 [US2] Add collapsible state management with useState(true) for Lists section in src/components/dashboard/DashboardSidebar.tsx
- [ ] T017 [US2] Implement toggle handler for Lists section header click in src/components/dashboard/DashboardSidebar.tsx
- [ ] T018 [US2] Add ChevronDown icon with rotation animation based on expanded state in src/components/dashboard/DashboardSidebar.tsx
- [ ] T019 [US2] Add conditional rendering of filter options based on expanded state in src/components/dashboard/DashboardSidebar.tsx
- [ ] T020 [US2] Verify all User Story 2 tests pass with npm test

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - navigation works and sections can collapse

---

## Phase 5: User Story 3 - Sign Out from Dashboard (Priority: P1)

**Goal**: Provide users with a secure way to log out of their account from the dashboard. Clicking the Sign Out button terminates their session and redirects them to the home page.

**Independent Test**: Click the Sign Out button and verify that the user is logged out and redirected to the home page.

### Tests for User Story 3

- [ ] T021 [P] [US3] Write test: Sign Out button renders in sidebar in tests/component/dashboard/DashboardSidebar.test.tsx
- [ ] T022 [P] [US3] Write test: clicking Sign Out calls signOutAction in tests/component/dashboard/DashboardSidebar.test.tsx
- [ ] T023 [P] [US3] Write test: Sign Out shows loading state during sign-out in tests/component/dashboard/DashboardSidebar.test.tsx
- [ ] T024 [P] [US3] Write test: Sign Out handles errors gracefully in tests/component/dashboard/DashboardSidebar.test.tsx

### Implementation for User Story 3

- [ ] T025 [US3] Import signOutAction in src/components/dashboard/DashboardSidebar.tsx
- [ ] T026 [US3] Add Sign Out button with LogOut icon at bottom of sidebar in src/components/dashboard/DashboardSidebar.tsx
- [ ] T027 [US3] Implement handleSignOut async function with loading state in src/components/dashboard/DashboardSidebar.tsx
- [ ] T028 [US3] Add error handling for failed sign-out attempts in src/components/dashboard/DashboardSidebar.tsx
- [ ] T029 [US3] Verify all User Story 3 tests pass with npm test

**Checkpoint**: All critical user stories (P1) are now complete - users can navigate, filter, and sign out

---

## Phase 6: User Story 4 - View Dashboard Header and Initiate List Creation (Priority: P2)

**Goal**: Display a clear page heading confirming users are in the lists management area, with quick access to create a new list via a prominent button in the header.

**Independent Test**: Verify the header displays "My Lists" heading and subtitle, and that clicking "+ New List" logs to the console.

### Tests for User Story 4

- [ ] T030 [P] [US4] Create test file tests/component/dashboard/DashboardHeader.test.tsx with test setup
- [ ] T031 [P] [US4] Write test: header renders "My Lists" heading (h1) in tests/component/dashboard/DashboardHeader.test.tsx
- [ ] T032 [P] [US4] Write test: header renders subtitle text in tests/component/dashboard/DashboardHeader.test.tsx
- [ ] T033 [P] [US4] Write test: "+ New List" button renders and is clickable in tests/component/dashboard/DashboardHeader.test.tsx
- [ ] T034 [P] [US4] Write test: clicking "+ New List" logs to console in tests/component/dashboard/DashboardHeader.test.tsx
- [ ] T035 [P] [US4] Write test: header layout is responsive on mobile in tests/component/dashboard/DashboardHeader.test.tsx

### Implementation for User Story 4

- [ ] T036 [P] [US4] Create DashboardHeader component in src/components/dashboard/DashboardHeader.tsx
- [ ] T037 [US4] Add "My Lists" h1 heading and subtitle in src/components/dashboard/DashboardHeader.tsx
- [ ] T038 [US4] Add "+ New List" button with Plus icon and console.log handler in src/components/dashboard/DashboardHeader.tsx
- [ ] T039 [US4] Implement responsive layout with flexbox for mobile/desktop in src/components/dashboard/DashboardHeader.tsx
- [ ] T040 [US4] Import and render DashboardHeader in src/app/(dashboard)/dashboard/page.tsx
- [ ] T041 [US4] Verify all User Story 4 tests pass with npm test

**Checkpoint**: Dashboard now has complete navigation and a clear header with action button

---

## Phase 7: User Story 5 - Access Settings (Priority: P3)

**Goal**: Provide a Settings link in the sidebar for future implementation. The link is visible but non-functional as the settings route doesn't exist yet.

**Independent Test**: Verify the Settings link is visible in the sidebar.

### Implementation for User Story 5

- [ ] T042 [US5] Add Settings link with Settings icon in src/components/dashboard/DashboardSidebar.tsx
- [ ] T043 [US5] Position Settings link between Lists section and Sign Out button in src/components/dashboard/DashboardSidebar.tsx
- [ ] T044 [US5] Add visual styling consistent with navigation items in src/components/dashboard/DashboardSidebar.tsx

**Checkpoint**: All user stories are now complete

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality improvements

- [ ] T045 [P] Run full test suite with npm test and verify all tests pass
- [ ] T046 [P] Check test coverage with npm test:coverage and verify ≥65% coverage for new components
- [ ] T047 Validate implementation against quickstart.md checklist
- [ ] T048 Test responsive design on mobile viewport (320px width)
- [ ] T049 Test keyboard navigation (Tab, Enter, Space keys)
- [ ] T050 Verify filter state persists when bookmarking URL with filter parameter
- [ ] T051 Test sign-out flow on different browsers (Chrome, Firefox, Safari)
- [ ] T052 Verify accessibility with screen reader (VoiceOver/NVDA)
- [ ] T053 Validate performance targets: filter update <200ms, collapse animation <100ms, sign-out <2s

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 but independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Independent from US1/US2
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Independent component, no dependencies
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent addition to sidebar

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation tasks for each story can proceed sequentially
- Story complete and tested before moving to next priority

### Parallel Opportunities

#### Phase 1 (Setup)
- Only 1 task (verification) - no parallelism

#### Phase 2 (Foundational)
- T002 (signOutAction) can run in parallel with T003 (verify logout endpoint)

#### Phase 3 (User Story 1)
- All test tasks (T004-T007) marked [P] can run in parallel
- Implementation tasks run sequentially (T008-T012)

#### Phase 4 (User Story 2)
- All test tasks (T013-T015) marked [P] can run in parallel
- Implementation tasks run sequentially (T016-T020)

#### Phase 5 (User Story 3)
- All test tasks (T021-T024) marked [P] can run in parallel
- Implementation tasks run sequentially (T025-T029)

#### Phase 6 (User Story 4)
- All test tasks (T030-T035) marked [P] can run in parallel
- T036 (create component) can run in parallel with T040 (update page)
- Other implementation tasks run sequentially (T037-T041)

#### Phase 7 (User Story 5)
- All implementation tasks (T042-T044) run sequentially on same file

#### Phase 8 (Polish)
- T045 (test suite) and T046 (coverage) marked [P] can run in parallel
- Manual validation tasks (T047-T053) can be distributed across team members

### Parallel Execution: After Foundational Phase

Once Phase 2 completes, different team members can work on different user stories simultaneously:

```bash
# Developer A: User Story 1 (P1 - Critical)
Phase 3: T004-T012

# Developer B: User Story 3 (P1 - Critical)  
Phase 5: T021-T029

# Developer C: User Story 4 (P2)
Phase 6: T030-T041

# After P1 stories complete:
# Developer D: User Story 2 (P2)
Phase 4: T013-T020

# Developer E: User Story 5 (P3)
Phase 7: T042-T044
```

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
T004: "Create test file tests/component/dashboard/DashboardSidebar.test.tsx with test setup and mocks"
T005: "Write test: sidebar renders all navigation items (All Lists, Published, Drafts)"
T006: "Write test: active filter is highlighted based on URL search params"
T007: "Write test: clicking filter updates URL with correct parameter"

# Then proceed with implementation sequentially:
T008: "Update DashboardSidebar component in src/components/dashboard/DashboardSidebar.tsx"
T009: "Add filter navigation items with Link components and icons"
T010: "Implement active state detection using useSearchParams"
T011: "Add data-active attributes and conditional styling"
T012: "Verify all User Story 1 tests pass"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T003) - CRITICAL
3. Complete Phase 3: User Story 1 (T004-T012) - Navigation
4. Complete Phase 5: User Story 3 (T021-T029) - Sign Out
5. **STOP and VALIDATE**: Test US1 and US3 independently
6. Deploy/demo if ready - this gives users core navigation and security

### Incremental Delivery (Recommended)

1. **Foundation** → Complete Phase 1 + Phase 2 → Foundation ready
2. **MVP** → Add US1 (Navigation) + US3 (Sign Out) → Test independently → Deploy/Demo 🎯
3. **Enhanced UX** → Add US2 (Collapse) + US4 (Header) → Test independently → Deploy/Demo
4. **Complete** → Add US5 (Settings) → Polish (Phase 8) → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. **Together**: Complete Setup (Phase 1) + Foundational (Phase 2)
2. **Once Foundational is done:**
   - Developer A: User Story 1 (P1 - Navigation) - Phases 3
   - Developer B: User Story 3 (P1 - Sign Out) - Phase 5
   - Developer C: User Story 4 (P2 - Header) - Phase 6
3. **After P1 stories complete:**
   - Developer D: User Story 2 (P2 - Collapse) - Phase 4
   - Developer E: User Story 5 (P3 - Settings) - Phase 7
4. **All together**: Polish & Validation (Phase 8)

---

## Implementation Notes

### File Modifications Summary

**New Files**:
- `src/components/dashboard/DashboardHeader.tsx` - Header component with title and CTA button
- `tests/component/dashboard/DashboardSidebar.test.tsx` - ~80 lines of sidebar tests
- `tests/component/dashboard/DashboardHeader.test.tsx` - ~60 lines of header tests

**Modified Files**:
- `src/actions/auth-actions.ts` - Add signOutAction server action
- `src/components/dashboard/DashboardSidebar.tsx` - Enhanced with navigation, collapsible sections, sign out
- `src/app/(dashboard)/dashboard/page.tsx` - Add DashboardHeader component

**No Database Changes**: This feature operates entirely with client-side state and existing authentication infrastructure

### Key Patterns

1. **Client Components**: DashboardSidebar and DashboardHeader need `'use client'` directive
2. **Server Actions**: signOutAction marked with `'use server'`
3. **Navigation**: Use Next.js Link component with URL search parameters
4. **Active State**: Use data-active attribute + conditional Tailwind classes
5. **Icons**: Import from lucide-react (List, Settings, LogOut, ChevronDown, Plus)
6. **Testing**: Mock useSearchParams and router utilities for component tests

### Testing Requirements

- **Total test lines**: ~140 lines (per spec.md FR-023, FR-024)
  - DashboardSidebar tests: ~80 lines
  - DashboardHeader tests: ~60 lines
- **Coverage target**: ≥65% for new components
- **Test framework**: Vitest + React Testing Library
- **All tests must pass**: Before feature is considered complete

### Performance Targets (from spec.md)

- Navigation state updates: <200ms visual feedback
- Sidebar expand/collapse: <100ms animation
- Sign-out flow: Complete within 2 seconds
- Filter changes: Instant client-side navigation

---

## Success Criteria Checklist

From spec.md Success Criteria:

- [ ] SC-001: Users can switch between filters with single click, active filter visible within 200ms
- [ ] SC-002: Users can expand/collapse Lists section with single click, feedback within 100ms
- [ ] SC-003: Users can sign out and are redirected to home page within 2 seconds
- [ ] SC-004: Dashboard header displays correctly on 320px-1920px viewports without horizontal scrolling
- [ ] SC-005: 100% of navigation interactions update URL correctly with appropriate filter parameters
- [ ] SC-006: All automated tests pass with at least 65% code coverage for new components
- [ ] SC-007: Users can identify current filter at a glance through clear visual indicators
- [ ] SC-008: "+ New List" button is visible and responsive with no console errors
- [ ] SC-009: Sidebar navigation remains functional and accessible on mobile devices

---

## Related Documentation

- [Feature Specification](./spec.md) - Complete feature requirements and user stories
- [Implementation Plan](./plan.md) - Technical context and architecture decisions
- [Research Findings](./research.md) - Technical decisions and alternatives considered
- [Data Model](./data-model.md) - Client-side state management details
- [Server Action Contract](./contracts/logout-action.md) - Sign out API contract
- [Quick Start Guide](./quickstart.md) - Developer reference and code examples
- [Repository Instructions](../../.github/copilot-instructions.md) - Project conventions

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability (US1-US5)
- Each user story should be independently completable and testable
- Tests must fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP = User Stories 1 + 3 (Navigation + Sign Out) = Core functionality
- Full feature = All 5 user stories + Polish
