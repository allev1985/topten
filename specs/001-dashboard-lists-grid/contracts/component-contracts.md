# Component Contracts: Dashboard Lists and Grids

**Feature**: Dashboard Lists and Grids  
**Phase**: 1 - Design & Contracts  
**Date**: 2025-12-07

## Overview

This document defines the component contracts (props, behaviors, and interactions) for the dashboard lists grid feature. Since this is a frontend-only feature using mock data, there are no REST/GraphQL API contracts. Component contracts serve as the interface specification for this implementation.

---

## Component Contracts

### 1. ListCard Component

**File**: `src/components/dashboard/ListCard.tsx`

**Contract**:
```typescript
export interface ListCardProps {
  /** The list entity data to display */
  list: List;
  /** Handler called when the card is clicked (excluding menu button) */
  onClick: (listId: string) => void;
}

export function ListCard({ list, onClick }: ListCardProps): JSX.Element;
```

**Responsibilities**:
- Display list hero image with Next.js Image optimization
- Display list title with 2-line truncation
- Display publication status badge (Published/Draft)
- Display place count with correct pluralization
- Display three-dot menu button (trigger only)
- Handle click events on card (excluding menu)
- Prevent menu button clicks from triggering card click

**Visual Structure**:
```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │    Hero Image (16:9)        │ │ [Menu ⋮]
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ List Title (max 2 lines)        │
│ [Badge] 12 places               │
└─────────────────────────────────┘
```

**Behavior Specifications**:

| Behavior | Input | Expected Output | Error Handling |
|----------|-------|-----------------|----------------|
| Render card | Valid List object | Card with all elements | TypeScript compile error if invalid |
| Click card image | Mouse click event | `onClick(list.id)` called | - |
| Click card title | Mouse click event | `onClick(list.id)` called | - |
| Click menu button | Mouse click event | Event propagation stopped, no `onClick` | - |
| Display published list | `isPublished: true` | Badge shows "Published" with default variant | - |
| Display draft list | `isPublished: false` | Badge shows "Draft" with secondary variant | - |
| Display place count | `placeCount: 1` | Shows "1 place" (singular) | - |
| Display place count | `placeCount: 0, 2, 3+` | Shows "N places" (plural) | - |
| Truncate long title | Title >2 lines | Truncates with ellipsis | - |
| Load hero image | Valid URL | Image displays | Next.js Image shows fallback |

**Props Validation**:
```typescript
// Runtime validation (optional, TypeScript provides compile-time checks)
if (!list.id || !list.title) {
  console.error("ListCard requires list with id and title");
  return null;
}
```

**Accessibility Requirements**:
- Image alt text: `${list.title} cover image`
- Card is keyboard navigable (Tab key)
- Card activates on Enter/Space when focused
- Menu button has aria-label: `Options for ${list.title}`
- Status badge includes text content for screen readers

**CSS Classes** (Tailwind):
```typescript
// Card container
"relative overflow-hidden rounded-lg border bg-card cursor-pointer 
 hover:shadow-lg transition-shadow"

// Image container
"relative aspect-video w-full overflow-hidden"

// Title
"line-clamp-2 text-lg font-semibold"

// Badge and count container
"flex items-center justify-between gap-2 mt-2"
```

---

### 2. ListGrid Component

**File**: `src/components/dashboard/ListGrid.tsx`

**Contract**:
```typescript
export interface ListGridProps {
  /** Array of list entities to display in the grid */
  lists: List[];
  /** Handler called when any list card is clicked */
  onListClick: (listId: string) => void;
}

export function ListGrid({ lists, onListClick }: ListGridProps): JSX.Element;
```

**Responsibilities**:
- Render responsive CSS Grid layout
- Map list data to ListCard components
- Pass click handler to all child cards
- Handle empty state (renders empty grid, no special message)

**Visual Structure**:
```
Desktop (≥1024px):
┌─────┬─────┬─────┐
│ [1] │ [2] │ [3] │
├─────┼─────┼─────┤
│ [4] │ [5] │     │
└─────┴─────┴─────┘

Tablet (768px-1023px):
┌─────┬─────┐
│ [1] │ [2] │
├─────┼─────┤
│ [3] │ [4] │
├─────┼─────┤
│ [5] │     │
└─────┴─────┘

Mobile (<768px):
┌─────┐
│ [1] │
├─────┤
│ [2] │
├─────┤
│ [3] │
├─────┤
│ [4] │
├─────┤
│ [5] │
└─────┘
```

**Behavior Specifications**:

| Behavior | Input | Expected Output | Error Handling |
|----------|-------|-----------------|----------------|
| Render grid | Array of Lists | Grid with N cards | Empty array → empty grid |
| Render empty grid | Empty array `[]` | Empty grid container | No error, no empty state message |
| Pass click handler | `onListClick` function | Each card receives handler | TypeScript enforces function type |
| Responsive layout | Viewport resize | Grid columns adjust per breakpoint | CSS handles automatically |

**Props Validation**:
```typescript
// TypeScript ensures lists is an array
// Empty array is valid (no minimum length requirement)
```

**CSS Classes** (Tailwind):
```typescript
// Grid container
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

**Responsive Breakpoints**:
| Breakpoint | Viewport Width | Grid Columns | Tailwind Class |
|------------|----------------|--------------|----------------|
| Mobile | <768px | 1 | `grid-cols-1` |
| Tablet | 768px-1023px | 2 | `md:grid-cols-2` |
| Desktop | ≥1024px | 3 | `lg:grid-cols-3` |

---

### 3. Dashboard Page Integration

**File**: `src/app/(dashboard)/dashboard/page.tsx`

**Contract**:
```typescript
export default function DashboardPage(): JSX.Element;
```

**Integration Pattern**:
```typescript
import { mockLists } from "@/lib/mocks/lists";
import { ListGrid } from "@/components/dashboard/ListGrid";

export default function DashboardPage() {
  const handleListClick = (listId: string) => {
    console.log("List clicked:", listId);
    // TODO: Navigate to list detail page in future implementation
  };

  return (
    <div className="flex min-h-screen">
      {/* Existing sidebar and header */}
      <DashboardContent>
        <div className="mt-16 lg:mt-0">
          <DashboardHeader />
          <div className="p-6">
            <ListGrid lists={mockLists} onListClick={handleListClick} />
          </div>
        </div>
      </DashboardContent>
    </div>
  );
}
```

**Behavior**:
- Import mock data (temporary)
- Define click handler with console.log (temporary)
- Render ListGrid within existing dashboard layout
- Maintain existing responsive sidebar/header behavior

---

## Type Contracts

### List Type

**File**: `src/types/list.ts`

**Contract**:
```typescript
/**
 * List entity for dashboard display
 * Represents a curator's collection of favorite places
 */
export interface List {
  /** Unique identifier (UUID format) */
  id: string;
  
  /** Display name of the list (1-255 characters) */
  title: string;
  
  /** URL to hero/cover image */
  heroImageUrl: string;
  
  /** Publication status (true = published, false = draft) */
  isPublished: boolean;
  
  /** Number of places in the list (non-negative integer) */
  placeCount: number;
}
```

**Validation Rules**:
- `id`: Non-empty string, UUID format preferred
- `title`: Non-empty string, max 255 characters
- `heroImageUrl`: Valid URL string
- `isPublished`: Boolean value
- `placeCount`: Non-negative integer

---

## Mock Data Contract

**File**: `src/lib/mocks/lists.ts`

**Contract**:
```typescript
/**
 * Mock list data for dashboard development
 * @deprecated This will be replaced with real database data in future implementation
 */
export const mockLists: List[];
```

**Requirements**:
- Export as named constant `mockLists`
- Type as `List[]` array
- Include minimum 5 list items (per spec FR-018)
- Include mix of published/draft status
- Include variety of place counts (0, 1, multiple)
- Include at least one long title for truncation testing
- Use valid UUID format for IDs
- Use placehold.co URLs for images

---

## Event Handler Contracts

### onClick Handler (Card Click)

**Signature**:
```typescript
type OnListClick = (listId: string) => void;
```

**Contract**:
- **Input**: `listId` - The unique identifier of the clicked list
- **Output**: None (void)
- **Side Effects**: Console logging (temporary), future navigation
- **Timing**: Synchronous
- **Error Handling**: Handler should not throw errors

**Example Implementation**:
```typescript
const handleListClick: OnListClick = (listId: string) => {
  console.log("List clicked:", listId);
  // Future: router.push(`/dashboard/lists/${listId}`)
};
```

### Menu Button Click (Internal)

**Signature**:
```typescript
type OnMenuClick = (event: React.MouseEvent) => void;
```

**Contract**:
- **Input**: `event` - React mouse event
- **Output**: None (void)
- **Side Effects**: Stops event propagation
- **Timing**: Synchronous
- **Error Handling**: Must call `event.stopPropagation()`

**Example Implementation**:
```typescript
const handleMenuClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  // Future: Open dropdown menu (issue #4)
};
```

---

## Component State Contracts

### ListCard State

**State**: None (stateless functional component)

**Rationale**: All data comes from props. No internal state needed for initial implementation.

### ListGrid State

**State**: None (stateless functional component)

**Rationale**: Pure presentational component. Parent manages data and handlers.

### Dashboard Page State

**State**: 
```typescript
const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
// Existing state for mobile sidebar
```

**Rationale**: Dashboard page already manages sidebar state. No additional state needed for lists grid.

---

## Styling Contracts

### Theme Integration

**shadcn/ui Theme Variables**:
- Card background: `bg-card`
- Card border: `border`
- Card text: `text-card-foreground`
- Badge default: `bg-primary text-primary-foreground`
- Badge secondary: `bg-secondary text-secondary-foreground`

**Tailwind Configuration**:
- Uses existing Tailwind config (no changes needed)
- Responsive breakpoints: `sm: 640px, md: 768px, lg: 1024px, xl: 1280px`
- Grid gap: `gap-6` (1.5rem / 24px)

### Component-Specific Styles

**ListCard**:
- Border radius: `rounded-lg` (0.5rem)
- Shadow on hover: `hover:shadow-lg`
- Transition: `transition-shadow`
- Cursor: `cursor-pointer`

**ListGrid**:
- No custom styling beyond grid utilities
- Inherits container width from parent (DashboardContent)

---

## Accessibility Contracts

### Keyboard Navigation

**ListCard**:
- **Tab**: Focus card
- **Enter/Space**: Activate card (call onClick)
- **Tab** (from card): Focus menu button
- **Enter/Space** (on menu): Open menu (future)

**Focus Indicators**:
- Visible focus ring on card: `focus:ring-2 focus:ring-ring focus:ring-offset-2`
- Visible focus ring on menu button: shadcn/ui Button default focus styles

### Screen Reader Announcements

**ListCard Announcement**:
```
"[List Title], [Published/Draft], [N place/places], Button"
```

**Example**:
```
"Best Coffee Shops, Published, 12 places, Button"
```

### ARIA Attributes

**ListCard**:
- `role="button"` (if using div instead of button element)
- `tabIndex={0}` (for keyboard navigation)
- `aria-label={`View ${list.title}`}` (optional, title provides context)

**Menu Button**:
- `aria-label={`Options for ${list.title}`}`
- `aria-haspopup="menu"` (for future dropdown)

---

## Performance Contracts

### Rendering Performance

**ListCard**:
- **Initial Render**: <16ms (60 FPS)
- **Re-render**: <16ms when props change
- **Image Load**: Lazy loading via Next.js Image

**ListGrid**:
- **Initial Render**: <50ms for 5 cards
- **Scalability**: Should handle 50+ cards without performance degradation
- **Layout Shift**: Minimal CLS (Cumulative Layout Shift) via fixed aspect ratio images

### Bundle Size

**Estimated Impact**:
- ListCard component: ~2KB gzipped
- ListGrid component: ~1KB gzipped
- shadcn/ui Badge: ~1KB gzipped (new dependency)
- shadcn/ui DropdownMenu: ~3KB gzipped (new dependency)
- Total: ~7KB additional bundle size

---

## Testing Contracts

### Unit Test Requirements

**ListCard**:
```typescript
describe("ListCard", () => {
  it("renders all required elements");
  it("displays correct badge for published list");
  it("displays correct badge for draft list");
  it("displays singular place count (1 place)");
  it("displays plural place count (0, 2+ places)");
  it("truncates long titles");
  it("calls onClick with list ID on card click");
  it("does not call onClick when menu button clicked");
  it("renders accessible alt text for image");
});
```

**ListGrid**:
```typescript
describe("ListGrid", () => {
  it("renders all list cards from data");
  it("applies correct grid classes");
  it("handles empty lists array");
  it("passes click handler to all cards");
});
```

### Integration Test Requirements

**Dashboard Page**:
```typescript
describe("Dashboard with Lists Grid", () => {
  it("displays all mock lists");
  it("logs list ID to console on card click");
  it("menu button does not trigger card click");
});
```

### E2E Test Requirements

**Responsive Grid**:
```typescript
test("dashboard grid responds to viewport changes", async ({ page }) => {
  // Test mobile, tablet, desktop layouts
  // Verify column counts at each breakpoint
});
```

**Accessibility**:
```typescript
test("dashboard grid is accessible", async ({ page }) => {
  // Run accessibility audit
  // Verify keyboard navigation
  // Test screen reader announcements
});
```

---

## Error Handling Contracts

### Component Error Boundaries

**ListCard**:
- Gracefully handles missing props (TypeScript prevents this)
- Gracefully handles failed image loads (Next.js Image fallback)
- Does not throw errors on render

**ListGrid**:
- Handles empty array without errors
- Handles malformed list data (TypeScript prevents this)
- Does not throw errors on render

### User-Facing Errors

**Image Load Failure**:
- Next.js Image component shows default fallback
- No error message shown to user
- Console warning logged (Next.js default behavior)

**Invalid Data**:
- TypeScript prevents invalid data at compile time
- Runtime validation not required for initial implementation

---

## Future Contract Extensions (Out of Scope)

These contracts may be added in future implementations:

1. **List Actions Contract**:
   - `onEdit(listId: string): void`
   - `onDelete(listId: string): void`
   - `onShare(listId: string): void`
   - `onPublish(listId: string): void`

2. **Loading State Contract**:
   - `isLoading: boolean`
   - Loading skeletons for cards

3. **Error State Contract**:
   - `error: Error | null`
   - Error message display

4. **Pagination Contract**:
   - `currentPage: number`
   - `totalPages: number`
   - `onPageChange(page: number): void`

5. **Filtering Contract**:
   - `filter: "all" | "published" | "draft"`
   - `onFilterChange(filter: string): void`

6. **Sorting Contract**:
   - `sortBy: "updated" | "created" | "title"`
   - `sortOrder: "asc" | "desc"`
   - `onSortChange(field: string, order: string): void`

---

## Summary

This contracts document defines the complete interface specification for the Dashboard Lists and Grids feature. All component props, behaviors, events, and accessibility requirements are explicitly specified to guide implementation and testing. The contracts are designed for the initial mock data implementation while being extensible for future database integration and feature enhancements.

**Contract Coverage**:
- ✅ Component interfaces (props, return types)
- ✅ Type definitions
- ✅ Event handler signatures
- ✅ Styling requirements
- ✅ Accessibility requirements
- ✅ Performance expectations
- ✅ Testing requirements
- ✅ Error handling
- ✅ Future extensibility
