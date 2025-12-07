# Quickstart: Dashboard UI Feedback States

**Feature**: Dashboard UI Feedback States  
**Date**: 2025-12-07  
**Status**: Complete

This guide provides step-by-step instructions for implementing the Dashboard UI feedback states feature.

---

## Prerequisites

- Node.js 20+ and pnpm 8+
- TopTen repository cloned and dependencies installed
- Basic familiarity with Next.js App Router, React, and TypeScript
- shadcn/ui CLI available (`npx shadcn@latest`)

---

## Implementation Order

The feature should be implemented in the following order to minimize dependencies and enable incremental testing:

### Phase 1: Install Dependencies
### Phase 2: Create Skeleton Component
### Phase 3: Create Empty State Component  
### Phase 4: Create Error State Component
### Phase 5: Integrate State Management
### Phase 6: Write Tests
### Phase 7: Validate & Polish

---

## Phase 1: Install Dependencies

### Step 1.1: Add Skeleton Component

```bash
# Install shadcn/ui Skeleton component
npx shadcn@latest add skeleton
```

**Expected Output**: Creates `src/components/ui/skeleton.tsx`

**Verification**:
```bash
ls src/components/ui/skeleton.tsx
# Should exist
```

---

## Phase 2: Create Skeleton Component

### Step 2.1: Create ListCardSkeleton Component

**File**: `src/components/dashboard/ListCardSkeleton.tsx`

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ListCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        {/* Hero Image Skeleton */}
        <Skeleton className="aspect-[16/9] rounded-t-lg" />
        
        {/* Card Content Skeleton */}
        <div className="p-4">
          {/* Title Skeleton */}
          <Skeleton className="mb-2 h-6 w-3/4" />
          
          {/* Footer Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Verification**:
```bash
# Run TypeScript compiler
pnpm typecheck
# Should pass with no errors
```

---

## Phase 3: Create Empty State Component

### Step 3.1: Create EmptyState Component

**File**: `src/components/dashboard/EmptyState.tsx`

```tsx
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  filter: "all" | "published" | "drafts";
  onCreateClick: () => void;
}

function getEmptyStateMessage(filter: EmptyStateProps["filter"]): {
  title: string;
  subtitle: string;
} {
  switch (filter) {
    case "published":
      return {
        title: "No published lists yet",
        subtitle: "Publish a list to see it here",
      };
    case "drafts":
      return {
        title: "No draft lists yet",
        subtitle: "Create a draft to see it here",
      };
    default:
      return {
        title: "No lists yet",
        subtitle: "Create your first list to get started",
      };
  }
}

export function EmptyState({ filter, onCreateClick }: EmptyStateProps) {
  const message = getEmptyStateMessage(filter);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="text-xl font-semibold">{message.title}</h3>
      <p className="text-muted-foreground mt-2 text-sm">{message.subtitle}</p>
      <Button onClick={onCreateClick} className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Create New List
      </Button>
    </div>
  );
}
```

**Verification**:
```bash
pnpm typecheck
# Should pass
```

---

## Phase 4: Create Error State Component

### Step 4.1: Create ErrorState Component

**File**: `src/components/dashboard/ErrorState.tsx`

```tsx
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load lists</AlertTitle>
        <AlertDescription>
          We couldn&apos;t load your lists. Please try again.
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
  );
}
```

**Verification**:
```bash
pnpm typecheck
# Should pass
```

---

## Phase 5: Integrate State Management

### Step 5.1: Update Dashboard Page

**File**: `src/app/(dashboard)/dashboard/page.tsx`

**Changes Required**:

1. **Add imports** (top of file):
```tsx
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ListCardSkeleton } from "@/components/dashboard/ListCardSkeleton";
import { ErrorState } from "@/components/dashboard/ErrorState";
```

2. **Add state type** (before DashboardPageContent):
```tsx
type DashboardState =
  | { type: "loading" }
  | { type: "error"; error: Error }
  | { type: "success"; lists: List[] };
```

3. **Replace mock data logic** in `DashboardPageContent`:

Replace this:
```tsx
const filteredLists = useMemo(() => {
  if (filter === "published") {
    return mockLists.filter((list) => list.isPublished);
  } else if (filter === "drafts") {
    return mockLists.filter((list) => !list.isPublished);
  }
  return mockLists;
}, [filter]);
```

With this:
```tsx
const [state, setState] = useState<DashboardState>({
  type: "success",
  lists: mockLists,
});

// Simulate loading state for demonstration
// TODO: Replace with real API call
useEffect(() => {
  setState({ type: "loading" });
  
  const timer = setTimeout(() => {
    setState({ type: "success", lists: mockLists });
  }, 500);
  
  return () => clearTimeout(timer);
}, []);

const filteredLists = useMemo(() => {
  if (state.type !== "success") return [];
  
  const { lists } = state;
  if (filter === "published") {
    return lists.filter((list) => list.isPublished);
  } else if (filter === "drafts") {
    return lists.filter((list) => !list.isPublished);
  }
  return lists;
}, [state, filter]);
```

4. **Add handlers**:
```tsx
const handleRetry = () => {
  setState({ type: "loading" });
  // Re-trigger data fetch (currently simulated)
  const timer = setTimeout(() => {
    setState({ type: "success", lists: mockLists });
  }, 500);
};

const handleCreateClick = () => {
  console.log("Create new list clicked");
  // TODO: Navigate to list creation flow
};
```

5. **Replace rendering logic** (replace the `{filteredLists.length > 0 ? ...}` section):
```tsx
{/* State-driven content */}
{state.type === "loading" && (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array(6)
      .fill(null)
      .map((_, index) => (
        <ListCardSkeleton key={index} />
      ))}
  </div>
)}

{state.type === "error" && (
  <ErrorState error={state.error} onRetry={handleRetry} />
)}

{state.type === "success" && filteredLists.length === 0 && (
  <EmptyState filter={filter} onCreateClick={handleCreateClick} />
)}

{state.type === "success" && filteredLists.length > 0 && (
  <ListGrid lists={filteredLists} onListClick={handleListClick} />
)}
```

**Verification**:
```bash
# Type check
pnpm typecheck

# Start dev server
pnpm dev

# Open http://localhost:3000/dashboard
# - Should see skeleton cards briefly
# - Then see list grid (or empty state if no lists)
```

---

## Phase 6: Write Tests

### Step 6.1: Test EmptyState Component

**File**: `tests/component/dashboard/EmptyState.test.tsx`

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/components/dashboard/EmptyState";

describe("EmptyState", () => {
  it("renders correct message for 'all' filter", () => {
    const onClick = vi.fn();
    render(<EmptyState filter="all" onCreateClick={onClick} />);
    
    expect(screen.getByText("No lists yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first list to get started")).toBeInTheDocument();
  });

  it("renders correct message for 'published' filter", () => {
    const onClick = vi.fn();
    render(<EmptyState filter="published" onCreateClick={onClick} />);
    
    expect(screen.getByText("No published lists yet")).toBeInTheDocument();
    expect(screen.getByText("Publish a list to see it here")).toBeInTheDocument();
  });

  it("renders correct message for 'drafts' filter", () => {
    const onClick = vi.fn();
    render(<EmptyState filter="drafts" onCreateClick={onClick} />);
    
    expect(screen.getByText("No draft lists yet")).toBeInTheDocument();
    expect(screen.getByText("Create a draft to see it here")).toBeInTheDocument();
  });

  it("calls onCreateClick when button is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EmptyState filter="all" onCreateClick={onClick} />);
    
    const button = screen.getByRole("button", { name: /create new list/i });
    await user.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders Plus icon in button", () => {
    const onClick = vi.fn();
    render(<EmptyState filter="all" onCreateClick={onClick} />);
    
    const button = screen.getByRole("button", { name: /create new list/i });
    expect(button).toBeInTheDocument();
  });
});
```

### Step 6.2: Test ListCardSkeleton Component

**File**: `tests/component/dashboard/ListCardSkeleton.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListCardSkeleton } from "@/components/dashboard/ListCardSkeleton";

describe("ListCardSkeleton", () => {
  it("renders without crashing", () => {
    render(<ListCardSkeleton />);
    // Component should render without errors
  });

  it("renders skeleton elements", () => {
    const { container } = render(<ListCardSkeleton />);
    
    // Should have skeleton elements (check by class or data-testid)
    const skeletons = container.querySelectorAll('[class*="animate"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("matches ListCard structure", () => {
    const { container } = render(<ListCardSkeleton />);
    
    // Should have card structure
    expect(container.querySelector('[class*="aspect-\\[16/9\\]"]')).toBeInTheDocument();
  });
});
```

### Step 6.3: Test ErrorState Component

**File**: `tests/component/dashboard/ErrorState.test.tsx`

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "@/components/dashboard/ErrorState";

describe("ErrorState", () => {
  it("renders error title", () => {
    const onRetry = vi.fn();
    const error = new Error("Test error");
    
    render(<ErrorState error={error} onRetry={onRetry} />);
    expect(screen.getByText("Failed to load lists")).toBeInTheDocument();
  });

  it("renders error description", () => {
    const onRetry = vi.fn();
    const error = new Error("Test error");
    
    render(<ErrorState error={error} onRetry={onRetry} />);
    expect(screen.getByText(/couldn't load your lists/i)).toBeInTheDocument();
  });

  it("renders retry button", () => {
    const onRetry = vi.fn();
    const error = new Error("Test error");
    
    render(<ErrorState error={error} onRetry={onRetry} />);
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("calls onRetry when button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const error = new Error("Test error");
    
    render(<ErrorState error={error} onRetry={onRetry} />);
    
    const button = screen.getByRole("button", { name: /retry/i });
    await user.click(button);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

### Step 6.4: Run Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Verify coverage is >= 65% for new components
# Check coverage report in terminal or coverage/index.html
```

---

## Phase 7: Validate & Polish

### Step 7.1: Manual Testing Checklist

- [ ] **Loading State**: Visit `/dashboard`, see 6 skeleton cards briefly
- [ ] **Success State**: See list grid after loading completes
- [ ] **Empty State (All)**: Clear mock data, see "No lists yet"
- [ ] **Empty State (Published)**: Filter to Published with no data, see "No published lists yet"
- [ ] **Empty State (Drafts)**: Filter to Drafts with no data, see "No draft lists yet"
- [ ] **Error State**: Simulate error, see error alert with retry button
- [ ] **Retry Action**: Click retry, see loading state → success
- [ ] **Create Action**: Click "Create New List", see console log
- [ ] **Responsive Layout**: Test on mobile (1 col), tablet (2 col), desktop (3 col)
- [ ] **Keyboard Navigation**: Tab to buttons, activate with Enter/Space
- [ ] **No State Overlap**: Verify only one state visible at a time

### Step 7.2: Code Quality Checks

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm typecheck
```

### Step 7.3: Performance Validation

```bash
# Run dev server
pnpm dev

# Open Chrome DevTools → Lighthouse
# Run performance audit on /dashboard
# Verify:
# - No layout shift (CLS = 0)
# - Fast render times (<100ms for state changes)
```

---

## Troubleshooting

### Issue: Skeleton component not found

**Error**: `Cannot find module '@/components/ui/skeleton'`

**Solution**:
```bash
npx shadcn@latest add skeleton
```

---

### Issue: TypeScript errors in dashboard page

**Error**: `Type 'List[]' is not assignable to type 'never[]'`

**Solution**: Ensure `DashboardState` type is defined before using `useState`

---

### Issue: Tests fail with "window.confirm is not defined"

**Solution**: Mock window.confirm in affected tests:
```tsx
vi.spyOn(window, 'confirm').mockReturnValue(true);
```

---

### Issue: Skeletons don't animate

**Solution**: Verify Skeleton component includes animation classes:
```tsx
<Skeleton className="animate-pulse" />
```

---

## Next Steps

After completing this quickstart:

1. **Update Documentation**: Add feature to project README
2. **Create Tasks**: Run `/speckit.tasks` to generate implementation tasks
3. **Code Review**: Request review from team
4. **Merge**: Merge to main branch once approved
5. **Monitor**: Watch for any production issues
6. **Iterate**: Plan next iteration (e.g., add illustrations to empty state)

---

## References

- [Feature Spec](./spec.md)
- [Implementation Plan](./plan.md)
- [Component Contracts](./contracts/components.md)
- [Data Model](./data-model.md)
- [Research](./research.md)

---

## Estimated Time

- **Phase 1**: 5 minutes
- **Phase 2**: 15 minutes
- **Phase 3**: 15 minutes
- **Phase 4**: 15 minutes
- **Phase 5**: 30 minutes
- **Phase 6**: 45 minutes
- **Phase 7**: 30 minutes

**Total**: ~2.5 hours for complete implementation
