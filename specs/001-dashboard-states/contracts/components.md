# Component Contracts: Dashboard UI Feedback States

**Feature**: Dashboard UI Feedback States  
**Date**: 2025-12-07  
**Status**: Complete

This document defines the public API contracts for all new components in this feature.

---

## EmptyState Component

### Purpose
Displays a user-friendly message when no lists are available, with context-aware messaging based on the current filter and a call-to-action to create a new list.

### Props Interface

```typescript
interface EmptyStateProps {
  filter: 'all' | 'published' | 'drafts';
  onCreateClick: () => void;
}
```

### Props Documentation

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `filter` | `'all' \| 'published' \| 'drafts'` | Yes | - | Current filter selection; determines message variant |
| `onCreateClick` | `() => void` | Yes | - | Callback invoked when "Create New List" button is clicked |

### Behavior

**Rendering Logic**:
- Displays a centered container with heading, subtitle, and CTA button
- Message content varies based on `filter` prop:
  - `'all'`: "No lists yet" / "Create your first list to get started"
  - `'published'`: "No published lists yet" / "Publish a list to see it here"
  - `'drafts'`: "No draft lists yet" / "Create a draft to see it here"
- Button always displays "Create New List" with Plus icon

**User Interactions**:
- Clicking the "Create New List" button invokes `onCreateClick` callback
- Button is keyboard accessible (Tab + Enter/Space)

**Accessibility**:
- Semantic HTML with proper heading hierarchy (`<h3>` for title)
- Button has descriptive text (no aria-label needed)
- Color contrast meets WCAG AA standards

### Visual Contract

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <h3 className="text-xl font-semibold">{title}</h3>
  <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
  <Button onClick={onCreateClick} className="mt-4">
    <Plus className="mr-2 h-4 w-4" />
    Create New List
  </Button>
</div>
```

**Layout**:
- Centered horizontally and vertically
- 16rem (64px) vertical padding
- Text-centered alignment
- Responsive (scales on mobile)

### Example Usage

```tsx
import { EmptyState } from '@/components/dashboard/EmptyState';

function DashboardPage() {
  const filter = 'all'; // from URL params
  
  const handleCreate = () => {
    console.log('Create new list clicked');
    // TODO: Navigate to list creation
  };
  
  return <EmptyState filter={filter} onCreateClick={handleCreate} />;
}
```

### Testing Contract

**Required Test Coverage**:
- ✅ Renders correct message for filter='all'
- ✅ Renders correct message for filter='published'
- ✅ Renders correct message for filter='drafts'
- ✅ Calls onCreateClick when button is clicked
- ✅ Calls onCreateClick when button is activated via keyboard (Enter/Space)
- ✅ Renders Plus icon in button

---

## ListCardSkeleton Component

### Purpose
Displays a placeholder skeleton that mimics the visual structure of a ListCard during loading states, providing visual feedback to users.

### Props Interface

```typescript
interface ListCardSkeletonProps {
  // No props - purely presentational
}
```

### Behavior

**Rendering Logic**:
- Renders a Card with Skeleton placeholders matching ListCard structure:
  - Hero image placeholder (16:9 aspect ratio)
  - Title placeholder (3/4 width)
  - Place count placeholder (1/2 width)
  - Badge placeholder (fixed width)

**User Interactions**:
- None (static placeholder, no interactivity)

**Accessibility**:
- Uses aria-hidden or aria-busy attributes
- Screen readers should announce loading state at page level, not per skeleton

### Visual Contract

```tsx
<Card>
  <CardContent className="p-0">
    <Skeleton className="aspect-[16/9] rounded-t-lg" />
    <div className="p-4">
      <Skeleton className="mb-2 h-6 w-3/4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  </CardContent>
</Card>
```

**Layout**:
- Matches ListCard dimensions exactly
- 16:9 aspect ratio image area
- 1rem (16px) padding in content area
- 0.5rem (8px) margin between elements

**Animation**:
- Uses Skeleton component's built-in shimmer animation
- No custom animations required

### Example Usage

```tsx
import { ListCardSkeleton } from '@/components/dashboard/ListCardSkeleton';
import { ListGrid } from '@/components/dashboard/ListGrid';

function LoadingState() {
  const skeletons = Array(6).fill(null);
  
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {skeletons.map((_, index) => (
        <ListCardSkeleton key={index} />
      ))}
    </div>
  );
}
```

### Testing Contract

**Required Test Coverage**:
- ✅ Renders Card component
- ✅ Renders hero image skeleton (aspect-[16/9])
- ✅ Renders title skeleton placeholder
- ✅ Renders place count skeleton placeholder
- ✅ Renders badge skeleton placeholder
- ✅ Matches ListCard structure (visual regression)

---

## ErrorState Component

### Purpose
Displays a clear error message when list loading fails, with a retry mechanism to allow users to recover without leaving the page.

### Props Interface

```typescript
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}
```

### Props Documentation

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `error` | `Error` | Yes | - | Error object containing failure details |
| `onRetry` | `() => void` | Yes | - | Callback invoked when "Retry" button is clicked |

### Behavior

**Rendering Logic**:
- Displays a centered Alert with destructive variant
- Shows error icon (AlertCircle from lucide-react)
- Displays error title: "Failed to load lists"
- Displays error description with retry button
- Error message can be dynamic (from error.message) or generic

**User Interactions**:
- Clicking "Retry" button invokes `onRetry` callback
- Button is keyboard accessible (Tab + Enter/Space)
- Clicking retry should clear error state and trigger loading

**Accessibility**:
- Alert has role="alert" for screen reader announcement
- Destructive styling provides visual severity indication
- Button has clear action label ("Retry")

### Visual Contract

```tsx
<div className="flex flex-col items-center justify-center py-16">
  <Alert variant="destructive" className="max-w-md">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Failed to load lists</AlertTitle>
    <AlertDescription>
      We couldn't load your lists. Please try again.
      <Button 
        onClick={onRetry} 
        variant="outline" 
        size="sm" 
        className="ml-2"
      >
        Retry
      </Button>
    </AlertDescription>
  </Alert>
</div>
```

**Layout**:
- Centered horizontally and vertically
- 16rem (64px) vertical padding
- Alert max-width: 28rem (448px)
- Inline retry button with left margin

**Styling**:
- Alert: destructive variant (red/error colors)
- Button: outline variant, small size
- Icon: 1rem (16px) size

### Example Usage

```tsx
import { ErrorState } from '@/components/dashboard/ErrorState';

function DashboardPage() {
  const [error, setError] = useState<Error | null>(null);
  
  const handleRetry = () => {
    setError(null);
    // Re-trigger data fetch
    fetchLists()
      .catch(err => setError(err));
  };
  
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }
  
  // ... rest of component
}
```

### Testing Contract

**Required Test Coverage**:
- ✅ Renders Alert with destructive variant
- ✅ Renders AlertCircle icon
- ✅ Renders error title
- ✅ Renders error description
- ✅ Renders Retry button
- ✅ Calls onRetry when button is clicked
- ✅ Calls onRetry when button is activated via keyboard

---

## Dashboard Page State Management Contract

### Purpose
Manages the mutually exclusive states of the dashboard (loading, error, empty, content) and orchestrates component rendering.

### State Interface

```typescript
type DashboardState = 
  | { type: 'loading' }
  | { type: 'error'; error: Error }
  | { type: 'success'; lists: List[] };
```

### State Transitions

```typescript
// Initial state
const [state, setState] = useState<DashboardState>({ type: 'loading' });

// Transition to success
setState({ type: 'success', lists: fetchedLists });

// Transition to error
setState({ type: 'error', error: new Error('Fetch failed') });

// Transition back to loading (retry)
setState({ type: 'loading' });
```

### Rendering Logic

```typescript
function renderContent(state: DashboardState, filter: FilterType) {
  // Loading state
  if (state.type === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(6).fill(null).map((_, i) => (
          <ListCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  // Error state
  if (state.type === 'error') {
    return (
      <ErrorState 
        error={state.error} 
        onRetry={() => setState({ type: 'loading' })} 
      />
    );
  }
  
  // Success state with empty list
  if (state.lists.length === 0) {
    return (
      <EmptyState 
        filter={filter}
        onCreateClick={() => console.log('Create clicked')}
      />
    );
  }
  
  // Success state with content
  return <ListGrid lists={state.lists} onListClick={handleListClick} />;
}
```

### Behavior Guarantees

**State Exclusivity**:
- Only ONE state component renders at any time
- TypeScript discriminated union enforces compile-time safety
- Runtime checks ensure proper state transitions

**Error Recovery**:
- Error state always includes retry mechanism
- Retry transitions to loading state
- Original error is cleared on retry

**Empty State Detection**:
- Empty state only shown in success state with zero lists
- Loading state never shows empty state
- Error state takes precedence over empty state

### Testing Contract

**Required Test Coverage**:
- ✅ Initial state is 'loading'
- ✅ Loading state renders 6 skeleton cards
- ✅ Successful fetch transitions to success state
- ✅ Failed fetch transitions to error state
- ✅ Success with no lists shows EmptyState
- ✅ Success with lists shows ListGrid
- ✅ Retry transitions from error to loading
- ✅ Only one state renders at a time (exclusivity)

---

## Integration Contract

### Component Composition

```
DashboardPage
├── Filter Tabs (existing)
├── State-Driven Content:
│   ├── Loading State
│   │   └── Grid of 6 × ListCardSkeleton
│   ├── Error State
│   │   └── ErrorState (with retry)
│   ├── Empty State
│   │   └── EmptyState (with create CTA)
│   └── Success State
│       └── ListGrid + ListCard (existing)
```

### Data Flow

```
User Action → State Change → Component Re-render → UI Update

Examples:
1. Page load → 'loading' → ListCardSkeleton grid
2. Fetch success → 'success' → EmptyState | ListGrid
3. Fetch error → 'error' → ErrorState
4. Retry click → 'loading' → ListCardSkeleton grid
5. Create click → console.log (future: navigation)
```

### Breaking Changes

**None**: This feature is additive and does not modify existing component APIs.

**Modified Files**:
- `src/app/(dashboard)/dashboard/page.tsx`: State management logic added
  - Existing ListGrid integration unchanged
  - Filter logic preserved
  - No breaking changes to existing functionality

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-07 | Initial contract definition |

---

## References

- [Feature Spec](../spec.md)
- [Data Model](../data-model.md)
- [Research Findings](../research.md)
