# Component Contracts

**Feature**: Dashboard Foundation  
**Version**: 1.0.0  
**Date**: 2025-12-06

This document defines the public interfaces (contracts) for all dashboard components.

---

## DashboardSidebar

**File**: `src/components/dashboard/DashboardSidebar.tsx`

**Type**: React Server Component (stateless, presentational)

### Props Interface

```typescript
// No props - component is self-contained
export interface DashboardSidebarProps {}
```

### Return Type

```typescript
JSX.Element
```

### Public API

```typescript
export function DashboardSidebar(): JSX.Element
```

### Behavior Contract

**Guarantees**:
- MUST render "📍 YourFavs" branding at the top
- MUST include a navigation container for future items
- MUST use semantic HTML (`<nav>` for navigation)
- MUST apply consistent styling for both desktop and mobile contexts

**Postconditions**:
- Component renders without errors
- Visual structure matches design: logo/brand at top, navigation below
- Accessible to screen readers (proper semantic elements)

**Error Handling**: None (no user input, no async operations)

**Performance**:
- Rendering time: <50ms
- Memory footprint: <5KB

---

## DashboardContent

**File**: `src/components/dashboard/DashboardContent.tsx`

**Type**: React Server Component (wrapper component)

### Props Interface

```typescript
import type { ReactNode } from 'react';

export interface DashboardContentProps {
  /**
   * Child components to render within the main content area
   */
  children: ReactNode;
}
```

### Return Type

```typescript
JSX.Element
```

### Public API

```typescript
export function DashboardContent(props: DashboardContentProps): JSX.Element
```

### Behavior Contract

**Preconditions**:
- `children` MUST be valid React node(s)

**Guarantees**:
- MUST render children within `<main>` semantic element
- MUST apply responsive margin: `lg:ml-64` for desktop sidebar offset
- MUST apply minimum height: `min-h-screen`
- MUST include padding for content spacing

**Postconditions**:
- Children render correctly within main content area
- Layout adjusts based on viewport width
- Main content area is scrollable independently of sidebar

**Error Handling**: None (React handles invalid children)

**Performance**:
- Rendering time: <50ms (excluding children)
- No unnecessary re-renders (children changes only)

---

## DashboardPage

**File**: `src/app/(dashboard)/dashboard/page.tsx`

**Type**: React Client Component (orchestration, state management)

### Props Interface

```typescript
// Page components do not receive props in Next.js App Router
export interface DashboardPageProps {}
```

### Return Type

```typescript
JSX.Element
```

### Public API

```typescript
export default function DashboardPage(): JSX.Element
```

### State Management

**Internal State**:

```typescript
interface DashboardPageState {
  isDrawerOpen: boolean;  // Mobile drawer visibility
}
```

**State Transitions**:
- `setIsDrawerOpen(true)`: Opens mobile drawer
- `setIsDrawerOpen(false)`: Closes mobile drawer
- Auto-close: Handled by Sheet component (outside click, ESC key)

### Behavior Contract

**Preconditions**:
- User MUST be authenticated (enforced by parent layout.tsx)
- Supabase client MUST be initialized

**Guarantees**:
- MUST monitor session state changes via `supabase.auth.onAuthStateChange`
- MUST redirect to `/login` if session expires or user signs out
- MUST render fixed sidebar on desktop (≥1024px)
- MUST render hamburger menu + Sheet drawer on mobile (<1024px)
- MUST clean up auth subscription on component unmount

**Postconditions**:
- Page renders dashboard layout correctly
- Session monitoring is active
- User is redirected on auth state change (SIGNED_OUT or null session)
- No memory leaks from auth subscription

**Error Handling**:
- Supabase client errors: Component may fail to render (graceful degradation via error boundary)
- Network errors: Session monitoring continues, may miss some events

**Performance**:
- Initial render: <500ms
- Session monitoring overhead: <10ms per event
- Drawer open/close: <300ms animation time

**Side Effects**:
- Navigation: `router.push('/login')` on auth state change
- Subscription: Supabase auth listener (cleaned up on unmount)

---

## Supabase Client Dependency

**File**: `src/lib/supabase/client.ts` (existing)

### Required Interface

```typescript
export function createClient(): SupabaseClient
```

**Expected Methods**:

```typescript
interface SupabaseAuthMethods {
  auth: {
    onAuthStateChange: (
      callback: (event: AuthChangeEvent, session: Session | null) => void
    ) => {
      data: {
        subscription: {
          unsubscribe: () => void;
        };
      };
    };
  };
}
```

**Events**:
- `SIGNED_IN`: User authenticated
- `SIGNED_OUT`: User logged out
- `TOKEN_REFRESHED`: Session token refreshed
- `USER_UPDATED`: User metadata updated

**Session Object**:

```typescript
interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  user: {
    id: string;
    email: string;
    // ... other fields
  };
}
```

---

## shadcn/ui Sheet Dependency

**Files**: 
- `src/components/ui/sheet.tsx` (generated via shadcn CLI)
- Dependency: `@radix-ui/react-dialog`

### Required Components

```typescript
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
```

### Sheet Props Contract

```typescript
interface SheetProps {
  open?: boolean;                    // Controlled state
  onOpenChange?: (open: boolean) => void;  // State change callback
  children: ReactNode;
}

interface SheetTriggerProps {
  asChild?: boolean;                 // Render as child element (composition)
  children: ReactNode;
}

interface SheetContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';  // Slide direction
  className?: string;                // Custom styling
  children: ReactNode;
}
```

### Expected Behavior

**Sheet**:
- Manages open/closed state
- Provides accessible overlay and focus trap
- Handles ESC key to close
- Handles outside click to close

**SheetTrigger**:
- Opens sheet when clicked
- Can wrap custom button via `asChild` prop

**SheetContent**:
- Animates in/out from specified side
- Applies z-index for overlay
- Traps focus within drawer when open
- Returns focus to trigger on close

---

## Next.js Router Dependency

**Import**: `next/navigation`

### Required Methods

```typescript
import { useRouter } from 'next/navigation';

interface Router {
  push: (href: string) => void;      // Client-side navigation
  // Other methods not used in this feature
}
```

### Expected Behavior

**`push(href)`**:
- Navigates to specified route
- Updates browser history
- Triggers server-side auth check on protected routes

---

## Testing Contracts

### DashboardSidebar Tests

**File**: `tests/component/dashboard/DashboardSidebar.test.tsx`

**Required Test Cases**:

```typescript
describe('DashboardSidebar', () => {
  it('renders YourFavs branding', () => {
    // Verify "📍 YourFavs" text is present
  });

  it('includes navigation container', () => {
    // Verify nav element exists
  });

  it('uses semantic HTML', () => {
    // Verify <nav> element is used
  });
});
```

**Coverage Target**: 100% (simple presentational component)

---

### DashboardContent Tests

**File**: `tests/component/dashboard/DashboardContent.test.tsx`

**Required Test Cases**:

```typescript
describe('DashboardContent', () => {
  it('renders children correctly', () => {
    // Verify children prop is rendered
  });

  it('applies responsive margin classes', () => {
    // Verify lg:ml-64 class is present
  });

  it('uses main semantic element', () => {
    // Verify <main> element is used
  });

  it('applies minimum height', () => {
    // Verify min-h-screen class is present
  });
});
```

**Coverage Target**: 100% (simple wrapper component)

---

### DashboardPage Tests

**File**: `tests/component/dashboard/page.test.tsx`

**Required Test Cases**:

```typescript
describe('DashboardPage', () => {
  it('subscribes to auth state changes on mount', () => {
    // Mock Supabase client, verify onAuthStateChange called
  });

  it('unsubscribes from auth state on unmount', () => {
    // Verify subscription.unsubscribe called
  });

  it('redirects to /login on SIGNED_OUT event', () => {
    // Mock router, trigger SIGNED_OUT, verify push('/login')
  });

  it('redirects to /login when session is null', () => {
    // Mock router, trigger null session, verify push('/login')
  });

  it('renders desktop sidebar on large viewport', () => {
    // Verify aside element with lg:block class
  });

  it('renders mobile hamburger on small viewport', () => {
    // Verify Sheet trigger with lg:hidden class
  });

  it('opens drawer when hamburger clicked', () => {
    // Simulate click, verify setIsDrawerOpen(true)
  });

  it('closes drawer when Sheet onOpenChange(false) called', () => {
    // Trigger onOpenChange(false), verify setIsDrawerOpen(false)
  });
});
```

**Coverage Target**: ≥70%

---

### Integration Tests

**File**: `tests/integration/dashboard/auth-protection.test.ts`

**Required Test Cases**:

```typescript
describe('Dashboard Auth Protection', () => {
  it('redirects unauthenticated users to /login', () => {
    // Test server-side redirect (layout.tsx)
  });

  it('allows authenticated users to access dashboard', () => {
    // Verify dashboard renders for authenticated users
  });
});
```

**File**: `tests/integration/dashboard/session-monitoring.test.ts`

**Required Test Cases**:

```typescript
describe('Session Monitoring', () => {
  it('redirects when session expires', () => {
    // Simulate session expiration event
  });

  it('redirects when user signs out', () => {
    // Simulate SIGNED_OUT event
  });
});
```

**File**: `tests/integration/dashboard/responsive-layout.test.ts`

**Required Test Cases**:

```typescript
describe('Responsive Layout', () => {
  it('shows sidebar on desktop viewport', () => {
    // Set viewport to 1024px+, verify sidebar visible
  });

  it('hides sidebar on mobile viewport', () => {
    // Set viewport to <1024px, verify sidebar hidden
  });

  it('shows hamburger menu on mobile viewport', () => {
    // Set viewport to <1024px, verify button visible
  });
});
```

---

### E2E Tests

**File**: `tests/e2e/dashboard/dashboard-access.spec.ts`

**Required Test Scenarios**:

```typescript
describe('Dashboard Access E2E', () => {
  it('redirects unauthenticated users', () => {
    // Visit /dashboard without auth, verify redirect to /login
  });

  it('displays dashboard for authenticated users', () => {
    // Login, visit /dashboard, verify content
  });

  it('opens mobile drawer', () => {
    // Set mobile viewport, click hamburger, verify drawer opens
  });

  it('closes drawer on outside click', () => {
    // Open drawer, click outside, verify drawer closes
  });
});
```

---

## Versioning & Breaking Changes

**Current Version**: 1.0.0

**Breaking Change Policy**:
- Props interface changes: MAJOR version bump
- Behavior changes: MINOR version bump
- Bug fixes: PATCH version bump

**Backward Compatibility**:
- Future navigation items: Add as optional props to DashboardSidebar
- Future user profile: Add as optional props to DashboardSidebar
- Layout changes: Non-breaking (CSS-only)

---

## Dependencies Summary

| Dependency | Version | Purpose | Contract |
|------------|---------|---------|----------|
| React | 19.2.0 | Component library | Standard hooks API |
| Next.js | 16.0.5 | Framework | App Router, useRouter |
| Supabase SSR | 0.8.0 | Auth client | onAuthStateChange |
| shadcn/ui Sheet | latest | Mobile drawer | Sheet, SheetContent, SheetTrigger |
| Lucide React | 0.555.0 | Icons | Menu icon |
| Tailwind CSS | 4.x | Styling | Utility classes, responsive |

---

## Contract Compliance Checklist

- [x] All public APIs documented with TypeScript interfaces
- [x] Behavior contracts specified (preconditions, postconditions, guarantees)
- [x] Error handling documented
- [x] Performance characteristics defined
- [x] Side effects listed
- [x] Dependencies and their contracts specified
- [x] Test contracts defined with required test cases
- [x] Versioning policy established
- [x] Breaking change policy defined

**Status**: ✅ Contracts complete and ready for implementation
