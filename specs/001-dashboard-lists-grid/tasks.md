---

description: "Task list for Dashboard Lists and Grids feature implementation"
---

# Tasks: Dashboard Lists and Grids

**Input**: Design documents from `/specs/001-dashboard-lists-grid/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly required in the specification, so test tasks are omitted unless user requests TDD approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app with Next.js App Router
- Components: `src/components/`
- Types: `src/types/`
- App routes: `src/app/`
- Tests: `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic dependencies

- [x] T001 Install shadcn/ui Badge component via `npx shadcn@latest add badge` to src/components/ui/badge.tsx
- [x] T002 Install shadcn/ui DropdownMenu component via `npx shadcn@latest add dropdown-menu` to src/components/ui/dropdown-menu.tsx
- [x] T003 Configure Next.js Image component for placehold.co in next.config.ts by adding remotePatterns entry

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create List type interface in src/types/list.ts with fields: id, title, heroImageUrl, isPublished, placeCount
- [x] T005 [P] Create ListCardProps interface in src/types/list.ts with fields: list, onClick
- [x] T006 [P] Create ListGridProps interface in src/types/list.ts with fields: lists, onListClick
- [x] T007 Create mock data directory src/lib/mocks/
- [x] T008 Create mockLists array in src/lib/mocks/lists.ts with 5 List items (mix of published/draft, varying place counts, one long title)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Lists Portfolio (Priority: P1) 🎯 MVP

**Goal**: Display all curator lists as cards in a responsive grid on the dashboard

**Independent Test**: Navigate to /dashboard and verify that all 5 mock lists are displayed as cards in a grid layout with proper responsive behavior (1 column mobile, 2 tablet, 3 desktop)

### Implementation for User Story 1

- [x] T009 [P] [US1] Create ListCard component in src/components/dashboard/ListCard.tsx with Card, Image, h3 title, Badge, place count, DropdownMenuTrigger
- [x] T010 [P] [US1] Create ListGrid component in src/components/dashboard/ListGrid.tsx with responsive grid classes (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- [x] T011 [US1] Integrate ListGrid into dashboard page in src/app/(dashboard)/dashboard/page.tsx by importing mockLists and ListGrid
- [x] T012 [US1] Add handleListClick handler in src/app/(dashboard)/dashboard/page.tsx that logs list ID to console
- [x] T013 [US1] Wrap ListGrid with padding container (p-6) in src/app/(dashboard)/dashboard/page.tsx within DashboardContent

**Checkpoint**: At this point, User Story 1 should be fully functional - all lists displayed in responsive grid

---

## Phase 4: User Story 2 - Identify List Status (Priority: P1)

**Goal**: Display publication status of each list clearly marked with badges

**Independent Test**: View dashboard and verify each card has a visually distinct status badge (Published = default variant, Draft = secondary variant)

### Implementation for User Story 2

- [x] T014 [US2] Add Badge component to ListCard in src/components/dashboard/ListCard.tsx with conditional variant (default for published, secondary for draft)
- [x] T015 [US2] Add conditional text to Badge in src/components/dashboard/ListCard.tsx displaying "Published" or "Draft" based on isPublished prop
- [x] T016 [US2] Verify Badge positioning in ListCard layout in src/components/dashboard/ListCard.tsx using flex container with place count

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - grid displays with status badges visible

---

## Phase 5: User Story 3 - View List Metadata (Priority: P1)

**Goal**: Display key information (title, image, place count) on each card for list identification

**Independent Test**: View dashboard and verify each card displays title (truncated to 2 lines if long), hero image, and correct place count with proper pluralization

### Implementation for User Story 3

- [x] T017 [US3] Add Next.js Image component to ListCard in src/components/dashboard/ListCard.tsx with fill layout and object-cover for hero image
- [x] T018 [US3] Add h3 title element to ListCard in src/components/dashboard/ListCard.tsx with line-clamp-2 class for truncation
- [x] T019 [US3] Add place count display to ListCard in src/components/dashboard/ListCard.tsx with conditional singular/plural text (placeCount === 1 ? 'place' : 'places')
- [x] T020 [US3] Add alt text to Image component in src/components/dashboard/ListCard.tsx using pattern "${list.title} cover image"

**Checkpoint**: All three P1 user stories should now be complete - cards show full metadata

---

## Phase 6: User Story 4 - Navigate to List Details (Priority: P2)

**Goal**: Enable clicking on list cards to navigate to detail pages (logging for now)

**Independent Test**: Click on any list card area (image, title, metadata) and verify list ID is logged to browser console

### Implementation for User Story 4

- [x] T021 [US4] Wrap ListCard content in clickable container in src/components/dashboard/ListCard.tsx with cursor-pointer and onClick handler
- [x] T022 [US4] Add onClick prop handler to ListCard in src/components/dashboard/ListCard.tsx that calls props.onClick(list.id)
- [x] T023 [US4] Add hover effect to ListCard in src/components/dashboard/ListCard.tsx with hover:shadow-lg transition-shadow classes
- [x] T024 [US4] Add keyboard navigation support to ListCard in src/components/dashboard/ListCard.tsx with tabIndex={0} and onKeyDown handler for Enter/Space

**Checkpoint**: User Story 4 complete - card clicks are captured and logged

---

## Phase 7: User Story 5 - Access List Actions Menu (Priority: P2)

**Goal**: Display menu button on each card for future list actions

**Independent Test**: Verify each card has visible three-dot menu button in top-right corner that doesn't trigger card click when clicked

### Implementation for User Story 5

- [x] T025 [US5] Add DropdownMenuTrigger with Button to ListCard in src/components/dashboard/ListCard.tsx positioned absolute top-right
- [x] T026 [US5] Add lucide-react MoreVertical icon to menu Button in src/components/dashboard/ListCard.tsx
- [x] T027 [US5] Add stopPropagation handler to menu button onClick in src/components/dashboard/ListCard.tsx to prevent card click
- [x] T028 [US5] Add aria-label to menu Button in src/components/dashboard/ListCard.tsx with text "Options for ${list.title}"
- [x] T029 [US5] Add empty DropdownMenuContent to ListCard in src/components/dashboard/ListCard.tsx with TODO comment for issue #4

**Checkpoint**: All user stories should now be independently functional - complete feature implemented

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T030 [P] Verify accessibility with semantic HTML (h3 for titles, alt text for images) across src/components/dashboard/ListCard.tsx
- [x] T031 [P] Add focus indicators to ListCard in src/components/dashboard/ListCard.tsx with focus:ring-2 focus:ring-ring classes
- [x] T032 [P] Verify responsive breakpoints work correctly by testing at 320px, 768px, 1024px viewports
- [x] T033 [P] Add TypeScript strict mode compliance check across all new components
- [x] T034 Verify console.log output format includes "List clicked:" prefix in handleListClick
- [x] T035 Add comments to mock data in src/lib/mocks/lists.ts indicating temporary nature and future replacement
- [x] T036 Verify Next.js Image optimization is working by checking Network tab for optimized images
- [x] T037 Run quickstart.md validation by following setup steps and verifying all 5 cards display correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on User Story 1 (needs ListCard component) - Extends US1 with Badge
- **User Story 3 (P1)**: Depends on User Story 1 (needs ListCard component) - Extends US1 with metadata display
- **User Story 4 (P2)**: Depends on User Story 1 (needs ListCard component) - Adds interaction to existing card
- **User Story 5 (P2)**: Depends on User Story 1 (needs ListCard component) - Adds menu button to existing card

### Within Each User Story

- ListCard component before ListGrid component (dependency)
- Components before dashboard integration
- Types and mock data before components
- All P1 stories before P2 stories

### Parallel Opportunities

- All Setup tasks (T001, T002, T003) can run in parallel
- All Foundational tasks marked [P] (T004, T005, T006) can run in parallel
- Once T008 completes, US1 tasks T009 and T010 can run in parallel
- US2, US3, US4, US5 tasks can run in parallel IF working in separate areas of ListCard
- Polish tasks marked [P] (T030, T031, T032, T033) can run in parallel

---

## Parallel Example: User Story 1

```bash
# After T008 (mock data) completes, launch these together:
Task T009: "Create ListCard component in src/components/dashboard/ListCard.tsx"
Task T010: "Create ListGrid component in src/components/dashboard/ListGrid.tsx"

# Then proceed sequentially:
Task T011: "Integrate ListGrid into dashboard page"
Task T012: "Add handleListClick handler"
Task T013: "Wrap ListGrid with padding"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 - All P1)

1. Complete Phase 1: Setup (install shadcn components, configure Next.js)
2. Complete Phase 2: Foundational (CRITICAL - types and mock data block all stories)
3. Complete Phase 3: User Story 1 (grid display)
4. Complete Phase 4: User Story 2 (status badges)
5. Complete Phase 5: User Story 3 (metadata display)
6. **STOP and VALIDATE**: Test complete grid with all P1 features
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Basic grid works
3. Add User Story 2 → Test independently → Status visible
4. Add User Story 3 → Test independently → Full metadata visible (MVP!)
5. Add User Story 4 → Test independently → Click interaction works
6. Add User Story 5 → Test independently → Menu buttons present
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core grid) - MUST complete first
   - Then in parallel:
     - Developer B: User Story 2 (badges) - extends ListCard
     - Developer C: User Story 3 (metadata) - extends ListCard
     - Developer D: User Story 4 (clicks) - extends ListCard
     - Developer E: User Story 5 (menu) - extends ListCard
3. Stories complete and integrate independently

**Note**: US2-5 all modify ListCard, so coordinate to avoid merge conflicts. Sequential execution recommended for small teams.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are NOT included per specification (not explicitly requested)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- shadcn/ui components are NOT modified after installation (constitution requirement)
- Mock data is temporary and will be replaced with database integration in future
- Console logging is temporary placeholder for navigation (future enhancement)
- Empty state handling is out of scope (assumes at least one list exists)
- Three-dot menu dropdown content is out of scope (tracked in issue #4)

---

## Total Task Count

**Total Tasks**: 37

### Tasks per User Story:
- Setup (Phase 1): 3 tasks
- Foundational (Phase 2): 5 tasks
- User Story 1 (P1): 5 tasks
- User Story 2 (P1): 3 tasks
- User Story 3 (P1): 4 tasks
- User Story 4 (P2): 4 tasks
- User Story 5 (P2): 5 tasks
- Polish (Phase 8): 8 tasks

### Parallel Opportunities Identified:
- Setup phase: 3 tasks can run in parallel
- Foundational phase: 3 tasks (T004, T005, T006) can run in parallel
- User Story 1: 2 tasks (T009, T010) can run in parallel
- Polish phase: 4 tasks (T030, T031, T032, T033) can run in parallel

### Independent Test Criteria:
- **US1**: Navigate to /dashboard, verify 5 cards in responsive grid (1/2/3 columns)
- **US2**: View dashboard, verify distinct Published/Draft badges on all cards
- **US3**: View dashboard, verify all cards show title (truncated), image, place count (singular/plural)
- **US4**: Click cards, verify console logs show list IDs
- **US5**: Click menu buttons, verify no console logs (card click not triggered)

### Suggested MVP Scope:
**Minimum Viable Product**: User Stories 1, 2, and 3 (all P1)
- Provides complete visual portfolio view with status and metadata
- Delivers core value: curators can scan their lists at a glance
- Total MVP tasks: 3 (Setup) + 5 (Foundational) + 5 (US1) + 3 (US2) + 4 (US3) = **20 tasks**

**Enhanced MVP**: Add User Stories 4 and 5 (P2)
- Adds interaction (click to log ID) and future-ready menu buttons
- Total Enhanced MVP tasks: 20 (MVP) + 4 (US4) + 5 (US5) = **29 tasks**

**Full Feature**: All phases including Polish
- Production-ready with accessibility and optimization verification
- Total Full Feature tasks: **37 tasks**

---

## Format Validation

✅ ALL tasks follow the required checklist format:
- ✅ Checkbox prefix: `- [ ]`
- ✅ Task ID: Sequential (T001-T037)
- ✅ [P] marker: Present on parallelizable tasks
- ✅ [Story] label: Present on all user story tasks (US1-US5)
- ✅ Description: Clear action with exact file path
- ✅ Setup/Foundational/Polish: No story label (as required)
- ✅ User Story phases: All have [US#] labels

---

**Implementation Ready**: This task list is immediately executable. Each task is specific enough for an LLM to complete without additional context. Begin with Phase 1 (Setup) and proceed through each phase sequentially, with parallel execution where marked.
