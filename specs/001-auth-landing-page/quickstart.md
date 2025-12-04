# Quickstart Guide: Auth-Aware Landing Page

**Feature**: 001-auth-landing-page  
**Audience**: Developers implementing or extending this feature  
**Last Updated**: 2025-12-04

## Overview

This guide walks you through the auth-aware landing page implementation, explaining how to work with server-side authentication detection and the Server/Client Component pattern in Next.js App Router.

---

## Quick Links

- **Specification**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Research Findings**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Type Contracts**: [contracts/landing-page.ts](./contracts/landing-page.ts)

---

## Key Concepts

### Server vs Client Components

```typescript
// ❌ BEFORE: Client Component (all JS shipped to browser)
export default function Home() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Auth check happens client-side → auth flicker
    checkAuth().then(setUser);
  }, []);
  
  return <div>...</div>;
}

// ✅ AFTER: Server Component → Client Component pattern
export default async function Home() {
  // Auth check happens server-side → no flicker
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  
  // Pass boolean to client component
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
```

**Benefits**:
- ⚡ Faster initial page load (less JS to download)
- 🎯 No authentication flicker
- 🔒 Auth check happens server-side (more secure)
- 🚫 Zero hydration errors

---

## Implementation Steps

### Step 1: Update Server Component (page.tsx)

**File**: `src/app/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server';
import LandingPageClient from '@/components/shared/LandingPageClient';

export default async function Home() {
  // 1. Create Supabase client (server-side)
  const supabase = await createClient();
  
  // 2. Check authentication status
  const { data: { user } } = await supabase.auth.getUser();
  
  // 3. Convert to boolean (serializable)
  const isAuthenticated = !!user;
  
  // 4. Pass to client component
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
```

**Key Points**:
- ✅ Function is `async` (required for Server Components)
- ✅ No `'use client'` directive (Server Component by default)
- ✅ Uses `createClient()` from `@/lib/supabase/server` (not `/client`)
- ✅ Calls `getUser()` not `getSession()` (more secure)
- ✅ Passes boolean (serializable, no hydration issues)

---

### Step 2: Create Client Component Wrapper

**File**: `src/components/shared/LandingPageClient.tsx`

```typescript
'use client'; // Required for client components

interface LandingPageClientProps {
  isAuthenticated: boolean;
}

export default function LandingPageClient({ 
  isAuthenticated 
}: LandingPageClientProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
          YourFavs
        </h1>
        
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Curate and share your favorite places
        </p>
        
        {/* Conditional rendering based on auth state */}
        {isAuthenticated ? (
          <nav>
            {/* Navigation for authenticated users */}
            <a href="/dashboard">Go to Dashboard</a>
          </nav>
        ) : (
          <nav>
            {/* Navigation for guests */}
            <a href="/login">Log In</a>
            <a href="/signup">Sign Up</a>
          </nav>
        )}
      </main>
    </div>
  );
}
```

**Key Points**:
- ✅ Has `'use client'` directive (enables client-side features)
- ✅ Accepts `isAuthenticated` boolean prop
- ✅ TypeScript interface matches contract
- ✅ Renders differently based on auth state
- ✅ No `useEffect` or client-side auth checks (prevents flicker)

---

## Error Handling

### Graceful Fallback Pattern

```typescript
export default async function Home() {
  const supabase = await createClient();
  
  // Auth check with error handling
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Fail-closed: Default to non-authenticated on error
  const isAuthenticated = error ? false : !!user;
  
  // Optional: Log errors for monitoring
  if (error) {
    console.error('Auth check failed:', error.message);
    // Could send to error tracking service
  }
  
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
```

**Why Fail-Closed**:
- 🔒 Security: When in doubt, treat as guest
- 👤 UX: User can still access login/signup
- 🐛 Debugging: Errors logged but don't break page

---

## Testing Guide

### Unit Test: Auth State Detection

**File**: `tests/unit/auth/landing-page-auth.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    }
  }))
}));

describe('Landing Page Auth Detection', () => {
  it('should return true when user is authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockClient = await createClient();
    vi.mocked(mockClient.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    const isAuthenticated = !!mockUser;
    expect(isAuthenticated).toBe(true);
  });
  
  it('should return false when user is not authenticated', async () => {
    const mockClient = await createClient();
    vi.mocked(mockClient.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null
    });
    
    const isAuthenticated = !!null;
    expect(isAuthenticated).toBe(false);
  });
});
```

---

### Component Test: Rendering Based on Auth State

**File**: `tests/component/landing-page/LandingPageClient.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandingPageClient from '@/components/shared/LandingPageClient';

describe('LandingPageClient', () => {
  it('renders authenticated content when isAuthenticated=true', () => {
    render(<LandingPageClient isAuthenticated={true} />);
    
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Log In')).not.toBeInTheDocument();
  });
  
  it('renders guest content when isAuthenticated=false', () => {
    render(<LandingPageClient isAuthenticated={false} />);
    
    expect(screen.getByText('Log In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument();
  });
  
  it('renders shared content regardless of auth state', () => {
    const { rerender } = render(<LandingPageClient isAuthenticated={false} />);
    expect(screen.getByText('YourFavs')).toBeInTheDocument();
    
    rerender(<LandingPageClient isAuthenticated={true} />);
    expect(screen.getByText('YourFavs')).toBeInTheDocument();
  });
});
```

---

### E2E Test: Full User Flow

**File**: `tests/e2e/landing-page/authenticated.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Landing Page - Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });
  
  test('should see authenticated landing page', async ({ page }) => {
    await page.goto('/');
    
    // Should see authenticated content
    await expect(page.getByText('Go to Dashboard')).toBeVisible();
    
    // Should NOT see guest content
    await expect(page.getByText('Log In')).not.toBeVisible();
    
    // No console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
```

---

## Common Pitfalls & Solutions

### ❌ Problem: Hydration Error

```typescript
// ❌ BAD: Client component checks auth client-side
'use client';
export default function Home() {
  const [isAuth, setIsAuth] = useState(false);
  
  useEffect(() => {
    checkAuth().then(setIsAuth); // Client-side check
  }, []);
  
  return <div>{isAuth ? 'Hello' : 'Login'}</div>;
  // Server renders 'Login', client renders 'Hello' → hydration error!
}
```

**✅ Solution**: Server Component pattern
```typescript
// ✅ GOOD: Server component checks auth server-side
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user; // Decided server-side
  
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
  // Server and client render the same thing → no hydration error!
}
```

---

### ❌ Problem: Passing Non-Serializable Props

```typescript
// ❌ BAD: Passing complex object to client component
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Error: Cannot pass User object (not serializable)
  return <LandingPageClient user={user} />;
}
```

**✅ Solution**: Pass serializable boolean
```typescript
// ✅ GOOD: Pass simple boolean
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user; // Boolean is serializable
  
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
```

---

### ❌ Problem: Using getSession() Instead of getUser()

```typescript
// ❌ BAD: getSession() doesn't validate JWT server-side
const { data: { session } } = await supabase.auth.getSession();
const isAuthenticated = !!session; // Security risk!
```

**✅ Solution**: Use getUser() for security
```typescript
// ✅ GOOD: getUser() validates JWT server-side
const { data: { user } } = await supabase.auth.getUser();
const isAuthenticated = !!user; // Secure!
```

---

## Performance Best Practices

### ✅ Leverage Server Components

```typescript
// Server Component = less JavaScript shipped to browser
export default async function Home() {
  // This code runs on server, not sent to client
  const heavyComputation = await expensiveOperation();
  const isAuthenticated = checkAuth();
  
  // Only send the result to client
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
```

**Benefits**:
- 📦 Smaller bundle size
- ⚡ Faster Time to Interactive
- 🔒 Server-side operations stay server-side

---

### ✅ Middleware Handles Session Refresh

You don't need to worry about session refresh in the page component because middleware handles it:

```typescript
// middleware.ts already does this for all routes
export async function middleware(request: NextRequest) {
  // Refreshes session automatically
  return updateSession(request);
}

// Your page component gets fresh auth state
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // User is already refreshed by middleware
}
```

---

## Extending This Pattern

### Adding More Client-Side Features

```typescript
'use client';

interface LandingPageClientProps {
  isAuthenticated: boolean;
}

export default function LandingPageClient({ isAuthenticated }: LandingPageClientProps) {
  const [showModal, setShowModal] = useState(false);
  
  // Can use all client-side features:
  // - useState, useEffect, etc.
  // - Event handlers
  // - Browser APIs
  // - Third-party libraries
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={() => setShowModal(true)}>
          Open Settings
        </button>
      ) : (
        <button onClick={() => setShowModal(true)}>
          Learn More
        </button>
      )}
      
      {showModal && <Modal />}
    </div>
  );
}
```

---

### Fetching Additional User Data

```typescript
// Server Component can fetch more data if needed
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  
  // Fetch additional data for authenticated users
  let userData = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    userData = data;
  }
  
  return (
    <LandingPageClient 
      isAuthenticated={isAuthenticated}
      userName={userData?.display_name}
    />
  );
}
```

---

## Debugging Tips

### Check Authentication in Development

```typescript
export default async function Home() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Auth check:', { 
      isAuthenticated: !!user, 
      userId: user?.id,
      error: error?.message 
    });
  }
  
  const isAuthenticated = !!user;
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}
```

---

### Verify No Hydration Errors

```bash
# Run dev server and check browser console
npm run dev

# Look for these warnings:
# ❌ "Warning: Text content did not match..."
# ❌ "Warning: Expected server HTML to contain..."

# If you see these, check that:
# 1. Server Component passes correct props
# 2. Client Component doesn't change content on mount
# 3. No useEffect changing initial render
```

---

## Additional Resources

### Official Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)

### Project Documentation
- [Repository Custom Instructions](/.github/copilot-instructions.md)
- [Project Constitution](/.specify/memory/constitution.md)
- [Auth Middleware Spec](/specs/001-auth-middleware/spec.md)

---

## Support

If you encounter issues:

1. **Check existing tests**: See how auth is tested in `tests/`
2. **Review middleware**: Ensure session refresh is working
3. **Verify environment**: Check `.env.local` has correct Supabase keys
4. **Run type checking**: `npm run typecheck` to catch type errors
5. **Check console**: Look for auth errors in browser/server console

---

**Quickstart Guide Complete** ✅

Ready to implement? Follow the steps above and refer to the test examples for validation.
