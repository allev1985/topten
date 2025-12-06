# Tasks: Dialog Component and Image Configuration Setup

**Feature**: 001-dialog-component-setup  
**Input**: Design documents from `/specs/001-dialog-component-setup/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to repository root: `/home/runner/work/topten/topten`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project prerequisites and prepare for component installation

- [x] T001 Verify shadcn/ui configuration exists in components.json at repository root
- [x] T002 Verify existing UI components are present in src/components/ui/ (button.tsx, input.tsx, label.tsx)
- [x] T003 Verify pnpm package manager is available (pnpm --version)

**Checkpoint**: Project prerequisites validated - ready for component installation

---

## Phase 2: User Story 1 - Display Modal Overlays (Priority: P1) 🎯 MVP

**Goal**: Enable modal dialog functionality for confirmations, forms, and detail views with full keyboard accessibility

**Independent Test**: Create a test page with a simple dialog, verify it opens on button click, closes with ESC key, and returns focus to trigger button

### Implementation for User Story 1

- [x] T004 [US1] Install Dialog component using shadcn CLI: `pnpm dlx shadcn@latest add dialog` from repository root
- [x] T005 [US1] Verify Dialog component installed at src/components/ui/dialog.tsx
- [x] T006 [US1] Verify @radix-ui/react-dialog dependency added to package.json
- [x] T007 [US1] Create test page at src/app/test-dialog/page.tsx with simple dialog example from quickstart.md
- [x] T008 [US1] Verify dialog opens and closes correctly in development mode (pnpm dev)
- [x] T009 [US1] Test keyboard navigation (ESC closes, Tab cycles focus within dialog)
- [x] T010 [US1] Test focus management (focus returns to trigger on close)
- [x] T011 [US1] Verify dialog has proper ARIA attributes (role="dialog", aria-modal="true")
- [x] T012 [US1] Run build to ensure no compilation errors: `pnpm build`
- [x] T013 [US1] Remove test page at src/app/test-dialog/page.tsx

**Checkpoint**: Dialog component fully functional - can be used throughout application for modal interactions

---

## Phase 3: User Story 2 - View Placeholder Content During Development (Priority: P2)

**Goal**: Enable external placeholder images from placehold.co for realistic page layout previews

**Independent Test**: Add a Next.js Image component with placehold.co source to a page, verify it loads without errors and displays correctly

### Implementation for User Story 2

- [x] T014 [US2] Update next.config.ts to add remotePatterns for placehold.co per contracts/nextjs-image-config.md
- [x] T015 [US2] Verify configuration syntax follows TypeScript NextConfig type
- [x] T016 [US2] Create test page at src/app/test-images/page.tsx with placeholder image examples
- [x] T017 [US2] Test basic placeholder image loads: https://placehold.co/600x400
- [x] T018 [US2] Test placeholder with custom text: https://placehold.co/400x300?text=Test
- [x] T019 [US2] Test responsive placeholder image with fill prop
- [x] T020 [US2] Run build to verify image configuration is valid: `pnpm build`
- [x] T021 [US2] Verify no console warnings about unconfigured image hosts
- [x] T022 [US2] Remove test page at src/app/test-images/page.tsx

**Checkpoint**: External placeholder images working - can be used for development and design iteration

---

## Phase 4: Integration & Validation

**Purpose**: Verify both user stories work together and validate against acceptance criteria

- [x] T023 Create integration test page at src/app/test-integration/page.tsx combining Dialog with placeholder images
- [x] T024 Test dialog containing placeholder image (per quickstart.md PlaceDetailsDialog pattern)
- [x] T025 Verify dialog with image opens, displays image correctly, and closes properly
- [x] T026 Run full build: `pnpm build` to ensure no errors
- [x] T027 Test production build locally: `pnpm start` and verify all functionality
- [x] T028 Remove integration test page at src/app/test-integration/page.tsx

**Checkpoint**: Both user stories independently functional and work together correctly

---

## Phase 5: Documentation & Polish

**Purpose**: Finalize documentation and ensure quickstart guide is accurate

- [x] T029 [P] Verify quickstart.md examples work as documented
- [x] T030 [P] Verify contracts/dialog-component-api.md matches installed component exports
- [x] T031 [P] Verify contracts/nextjs-image-config.md matches next.config.ts configuration
- [x] T032 Update .github/copilot-instructions.md with Dialog component usage patterns (run update-agent-context.sh)
- [x] T033 Add comment to next.config.ts documenting that placehold.co is for development only
- [x] T034 Final build validation: `pnpm build` with no errors or warnings

**Checkpoint**: Feature complete, documented, and ready for use by development team

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion - installs Dialog component
- **User Story 2 (Phase 3)**: Depends on Setup completion - can run in parallel with US1
- **Integration (Phase 4)**: Depends on both US1 and US2 completion
- **Documentation (Phase 5)**: Depends on Integration completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) - No dependencies on US2
- **User Story 2 (P2)**: Can start after Setup (Phase 1) - No dependencies on US1
- **Stories are independent**: US1 and US2 can be implemented in parallel by different developers

### Within Each User Story

**User Story 1 (Dialog Component)**:

1. Install component (T004)
2. Verify installation (T005-T006)
3. Create test page and validate (T007-T011)
4. Build validation (T012)
5. Cleanup (T013)

**User Story 2 (Image Configuration)**:

1. Update configuration (T014-T015)
2. Create test page (T016)
3. Test various image patterns (T017-T019)
4. Build validation (T020-T021)
5. Cleanup (T022)

### Parallel Opportunities

- **Phase 1**: All verification tasks (T001-T003) can be done in sequence or verified together
- **User Stories**: US1 (T004-T013) and US2 (T014-T022) can be worked on in parallel by different developers
- **Phase 5**: Documentation tasks (T029-T031) marked [P] can run in parallel

---

## Parallel Example: Independent User Stories

```bash
# Developer A: User Story 1 (Dialog Component)
Task: "Install Dialog component using shadcn CLI"
Task: "Verify Dialog component installed at src/components/ui/dialog.tsx"
Task: "Create test page at src/app/test-dialog/page.tsx"
Task: "Test keyboard navigation and accessibility"

# Developer B: User Story 2 (Image Configuration) - CAN RUN IN PARALLEL
Task: "Update next.config.ts to add remotePatterns"
Task: "Create test page at src/app/test-images/page.tsx"
Task: "Test placeholder images load correctly"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: User Story 1 (T004-T013)
3. **STOP and VALIDATE**: Test Dialog component independently
4. Can start using Dialog in application immediately

### Incremental Delivery

1. Complete Setup → Foundation ready
2. Add User Story 1 (Dialog) → Test independently → **Can be used immediately**
3. Add User Story 2 (Images) → Test independently → **Complete development tooling**
4. Integration validation → **Both features work together**
5. Each story adds value without breaking previous work

### Parallel Team Strategy

With multiple developers:

1. Everyone completes Setup together (T001-T003)
2. Once Setup is done:
   - **Developer A**: User Story 1 - Dialog Component (T004-T013)
   - **Developer B**: User Story 2 - Image Configuration (T014-T022)
3. Then collaborate on Integration (T023-T028)
4. Split Documentation tasks (T029-T034)

---

## Success Criteria Validation

After completing all tasks, verify against spec.md success criteria:

### User Story 1 Success Criteria

- [ ] **SC-001**: Modal interactions complete in under 5 seconds (trigger to completion)
- [ ] **SC-002**: Application builds successfully with zero errors related to modal functionality
- [ ] **SC-004**: Keyboard accessible with 100% success rate (ESC, Tab, Enter navigation)
- [ ] **SC-005**: Screen readers announce dialog content with proper role and label information

### User Story 2 Success Criteria

- [ ] **SC-002**: Application builds successfully with zero errors related to image functionality
- [ ] **SC-003**: External placeholder images load within 2 seconds on standard network

### Overall Success Criteria

- [ ] **SC-002**: Build succeeds with zero errors: `pnpm build` exits with code 0
- [ ] Dialog component installed and accessible via `@/components/ui/dialog`
- [ ] Next.js configured to allow images from https://placehold.co
- [ ] All quickstart.md examples work as documented
- [ ] Ready for use in actual feature development (list deletion, place details, etc.)

---

## Notes

- All test pages created during implementation are temporary and removed after validation
- Dialog component should not be modified after installation (use as-is from shadcn/ui)
- Placeholder images are for development only - add comment in next.config.ts
- Each user story delivers independently testable value
- Focus on validation over implementation (component is pre-built, just installing)
- Build must succeed after each major phase
- Keep test pages simple - just validate functionality, don't build complex examples

---

## Edge Cases to Validate

During testing, verify behavior for edge cases identified in spec.md:

- [ ] Multiple modal instances (verify only one modal at a time pattern works)
- [ ] Modal open during navigation (verify modal closes automatically)
- [ ] Modal content exceeds viewport height (verify scrolling works)
- [ ] External image temporarily unavailable (verify graceful degradation)
- [ ] Image loading doesn't block page interaction

---

## Total Task Count

- **Setup**: 3 tasks (T001-T003)
- **User Story 1**: 10 tasks (T004-T013)
- **User Story 2**: 9 tasks (T014-T022)
- **Integration**: 6 tasks (T023-T028)
- **Documentation**: 6 tasks (T029-T034)
- **Total**: 34 tasks

**Estimated Effort**:

- Setup: 15 minutes
- User Story 1: 45 minutes (installation + validation)
- User Story 2: 30 minutes (configuration + validation)
- Integration: 20 minutes
- Documentation: 20 minutes
- **Total**: ~2 hours for complete feature implementation
