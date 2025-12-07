# Tasks: Dashboard UI Feedback States

**Input**: Design documents from `/specs/001-dashboard-states/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install shadcn/ui dependencies required for all feedback states

- [x] T001 Install shadcn/ui Skeleton component via CLI: `npx shadcn@latest add skeleton` → creates src/components/ui/skeleton.tsx
- [x] T002 Verify Skeleton component installation by running `pnpm typecheck` → should pass with no errors

**Verification**: Skeleton component exists at `src/components/ui/skeleton.tsx` and type checks pass

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create reusable UI components that will be used by dashboard page state management

**⚠️ CRITICAL**: These components must be complete before dashboard page integration (Phase 5)

- [x] T003 [P] Create ListCardSkeleton component in src/components/dashboard/ListCardSkeleton.tsx with Card, CardContent, and Skeleton placeholders matching ListCard structure (16:9 aspect ratio hero, title, footer)
- [x] T004 [P] Create EmptyState component in src/components/dashboard/EmptyState.tsx with filter-aware messaging (all/published/drafts variants), Plus icon, and "Create New List" button
- [x] T005 [P] Create ErrorState component in src/components/dashboard/ErrorState.tsx with Alert (destructive variant), AlertCircle icon, error title/description, and inline Retry button
- [x] T006 Run `pnpm typecheck` to verify all three components compile without errors

**Checkpoint**: All three feedback state components are created and type-safe

---

## Phase 3: User Story 1 - Empty State Guidance (Priority: P1) 🎯 MVP

**Goal**: Provide clear guidance to users visiting the dashboard with no lists, including filter-aware messages and a prominent call-to-action

**Independent Test**: Access dashboard with no lists and verify empty state message appears with "Create New List" button that logs to console when clicked

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Create EmptyState component test file tests/component/dashboard/EmptyState.test.tsx with test case for rendering "No lists yet" message when filter='all'
- [x] T008 [P] [US1] Add test case to EmptyState.test.tsx for rendering "No published lists yet" when filter='published'
- [x] T009 [P] [US1] Add test case to EmptyState.test.tsx for rendering "No draft lists yet" when filter='drafts'
- [x] T010 [P] [US1] Add test case to EmptyState.test.tsx for calling onCreateClick callback when button is clicked
- [x] T011 [P] [US1] Add test case to EmptyState.test.tsx for rendering Plus icon in button
- [x] T012 [US1] Run `pnpm test tests/component/dashboard/EmptyState.test.tsx` to verify tests FAIL (component exists but dashboard integration not complete)

### Implementation for User Story 1

- [x] T013 [US1] Update src/app/(dashboard)/dashboard/page.tsx to add DashboardState type definition (discriminated union: loading | error | success)
- [x] T014 [US1] Update src/app/(dashboard)/dashboard/page.tsx to add EmptyState import and handleCreateClick handler (logs "Create new list clicked" to console)
- [x] T015 [US1] Update src/app/(dashboard)/dashboard/page.tsx to add conditional rendering for empty state: when state.type === 'success' && filteredLists.length === 0, render EmptyState component with filter prop and onCreateClick handler
- [x] T016 [US1] Run `pnpm test tests/component/dashboard/EmptyState.test.tsx` to verify all EmptyState tests now PASS
- [ ] T017 [US1] Run `pnpm dev` and manually test: clear mockLists, verify "No lists yet" appears, click button, verify console log, test filter variants (published/drafts)

**Checkpoint**: Empty state is fully functional and independently testable with 5 passing tests

**Coverage Target**: 80% for EmptyState component (5 test cases covering all filter variants, button interaction, and icon rendering)

---

## Phase 4: User Story 2 - Loading Feedback (Priority: P2)

**Goal**: Display 6 skeleton placeholder cards during loading to indicate the system is working and preview the expected layout

**Independent Test**: Trigger loading state and verify 6 skeleton cards appear in correct responsive grid layout (3/2/1 columns)

### Tests for User Story 2

- [x] T018 [P] [US2] Create ListCardSkeleton component test file tests/component/dashboard/ListCardSkeleton.test.tsx with test case for rendering without crashing
- [x] T019 [P] [US2] Add test case to ListCardSkeleton.test.tsx for rendering skeleton elements (verify presence of animated elements)
- [x] T020 [P] [US2] Add test case to ListCardSkeleton.test.tsx for matching ListCard structure (verify aspect-[16/9] hero image skeleton)
- [x] T021 [US2] Run `pnpm test tests/component/dashboard/ListCardSkeleton.test.tsx` to verify tests FAIL

### Implementation for User Story 2

- [x] T022 [US2] Update src/app/(dashboard)/dashboard/page.tsx to add ListCardSkeleton import at top of file
- [x] T023 [US2] Update src/app/(dashboard)/dashboard/page.tsx to add useState hook for DashboardState initialized to { type: 'loading' }
- [x] T024 [US2] Update src/app/(dashboard)/dashboard/page.tsx to add useEffect hook that simulates loading (setTimeout 500ms, then setState to success with mockLists)
- [x] T025 [US2] Update src/app/(dashboard)/dashboard/page.tsx to add conditional rendering for loading state: when state.type === 'loading', render grid div with 6 ListCardSkeleton components
- [x] T026 [US2] Run `pnpm test tests/component/dashboard/ListCardSkeleton.test.tsx` to verify all skeleton tests now PASS
- [ ] T027 [US2] Run `pnpm dev` and manually test: refresh page, verify 6 skeleton cards appear briefly, then transition to list grid

**Checkpoint**: Loading state with skeletons is fully functional and independently testable with 3 passing tests

**Coverage Target**: 70% for ListCardSkeleton component (3 test cases covering rendering, animation, and structure)

---

## Phase 5: User Story 3 - Error Recovery (Priority: P2)

**Goal**: Display clear error message when loading fails with retry button to allow recovery without leaving the page

**Independent Test**: Trigger error state and verify error alert appears with retry button that re-triggers loading

### Tests for User Story 3

- [x] T028 [P] [US3] Create ErrorState component test file tests/component/dashboard/ErrorState.test.tsx with test case for rendering error title "Failed to load lists"
- [x] T029 [P] [US3] Add test case to ErrorState.test.tsx for rendering error description text
- [x] T030 [P] [US3] Add test case to ErrorState.test.tsx for rendering Retry button
- [x] T031 [P] [US3] Add test case to ErrorState.test.tsx for calling onRetry callback when button is clicked
- [x] T032 [US3] Run `pnpm test tests/component/dashboard/ErrorState.test.tsx` to verify tests FAIL

### Implementation for User Story 3

- [x] T033 [US3] Update src/app/(dashboard)/dashboard/page.tsx to add ErrorState import at top of file
- [x] T034 [US3] Update src/app/(dashboard)/dashboard/page.tsx to add handleRetry function that sets state to { type: 'loading' } and re-triggers data fetch simulation
- [x] T035 [US3] Update src/app/(dashboard)/dashboard/page.tsx to add conditional rendering for error state: when state.type === 'error', render ErrorState component with error prop and onRetry handler
- [ ] T036 [US3] Update src/app/(dashboard)/dashboard/page.tsx useEffect to simulate occasional errors (e.g., random or toggle flag for testing)
- [x] T037 [US3] Run `pnpm test tests/component/dashboard/ErrorState.test.tsx` to verify all error state tests now PASS
- [ ] T038 [US3] Run `pnpm dev` and manually test: trigger error state, verify error alert appears, click retry button, verify loading state → success state transition

**Checkpoint**: Error state with retry is fully functional and independently testable with 4 passing tests

**Coverage Target**: 80% for ErrorState component (4 test cases covering title, description, button, and interaction)

---

## Phase 6: User Story 4 - State Exclusivity (Priority: P3)

**Goal**: Ensure only one feedback state renders at a time to prevent UI confusion with overlapping messages

**Independent Test**: Trigger different states sequentially and verify only one state renders at any given time

### Tests for User Story 4

- [x] T039 [US4] Create integration test file tests/integration/dashboard/state-transitions.test.tsx with test case for loading state rendering only skeleton cards (no error, no empty, no list cards)
- [x] T040 [US4] Add test case to state-transitions.test.tsx for error state rendering only ErrorState component (no loading, no empty, no list cards)
- [x] T041 [US4] Add test case to state-transitions.test.tsx for empty state (success with no lists) rendering only EmptyState component (no loading, no error, no list cards)
- [x] T042 [US4] Add test case to state-transitions.test.tsx for success state (with lists) rendering only ListGrid component (no loading, no error, no empty)
- [x] T043 [US4] Add test case to state-transitions.test.tsx for state transition from loading → success
- [x] T044 [US4] Add test case to state-transitions.test.tsx for state transition from loading → error
- [x] T045 [US4] Add test case to state-transitions.test.tsx for state transition from error → loading (retry flow)
- [x] T046 [US4] Run `pnpm test tests/integration/dashboard/state-transitions.test.tsx` to verify integration tests FAIL (state logic exists but may have race conditions)

### Implementation for User Story 4

- [x] T047 [US4] Update src/app/(dashboard)/dashboard/page.tsx to ensure filteredLists calculation checks state.type === 'success' before accessing state.lists
- [x] T048 [US4] Update src/app/(dashboard)/dashboard/page.tsx to ensure all state conditions are mutually exclusive (use if-else chain, not independent if statements)
- [x] T049 [US4] Update src/app/(dashboard)/dashboard/page.tsx to ensure success state with content renders last in conditional chain (after loading, error, and empty checks)
- [x] T050 [US4] Run `pnpm test tests/integration/dashboard/state-transitions.test.tsx` to verify all state exclusivity tests now PASS
- [ ] T051 [US4] Run `pnpm dev` and manually test state transitions: refresh (loading → success), trigger error (success → error), retry (error → loading), clear lists (success → empty)

**Checkpoint**: State exclusivity guarantees are enforced and fully tested with 8 passing integration tests

**Coverage Target**: 90% for state transition logic (8 test cases covering all state combinations and transitions)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate test coverage, run full test suite, verify code quality, and ensure no regressions

- [x] T052 [P] Run `pnpm test:coverage` to generate coverage report and verify overall feature coverage >= 65%
- [x] T053 [P] Run `pnpm test` to verify all existing dashboard tests still pass (no regressions)
- [x] T054 [P] Run `pnpm lint` to check code style and fix any linting issues with `pnpm lint:fix`
- [x] T055 Run `pnpm typecheck` to verify no TypeScript errors in updated dashboard page and new components
- [ ] T056 Run `pnpm dev` and perform manual responsive testing: verify 3 columns on desktop (>1024px), 2 columns on tablet (768-1023px), 1 column on mobile (<768px)
- [ ] T057 Run Chrome DevTools Lighthouse performance audit on /dashboard page and verify CLS (Cumulative Layout Shift) = 0 between states
- [ ] T058 [P] Update src/app/(dashboard)/dashboard/page.tsx to remove or comment out error simulation logic (leave clean state management for production)
- [ ] T059 Review quickstart.md validation checklist (Phase 7, Step 7.1) and verify all 11 manual testing items are complete
- [ ] T060 Document any deviations from plan.md or issues encountered in specs/001-dashboard-states/IMPLEMENTATION_NOTES.md (if needed)

**Checkpoint**: All quality gates passed, 65%+ coverage achieved, no regressions, production-ready

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - install Skeleton component first
- **Foundational (Phase 2)**: Depends on Setup (Skeleton must exist) - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Empty State): Can start after Foundational
  - US2 (Loading): Can start after Foundational  
  - US3 (Error): Can start after Foundational
  - US4 (State Exclusivity): Depends on US1, US2, US3 completion (validates all states work together)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (can work in parallel with US1)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (can work in parallel with US1, US2)
- **User Story 4 (P3)**: Depends on US1, US2, US3 completion - Tests integration of all states

### Within Each User Story

1. Write tests FIRST and ensure they FAIL
2. Implement component or integration logic
3. Run tests and verify they PASS
4. Manual testing for verification
5. Move to next user story or phase

### Parallel Opportunities

**Setup Phase**:
- T001 and T002 are sequential (verify after install)

**Foundational Phase**:
- T003, T004, T005 can run in parallel (different files: ListCardSkeleton.tsx, EmptyState.tsx, ErrorState.tsx)
- T006 runs after all three complete

**User Story 1 (Empty State)**:
- T007, T008, T009, T010, T011 can run in parallel (all test cases in same file)
- T013, T014 can run in parallel (both are edits to dashboard page but different sections)

**User Story 2 (Loading)**:
- T018, T019, T020 can run in parallel (all test cases in same file)
- T022, T023, T024, T025 are sequential (all edit same file)

**User Story 3 (Error)**:
- T028, T029, T030, T031 can run in parallel (all test cases in same file)
- T033, T034, T035, T036 are sequential (all edit same file)

**User Story 4 (State Exclusivity)**:
- T039-T045 are sequential (all edit same integration test file, build on each other)
- T047, T048, T049 are sequential (all edit same dashboard page file)

**Polish Phase**:
- T052, T053, T054 can run in parallel (different commands: coverage, test, lint)
- T058, T060 can run in parallel (different files)

---

## Parallel Example: Foundational Phase

```bash
# Launch all component creation tasks together:
Task T003: "Create ListCardSkeleton component in src/components/dashboard/ListCardSkeleton.tsx"
Task T004: "Create EmptyState component in src/components/dashboard/EmptyState.tsx"
Task T005: "Create ErrorState component in src/components/dashboard/ErrorState.tsx"

# Then verify:
Task T006: "Run pnpm typecheck to verify all components compile"
```

## Parallel Example: User Story 1 Tests

```bash
# Launch all EmptyState test cases together (write in same file):
Task T007: "Test case for filter='all' message"
Task T008: "Test case for filter='published' message"
Task T009: "Test case for filter='drafts' message"
Task T010: "Test case for button click callback"
Task T011: "Test case for Plus icon rendering"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only - Empty State)

1. Complete Phase 1: Setup (install Skeleton) - **~5 minutes**
2. Complete Phase 2: Foundational (create all 3 components) - **~45 minutes**
3. Complete Phase 3: User Story 1 (empty state tests + integration) - **~45 minutes**
4. **STOP and VALIDATE**: Run tests, manual test, verify empty state works independently
5. Deploy/demo if ready - **MVP complete with empty state guidance**

**Total MVP Time**: ~1.5 hours
**MVP Value**: New users immediately understand empty state and see clear next action

### Incremental Delivery (All User Stories)

1. Complete Setup + Foundational → Components ready - **~50 minutes**
2. Add User Story 1 (Empty State) → Test independently → **MVP!** - **+45 minutes**
3. Add User Story 2 (Loading Skeleton) → Test independently → Demo loading UX - **+45 minutes**
4. Add User Story 3 (Error + Retry) → Test independently → Demo error recovery - **+45 minutes**
5. Add User Story 4 (State Exclusivity) → Test integration → Demo all states working together - **+30 minutes**
6. Polish & Validate → Coverage, quality checks, manual testing - **+30 minutes**

**Total Time**: ~4 hours (includes all user stories, tests, and polish)
**Each story adds value without breaking previous stories**

### Parallel Team Strategy

With 2 developers after Foundational phase:

1. Team completes Setup + Foundational together - **~50 minutes**
2. Once Foundational is done:
   - Developer A: User Story 1 (Empty State) - **~45 minutes**
   - Developer B: User Story 2 (Loading) - **~45 minutes**
3. Then continue sequentially:
   - Developer A: User Story 3 (Error) - **~45 minutes**
   - Developer B: User Story 4 (State Exclusivity) - **~30 minutes**
4. Together: Polish & Validate - **~30 minutes**

**Total Time with 2 devs**: ~2.5 hours (parallel work reduces timeline)

---

## Task Verification Examples

### T001 Verification
```bash
npx shadcn@latest add skeleton
# Expected output: ✓ Component skeleton added successfully
ls src/components/ui/skeleton.tsx
# Expected: File exists
```

### T003 Verification (ListCardSkeleton)
```bash
# After creating component
pnpm typecheck
# Expected: No errors in ListCardSkeleton.tsx
grep -r "ListCardSkeleton" src/components/dashboard/
# Expected: Component file found
```

### T007 Verification (EmptyState test)
```bash
pnpm test tests/component/dashboard/EmptyState.test.tsx
# Expected BEFORE dashboard integration: Tests FAIL (component exists but not integrated)
# Expected AFTER T013-T015: Tests PASS
```

### T052 Verification (Coverage)
```bash
pnpm test:coverage
# Expected output shows coverage >= 65% for:
# - src/components/dashboard/EmptyState.tsx
# - src/components/dashboard/ListCardSkeleton.tsx
# - src/components/dashboard/ErrorState.tsx
# - src/app/(dashboard)/dashboard/page.tsx (state logic)
```

### T057 Verification (Performance)
```bash
# Start dev server
pnpm dev

# Open Chrome DevTools → Lighthouse
# Run performance audit on http://localhost:3000/dashboard
# Check metrics:
# - CLS (Cumulative Layout Shift) = 0
# - Fast render times (<100ms for state changes)
```

---

## Coverage Targets Summary

| Component/Area | Target Coverage | Test Count | Key Test Files |
|----------------|----------------|------------|----------------|
| EmptyState | 80% | 5 tests | tests/component/dashboard/EmptyState.test.tsx |
| ListCardSkeleton | 70% | 3 tests | tests/component/dashboard/ListCardSkeleton.test.tsx |
| ErrorState | 80% | 4 tests | tests/component/dashboard/ErrorState.test.tsx |
| State Transitions | 90% | 8 tests | tests/integration/dashboard/state-transitions.test.ts |
| **Overall Feature** | **65% minimum** | **20 tests** | All of the above |

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label (US1, US2, US3, US4) maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are written FIRST and should FAIL before implementation (TDD approach)
- Commit after each completed user story phase
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, breaking existing functionality
- All file paths are absolute from repository root: /home/runner/work/topten/topten/

---

## Success Criteria

After completing all tasks, the dashboard should:

1. ✅ Display 6 skeleton cards during initial load (100ms perceived performance)
2. ✅ Show clear empty state message with CTA when no lists exist
3. ✅ Display filter-specific empty messages (published/drafts)
4. ✅ Show error alert with retry button when loading fails
5. ✅ Allow error recovery via retry without page reload
6. ✅ Render only one state at a time (no overlapping states)
7. ✅ Maintain responsive 3/2/1 column grid across all states
8. ✅ Achieve 65%+ test coverage across all new components
9. ✅ Pass all existing dashboard tests (no regressions)
10. ✅ Have zero Cumulative Layout Shift (CLS = 0) between state transitions

---

## References

- **Feature Spec**: [spec.md](./spec.md) - User stories and acceptance criteria
- **Implementation Plan**: [plan.md](./plan.md) - Technical approach and architecture
- **Quickstart Guide**: [quickstart.md](./quickstart.md) - Step-by-step implementation walkthrough
- **Component Contracts**: [contracts/components.md](./contracts/components.md) - Component API contracts
- **Data Model**: [data-model.md](./data-model.md) - TypeScript type definitions
- **Research**: [research.md](./research.md) - Technology decisions and patterns
- **Constitution**: [../../.specify/memory/constitution.md](../../.specify/memory/constitution.md) - Code quality principles

---

**Tasks Status**: ✅ **READY FOR IMPLEMENTATION**
**Total Tasks**: 60 tasks across 7 phases
**Estimated Time**: 2.5-4 hours (depending on team size and approach)
**MVP Scope**: Phase 1-3 (Tasks T001-T017) - Empty State guidance for new users (~1.5 hours)
