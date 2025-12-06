# Quickstart Guide: Landing Page

**Feature**: Landing Page  
**Date**: 2025-12-05  
**Audience**: Developers working on the YourFavs landing page

---

## Overview

This guide helps developers understand, test, and extend the YourFavs landing page. The landing page uses Next.js App Router with a Server Component + Client Component pattern for optimal performance and future extensibility.

---

## Quick Navigation

- [Setup](#setup)
- [Development](#development)
- [Testing](#testing)
- [Architecture](#architecture)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/topten.git
cd topten

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The landing page will be available at `http://localhost:3000/`

---

## Development

### File Structure

```
src/app/
├── page.tsx                          # Server Component (route handler)
└── _components/
    └── landing-page-client.tsx       # Client Component (UI)

tests/
├── component/landing-page/
│   └── landing-page-client.test.tsx  # Component tests
├── e2e/
│   └── landing-page.spec.ts          # E2E tests
└── integration/landing-page/
    └── navigation.test.ts            # Navigation tests
```

### Key Files

#### `src/app/page.tsx` (Server Component)

```typescript
import type { Metadata } from 'next'
import LandingPageClient from './_components/landing-page-client'

export const metadata: Metadata = {
  title: 'YourFavs - Curate and share your favorite places',
  description: 'Discover and share curated lists of your favorite coffee shops, restaurants, bars, and more.',
  openGraph: {
    title: 'YourFavs',
    description: 'Curate and share your favorite places',
    type: 'website',
  },
}

export default function LandingPage() {
  return <LandingPageClient />
}
```

**Purpose**:

- Handles the root route (`/`)
- Generates SEO metadata
- Server-side renders the page shell

#### `src/app/_components/landing-page-client.tsx` (Client Component)

```typescript
'use client'

export default function LandingPageClient() {
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
  )
}
```

**Purpose**:

- Renders the UI
- Provides foundation for future client-side features
- Maintains visual consistency

### Development Workflow

```bash
# Start development server with auto-reload
pnpm dev

# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm typecheck
```

### Live Reload

Next.js provides Fast Refresh. Changes to components will auto-reload in the browser without losing state.

---

## Testing

### Run All Tests

```bash
# Run all unit and component tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Run Specific Tests

```bash
# Component tests only
pnpm test tests/component/landing-page

# E2E tests only
pnpm test:e2e tests/e2e/landing-page.spec.ts

# Integration tests only
pnpm test tests/integration/landing-page
```

### Test Coverage Requirements

- **Minimum**: 70% code coverage
- **Target Files**:
  - `src/app/_components/landing-page-client.tsx`
  - Related utilities/helpers

### Writing Tests

#### Component Test Example

```typescript
// tests/component/landing-page/landing-page-client.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LandingPageClient from '@/app/_components/landing-page-client'

describe('LandingPageClient', () => {
  it('renders the YourFavs heading', () => {
    render(<LandingPageClient />)
    expect(screen.getByRole('heading', { name: 'YourFavs' })).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<LandingPageClient />)
    expect(screen.getByText(/curate and share your favorite places/i)).toBeInTheDocument()
  })
})
```

#### E2E Test Example

```typescript
// tests/e2e/landing-page.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "YourFavs" })).toBeVisible();
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

---

## Architecture

### Server vs Client Components

The landing page uses a **hybrid approach**:

#### Server Component (`page.tsx`)

- ✅ Generates SEO metadata
- ✅ Handles routing
- ✅ Fast initial render (no JavaScript needed)
- ❌ Cannot use client-side hooks or interactivity

#### Client Component (`landing-page-client.tsx`)

- ✅ Supports React hooks (useState, useEffect)
- ✅ Event handlers (onClick, onChange)
- ✅ Browser APIs (window, document)
- ❌ Increases client-side JavaScript bundle
- ❌ Cannot access server-only APIs

### Why This Pattern?

1. **Performance**: Server Component reduces initial bundle size
2. **SEO**: Metadata generated server-side for search engines
3. **Progressive Enhancement**: Page works without JavaScript
4. **Future-Proof**: Client wrapper ready for interactive features

### Data Flow

```
User Request → Next.js Router → Server Component (page.tsx)
                                      ↓
                        Generate Metadata + Render
                                      ↓
                        Client Component (landing-page-client.tsx)
                                      ↓
                                   Browser
```

---

## Common Tasks

### Task 1: Update Content

**Goal**: Change the heading or tagline

**Steps**:

1. Open `src/app/_components/landing-page-client.tsx`
2. Modify the `<h1>` or `<p>` content
3. Update tests to match new content
4. Run `pnpm test` to verify

**Example**:

```typescript
// Before
<h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
  YourFavs
</h1>

// After
<h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
  YourFavs - Discover Local Gems
</h1>
```

**Remember**: Update `metadata` in `page.tsx` for SEO consistency.

---

### Task 2: Add a Call-to-Action Button

**Goal**: Add a "Get Started" button

**Steps**:

1. Import Button component:

   ```typescript
   import { Button } from "@/components/ui/button";
   ```

2. Add button to JSX:

   ```typescript
   <div className="flex gap-4 mt-8">
     <Button size="lg">Get Started</Button>
   </div>
   ```

3. Add click handler (if needed):

   ```typescript
   'use client'

   import { useRouter } from 'next/navigation'

   export default function LandingPageClient() {
     const router = useRouter()

     return (
       // ... existing code
       <Button size="lg" onClick={() => router.push('/signup')}>
         Get Started
       </Button>
     )
   }
   ```

4. Write tests for the new button:
   ```typescript
   it('renders get started button', () => {
     render(<LandingPageClient />)
     expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
   })
   ```

---

### Task 3: Add Modal Dialog

**Goal**: Show a welcome modal for first-time visitors

**Steps**:

1. Import Dialog components:

   ```typescript
   import {
     Dialog,
     DialogContent,
     DialogHeader,
     DialogTitle,
   } from "@/components/ui/dialog";
   import { useState } from "react";
   ```

2. Add state and dialog:

   ```typescript
   export default function LandingPageClient() {
     const [showWelcome, setShowWelcome] = useState(false)

     return (
       <>
         {/* Existing content */}
         <Button onClick={() => setShowWelcome(true)}>
           Learn More
         </Button>

         {/* Welcome dialog */}
         <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Welcome to YourFavs!</DialogTitle>
             </DialogHeader>
             <p>Start curating your favorite places today.</p>
           </DialogContent>
         </Dialog>
       </>
     )
   }
   ```

3. Test modal interaction:

   ```typescript
   import { fireEvent } from '@testing-library/react'

   it('opens welcome modal when button clicked', () => {
     render(<LandingPageClient />)
     const button = screen.getByRole('button', { name: /learn more/i })
     fireEvent.click(button)
     expect(screen.getByRole('dialog')).toBeInTheDocument()
   })
   ```

---

### Task 4: Update SEO Metadata

**Goal**: Change page title or description for search engines

**Steps**:

1. Open `src/app/page.tsx`
2. Modify the `metadata` export:

   ```typescript
   export const metadata: Metadata = {
     title: "YourFavs - Your New Title",
     description: "Your new description",
     keywords: ["favorites", "places", "recommendations"], // Optional
     openGraph: {
       title: "YourFavs",
       description: "Your new description",
       images: ["/og-image.png"], // Optional
     },
     twitter: {
       card: "summary_large_image", // Optional
       title: "YourFavs",
       description: "Your new description",
     },
   };
   ```

3. Verify metadata in browser:
   - View page source
   - Check `<title>` and `<meta>` tags

4. Test with SEO tools:
   - [Open Graph Debugger](https://www.opengraph.xyz/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

### Task 5: Add Responsive Breakpoints

**Goal**: Adjust layout for different screen sizes

**Steps**:

1. Use Tailwind responsive prefixes:

   ```typescript
   <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
     YourFavs
   </h1>

   <p className="max-w-sm md:max-w-md lg:max-w-lg text-base md:text-lg">
     Curate and share your favorite places
   </p>
   ```

2. Test responsive behavior:

   ```bash
   # Open browser DevTools
   # Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
   # Test mobile (375px), tablet (768px), desktop (1280px)
   ```

3. Add responsive E2E tests:
   ```typescript
   test("renders correctly on mobile", async ({ page }) => {
     await page.setViewportSize({ width: 375, height: 667 });
     await page.goto("/");
     await expect(page.getByRole("heading")).toBeVisible();
   });
   ```

---

## Troubleshooting

### Hydration Errors

**Symptom**: Console error: "Hydration failed because the initial UI does not match what was rendered on the server"

**Causes**:

- Different content on server vs client
- Time-based or random values
- Browser-only APIs used during render

**Solutions**:

```typescript
// ❌ Bad: Different on server vs client
const timestamp = Date.now();

// ✅ Good: Use useEffect for client-only values
useEffect(() => {
  setTimestamp(Date.now());
}, []);

// ❌ Bad: Browser API during render
const theme = localStorage.getItem("theme");

// ✅ Good: Use useEffect or suppress warning
useEffect(() => {
  setTheme(localStorage.getItem("theme"));
}, []);
```

### Test Failures

**Symptom**: Component tests fail with "element not found"

**Debug Steps**:

1. Check test query method:

   ```typescript
   // ✅ Preferred: getByRole
   screen.getByRole("heading", { name: "YourFavs" });

   // ⚠️ Fallback: getByText
   screen.getByText("YourFavs");

   // ❌ Avoid: getByTestId (use only as last resort)
   screen.getByTestId("landing-heading");
   ```

2. Use `screen.debug()` to see rendered HTML:

   ```typescript
   render(<LandingPageClient />)
   screen.debug() // Prints HTML to console
   ```

3. Check async rendering:
   ```typescript
   // Use findBy* for async elements
   await screen.findByRole("heading");
   ```

### Performance Issues

**Symptom**: Slow page load, Lighthouse score < 90

**Debug Steps**:

1. Check bundle size:

   ```bash
   pnpm build
   # Review .next/static/chunks output
   ```

2. Run Lighthouse audit:

   ```bash
   # In browser DevTools → Lighthouse → Run audit
   ```

3. Optimize images (if added):

   ```typescript
   // ✅ Use Next.js Image component
   import Image from 'next/image'
   <Image src="/hero.jpg" alt="Hero" width={800} height={600} />

   // ❌ Avoid raw <img> tags
   <img src="/hero.jpg" alt="Hero" />
   ```

### Dark Mode Not Working

**Symptom**: Dark mode styles not applying

**Debug Steps**:

1. Verify Tailwind config includes dark mode:

   ```javascript
   // tailwind.config.js
   module.exports = {
     darkMode: "class", // or 'media'
     // ...
   };
   ```

2. Check dark: prefix usage:

   ```typescript
   // ✅ Correct
   className = "text-black dark:text-white";

   // ❌ Incorrect
   className = "dark:text-white text-black"; // Order matters
   ```

3. Test dark mode toggle:
   ```typescript
   // Add to <html> tag
   <html className="dark">
   ```

---

## Next Steps

### For New Features

1. **Plan**: Document the feature in `specs/` directory
2. **Design**: Update component contract
3. **Implement**: Write code + tests
4. **Review**: Code review + testing
5. **Deploy**: Merge to main

### For Bug Fixes

1. **Reproduce**: Write failing test
2. **Fix**: Implement solution
3. **Verify**: Ensure test passes
4. **Regression**: Add to test suite

### For Performance Optimization

1. **Measure**: Run Lighthouse + performance tests
2. **Identify**: Find bottlenecks
3. **Optimize**: Implement improvements
4. **Verify**: Re-run benchmarks

---

## Additional Resources

### Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Vitest](https://vitest.dev/guide/)
- [Playwright](https://playwright.dev/docs/intro)

### Project Docs

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Document](./research.md)
- [Component Contract](./contracts/landing-page-component.md)
- [Project Constitution](../../.specify/memory/constitution.md)

### Tools

- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

## Getting Help

- **Questions**: Ask in team Slack #dev-questions
- **Bugs**: Create GitHub issue with reproduction steps
- **Feature Requests**: Start discussion in GitHub Discussions
- **Security**: Email security@yourfavs.com (do not file public issue)

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-05  
**Maintainer**: Platform Team
