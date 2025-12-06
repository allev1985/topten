# Tasks: Dashboard Foundation

**Feature Branch**: `001-dashboard-foundation`  
**Input**: Design documents from `/specs/001-dashboard-foundation/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/components.md, quickstart.md

**Tests**: ✅ Comprehensive test coverage (≥65%) is REQUIRED per spec SC-005

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install required dependencies and create base directory structure

- [X] T001 Install shadcn Sheet component via CLI: `pnpm dlx shadcn@latest add sheet`
- [X] T002 [P] Create dashboard components directory: `src/components/dashboard/`
- [X] T003 [P] Create component test directory: `tests/component/dashboard/`
- [X] T004 [P] Create integration test directory: `tests/integration/dashboard/`
- [X] T005 [P] Create E2E test directory: `tests/e2e/dashboard/`

**Checkpoint**: All directories created and shadcn Sheet component installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Verify existing Supabase auth setup in `src/app/(dashboard)/layout.tsx` for server-side protection
- [X] T007 Verify existing Supabase client utilities in `src/lib/supabase/client.ts`
- [X] T008 Verify shadcn Button component exists in `src/components/ui/button.tsx`
- [X] T009 Verify shadcn Sheet component installed correctly in `src/components/ui/sheet.tsx`

**Checkpoint**: Foundation ready - all dependencies verified, user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Protected Dashboard Access (Priority: P1) 🎯 MVP

**Goal**: Implement authentication protection so only authenticated curators can access the dashboard

**Independent Test**: Attempt to access /dashboard both authenticated and unauthenticated, verify redirect behavior

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [P] [US1] Component test for session monitoring in `tests/component/dashboard/page.test.tsx`
- [X] T011 [P] [US1] Integration test for auth protection in `tests/integration/dashboard/auth-protection.test.ts`
- [X] T012 [P] [US1] Integration test for session monitoring in `tests/integration/dashboard/session-monitoring.test.ts`
- [X] T013 [P] [US1] E2E test for dashboard access flows in `tests/e2e/dashboard/dashboard-access.spec.ts`

### Implementation for User Story 1

- [X] T014 [US1] Create dashboard page with client-side session monitoring in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T015 [US1] Implement useEffect hook for Supabase auth state change listener in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T016 [US1] Add redirect to /login on SIGNED_OUT or null session in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T017 [US1] Add cleanup for auth subscription on component unmount in `src/app/(dashboard)/dashboard/page.tsx`

**Checkpoint**: User Story 1 complete - authentication protection working, users redirected appropriately

---

## Phase 4: User Story 2 - Desktop Navigation Workspace (Priority: P2)

**Goal**: Provide persistent sidebar with navigation and branding for desktop users (≥1024px width)

**Independent Test**: Verify sidebar visibility, logo display, and fixed positioning on desktop viewport without requiring functional navigation items

### Tests for User Story 2

- [X] T018 [P] [US2] Component test for DashboardSidebar in `tests/component/dashboard/DashboardSidebar.test.tsx`
- [X] T019 [P] [US2] Integration test for responsive layout (desktop) in `tests/integration/dashboard/responsive-layout.test.ts`

### Implementation for User Story 2

- [X] T020 [P] [US2] Create DashboardSidebar component in `src/components/dashboard/DashboardSidebar.tsx`
- [X] T021 [US2] Add "📍 YourFavs" branding to DashboardSidebar in `src/components/dashboard/DashboardSidebar.tsx`
- [X] T022 [US2] Add navigation container with semantic nav element in `src/components/dashboard/DashboardSidebar.tsx`
- [X] T023 [US2] Add fixed desktop sidebar to dashboard page in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T024 [US2] Apply fixed positioning and styling (hidden lg:block, w-64, border-r) to sidebar in `src/app/(dashboard)/dashboard/page.tsx`

**Checkpoint**: User Story 2 complete - desktop sidebar visible and functional, branding displayed

---

## Phase 5: User Story 3 - Mobile Navigation Access (Priority: P2)

**Goal**: Provide hamburger menu and drawer navigation for mobile users (<1024px width)

**Independent Test**: Verify hamburger menu visibility, drawer open/close behavior, and sidebar content accessibility on mobile viewport

### Tests for User Story 3

- [X] T025 [P] [US3] Integration test for responsive layout (mobile) in `tests/integration/dashboard/responsive-layout.test.ts`
- [X] T026 [P] [US3] E2E test for mobile drawer interactions in `tests/e2e/dashboard/dashboard-access.spec.ts`

### Implementation for User Story 3

- [X] T027 [US3] Add drawer state management (isDrawerOpen) to dashboard page in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T028 [US3] Create mobile navigation header with Sheet component in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T029 [US3] Add hamburger button (Menu icon from lucide-react) with lg:hidden class in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T030 [US3] Configure SheetTrigger with hamburger button in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T031 [US3] Configure SheetContent with DashboardSidebar (side="left", w-64, p-0) in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T032 [US3] Connect Sheet open/onOpenChange to isDrawerOpen state in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T033 [US3] Add ARIA label to hamburger button ("Open navigation menu") in `src/app/(dashboard)/dashboard/page.tsx`

**Checkpoint**: User Story 3 complete - mobile drawer functional, accessible, and contains same content as desktop sidebar

---

## Phase 6: User Story 4 - Content Area Foundation (Priority: P3)

**Goal**: Provide properly structured main content area that adapts to viewport and sidebar visibility

**Independent Test**: Verify main content area exists, uses semantic HTML, and responds properly to different viewport sizes

### Tests for User Story 4

- [X] T034 [P] [US4] Component test for DashboardContent in `tests/component/dashboard/DashboardContent.test.tsx`

### Implementation for User Story 4

- [X] T035 [P] [US4] Create DashboardContent component in `src/components/dashboard/DashboardContent.tsx`
- [X] T036 [US4] Add semantic main element with min-h-screen in `src/components/dashboard/DashboardContent.tsx`
- [X] T037 [US4] Apply responsive margin (lg:ml-64) for desktop sidebar offset in `src/components/dashboard/DashboardContent.tsx`
- [X] T038 [US4] Add content padding wrapper in `src/components/dashboard/DashboardContent.tsx`
- [X] T039 [US4] Integrate DashboardContent into dashboard page in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T040 [US4] Add placeholder content (heading and text) in `src/app/(dashboard)/dashboard/page.tsx`
- [X] T041 [US4] Apply mobile header offset (mt-16 lg:mt-0) to content in `src/app/(dashboard)/dashboard/page.tsx`

**Checkpoint**: User Story 4 complete - content area properly structured with semantic HTML and responsive layout

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, optimization, and cleanup across all user stories

- [X] T042 Run all component tests and verify passing: `pnpm test tests/component/dashboard`
- [X] T043 Run all integration tests and verify passing: `pnpm test tests/integration/dashboard`
- [ ] T044 Run all E2E tests and verify passing: `pnpm test:e2e tests/e2e/dashboard`
- [X] T045 Run test coverage report and verify ≥65%: `pnpm test:coverage`
- [X] T046 [P] Run TypeScript type checking: `pnpm typecheck`
- [X] T047 [P] Run linting: `pnpm lint`
- [ ] T048 Manual testing: Verify all acceptance scenarios from spec.md User Stories 1-4
- [ ] T049 Manual testing: Test responsive behavior across viewports (320px, 375px, 768px, 1024px, 1440px, 1920px)
- [ ] T050 Manual testing: Test session expiration detection and redirect
- [ ] T051 Manual testing: Accessibility testing (keyboard navigation, screen reader, focus trap)
- [ ] T052 Performance validation: Verify metrics meet success criteria (SC-001 to SC-008)
- [X] T053 [P] Code cleanup: Remove any console.logs or debug code
- [ ] T054 Review quickstart.md validation checklist in `specs/001-dashboard-foundation/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2 → P3)
- **Polish (Phase 7)**: Depends on all user stories (Phase 3-6) being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses DashboardSidebar independently
- **User Story 3 (P2)**: Depends on User Story 2 (Phase 4) - Reuses DashboardSidebar component
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent content wrapper

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Components before integration into page
- Core implementation before styling/polish
- Story complete before moving to next priority

### Parallel Opportunities

#### Phase 1 (Setup)
All tasks T002-T005 can run in parallel after T001 completes

#### Phase 2 (Foundational)
All verification tasks T006-T009 can run in parallel

#### User Story 1 Tests
All test tasks T010-T013 can run in parallel

#### User Story 2 Tests
Tasks T018-T019 can run in parallel

#### User Story 2 Implementation
Task T020 (create component) can be done in parallel with page setup

#### User Story 3 Tests
Tasks T025-T026 can run in parallel

#### User Story 4
Tasks T034 (test) and T035 (component) can run in parallel

#### Phase 7 (Polish)
Tasks T046-T047 (typecheck/lint) can run in parallel
Task T053 (cleanup) can run in parallel with other non-test tasks

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Component test for session monitoring in tests/component/dashboard/page.test.tsx"
Task: "Integration test for auth protection in tests/integration/dashboard/auth-protection.test.ts"
Task: "Integration test for session monitoring in tests/integration/dashboard/session-monitoring.test.ts"
Task: "E2E test for dashboard access flows in tests/e2e/dashboard/dashboard-access.spec.ts"

# After tests written and failing, implement sequentially:
Task: "Create dashboard page with client-side session monitoring"
Task: "Implement useEffect hook for Supabase auth state change listener"
Task: "Add redirect to /login on SIGNED_OUT or null session"
Task: "Add cleanup for auth subscription on component unmount"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T009) - CRITICAL
3. Complete Phase 3: User Story 1 (T010-T017)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Verify auth protection working before proceeding

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Auth protection working (MVP!)
3. Add User Story 2 → Test independently → Desktop navigation added
4. Add User Story 3 → Test independently → Mobile navigation added
5. Add User Story 4 → Test independently → Content area complete
6. Polish → Full feature complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Auth protection)
   - Developer B: User Story 2 (Desktop sidebar) + User Story 4 (Content area)
   - Developer C: User Story 3 (Mobile drawer) - starts after US2 component ready
3. Stories complete and integrate independently

---

## Coverage Targets (Success Criteria SC-005)

**Required Coverage**: ≥65% across all metrics

| Component | Coverage Goal | Complexity |
|-----------|---------------|------------|
| `DashboardSidebar.tsx` | 100% | Low (presentational) |
| `DashboardContent.tsx` | 100% | Low (wrapper) |
| `page.tsx` | ≥70% | Medium (session logic) |
| Integration tests | 100% coverage of critical paths | High |

---

## Performance Validation Checklist (from spec.md)

- [ ] **SC-001**: Unauthenticated redirect to /login < 500ms
- [ ] **SC-002**: Dashboard load for authenticated users < 1s
- [ ] **SC-003**: Drawer animation open/close < 300ms
- [ ] **SC-004**: Layout renders correctly 320px-2560px width (no horizontal scroll)
- [ ] **SC-005**: Test coverage ≥65% (lines, functions, branches, statements)
- [ ] **SC-006**: Session expiration detection and redirect < 2s
- [ ] **SC-007**: Sidebar remains fixed during content scrolling on desktop
- [ ] **SC-008**: Drawer toggle 20+ times without UI lag or errors

---

## Manual Testing Scenarios (from spec.md)

### User Story 1: Protected Dashboard Access
- [ ] Unauthenticated user navigates to /dashboard → redirected to /login
- [ ] Authenticated curator navigates to /dashboard → sees dashboard page
- [ ] Session expires while on dashboard → redirected to /login
- [ ] User logs in from login page → redirected to /dashboard

### User Story 2: Desktop Navigation Workspace
- [ ] Desktop viewport (≥1024px) shows fixed sidebar on left
- [ ] Sidebar displays "📍 YourFavs" logo/branding
- [ ] Sidebar remains fixed during main content scrolling
- [ ] Resizing from desktop to mobile hides sidebar and shows hamburger

### User Story 3: Mobile Navigation Access
- [ ] Mobile viewport (<1024px) shows hamburger menu, no sidebar
- [ ] Tapping hamburger opens drawer from left
- [ ] Drawer shows same content as desktop sidebar
- [ ] Tapping close button or outside drawer closes it

### User Story 4: Content Area Foundation
- [ ] Main content area visible on all viewports
- [ ] Semantic HTML elements (nav, aside, main) used correctly
- [ ] Content area offsets for sidebar on desktop (right of sidebar)
- [ ] Content area full width on mobile

---

## Edge Cases to Test (from spec.md)

- [ ] Authentication token expires while actively using dashboard
- [ ] Rapid viewport size changes (tablet rotation)
- [ ] Direct URL navigation to /dashboard while unauthenticated
- [ ] Drawer opened on mobile, then rotated/resized to desktop width
- [ ] Supabase authentication service temporarily unavailable
- [ ] JavaScript disabled (graceful degradation)
- [ ] Browser back button after redirect to login

---

## Notes

- **[P] tasks**: Different files, no dependencies, can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Tests first**: All test tasks must fail before implementing corresponding features
- **Independent stories**: Each user story should be independently completable and testable
- **Commit frequently**: Commit after each task or logical group of tasks
- **Stop at checkpoints**: Validate each story independently before proceeding
- **Constitution compliance**: Follow `.specify/memory/constitution.md` principles
- **No shadcn modifications**: Never modify generated components in `src/components/ui/`

---

## Total Task Count: 54

- **Setup**: 5 tasks
- **Foundational**: 4 tasks
- **User Story 1**: 8 tasks (4 tests + 4 implementation)
- **User Story 2**: 7 tasks (2 tests + 5 implementation)
- **User Story 3**: 9 tasks (2 tests + 7 implementation)
- **User Story 4**: 8 tasks (1 test + 7 implementation)
- **Polish**: 13 tasks (validation, testing, cleanup)

**Parallel Opportunities Identified**: 19 tasks marked with [P]

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 17 tasks

**Full Feature Scope**: All 54 tasks for complete dashboard foundation with ≥65% test coverage
