# Data Model: Dashboard UI Feedback States

**Feature**: Dashboard UI Feedback States  
**Date**: 2025-12-07  
**Status**: Complete

## Overview

This feature is UI-only and does not involve database entities or persistent data storage. The data model describes the component state structures and TypeScript types used to manage UI feedback states.

## Type Definitions

### DashboardState (Discriminated Union)

**Purpose**: Type-safe representation of mutually exclusive dashboard states

**Type Definition**:
```typescript
type DashboardState = 
  | { type: 'loading' }
  | { type: 'error'; error: Error }
  | { type: 'success'; lists: List[] };
```

**Fields**:
- `type`: Discriminant field ('loading' | 'error' | 'success')
- `error`: Error object (only present when type is 'error')
- `lists`: Array of List objects (only present when type is 'success')

**State Transitions**:
```
Initial → loading
loading → success (lists loaded)
loading → error (fetch failed)
error → loading (user clicks retry)
success → loading (user triggers refresh)
```

**Validation Rules**:
- Only one type can be active at a time (enforced by TypeScript discriminated union)
- Error state must include an Error object
- Success state must include a lists array (can be empty)

---

### EmptyStateProps

**Purpose**: Props for the EmptyState component

**Type Definition**:
```typescript
interface EmptyStateProps {
  filter: 'all' | 'published' | 'drafts';
  onCreateClick: () => void;
}
```

**Fields**:
- `filter`: Current filter selection, determines message variant
- `onCreateClick`: Callback function when "Create New List" button is clicked

**Validation Rules**:
- `filter` must be one of the three allowed values
- `onCreateClick` must be a function (required, no default)

---

### ErrorStateProps

**Purpose**: Props for the ErrorState component

**Type Definition**:
```typescript
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}
```

**Fields**:
- `error`: Error object containing message details
- `onRetry`: Callback function when "Retry" button is clicked

**Validation Rules**:
- `error` must be an Error object (required)
- `onRetry` must be a function (required, no default)

---

### ListCardSkeletonProps

**Purpose**: Props for the ListCardSkeleton component

**Type Definition**:
```typescript
interface ListCardSkeletonProps {
  // No props required - component is purely presentational
}
```

**Rationale**: The skeleton is a static placeholder with no dynamic behavior, thus requires no props.

---

## Entity Relationships

```
DashboardPage
├── DashboardState (state)
│   ├── loading → renders ListGrid + ListCardSkeleton (6 instances)
│   ├── error → renders ErrorState + error object
│   └── success → renders EmptyState OR ListGrid + ListCard
│       ├── lists.length === 0 → EmptyState + filter
│       └── lists.length > 0 → ListGrid + lists
```

---

## State Management Flow

### Initial Load
```typescript
// Page mount
const [state, setState] = useState<DashboardState>({ type: 'loading' });

// Simulate data fetch
useEffect(() => {
  setState({ type: 'loading' });
  fetchLists()
    .then(lists => setState({ type: 'success', lists }))
    .catch(error => setState({ type: 'error', error }));
}, []);
```

### Error Recovery (Retry)
```typescript
const handleRetry = () => {
  setState({ type: 'loading' });
  // Re-trigger fetch logic
};

// Passed to ErrorState component
<ErrorState error={state.error} onRetry={handleRetry} />
```

### Empty State Action
```typescript
const handleCreateClick = () => {
  console.log('Create new list clicked');
  // TODO: Navigate to list creation flow (future implementation)
};

// Passed to EmptyState component
<EmptyState filter={filter} onCreateClick={handleCreateClick} />
```

---

## Derived Data

### Empty State Messages (Computed)

**Source**: `filter` prop and `lists.length === 0` condition

**Computation Logic**:
```typescript
function getEmptyStateMessage(filter: FilterType): {
  title: string;
  subtitle: string;
} {
  switch (filter) {
    case 'published':
      return {
        title: 'No published lists yet',
        subtitle: 'Publish a list to see it here',
      };
    case 'drafts':
      return {
        title: 'No draft lists yet',
        subtitle: 'Create a draft to see it here',
      };
    default:
      return {
        title: 'No lists yet',
        subtitle: 'Create your first list to get started',
      };
  }
}
```

**Usage**: Called by EmptyState component to determine which message to display

---

### Skeleton Count (Fixed)

**Value**: 6 skeleton cards

**Rationale**: 
- Fills a typical viewport on desktop (2 rows × 3 columns)
- Provides visual feedback without excessive rendering
- Matches common list pagination size

**Implementation**:
```typescript
const skeletonCards = Array(6).fill(null);
```

---

## Type Extensions (Existing Types)

### List Type (No changes required)

**Current Definition** (from `@/types/list.ts`):
```typescript
export interface List {
  id: string;
  title: string;
  heroImageUrl: string;
  isPublished: boolean;
  placeCount: number;
}
```

**Usage**: Unchanged; used in success state's `lists` array

---

## Validation Summary

| Entity | Required Fields | Optional Fields | Validation Rules |
|--------|----------------|-----------------|------------------|
| DashboardState | type | error, lists | Discriminated union ensures mutual exclusivity |
| EmptyStateProps | filter, onCreateClick | - | filter must be valid enum value |
| ErrorStateProps | error, onRetry | - | error must be Error object |
| ListCardSkeletonProps | - | - | No props, no validation |

---

## State Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    Component Mount                       │
└────────────────────┬────────────────────────────────────┘
                     ↓
              { type: 'loading' }
              (render 6 skeletons)
                     ↓
         ┌───────────┴──────────┐
         ↓                      ↓
  { type: 'success',      { type: 'error',
    lists: List[] }         error: Error }
         ↓                      ↓
    ┌────┴─────┐          (render ErrorState
    ↓          ↓           with retry button)
lists.length   lists.length         ↓
   > 0         === 0          User clicks retry
    ↓          ↓                    ↓
 ListGrid   EmptyState      { type: 'loading' }
                                    ↓
                            (cycle repeats)
```

---

## Notes

- **No Database Persistence**: All state is ephemeral and lives in component memory
- **Type Safety**: TypeScript discriminated unions prevent invalid states (e.g., error without error object)
- **Future Extensions**: When real API integration happens, replace mock data fetch with actual API calls; state structure remains unchanged
- **Testing Consideration**: State transitions are key test targets to verify exclusivity and proper error handling
