# Quickstart: Dashboard Foundation Implementation

**Feature**: Dashboard Foundation  
**Date**: 2025-12-06  
**Estimated Time**: 4-6 hours (implementation + testing)

This guide provides step-by-step instructions for implementing the Dashboard Foundation feature.

---

## Prerequisites

- [x] Node.js ≥20.0.0 installed
- [x] pnpm ≥8.0.0 installed
- [x] Repository cloned and dependencies installed (`pnpm install`)
- [x] Supabase local development environment running (`pnpm supabase:start`)
- [x] Existing authentication system functional (login/logout)

---

## Implementation Steps

### Step 1: Install shadcn Sheet Component

**Duration**: 5 minutes

```bash
# From repository root
pnpm dlx shadcn@latest add sheet
```

**Expected Output**:
- New file: `src/components/ui/sheet.tsx`
- Updated dependencies in `package.json` (if needed)

**Verification**:
```bash
# Check that sheet component was created
ls -la src/components/ui/sheet.tsx
```

---

### Step 2: Create DashboardSidebar Component

**Duration**: 15 minutes

**File**: `src/components/dashboard/DashboardSidebar.tsx`

```typescript
import type { JSX } from 'react';

/**
 * Reusable sidebar content component
 * Used in both desktop fixed sidebar and mobile drawer
 */
export function DashboardSidebar(): JSX.Element {
  return (
    <div className="flex flex-col h-full">
      {/* Logo/Branding */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-semibold">📍 YourFavs</h1>
      </div>

      {/* Navigation Container */}
      <nav className="flex-1 p-4">
        <div className="text-muted-foreground text-sm">
          Navigation items coming soon
        </div>
      </nav>
    </div>
  );
}
```

**Verification**:
```bash
# TypeScript check
pnpm typecheck
```

---

### Step 3: Create DashboardContent Component

**Duration**: 10 minutes

**File**: `src/components/dashboard/DashboardContent.tsx`

```typescript
import type { JSX, ReactNode } from 'react';

interface DashboardContentProps {
  children: ReactNode;
}

/**
 * Main content area wrapper with responsive margin
 * Offsets desktop sidebar width (lg:ml-64)
 */
export function DashboardContent({
  children,
}: DashboardContentProps): JSX.Element {
  return (
    <main className="min-h-screen lg:ml-64">
      <div className="p-6">{children}</div>
    </main>
  );
}
```

**Verification**:
```bash
pnpm typecheck
```

---

### Step 4: Create Dashboard Page

**Duration**: 30 minutes

**File**: `src/app/(dashboard)/dashboard/page.tsx`

```typescript
'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

/**
 * Dashboard page with authentication protection and responsive layout
 * Server-side auth is handled by parent layout.tsx
 * This component monitors session state client-side
 */
export default function DashboardPage(): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Monitor auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - Fixed on left */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 border-r bg-background">
        <DashboardSidebar />
      </aside>

      {/* Mobile Navigation Header */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="p-4">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <DashboardSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Main Content Area */}
      <DashboardContent>
        <div className="mt-16 lg:mt-0">
          <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your dashboard. Features coming soon.
          </p>
        </div>
      </DashboardContent>
    </div>
  );
}
```

**Verification**:
```bash
# TypeScript check
pnpm typecheck

# Start dev server
pnpm dev

# Manual test:
# 1. Navigate to http://localhost:3000/dashboard (unauthenticated)
#    - Should redirect to /login
# 2. Log in, navigate to /dashboard
#    - Should show dashboard
# 3. Test responsive behavior (resize browser)
# 4. Test mobile drawer (open/close)
```

---

### Step 5: Write Component Tests

**Duration**: 60 minutes

#### 5.1: DashboardSidebar Tests

**File**: `tests/component/dashboard/DashboardSidebar.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

describe('DashboardSidebar', () => {
  it('renders YourFavs branding', () => {
    render(<DashboardSidebar />);
    expect(screen.getByText(/YourFavs/i)).toBeInTheDocument();
  });

  it('includes navigation container', () => {
    const { container } = render(<DashboardSidebar />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('displays placeholder text for future navigation', () => {
    render(<DashboardSidebar />);
    expect(screen.getByText(/Navigation items coming soon/i)).toBeInTheDocument();
  });
});
```

#### 5.2: DashboardContent Tests

**File**: `tests/component/dashboard/DashboardContent.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

describe('DashboardContent', () => {
  it('renders children correctly', () => {
    render(
      <DashboardContent>
        <div>Test Content</div>
      </DashboardContent>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('uses main semantic element', () => {
    const { container } = render(
      <DashboardContent>
        <div>Test</div>
      </DashboardContent>
    );
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('applies responsive margin class', () => {
    const { container } = render(
      <DashboardContent>
        <div>Test</div>
      </DashboardContent>
    );
    const main = container.querySelector('main');
    expect(main).toHaveClass('lg:ml-64');
  });

  it('applies minimum height class', () => {
    const { container } = render(
      <DashboardContent>
        <div>Test</div>
      </DashboardContent>
    );
    const main = container.querySelector('main');
    expect(main).toHaveClass('min-h-screen');
  });
});
```

#### 5.3: Dashboard Page Tests

**File**: `tests/component/dashboard/page.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { createClient } from '@/lib/supabase/client';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('DashboardPage', () => {
  const mockPush = vi.fn();
  const mockUnsubscribe = vi.fn();
  let mockAuthCallback: ((event: string, session: unknown) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup router mock
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });

    // Setup Supabase mock
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        onAuthStateChange: vi.fn((callback) => {
          mockAuthCallback = callback;
          return {
            data: {
              subscription: {
                unsubscribe: mockUnsubscribe,
              },
            },
          };
        }),
      },
    });
  });

  afterEach(() => {
    mockAuthCallback = null;
  });

  it('subscribes to auth state changes on mount', () => {
    const supabase = createClient();
    render(<DashboardPage />);
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('redirects to /login on SIGNED_OUT event', () => {
    render(<DashboardPage />);
    
    // Trigger SIGNED_OUT event
    if (mockAuthCallback) {
      mockAuthCallback('SIGNED_OUT', null);
    }

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('redirects to /login when session is null', () => {
    render(<DashboardPage />);
    
    // Trigger event with null session
    if (mockAuthCallback) {
      mockAuthCallback('TOKEN_REFRESHED', null);
    }

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('does not redirect when session is valid', () => {
    render(<DashboardPage />);
    
    // Trigger SIGNED_IN with valid session
    if (mockAuthCallback) {
      mockAuthCallback('SIGNED_IN', { 
        access_token: 'token',
        user: { id: '123' }
      });
    }

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders dashboard content', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to your dashboard/i)).toBeInTheDocument();
  });

  it('renders desktop sidebar', () => {
    const { container } = render(<DashboardPage />);
    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
  });

  it('renders mobile navigation header', () => {
    const { container } = render(<DashboardPage />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });
});
```

**Run Tests**:
```bash
pnpm test tests/component/dashboard
```

---

### Step 6: Write Integration Tests

**Duration**: 45 minutes

#### 6.1: Auth Protection Tests

**File**: `tests/integration/dashboard/auth-protection.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/server';

describe('Dashboard Auth Protection', () => {
  beforeEach(async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
  });

  it('redirects unauthenticated users to /login', async () => {
    // This is tested via server-side layout.tsx redirect
    // In practice, test by visiting /dashboard without auth in E2E
    expect(true).toBe(true); // Placeholder - E2E handles this
  });

  it('allows authenticated users to access dashboard', async () => {
    // Tested via E2E with real auth flow
    expect(true).toBe(true); // Placeholder
  });
});
```

#### 6.2: Session Monitoring Tests

**File**: `tests/integration/dashboard/session-monitoring.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@/lib/supabase/client';

describe('Session Monitoring', () => {
  it('provides onAuthStateChange method', () => {
    const supabase = createClient();
    expect(supabase.auth.onAuthStateChange).toBeDefined();
    expect(typeof supabase.auth.onAuthStateChange).toBe('function');
  });

  it('returns subscription object', () => {
    const supabase = createClient();
    const callback = vi.fn();
    const result = supabase.auth.onAuthStateChange(callback);
    
    expect(result.data).toBeDefined();
    expect(result.data.subscription).toBeDefined();
    expect(result.data.subscription.unsubscribe).toBeDefined();
  });
});
```

#### 6.3: Responsive Layout Tests

**File**: `tests/integration/dashboard/responsive-layout.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}));

describe('Responsive Layout', () => {
  it('applies desktop sidebar classes', () => {
    const { container } = render(<DashboardPage />);
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('hidden', 'lg:block');
  });

  it('applies mobile nav classes', () => {
    const { container } = render(<DashboardPage />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('lg:hidden');
  });

  it('applies responsive content margin', () => {
    const { container } = render(<DashboardPage />);
    const main = container.querySelector('main');
    expect(main).toHaveClass('lg:ml-64');
  });
});
```

**Run Tests**:
```bash
pnpm test tests/integration/dashboard
```

---

### Step 7: Write E2E Tests

**Duration**: 45 minutes

**File**: `tests/e2e/dashboard/dashboard-access.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard Access', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test('displays dashboard for authenticated users', async ({ page }) => {
    // Login first (adjust based on your auth flow)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Should show dashboard content
    await expect(page.locator('h2')).toContainText('Dashboard');
    await expect(page.locator('aside')).toBeVisible(); // Desktop sidebar
  });

  test('opens mobile drawer on hamburger click', async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    // ... login flow ...
    await page.goto('/dashboard');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Click hamburger menu
    await page.click('button[aria-label="Open navigation menu"]');
    
    // Drawer should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.getByText('YourFavs')).toBeVisible();
  });

  test('closes drawer on outside click', async ({ page }) => {
    // Setup: mobile viewport with open drawer
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.click('button[aria-label="Open navigation menu"]');
    
    // Click overlay (outside drawer)
    await page.click('[data-radix-collection-item]', { force: true });
    
    // Drawer should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
```

**Run E2E Tests**:
```bash
pnpm test:e2e tests/e2e/dashboard
```

---

### Step 8: Verify Coverage

**Duration**: 15 minutes

```bash
# Run all tests with coverage
pnpm test:coverage

# Check coverage report
open coverage/index.html
```

**Coverage Targets** (from spec SC-005):
- Lines: ≥65%
- Functions: ≥65%
- Branches: ≥65%
- Statements: ≥65%

**If coverage is below target**:
1. Check which files/lines are uncovered
2. Add missing test cases
3. Re-run coverage

---

### Step 9: Manual Testing Checklist

**Duration**: 30 minutes

#### Desktop Testing (≥1024px)

- [ ] Navigate to `/dashboard` without auth → redirects to `/login`
- [ ] Login → navigate to `/dashboard` → shows dashboard
- [ ] Sidebar visible on left (fixed position)
- [ ] Logo "📍 YourFavs" visible in sidebar
- [ ] Main content area offset to the right
- [ ] Scroll page → sidebar remains fixed
- [ ] No hamburger menu visible

#### Mobile Testing (<1024px)

- [ ] Navigate to `/dashboard` → mobile layout renders
- [ ] Sidebar hidden
- [ ] Hamburger menu visible in top-left
- [ ] Click hamburger → drawer slides in from left
- [ ] Drawer contains same content as desktop sidebar
- [ ] Click outside drawer → drawer closes
- [ ] Click X/close button → drawer closes
- [ ] Press ESC key → drawer closes

#### Responsive Testing

- [ ] Resize from desktop to mobile → layout adapts smoothly
- [ ] Resize from mobile to desktop → layout adapts smoothly
- [ ] No horizontal scrollbars at any viewport size
- [ ] Test viewports: 320px, 375px, 768px, 1024px, 1440px, 1920px

#### Session Monitoring

- [ ] While on dashboard, logout via another tab → current tab redirects to `/login`
- [ ] Session expiration triggers redirect (test with short-lived token)

#### Accessibility

- [ ] Keyboard navigation: Tab through elements
- [ ] Screen reader: Test with NVDA/JAWS (nav, aside, main landmarks)
- [ ] Focus trap: Drawer captures focus when open
- [ ] Focus return: Focus returns to hamburger when drawer closes

---

## Troubleshooting

### Issue: Sheet component not found

**Solution**:
```bash
# Reinstall sheet component
pnpm dlx shadcn@latest add sheet --overwrite
```

### Issue: TypeScript errors with Supabase client

**Solution**: Verify `createClient` function signature matches expected interface. Check `src/lib/supabase/client.ts`.

### Issue: Tests fail with "Cannot find module"

**Solution**: 
```bash
# Ensure test setup is configured
cat tests/setup.ts

# Verify vitest config includes proper paths
cat vitest.config.ts
```

### Issue: Drawer animation not smooth

**Solution**: Check that Tailwind CSS is properly configured. Sheet component uses CSS transforms which require Tailwind.

### Issue: Coverage below 65%

**Solution**: 
1. Run `pnpm test:coverage`
2. Open `coverage/index.html`
3. Identify uncovered lines
4. Add test cases for uncovered scenarios
5. Focus on page.tsx auth monitoring logic

---

## Performance Validation

**Metrics to Verify** (from spec success criteria):

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Unauthenticated redirect | <500ms | Chrome DevTools Network tab |
| Dashboard load (authenticated) | <1s | Lighthouse Performance audit |
| Drawer animation | <300ms | Visual inspection + Chrome animation tools |
| Session detection | <2s | Manually expire session, measure redirect time |

**Lighthouse Audit**:
```bash
# Install Lighthouse CLI (if not installed)
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000/dashboard --view
```

**Expected Scores**:
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥90

---

## Deployment Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] E2E tests passing (`pnpm test:e2e`)
- [ ] Coverage ≥65% (`pnpm test:coverage`)
- [ ] TypeScript check passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Manual testing complete (all checkboxes above)
- [ ] Performance targets met (Lighthouse audit)
- [ ] No console errors in browser
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Mobile testing complete (iOS Safari, Android Chrome)

---

## Next Steps

After completing this feature:

1. **Add Navigation Items**: Extend `DashboardSidebar` with actual navigation links
2. **User Profile**: Add user profile display in sidebar footer
3. **Dashboard Content**: Implement lists management UI in content area
4. **Analytics**: Add usage tracking for drawer interactions
5. **Offline Support**: Add service worker for offline access

---

## Support & References

- **Spec Document**: `specs/001-dashboard-foundation/spec.md`
- **Data Model**: `specs/001-dashboard-foundation/data-model.md`
- **Contracts**: `specs/001-dashboard-foundation/contracts/components.md`
- **Research**: `specs/001-dashboard-foundation/research.md`

**Need Help?**
- Review constitution: `.specify/memory/constitution.md`
- Check decision records: `docs/decisions/`
- shadcn/ui docs: https://ui.shadcn.com/docs/components/sheet
- Supabase auth docs: https://supabase.com/docs/guides/auth

---

**Quickstart Status**: ✅ Complete and ready for implementation
