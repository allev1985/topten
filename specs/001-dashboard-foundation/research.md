# Phase 0: Research & Design Decisions

**Feature**: Dashboard Foundation  
**Date**: 2025-12-06  
**Status**: Complete

## Research Tasks

This document consolidates research findings and design decisions for the Dashboard Foundation feature.

---

## 1. Client-Side Session Monitoring in Next.js App Router

### Decision
Use `useEffect` hook with Supabase auth state listener in client component to monitor session changes.

### Rationale
- **Server Components Limitation**: Server components cannot use React hooks or client-side APIs
- **Real-time Detection**: `onAuthStateChange` provides immediate notification of session changes
- **Existing Pattern**: Aligns with Supabase SSR best practices for Next.js App Router
- **Performance**: Minimal overhead - only subscribes when dashboard page is active

### Implementation Pattern
```typescript
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Component rendering...
}
```

### Alternatives Considered
1. **Polling with setInterval**: 
   - Rejected: Less efficient, introduces artificial delay (100-1000ms checks)
   - Event-driven approach is more responsive and resource-efficient

2. **Middleware-only approach**: 
   - Rejected: Only checks on navigation, misses in-page session expiration
   - Requires page reload to detect changes

3. **Server Component periodic refresh**: 
   - Rejected: Not real-time, requires full page revalidation
   - Poor UX for session expiration detection

### References
- [Supabase Auth Helpers - SSR](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Next.js 16 App Router Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

---

## 2. Responsive Layout Strategy (Desktop Sidebar + Mobile Drawer)

### Decision
Use CSS media queries with Tailwind breakpoints (lg:1024px) for desktop sidebar visibility, and shadcn Sheet component for mobile drawer.

### Rationale
- **Standard Breakpoint**: Tailwind's `lg` (1024px) is industry-standard for desktop/tablet distinction
- **Progressive Enhancement**: Desktop users get persistent navigation, mobile users get on-demand access
- **Accessibility**: shadcn Sheet includes ARIA attributes, focus trapping, and keyboard navigation
- **Animation Performance**: CSS transforms (translateX) use GPU acceleration for smooth 60fps animations

### Implementation Pattern

**Desktop (≥1024px)**:
```tsx
<aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 border-r">
  <DashboardSidebar />
</aside>

<main className="lg:ml-64">
  <DashboardContent />
</main>
```

**Mobile (<1024px)**:
```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetTrigger asChild className="lg:hidden">
    <Button variant="ghost" size="icon">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent side="left">
    <DashboardSidebar />
  </SheetContent>
</Sheet>
```

### Alternatives Considered
1. **Custom drawer implementation**: 
   - Rejected: Reinventing accessibility features (focus trap, ARIA, keyboard nav)
   - shadcn Sheet is battle-tested and maintained

2. **JavaScript-based responsive detection**: 
   - Rejected: Unnecessary complexity for simple viewport-based layout
   - CSS media queries are declarative and performant

3. **Radix UI Dialog for mobile drawer**: 
   - Rejected: Sheet is semantically correct for slide-out navigation
   - Dialog implies modal context, Sheet implies auxiliary content

### Performance Targets
- Sheet open/close: <300ms (SC-003)
- No layout shift on viewport resize
- No flash of unstyled content (FOUC)

### References
- [shadcn/ui Sheet Component](https://ui.shadcn.com/docs/components/sheet)
- [Radix UI Dialog Primitive](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)

---

## 3. Component Architecture & Separation of Concerns

### Decision
Create three focused components:
1. **DashboardSidebar**: Reusable navigation content (used in both desktop/mobile)
2. **DashboardContent**: Main content area wrapper with responsive margins
3. **page.tsx**: Client component orchestrating layout, auth monitoring, and drawer state

### Rationale
- **Single Responsibility**: Each component has one clear purpose
- **Reusability**: DashboardSidebar used in both fixed sidebar and Sheet drawer
- **Testability**: Isolated components easier to unit test
- **Future Extensibility**: Navigation items can be added to DashboardSidebar without touching page logic

### Component Contracts

**DashboardSidebar**:
- Props: None (stateless, presentational)
- Purpose: Render logo and navigation container
- Usage: Both desktop (fixed aside) and mobile (Sheet content)

**DashboardContent**:
- Props: `children: ReactNode`
- Purpose: Provide responsive main content wrapper
- Behavior: Applies `lg:ml-64` to offset desktop sidebar width

**page.tsx**:
- Type: Client component (`'use client'`)
- Purpose: Session monitoring, drawer state management, layout orchestration
- State: `isDrawerOpen` (boolean)

### Alternatives Considered
1. **Single monolithic component**: 
   - Rejected: Violates single responsibility, difficult to test
   - Makes sidebar reuse between desktop/mobile impossible

2. **Context-based state sharing**: 
   - Rejected: Overkill for simple drawer state
   - Local state in page.tsx is sufficient

3. **Separate mobile and desktop sidebar components**: 
   - Rejected: Code duplication, maintenance burden
   - Same content should use same component

### References
- [React Component Composition](https://react.dev/learn/passing-props-to-a-component)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

---

## 4. Testing Strategy & Coverage Target

### Decision
Implement three-tier testing approach:
1. **Component Tests** (Vitest + React Testing Library): Isolated component behavior
2. **Integration Tests** (Vitest): Auth flows, responsive behavior, session monitoring
3. **E2E Tests** (Playwright): Full user scenarios from spec

Target: ≥65% overall coverage (SC-005)

### Rationale
- **Spec Requirement**: Success Criteria SC-005 mandates ≥65% coverage
- **Pyramid Principle**: More unit/component tests (fast), fewer E2E tests (slow but comprehensive)
- **Critical Path Coverage**: All user stories have corresponding test scenarios
- **Regression Prevention**: Failed scenarios must have tests before fixes

### Test Coverage Breakdown

**Component Tests** (~60% of test suite):
- `DashboardSidebar.test.tsx`: Logo rendering, navigation container structure
- `DashboardContent.test.tsx`: Children rendering, responsive className application
- `page.test.tsx`: Session monitoring, drawer state management

**Integration Tests** (~30% of test suite):
- `auth-protection.test.ts`: Redirect flows (authenticated/unauthenticated)
- `session-monitoring.test.ts`: Session expiration detection
- `responsive-layout.test.ts`: Sidebar visibility at different viewports

**E2E Tests** (~10% of test suite):
- `dashboard-access.spec.ts`: Full scenarios from User Stories 1-4

### Key Test Scenarios

**From User Story 1 (Auth Protection)**:
- ✅ Unauthenticated access redirects to /login
- ✅ Authenticated access shows dashboard
- ✅ Session expiration triggers redirect
- ✅ Login redirect returns to dashboard

**From User Story 2 (Desktop Navigation)**:
- ✅ Desktop viewport shows fixed sidebar
- ✅ Logo/branding visible in sidebar
- ✅ Sidebar remains fixed during scroll
- ✅ Viewport resize hides sidebar on mobile

**From User Story 3 (Mobile Navigation)**:
- ✅ Mobile viewport shows hamburger button
- ✅ Drawer opens on button click
- ✅ Drawer closes on close button/outside click
- ✅ Drawer contains same content as desktop sidebar

**From User Story 4 (Content Area)**:
- ✅ Main content area visible on all viewports
- ✅ Semantic HTML elements used correctly
- ✅ Content area width adjusts for sidebar (desktop)
- ✅ Content area full width on mobile

### Tools & Configuration
- **Vitest**: Fast unit/component/integration tests with coverage reporting
- **React Testing Library**: Component testing with user-centric queries
- **Playwright**: E2E browser automation with real browser testing
- **@vitest/coverage-v8**: Istanbul-based coverage with threshold enforcement

### Coverage Enforcement
```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 65,
      functions: 65,
      branches: 65,
      statements: 65,
    },
  },
});
```

### Alternatives Considered
1. **Jest instead of Vitest**: 
   - Rejected: Vitest is faster, better ESM support, already project standard
   - No need to change existing test infrastructure

2. **Cypress instead of Playwright**: 
   - Rejected: Playwright already configured in project
   - Better cross-browser support, faster execution

3. **Lower coverage threshold (e.g., 50%)**: 
   - Rejected: Spec explicitly requires ≥65%
   - Critical auth features deserve high coverage

### References
- [Vitest Coverage Configuration](https://vitest.dev/guide/coverage.html)
- [React Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Testing](https://playwright.dev/docs/intro)

---

## 5. shadcn/ui Sheet Component Integration

### Decision
Install shadcn Sheet component via CLI: `pnpm dlx shadcn@latest add sheet`

### Rationale
- **Framework Integrity**: Follows constitution principle - don't modify generated components
- **Maintained Dependencies**: CLI ensures correct Radix UI versions and peer dependencies
- **Configuration Respect**: Uses project's components.json configuration automatically
- **Bundle Optimization**: Only includes necessary Radix primitives

### Installation Command
```bash
pnpm dlx shadcn@latest add sheet
```

This will:
1. Install `@radix-ui/react-dialog` (if not present)
2. Generate `src/components/ui/sheet.tsx`
3. Respect existing `components.json` configuration
4. Use project's styling conventions (Tailwind, cn utility)

### Sheet Component Usage
```tsx
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

// In page.tsx
<Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon">
      <Menu className="h-6 w-6" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-64 p-0">
    <DashboardSidebar />
  </SheetContent>
</Sheet>
```

### Alternatives Considered
1. **Manual Radix Dialog implementation**: 
   - Rejected: Duplicates shadcn's work, loses future updates
   - Violates DRY principle

2. **Copy Sheet component from docs**: 
   - Rejected: May not match project's component.json configuration
   - CLI ensures consistency with existing components

3. **Custom drawer with Framer Motion**: 
   - Rejected: Adds dependency, reinvents accessibility
   - shadcn Sheet already provides smooth animations

### Configuration Notes
Project's `components.json`:
- Style: `new-york`
- RSC: `true` (Server Components enabled)
- Icon Library: `lucide` (Menu icon available)
- Aliases: `@/components/ui` for UI components

### References
- [shadcn/ui Sheet Documentation](https://ui.shadcn.com/docs/components/sheet)
- [shadcn/ui CLI](https://ui.shadcn.com/docs/cli)

---

## 6. Semantic HTML & Accessibility

### Decision
Use semantic HTML5 elements for dashboard structure:
- `<nav>` for navigation trigger/menu button
- `<aside>` for desktop sidebar
- `<main>` for content area

### Rationale
- **Spec Requirement**: FR-011 mandates semantic HTML for accessibility
- **Screen Reader Support**: Landmarks help assistive technology navigate page structure
- **SEO Benefits**: Search engines understand page hierarchy
- **Standards Compliance**: HTML5 best practices for application structure

### Implementation
```tsx
// Desktop sidebar
<aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 border-r">
  <DashboardSidebar />
</aside>

// Mobile trigger (within nav)
<nav className="lg:hidden p-4 border-b">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Open navigation menu">
        <Menu className="h-6 w-6" />
      </Button>
    </SheetTrigger>
  </Sheet>
</nav>

// Main content
<main className="lg:ml-64">
  <DashboardContent>
    {/* Content here */}
  </DashboardContent>
</main>
```

### Accessibility Checklist
- ✅ Semantic landmarks (nav, aside, main)
- ✅ ARIA labels on interactive elements (hamburger button)
- ✅ Keyboard navigation (Sheet component provides focus trap)
- ✅ Focus management (Sheet returns focus on close)
- ✅ Screen reader announcements (Radix Dialog handles ARIA)

### Alternatives Considered
1. **Generic divs with ARIA roles**: 
   - Rejected: Semantic HTML is simpler and more standard
   - Less maintenance burden than manual ARIA attributes

2. **Single `<div>` wrapper**: 
   - Rejected: Violates spec requirement FR-011
   - Poor accessibility for screen readers

### References
- [MDN Semantic HTML](https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantic_elements)
- [W3C ARIA Landmarks](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

---

## Summary of Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Session Monitoring** | useEffect + onAuthStateChange | Real-time detection, Supabase SSR pattern |
| **Responsive Layout** | CSS media queries (lg:1024px) + shadcn Sheet | Standard breakpoint, accessible drawer |
| **Component Architecture** | DashboardSidebar + DashboardContent + page.tsx | Single responsibility, reusability |
| **Testing Strategy** | 3-tier (component/integration/E2E), ≥65% coverage | Spec requirement, critical path coverage |
| **Sheet Installation** | shadcn CLI (`pnpm dlx shadcn@latest add sheet`) | Framework integrity, maintained dependencies |
| **Semantic HTML** | nav, aside, main elements | Accessibility, spec requirement FR-011 |

---

## Phase 0 Completion Checklist

- [x] Client-side session monitoring approach researched
- [x] Responsive layout strategy defined
- [x] Component architecture planned
- [x] Testing strategy established with ≥65% target
- [x] shadcn Sheet integration method confirmed
- [x] Semantic HTML requirements documented
- [x] All NEEDS CLARIFICATION items resolved
- [x] Best practices for Next.js App Router + Supabase identified
- [x] Performance targets mapped to spec success criteria

**Status**: ✅ Ready for Phase 1 (Design & Contracts)
