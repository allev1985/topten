# Research: Landing Page Architecture & Implementation

**Feature**: Landing Page  
**Date**: 2025-12-05  
**Status**: Complete

## Overview

This document captures the research and architectural decisions for implementing the YourFavs landing page using Next.js App Router with a Server Component + Client Component pattern.

## Architecture Decisions

### 1. Server Component vs Client Component Split

**Decision**: Use Server Component for page shell with optional Client Component wrapper for interactive features

**Rationale**:

- **Performance**: Server Components enable faster initial page load by reducing JavaScript bundle size and leveraging server-side rendering
- **SEO**: Server-rendered content improves search engine indexing and social media previews
- **Progressive Enhancement**: Core content (branding, tagline) works without JavaScript, meeting accessibility requirement (FR-007)
- **Future-Proofing**: Client Component wrapper provides foundation for future interactive features (modals, animations) without architectural refactoring

**Alternatives Considered**:

1. **Pure Server Component**: Simpler but would require refactoring when adding client-side features
2. **Pure Client Component**: Would work but increases bundle size, slower initial render, fails progressive enhancement requirement
3. **Hybrid with use client at root**: Violates Next.js best practices (prefer Server Components by default)

**Selected Approach**:

```tsx
// src/app/page.tsx (Server Component)
import LandingPageClient from "./_components/landing-page-client";

export default function LandingPage() {
  // Server-side operations (metadata, data fetching if needed)
  return <LandingPageClient />;
}

// src/app/_components/landing-page-client.tsx (Client Component)
("use client");

export default function LandingPageClient() {
  // Client-side interactivity wrapper
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
          YourFavs
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Curate and share your favorite places
        </p>
      </main>
    </div>
  );
}
```

**References**:

- [Next.js App Router: Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [React 19: Server Components](https://react.dev/reference/rsc/server-components)

---

### 2. Component Structure & Reusability

**Decision**: Reuse existing shadcn/ui components and Tailwind utilities; avoid creating new components unless necessary

**Rationale**:

- **DRY Principle**: Constitution mandates reusing existing code patterns
- **Consistency**: Maintains visual consistency with auth pages and other parts of the application
- **Maintenance**: Fewer components to maintain and test
- **Performance**: shadcn/ui components are already optimized and bundled

**Available Components for Reuse**:

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` - For structured content layout
- `Button` - For future CTAs (sign up, login)
- Tailwind utility classes - For layout and styling
- `cn()` utility - For conditional class merging

**Alternatives Considered**:

1. **Create custom landing page components**: Adds unnecessary complexity, violates DRY
2. **Use headless UI library**: Overkill for simple landing page
3. **Plain HTML/CSS**: Inconsistent with existing codebase styling approach

**Selected Approach**: Minimal custom code using existing design system

---

### 3. Testing Strategy

**Decision**: Multi-layered testing approach achieving minimum 70% coverage

**Rationale**:

- **Constitution Requirement**: Testing discipline principle requires comprehensive coverage
- **Risk Mitigation**: Landing page is critical entry point; failures impact all users
- **Regression Prevention**: Tests prevent future changes from breaking core functionality
- **Documentation**: Tests serve as living documentation of expected behavior

**Test Layers**:

#### Component Tests (Vitest + React Testing Library)

**Coverage Target**: Component rendering, accessibility, content display  
**Location**: `tests/component/landing-page/`

Test cases:

- ✅ Renders branding (YourFavs title)
- ✅ Renders tagline ("Curate and share your favorite places")
- ✅ Uses semantic HTML (`<main>` element)
- ✅ Applies correct Tailwind classes for styling
- ✅ No hydration mismatches between server and client
- ✅ Accessible to screen readers
- ✅ Renders consistently for authenticated vs unauthenticated users

Example test structure:

```typescript
// tests/component/landing-page/landing-page-client.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingPageClient from '@/app/_components/landing-page-client'

describe('LandingPageClient', () => {
  describe('branding display', () => {
    it('renders the YourFavs title', () => {
      render(<LandingPageClient />)
      expect(screen.getByText('YourFavs')).toBeInTheDocument()
    })

    it('renders the tagline', () => {
      render(<LandingPageClient />)
      expect(screen.getByText(/curate and share your favorite places/i)).toBeInTheDocument()
    })
  })

  describe('semantic structure', () => {
    it('uses main element for primary content', () => {
      const { container } = render(<LandingPageClient />)
      expect(container.querySelector('main')).toBeInTheDocument()
    })
  })
})
```

#### E2E Tests (Playwright)

**Coverage Target**: User flows, browser compatibility, performance  
**Location**: `tests/e2e/landing-page.spec.ts`

Test cases:

- ✅ Page loads successfully at root URL (/)
- ✅ No console errors or hydration warnings
- ✅ Page renders within 2 seconds (performance requirement)
- ✅ Works on mobile, tablet, desktop viewports
- ✅ Works in Chrome, Firefox, Safari, Edge
- ✅ Navigation to/from landing page works correctly

Example test structure:

```typescript
// tests/e2e/landing-page.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("loads successfully at root URL", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "YourFavs" })).toBeVisible();
  });

  test("renders within 2 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "YourFavs" })).toBeVisible();
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test("has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    expect(errors).toHaveLength(0);
  });
});
```

#### Integration Tests

**Coverage Target**: Navigation flows, state management  
**Location**: `tests/integration/landing-page/`

Test cases:

- ✅ Direct navigation to / works
- ✅ Navigation from other pages to / works
- ✅ Browser back/forward navigation works
- ✅ Deep linking works correctly

**Coverage Calculation**:
Based on Vitest configuration, coverage includes:

- `src/app/_components/landing-page-client.tsx`
- Server component (`src/app/page.tsx`) is excluded per existing config but will be tested via E2E

**Alternatives Considered**:

1. **E2E tests only**: Insufficient coverage, slow feedback loop
2. **Component tests only**: Misses browser-specific issues and performance requirements
3. **Manual testing only**: Not repeatable, violates constitution

**Selected Approach**: Multi-layered automated testing strategy

---

### 4. Performance Optimization

**Decision**: Leverage Next.js App Router optimizations with minimal custom optimization

**Rationale**:

- **Built-in Optimizations**: Next.js 16 provides automatic optimizations (code splitting, image optimization, font optimization)
- **Server Components**: Reduce client-side JavaScript bundle size
- **Static Generation**: Landing page can be statically generated (no dynamic data)
- **Progressive Enhancement**: Core content renders without JavaScript

**Optimization Techniques**:

1. **Server Component for Page Shell**: Reduces JavaScript bundle, faster initial render
2. **Minimal Client JavaScript**: Only interactive elements in Client Component
3. **Tailwind CSS Purging**: Automatically removes unused styles (configured)
4. **Font Optimization**: Next.js automatic font optimization
5. **Image Optimization**: Use Next.js Image component if images added in future

**Performance Targets**:

- Initial render: < 2 seconds (FR-005, SC-002)
- First Contentful Paint: < 1.5 seconds
- Largest Contentful Paint: < 2.5 seconds
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3 seconds

**Measurement Tools**:

- Lighthouse CI (automated)
- Playwright performance metrics
- Next.js built-in performance reporting

**Alternatives Considered**:

1. **Heavy optimization (lazy loading, code splitting)**: Premature for simple landing page
2. **CDN caching strategies**: Not needed at this stage
3. **Service workers**: Overkill for static content

**Selected Approach**: Rely on Next.js defaults with minimal custom optimization

---

### 5. Accessibility & Progressive Enhancement

**Decision**: Ensure core content works without JavaScript, follow WCAG 2.1 Level AA

**Rationale**:

- **Requirement**: FR-007 mandates JavaScript-free core content access
- **Inclusivity**: Makes application accessible to users with disabilities or slow connections
- **SEO**: Search engines can index content without JavaScript execution
- **Resilience**: Application degrades gracefully in constrained environments

**Implementation Strategy**:

1. **Semantic HTML**: Use proper heading hierarchy, landmark elements (`<main>`, `<nav>`)
2. **ARIA Labels**: Where needed for screen readers
3. **Color Contrast**: Follow WCAG AA standards (already met by Tailwind zinc palette)
4. **Keyboard Navigation**: All interactive elements keyboard-accessible
5. **Server-Rendered Content**: Core branding and messaging visible without JavaScript

**Accessibility Checklist**:

- ✅ Proper heading hierarchy (h1 for "YourFavs")
- ✅ Semantic HTML elements (`<main>`, `<h1>`, `<p>`)
- ✅ Sufficient color contrast (zinc-600/zinc-400 on white/black backgrounds)
- ✅ No content dependent on JavaScript to render
- ✅ Screen reader friendly (tested with VoiceOver/NVDA)
- ✅ Keyboard navigable (when interactive elements added)

**Testing**:

- Automated: axe-core via Playwright
- Manual: VoiceOver (macOS), NVDA (Windows), keyboard-only navigation

**Alternatives Considered**:

1. **WCAG AAA compliance**: Excessive for current scope
2. **Client-only rendering**: Violates FR-007
3. **Skip accessibility**: Violates constitution and legal requirements

**Selected Approach**: WCAG 2.1 Level AA compliance with progressive enhancement

---

### 6. Cross-Browser Compatibility

**Decision**: Support latest 2 versions of Chrome, Firefox, Safari, Edge

**Rationale**:

- **User Coverage**: Covers >95% of target audience
- **Maintenance**: Reasonable support burden
- **Modern Features**: Can use modern CSS and JavaScript features
- **Progressive Enhancement**: Older browsers get functional but simpler experience

**Browser Support Matrix**:

| Browser | Versions | Notes                       |
| ------- | -------- | --------------------------- |
| Chrome  | Latest 2 | Primary development browser |
| Firefox | Latest 2 | Full support                |
| Safari  | Latest 2 | iOS/macOS support           |
| Edge    | Latest 2 | Chromium-based              |

**Testing Strategy**:

- **Development**: Chrome DevTools
- **CI/CD**: Playwright with browser matrix
- **Manual**: BrowserStack for visual regression

**Known Compatibility Considerations**:

1. **CSS Grid/Flexbox**: Fully supported in target browsers
2. **Tailwind CSS**: Generates compatible CSS
3. **React 19**: Requires modern JavaScript features (ES2020+)
4. **Next.js**: Polyfills not included by default in App Router

**Alternatives Considered**:

1. **IE11 support**: No longer necessary, Microsoft ended support
2. **Support all browser versions**: Unsustainable maintenance burden
3. **Chrome-only**: Too restrictive, excludes significant user base

**Selected Approach**: Latest 2 versions of major browsers with progressive enhancement

---

## Technology Best Practices

### Next.js App Router

**Key Patterns**:

1. **Server Components by Default**: Use Client Components only when needed
2. **Colocation**: Keep components close to route segments (use `_components` for private)
3. **Metadata API**: Use Next.js metadata for SEO
4. **Error Handling**: Error boundaries for client components

**References**:

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Server vs Client Components Decision Tree](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#when-to-use-server-and-client-components)

### React 19

**Key Features**:

- **Server Components**: Use for non-interactive content
- **Suspense**: For loading states (future use)
- **React Compiler**: Automatic memoization (consider for future optimization)

**Gotchas**:

- `use client` directive required at top of file for Client Components
- Props passed to Client Components must be serializable
- Cannot import Server Components into Client Components

### Tailwind CSS v4

**Best Practices**:

1. Use utility classes over custom CSS
2. Leverage design tokens (zinc palette, spacing scale)
3. Use `cn()` utility for conditional classes
4. Follow existing color scheme (zinc-50/zinc-600 for light, black/zinc-400 for dark)

**Dark Mode**: Already configured (`dark:` variant available)

### Vitest + React Testing Library

**Best Practices**:

1. **Query Priority**: getByRole > getByLabelText > getByText > getByTestId
2. **User-Centric Tests**: Test what users see, not implementation details
3. **Avoid Implementation Details**: Don't test internal state, props, or class names directly
4. **Setup/Teardown**: Use existing `tests/setup.ts` configuration

**Pattern Example** (from existing tests):

```typescript
// ✅ Good: Tests user-visible behavior
expect(screen.getByText("YourFavs")).toBeInTheDocument();

// ❌ Bad: Tests implementation details
expect(component.props.title).toBe("YourFavs");
```

### Playwright

**Best Practices**:

1. **Selectors**: Use role-based selectors over CSS selectors
2. **Auto-Wait**: Leverage Playwright's built-in waiting
3. **Assertions**: Use web-first assertions (toBeVisible, toHaveText)
4. **Browser Matrix**: Test across multiple browsers in CI

**Pattern Example**:

```typescript
// ✅ Good: Web-first assertion with auto-wait
await expect(page.getByRole("heading", { name: "YourFavs" })).toBeVisible();

// ❌ Bad: Manual wait + CSS selector
await page.waitForTimeout(1000);
expect(await page.$("h1").innerText()).toBe("YourFavs");
```

---

## Implementation Risks & Mitigations

### Risk 1: Hydration Mismatch Errors

**Likelihood**: Medium  
**Impact**: High (blocks SC-003)

**Mitigation**:

- Use consistent server/client rendering logic
- Avoid time-based or random content on initial render
- Test in development mode (React 19 provides better hydration error messages)
- Use suppressHydrationWarning sparingly and only when justified

### Risk 2: Performance Regression

**Likelihood**: Low  
**Impact**: Medium (blocks SC-002)

**Mitigation**:

- Lighthouse CI in pipeline
- Playwright performance tests with thresholds
- Bundle size monitoring
- Regular performance audits

### Risk 3: Cross-Browser Issues

**Likelihood**: Low  
**Impact**: Medium (blocks SC-005)

**Mitigation**:

- Playwright browser matrix in CI
- Use well-supported CSS features
- Test on actual devices/browsers before release
- Progressive enhancement ensures baseline functionality

### Risk 4: Test Coverage < 70%

**Likelihood**: Low  
**Impact**: High (blocks SC-004)

**Mitigation**:

- Write tests alongside implementation
- Use Vitest coverage reports to identify gaps
- Block merge if coverage threshold not met (configure in vitest.config.ts)

---

## Open Questions & Decisions Deferred

### Questions Resolved ✅

1. **Should we use Server or Client Component?**  
   → **Resolved**: Hybrid approach (Server Component page with Client Component wrapper)

2. **What testing strategy to use?**  
   → **Resolved**: Multi-layered (component + E2E + integration)

3. **Which UI components to use?**  
   → **Resolved**: Reuse existing shadcn/ui components

4. **What performance targets to set?**  
   → **Resolved**: < 2s initial render, < 1.5s FCP

### Decisions Deferred to Future Iterations

1. **Advanced Features**: Modals, animations, authentication prompts (out of scope)
2. **Content Enhancement**: Hero images, CTAs, feature highlights (future iteration)
3. **Analytics Integration**: User tracking, event logging (future iteration)
4. **A/B Testing**: Content variants, conversion optimization (future iteration)

---

## References

### Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Vitest](https://vitest.dev)
- [Playwright](https://playwright.dev)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

### Project Documents

- [Feature Specification](./spec.md)
- [Project Constitution](../../.specify/memory/constitution.md)
- [Existing Test Examples](../../tests/component/auth/verify-email-page.test.tsx)

---

**Research Status**: ✅ Complete  
**Next Phase**: Phase 1 - Design & Contracts
