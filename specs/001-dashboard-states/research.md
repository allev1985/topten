# Research: Dashboard UI Feedback States

**Feature**: Dashboard UI Feedback States  
**Date**: 2025-12-07  
**Status**: Complete

## Research Questions & Findings

### 1. Skeleton Loading Patterns with shadcn/ui

**Question**: What are the best practices for implementing skeleton loading states using shadcn/ui Skeleton component?

**Decision**: Use shadcn/ui Skeleton component with custom composition for ListCardSkeleton

**Rationale**: 
- shadcn/ui provides a base Skeleton component that can be added via CLI (`npx shadcn@latest add skeleton`)
- The component uses Tailwind CSS animations for shimmer effect
- Follows the pattern of composing multiple Skeleton elements to match target component structure
- Maintains accessibility with proper ARIA attributes

**Alternatives Considered**:
- Custom CSS skeleton implementation - Rejected because shadcn/ui is already the project standard
- Third-party skeleton library (react-loading-skeleton) - Rejected to avoid additional dependencies

**Implementation Pattern**:
```tsx
// ListCardSkeleton will compose multiple Skeleton primitives
<Card>
  <Skeleton className="aspect-[16/9]" /> {/* Image placeholder */}
  <div className="p-4">
    <Skeleton className="h-6 w-3/4" />  {/* Title */}
    <Skeleton className="h-4 w-1/2" />  {/* Place count */}
  </div>
</Card>
```

**References**:
- shadcn/ui Skeleton documentation: https://ui.shadcn.com/docs/components/skeleton
- Pattern matches existing ListCard structure for seamless transition

---

### 2. Error State UX Patterns

**Question**: What are the best practices for displaying error states with retry functionality in React applications?

**Decision**: Use shadcn/ui Alert component with destructive variant and embedded retry Button

**Rationale**:
- Alert component already exists in the project (src/components/ui/alert.tsx)
- Destructive variant provides appropriate visual severity
- Inline retry button keeps user in context without navigation
- Centered layout matches empty state consistency

**Alternatives Considered**:
- Toast notifications - Rejected because error state needs to persist until resolved
- Modal dialog - Rejected because it's too intrusive for a recoverable error
- Custom error banner - Rejected to maintain shadcn/ui consistency

**Implementation Pattern**:
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Failed to load lists</AlertTitle>
  <AlertDescription>
    We couldn't load your lists. Please try again.
    <Button onClick={onRetry} variant="outline" size="sm">
      Retry
    </Button>
  </AlertDescription>
</Alert>
```

**References**:
- shadcn/ui Alert: https://ui.shadcn.com/docs/components/alert
- Material Design error patterns for retry UX
- Existing Alert component in project at src/components/ui/alert.tsx

---

### 3. Empty State Design Patterns

**Question**: What are effective empty state patterns that guide users to take action?

**Decision**: Centered message with heading, descriptive text, and prominent CTA button

**Rationale**:
- Follows common empty state UX patterns (heading + subtitle + action)
- Filter-aware messaging provides context-specific guidance
- CTA button uses primary styling for visual hierarchy
- Centered alignment matches error state for consistency

**Alternatives Considered**:
- Illustration/icon-based empty state - Rejected for MVP to reduce scope
- Inline suggestion without CTA - Rejected because explicit action is clearer
- Sidebar placement - Rejected because centered is more prominent

**Implementation Pattern**:
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <h3 className="text-xl font-semibold">No lists yet</h3>
  <p className="text-muted-foreground mt-2">
    Create your first list to get started
  </p>
  <Button onClick={onCreate} className="mt-4">
    <Plus className="mr-2 h-4 w-4" />
    Create New List
  </Button>
</div>
```

**References**:
- Nielsen Norman Group: Empty State UX Guidelines
- Pattern matches existing dashboard component styling
- Uses lucide-react Plus icon (already in dependencies)

---

### 4. State Management for Loading/Error/Empty States

**Question**: What's the best approach to manage mutually exclusive UI states in React?

**Decision**: Use useState hooks with discriminated union type for state management

**Rationale**:
- No external state library needed for this feature scope
- Discriminated union type ensures only one state is active at a time (type safety)
- useState is sufficient for component-local state
- Follows existing dashboard page patterns (already uses useState)

**Alternatives Considered**:
- useReducer - Rejected as overkill for simple state transitions
- External state library (Zustand/Redux) - Rejected to avoid new dependencies
- React Query - Rejected because we're using mock data currently

**Implementation Pattern**:
```tsx
type DashboardState = 
  | { type: 'loading' }
  | { type: 'error'; error: Error }
  | { type: 'success'; lists: List[] };

const [state, setState] = useState<DashboardState>({ type: 'loading' });

// Render logic
if (state.type === 'loading') return <LoadingState />;
if (state.type === 'error') return <ErrorState error={state.error} />;
if (state.lists.length === 0) return <EmptyState />;
return <ListGrid lists={state.lists} />;
```

**References**:
- TypeScript discriminated unions pattern
- Existing dashboard page at src/app/(dashboard)/dashboard/page.tsx uses useState

---

### 5. Responsive Grid Layout Preservation

**Question**: How to maintain the 3/2/1 column grid layout across all feedback states?

**Decision**: Wrap skeleton cards in existing ListGrid component; use full-width containers for empty/error states

**Rationale**:
- Skeleton cards should fill the grid to preview actual layout
- Empty and error states are singular, centered messages (not grid-based)
- Reusing ListGrid for skeletons avoids code duplication
- Maintains existing responsive breakpoints (lg:grid-cols-3 md:grid-cols-2)

**Alternatives Considered**:
- Custom skeleton grid - Rejected because ListGrid already implements responsive logic
- Grid layout for empty state - Rejected because empty state is a single message
- Separate responsive logic - Rejected to follow DRY principle

**Implementation Pattern**:
```tsx
// Loading state - reuse ListGrid
<ListGrid 
  lists={Array(6).fill(null).map((_, i) => ({ id: `skeleton-${i}` }))}
  renderCard={(_, index) => <ListCardSkeleton key={index} />}
/>

// Empty/error state - centered container
<div className="flex flex-col items-center justify-center py-16">
  {/* Message content */}
</div>
```

**References**:
- Existing ListGrid at src/components/dashboard/ListGrid.tsx
- Current responsive classes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

### 6. Test Coverage Strategy

**Question**: How to achieve 65% minimum test coverage while focusing on critical paths?

**Decision**: Component tests for all three new components + integration test for state transitions

**Rationale**:
- Component tests verify rendering and user interactions (click, keyboard)
- Integration test verifies state exclusivity (only one state at a time)
- Follows existing test patterns in tests/component/dashboard/
- Vitest + React Testing Library already configured

**Test Coverage Plan**:
1. **EmptyState.test.tsx** (~80% target)
   - Renders heading and description
   - Filter-specific messages (all/published/drafts)
   - Create button click handler
   - Accessibility (keyboard navigation)

2. **ListCardSkeleton.test.tsx** (~70% target)
   - Renders skeleton elements
   - Matches ListCard structure
   - Responsive behavior

3. **ErrorState.test.tsx** (~80% target)
   - Renders error message
   - Retry button functionality
   - Accessibility

4. **state-transitions.test.ts** (~90% target)
   - Loading → Success transition
   - Loading → Error transition
   - Error → Loading (retry)
   - Empty state when success with no lists
   - State exclusivity verification

**Alternatives Considered**:
- E2E tests only - Rejected because component tests provide faster feedback
- Snapshot tests - Rejected because they're brittle and don't test behavior
- Lower coverage threshold - Rejected because 65% is project minimum

**References**:
- Existing test at tests/component/dashboard/ListCard.test.tsx
- Vitest config with coverage at vitest.config.ts
- React Testing Library patterns already in use

---

## Summary of Decisions

| Decision Area | Choice | Key Rationale |
|--------------|--------|---------------|
| Skeleton Component | shadcn/ui Skeleton | Already project standard, CLI-installable |
| Error Display | Alert (destructive) + Button | Existing component, appropriate severity |
| Empty State Pattern | Centered heading + CTA | Standard UX pattern, clear action |
| State Management | useState + discriminated union | Type-safe, no new dependencies |
| Grid Layout | Reuse ListGrid for skeletons | DRY principle, consistent responsive |
| Testing Strategy | Component + Integration tests | Existing pattern, achieves coverage goal |

All research questions resolved. No NEEDS CLARIFICATION items remaining. Ready to proceed to Phase 1 (Design & Contracts).
