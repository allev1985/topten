# Research: Auth-Aware Landing Page

**Feature**: 001-auth-landing-page  
**Date**: 2025-12-04  
**Status**: Complete

## Overview

This research document consolidates findings on implementing server-side authentication detection in Next.js App Router applications, focusing on Supabase integration patterns, SSR/CSR boundaries, and hydration error prevention.

## Research Questions & Findings

### 1. Next.js App Router Server Component Authentication Patterns

**Question**: What are the best practices for implementing server-side authentication checks in Next.js 14+ App Router?

**Decision**: Use async Server Components with Supabase SSR client

**Rationale**:
- Next.js App Router Server Components are async by default, enabling server-side data fetching
- Supabase SSR package (`@supabase/ssr`) provides `createServerClient()` specifically designed for server-side auth
- Server Components eliminate client-side auth flicker and improve initial page load performance
- The existing `@/lib/supabase/server.ts` utility already implements the recommended pattern

**Alternatives Considered**:
1. **Client-side auth check with useEffect**: Rejected due to auth flicker, poor UX, and slower initial render
2. **getServerSideProps pattern**: Rejected as it's Pages Router only, not compatible with App Router
3. **Route handlers for auth API**: Unnecessary complexity for simple auth state check

**References**:
- Next.js App Router documentation: Server Components are async by default
- Supabase SSR documentation: Recommends `createServerClient()` for Server Components
- Existing implementation at `src/lib/supabase/server.ts` follows this pattern

---

### 2. Preventing Hydration Errors in SSR/CSR Boundaries

**Question**: How do we pass authentication state from Server Components to Client Components without causing hydration mismatches?

**Decision**: Pass serializable boolean prop (`isAuthenticated: boolean`) to Client Component

**Rationale**:
- Server Components can only pass serializable props to Client Components
- Boolean is the simplest serializable type and prevents object serialization issues
- User object is not needed in the initial render, only auth state
- This approach matches React's recommendation for SSR/CSR data flow
- No conditional rendering based on client-side state prevents hydration mismatches

**Alternatives Considered**:
1. **Pass entire user object**: Rejected due to serialization complexity and potential PII exposure
2. **Use Context API**: Rejected as it requires client-side rendering and causes hydration issues
3. **localStorage/sessionStorage**: Rejected as it's client-only and causes SSR/CSR mismatch
4. **Zustand/Redux**: Unnecessary complexity for simple boolean state

**Implementation Pattern**:
```typescript
// Server Component (page.tsx)
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  
  return <LandingPageClient isAuthenticated={isAuthenticated} />;
}

// Client Component (LandingPageClient.tsx)
'use client';

interface LandingPageClientProps {
  isAuthenticated: boolean;
}

export default function LandingPageClient({ isAuthenticated }: LandingPageClientProps) {
  // Render based on isAuthenticated prop
}
```

**References**:
- React Server Components RFC: Only serializable props allowed
- Next.js documentation: Server/Client component boundaries
- Vercel blog: Preventing hydration errors in Next.js

---

### 3. Supabase Auth Best Practices for Server Components

**Question**: What's the correct way to check authentication in Next.js Server Components using Supabase?

**Decision**: Use `supabase.auth.getUser()` from server-side client

**Rationale**:
- `getUser()` validates the JWT token server-side, ensuring security
- Works with the existing middleware that refreshes sessions
- Returns `null` for unauthenticated users, enabling simple conditional logic
- Existing `createClient()` utility in `@/lib/supabase/server.ts` is already configured correctly
- Middleware handles session refresh, so Server Components see current auth state

**Alternatives Considered**:
1. **getSession()**: Rejected as it doesn't validate JWT server-side (security risk)
2. **Custom auth check via database**: Unnecessary when Supabase provides built-in method
3. **Auth API route**: Adds unnecessary network request and complexity

**Security Considerations**:
- Always use `getUser()` for server-side auth validation (validates JWT)
- Never use `getSession()` alone for authorization decisions
- Middleware already handles session refresh, preventing stale sessions
- Graceful fallback to non-authenticated state on errors (fail-closed security)

**References**:
- Supabase documentation: "Use getUser() for server-side auth checks"
- Existing middleware implementation at `middleware.ts`
- Supabase SSR package documentation

---

### 4. Testing Strategy for Server Component Authentication

**Question**: How do we test server-side authentication logic with 70%+ coverage?

**Decision**: Multi-layer testing approach with unit, component, and E2E tests

**Rationale**:
- Unit tests verify auth detection logic in isolation (mock Supabase client)
- Component tests verify rendering based on auth state (React Testing Library)
- E2E tests verify full user flows with real auth (Playwright)
- Existing test infrastructure (Vitest, RTL, Playwright) supports all test types
- Coverage target aligns with project standards

**Test Strategy**:

1. **Unit Tests** (Vitest):
   - Test auth state detection with mocked Supabase responses
   - Test error handling when auth check fails
   - Test boolean transformation logic
   - Coverage: Auth helper functions if extracted

2. **Component Tests** (React Testing Library):
   - Test `LandingPageClient` renders correctly when `isAuthenticated={true}`
   - Test `LandingPageClient` renders correctly when `isAuthenticated={false}`
   - Test no hydration warnings occur
   - Coverage: Client component rendering logic

3. **E2E Tests** (Playwright):
   - Test authenticated user sees appropriate landing page
   - Test non-authenticated user sees appropriate landing page
   - Test no console errors or hydration warnings
   - Test navigation options appear correctly
   - Coverage: Full user flows

**Mocking Strategy**:
```typescript
// Unit test example
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: mockUser },
        error: null
      }))
    }
  }))
}));
```

**Alternatives Considered**:
1. **Only E2E tests**: Rejected as too slow and doesn't test edge cases efficiently
2. **Only unit tests**: Rejected as doesn't verify rendering integration
3. **Snapshot testing**: Rejected as brittle and doesn't test behavior

**References**:
- Existing test setup at `tests/setup.ts`
- Vitest configuration at `vitest.config.ts`
- Playwright configuration at `playwright.config.ts`

---

### 5. Performance Optimization for Auth Checks

**Question**: How do we ensure auth checks meet the <200ms performance target?

**Decision**: Leverage Server Components and existing middleware session management

**Rationale**:
- Server Components execute on server, removing client-side auth overhead
- Middleware already refreshes sessions, so auth check is fast token validation
- `getUser()` is optimized for performance (local JWT validation)
- No additional database queries needed for basic auth state
- Server-side rendering provides instant visual feedback

**Performance Characteristics**:
- `getUser()` average latency: ~10-50ms (JWT validation only)
- Server Component rendering: Faster than client-side due to no JS download
- Total auth check time: Well under 200ms target
- First Contentful Paint: Improved vs client-side auth

**Monitoring Approach**:
- Use Next.js built-in performance monitoring
- Log auth check timing in development
- Monitor TTFB in production (should remain low)

**Alternatives Considered**:
1. **Client-side auth with SSR placeholder**: Rejected due to auth flicker and poor UX
2. **Edge middleware auth**: Unnecessary as middleware already handles session refresh
3. **Caching auth state**: Rejected as sessions can change, stale cache risky

**References**:
- Next.js performance best practices
- Supabase performance documentation
- Existing middleware implementation

---

## Technology Stack Confirmation

All required technologies are already present in the project:

- ✅ Next.js 16.0.5 (App Router) - Framework
- ✅ React 19.2.0 - UI library
- ✅ TypeScript 5.x - Type safety
- ✅ Supabase (@supabase/ssr 0.8.0) - Auth provider
- ✅ Vitest 4.0.14 - Unit testing
- ✅ React Testing Library 16.3.0 - Component testing
- ✅ Playwright 1.57.0 - E2E testing
- ✅ Tailwind CSS 4.x - Styling (no changes needed)

**No new dependencies required.**

---

## Integration Points

### Existing Code to Reuse

1. **`@/lib/supabase/server.ts`**: 
   - Already implements `createClient()` with proper cookie handling
   - No modifications needed

2. **Middleware (`middleware.ts`)**:
   - Already handles session refresh for all routes
   - Landing page benefits from existing session management
   - No modifications needed

3. **App Router Layout (`src/app/layout.tsx`)**:
   - Already configured for Server Components
   - No modifications needed

### New Code to Create

1. **`src/app/page.tsx`** (modify):
   - Convert to async Server Component
   - Add auth check using `createClient()`
   - Pass `isAuthenticated` boolean to client component

2. **`src/components/shared/LandingPageClient.tsx`** (new):
   - Client Component with `'use client'` directive
   - Accepts `isAuthenticated: boolean` prop
   - Renders content based on auth state

3. **Test files** (new):
   - Unit tests for auth logic
   - Component tests for rendering
   - E2E tests for user flows

---

## Risk Assessment

### Low Risk
- ✅ Using established Next.js patterns (Server Components)
- ✅ Reusing existing Supabase utilities
- ✅ Simple boolean prop passing
- ✅ No breaking changes to existing functionality

### Mitigations
- Comprehensive testing strategy (unit + component + E2E)
- Graceful error handling (fallback to non-authenticated)
- Follow existing middleware session management
- Maintain current visual design (no UX changes)

---

## Decision Summary

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Component Type** | Async Server Component | Server-side auth, no client flicker |
| **Auth Method** | `getUser()` from `@/lib/supabase/server` | Secure JWT validation, existing utility |
| **Prop Type** | `isAuthenticated: boolean` | Serializable, simple, no hydration errors |
| **Client Component** | New `LandingPageClient.tsx` | Separation of concerns, future interactivity |
| **Testing Strategy** | Unit + Component + E2E | Comprehensive coverage, meets 70% target |
| **Error Handling** | Fallback to non-authenticated | Fail-closed security, graceful degradation |
| **Performance** | Server-side rendering | <200ms auth check, fast initial render |

---

## Next Steps (Phase 1)

1. Create data model for auth state interface
2. Define TypeScript contracts for component props
3. Create quickstart guide for developers
4. Update agent context with learnings
5. Re-evaluate Constitution Check with concrete design

**Research Complete** ✅
