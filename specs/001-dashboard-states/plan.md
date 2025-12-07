# Implementation Plan: Dashboard UI Feedback States

**Branch**: `001-dashboard-states` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dashboard-states/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements comprehensive UI feedback states for the dashboard to provide appropriate messages and guidance when there are no lists, content is loading, or errors occur. The implementation includes three new components (EmptyState, ListCardSkeleton, ErrorState) with proper state management in the dashboard page, maintaining the existing responsive grid layout (3/2/1 columns). The solution uses shadcn/ui components (Alert exists, Skeleton to be added), lucide-react icons, and follows existing component patterns with a minimum 65% test coverage target.

## Technical Context

**Language/Version**: TypeScript / Next.js 16.0.5 with App Router, React 19.2.0  
**Primary Dependencies**: 
- shadcn/ui (Radix UI primitives) - Alert component exists, Skeleton to be added
- lucide-react 0.555.0 for icons
- Tailwind CSS 4 for styling
- class-variance-authority for variant management

**Storage**: N/A (UI-only feature, no data persistence)  
**Testing**: Vitest 4.0.14 + React Testing Library 16.3.0 + @testing-library/user-event 14.6.1  
**Target Platform**: Web (all modern browsers), responsive design for mobile/tablet/desktop  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: 
- Empty state/error state render within same render cycle (<16ms)
- Skeleton cards appear within 100ms of page load
- No layout shift between states (CLS = 0)

**Constraints**: 
- Must not modify shadcn/ui components directly (composition only)
- Must maintain existing 3/2/1 column responsive grid
- Must achieve minimum 65% test coverage
- Must not break existing dashboard tests

**Scale/Scope**: 
- 3 new UI components (EmptyState, ListCardSkeleton, ErrorState)
- 1 modified page component (dashboard/page.tsx)
- Minimum 3 component test files
- State management using React hooks (no external state library)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Maintainability ✅
- **Single Responsibility**: Each component (EmptyState, ListCardSkeleton, ErrorState) has one clear purpose
- **DRY Compliance**: Checked existing components - no similar feedback state components exist; this does not duplicate functionality
- **Framework Code Integrity**: ✅ CRITICAL - Will NOT modify shadcn/ui Alert or Skeleton components directly; using composition for all feedback state components
- **Readable & Maintainable**: Using TypeScript with proper types, following existing component patterns in src/components/dashboard/

### II. Testing Discipline & Safety Nets ✅
- **Test Coverage**: Target 65% minimum coverage for all new components (EmptyState, ListCardSkeleton, ErrorState)
- **Test-First Development**: Tests will be written alongside implementation (Phase 6 in quickstart)
- **Test Suite Integrity**: All existing dashboard tests must continue passing - verified existing test structure
- **Test Types**: Component tests for all three new components, integration tests for state transitions

### III. User Experience Consistency ✅
- **Consistent Patterns**: Following existing dashboard component patterns (ListCard, ListGrid structure)
- **Visual Consistency**: Using existing shadcn/ui components (Alert, Skeleton) and lucide-react icons
- **Responsive Design**: Maintaining existing 3/2/1 column grid layout across all states
- **Filter Context**: Empty state messages adapt to filter selection (All/Published/Drafts)

### IV. Performance & Resource Efficiency ✅
- **Performance Targets**: 
  - Empty/error states render in same cycle (<16ms)
  - Skeleton cards appear within 100ms
  - No Cumulative Layout Shift (CLS = 0)
- **Resource Efficiency**: Using CSS transforms and Tailwind utilities for animations, no heavy dependencies
- **Measured Approach**: 6 skeletons chosen to balance visual feedback vs. rendering cost

### V. Observability & Debuggability ✅
- **Error Messages**: Clear, actionable error messages with retry mechanism (ErrorState component)
- **Console Logging**: "Create New List" button logs action (stubbed for MVP)
- **State Visibility**: Only one state renders at a time (discriminated union ensures this), making debug easier
- **Type Safety**: TypeScript discriminated union provides compile-time guarantees of state correctness

**POST-DESIGN RE-EVALUATION**:
- ✅ Component contracts defined in contracts/components.md
- ✅ Data model uses discriminated unions for type safety (data-model.md)
- ✅ Quickstart provides clear implementation steps with verification
- ✅ All components follow composition pattern (no direct framework modifications)
- ✅ Test strategy defined with specific coverage targets per component

**GATE STATUS**: ✅ **PASSED** - All principles satisfied after Phase 1 design. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-dashboard-states/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── components.md    # Component contracts (props, state, behavior)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (Next.js App Router)
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardContent.tsx      # Existing
│   │   ├── DashboardHeader.tsx       # Existing
│   │   ├── DashboardSidebar.tsx      # Existing
│   │   ├── ListCard.tsx              # Existing
│   │   ├── ListGrid.tsx              # Existing
│   │   ├── EmptyState.tsx            # NEW - Empty state component
│   │   ├── ListCardSkeleton.tsx      # NEW - Loading skeleton component
│   │   └── ErrorState.tsx            # NEW - Error state component
│   └── ui/
│       ├── alert.tsx                 # Existing - used by ErrorState
│       ├── skeleton.tsx              # NEW - to be added via shadcn/ui
│       └── [other components]        # Existing
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── page.tsx              # MODIFIED - add state management
└── types/
    └── list.ts                       # Existing - may extend for error types

tests/
├── component/
│   └── dashboard/
│       ├── ListCard.test.tsx         # Existing
│       ├── page.test.tsx             # Existing - will need updates
│       ├── EmptyState.test.tsx       # NEW
│       ├── ListCardSkeleton.test.tsx # NEW
│       └── ErrorState.test.tsx       # NEW
└── integration/
    └── dashboard/
        └── state-transitions.test.ts # NEW - test state exclusivity
```

**Structure Decision**: Following established Next.js App Router pattern with components organized by feature area (dashboard/). UI primitives live in components/ui/ (managed by shadcn/ui), feature components in components/dashboard/. Tests mirror source structure in tests/ directory with component and integration test separation.

## Complexity Tracking

> **No violations - this section intentionally left empty**

All Constitution principles are satisfied without requiring additional justification. The design follows existing patterns, uses composition for framework components, and maintains test discipline.

---

## Implementation Phases Summary

### Phase 0: Outline & Research ✅ COMPLETE

**Deliverables**:
- ✅ `research.md` - All research questions answered, no NEEDS CLARIFICATION items
- ✅ Technology decisions documented with rationale
- ✅ Best practices identified for skeleton loading, error states, and empty states

**Key Decisions**:
1. Use shadcn/ui Skeleton component (to be installed via CLI)
2. Use Alert component with destructive variant for errors
3. Use useState with discriminated union for state management
4. Maintain 6 skeleton cards for loading state
5. Component tests + integration tests for 65%+ coverage

---

### Phase 1: Design & Contracts ✅ COMPLETE

**Deliverables**:
- ✅ `data-model.md` - TypeScript type definitions and state transitions
- ✅ `contracts/components.md` - Component API contracts and integration patterns
- ✅ `quickstart.md` - Step-by-step implementation guide with code examples
- ✅ Agent context updated (`.github/agents/copilot-instructions.md`)

**Design Artifacts**:
1. **Component Contracts**: EmptyState, ListCardSkeleton, ErrorState
2. **State Type**: DashboardState discriminated union
3. **Integration Pattern**: State-driven rendering in dashboard page
4. **Test Strategy**: Component tests for each component + integration test for state exclusivity

**Constitution Re-Check**: ✅ All principles satisfied after design

---

## Component Architecture

### Component Hierarchy

```
DashboardPage (Modified)
├── State Management Layer
│   ├── DashboardState (discriminated union)
│   ├── Loading handlers
│   ├── Error handlers
│   └── Empty state handlers
│
└── Render Layer (state-driven)
    ├── Loading State → ListCardSkeleton × 6 (in grid)
    ├── Error State → ErrorState (centered)
    ├── Empty State → EmptyState (centered)
    └── Success State → ListGrid + ListCard (existing)
```

### Component Dependencies

```
EmptyState
├── Button (shadcn/ui)
└── Plus icon (lucide-react)

ListCardSkeleton
├── Card, CardContent (shadcn/ui)
└── Skeleton (shadcn/ui - to be added)

ErrorState
├── Alert, AlertTitle, AlertDescription (shadcn/ui)
├── Button (shadcn/ui)
└── AlertCircle icon (lucide-react)

DashboardPage (updates)
├── EmptyState (new)
├── ListCardSkeleton (new)
├── ErrorState (new)
├── ListGrid (existing)
└── ListCard (existing)
```

---

## State Management Strategy

### State Transitions

```
┌─────────────────────────────────────────────────────┐
│                 Page Mount                          │
│            { type: 'loading' }                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
        ┌──────────┴──────────┐
        │                     │
        ↓                     ↓
 Fetch Success         Fetch Failure
{ type: 'success',   { type: 'error',
  lists: List[] }      error: Error }
        │                     │
        ↓                     ↓
   ┌────┴─────┐         ErrorState
   │          │         with Retry
   ↓          ↓              │
lists.length  lists.length   │
   > 0        === 0          │
   │          │              │
   ↓          ↓              ↓
ListGrid   EmptyState    User clicks retry
           with CTA          │
                            │
                            ↓
                    { type: 'loading' }
                            │
                    (cycle repeats)
```

### State Exclusivity Guarantees

**Type-Level Safety** (TypeScript):
```typescript
type DashboardState = 
  | { type: 'loading' }
  | { type: 'error'; error: Error }
  | { type: 'success'; lists: List[] };
```

**Runtime Enforcement** (Rendering):
```typescript
if (state.type === 'loading') return <LoadingState />;      // Skeletons
if (state.type === 'error') return <ErrorState />;          // Error + retry
if (state.lists.length === 0) return <EmptyState />;        // Empty message
return <ListGrid />;                                         // Content
```

Only ONE condition can be true at any time, ensuring no state overlap.

---

## Testing Strategy

### Coverage Targets

| Component | Target Coverage | Test Count | Key Scenarios |
|-----------|----------------|------------|---------------|
| EmptyState | 80% | ~6 tests | Filter variants, button interaction, accessibility |
| ListCardSkeleton | 70% | ~3 tests | Rendering structure, skeleton elements |
| ErrorState | 80% | ~5 tests | Error display, retry interaction, accessibility |
| State Transitions | 90% | ~8 tests | Loading→Success, Loading→Error, Error→Retry, Empty detection |

**Overall Target**: 65% minimum coverage for all new code

### Test Types

1. **Component Tests** (Vitest + React Testing Library)
   - Rendering correctness
   - User interactions (click, keyboard)
   - Prop variations (filter types, error objects)
   - Accessibility (ARIA, keyboard navigation)

2. **Integration Tests**
   - State exclusivity (only one state renders)
   - State transitions (loading → success/error)
   - Filter context propagation
   - Retry flow end-to-end

3. **Manual Testing**
   - Responsive behavior (3/2/1 columns)
   - Performance (no layout shift)
   - Visual polish (animations, spacing)

---

## Implementation Order & Dependencies

### Critical Path

```
1. Install Skeleton component (shadcn CLI)
   ↓
2. Create ListCardSkeleton (depends on Skeleton)
   ↓
3. Create EmptyState (independent)
   ↓
4. Create ErrorState (independent)
   ↓
5. Update DashboardPage (depends on all three components)
   ↓
6. Write component tests (depends on implementation)
   ↓
7. Write integration tests (depends on page update)
   ↓
8. Validate coverage and polish
```

### Parallel Work Opportunities

- EmptyState and ErrorState can be built in parallel (no dependencies)
- Component tests can be written alongside implementation (TDD approach)
- Documentation updates can happen during implementation

---

## Key Technical Constraints

### Must Follow

1. **Framework Code Integrity**: DO NOT modify shadcn/ui components directly
   - ✅ Use composition to customize Alert and Skeleton
   - ✅ Create wrapper components (ErrorState, ListCardSkeleton)

2. **Responsive Grid Layout**: Maintain existing breakpoints
   - ✅ `lg:grid-cols-3` (desktop)
   - ✅ `md:grid-cols-2` (tablet)
   - ✅ `grid-cols-1` (mobile)

3. **Test Coverage**: Minimum 65% for all new code
   - ✅ Component tests for UI behavior
   - ✅ Integration tests for state logic

4. **No Breaking Changes**: All existing tests must pass
   - ✅ ListCard, ListGrid, DashboardSidebar tests unchanged
   - ✅ Only additive changes to DashboardPage

### Performance Targets

- Empty/Error state render: <16ms (same cycle)
- Skeleton cards appear: <100ms (perceived performance)
- No Cumulative Layout Shift (CLS = 0)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Skeleton component installation fails | High | Low | Pre-verify shadcn CLI works; fallback to manual Skeleton creation |
| Test coverage below 65% | Medium | Low | Write tests alongside implementation; monitor coverage during dev |
| Layout shift between states | Medium | Medium | Use fixed heights for containers; test with Chrome DevTools |
| Existing tests break | High | Low | Run test suite frequently; use TypeScript for compile-time safety |
| State management complexity | Low | Low | Use simple useState; discriminated union prevents invalid states |

---

## Next Steps (Post-Planning)

1. **Ready for Implementation**: All planning artifacts complete
2. **Run `/speckit.tasks`**: Generate granular implementation tasks from this plan
3. **Begin Phase 2**: Start implementation following quickstart.md
4. **Continuous Validation**: Run tests and type checks frequently
5. **Code Review**: Request review before merge
6. **Monitor**: Track coverage and performance metrics

---

## Deliverables Checklist

### Phase 0 (Research) ✅
- [x] `research.md` - 6 research questions answered with decisions and rationale
- [x] Technology choices documented
- [x] Best practices identified

### Phase 1 (Design) ✅
- [x] `data-model.md` - TypeScript types and state transitions
- [x] `contracts/components.md` - Component API contracts
- [x] `quickstart.md` - Implementation guide with code examples
- [x] Agent context updated
- [x] Constitution re-check passed

### Phase 2 (Tasks) - NOT CREATED YET
- [ ] `tasks.md` - To be generated by `/speckit.tasks` command

---

## References

- **Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Contracts**: [contracts/components.md](./contracts/components.md)
- **Quickstart**: [quickstart.md](./quickstart.md)
- **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)

---

**Plan Status**: ✅ **COMPLETE** - Ready for task generation and implementation
**Branch**: `001-dashboard-states`
**Next Command**: `/speckit.tasks` to generate implementation tasks
