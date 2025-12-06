# Developer Quickstart: Hero Section Implementation

**Feature**: Front Page Hero Section Integration & CTA Wiring  
**Branch**: `001-hero-section`  
**Target**: Experienced Next.js/React developers familiar with the TopTen codebase

---

## Overview

This guide provides code samples and implementation steps for adding the hero section to the landing page. The hero section displays value proposition text (tagline, headline, subheading) with a CTA button in a responsive two-column layout alongside the existing HeroImageGrid.

**What You'll Modify**:
- `src/components/shared/LandingPageClient.tsx` - Add hero section layout
- Test files - Add comprehensive test coverage

**What You'll Reuse**:
- Existing modal state management
- Header component with CTA buttons
- HeroImageGrid component
- LoginModal and SignupModal components

---

## Implementation Steps

### Step 1: Update LandingPageClient Component

**File**: `src/components/shared/LandingPageClient.tsx`

Replace the current `<main>` section (lines 36-49) with the following hero section implementation:

```tsx
"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import Header from "@/components/shared/Header";
import HeroImageGrid from "@/components/shared/HeroImageGrid";
import LoginModal from "@/components/shared/LoginModal";
import SignupModal from "@/components/shared/SignupModal";
import { Button } from "@/components/ui/button";

export default function LandingPageClient() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const openSignupModal = () => {
    setIsSignupModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header onLogin={handleLogin} onSignup={openSignupModal} />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectTo="/dashboard"
      />

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 md:px-8 md:py-16">
        {/* Hero Section Container */}
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-12">
            {/* Hero Text Column (40% on desktop) */}
            <div className="col-span-1 flex flex-col justify-center space-y-6 lg:col-span-2">
              {/* Tagline with Sparkles Icon */}
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Your personal guide to the world
                </p>
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white md:text-5xl lg:text-6xl">
                Curate and share your favourite places
              </h1>

              {/* Subheading */}
              <p className="max-w-prose text-lg text-zinc-600 dark:text-zinc-400 md:text-xl">
                Build focused, meaningful collections that reflect your genuine
                preferences and local expertise. Share them like recommendations
                from a trusted friend.
              </p>

              {/* CTA Button */}
              <div>
                <Button
                  variant="default"
                  size="lg"
                  onClick={openSignupModal}
                  className="font-semibold"
                >
                  Create Your First List
                </Button>
              </div>
            </div>

            {/* Hero Image Column (60% on desktop) */}
            <div className="col-span-1 lg:col-span-3">
              <HeroImageGrid />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Key Changes**:
1. Import `Sparkles` icon from `lucide-react`
2. Import `Button` component from shadcn/ui
3. Replace simple centered content with responsive grid layout
4. Add hero text column with tagline, headline, subheading, CTA
5. Add hero image column with HeroImageGrid
6. Use responsive Tailwind classes for mobile/desktop layouts

---

## Layout Breakdown

### Container Structure

```
main (flex container for vertical centering)
  └── Hero Section Container (max-w-7xl, centered)
      └── Grid Container (1 col mobile, 5 cols desktop)
          ├── Text Column (full width mobile, 2 cols desktop = 40%)
          │   └── Content stack (space-y-6)
          └── Image Column (full width mobile, 3 cols desktop = 60%)
              └── HeroImageGrid component
```

### Responsive Behavior

**Mobile (<1024px)**:
- `grid-cols-1` - Single column
- `col-span-1` - Both columns full width
- Text stacks above images naturally
- Vertical spacing via `gap-8`

**Desktop (≥1024px)**:
- `lg:grid-cols-5` - 5-column grid system
- Text: `lg:col-span-2` - Takes 2 of 5 columns (40%)
- Images: `lg:col-span-3` - Takes 3 of 5 columns (60%)
- Horizontal spacing via `lg:gap-12`

### Tailwind Class Reference

| Element | Classes | Purpose |
|---------|---------|---------|
| Main | `flex flex-1 flex-col items-center justify-center` | Center content vertically and horizontally |
| Main | `px-4 md:px-8 py-12 md:py-16` | Responsive padding |
| Container | `w-full max-w-7xl` | Full width, max 1280px |
| Grid | `grid grid-cols-1 lg:grid-cols-5` | Responsive column system |
| Grid | `items-center gap-8 lg:gap-12` | Vertical alignment, responsive gap |
| Text Column | `col-span-1 lg:col-span-2` | Full width → 40% |
| Text Column | `flex flex-col justify-center space-y-6` | Vertical layout, centered, spacing |
| Image Column | `col-span-1 lg:col-span-3` | Full width → 60% |
| Tagline | `flex items-center gap-2` | Horizontal layout with icon |
| Tagline Text | `text-sm font-medium text-zinc-600 dark:text-zinc-400` | Small muted text |
| Headline | `text-4xl md:text-5xl lg:text-6xl` | Responsive large text |
| Headline | `font-bold tracking-tight` | Bold, tight spacing |
| Subheading | `text-lg md:text-xl` | Responsive medium text |
| Subheading | `max-w-prose` | Limit line length (65ch) |

---

## Testing Implementation

### Component Tests

**File**: `tests/component/landing-page/landing-page-client.test.tsx`

Update existing tests and add new ones for hero section:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPageClient from "@/components/shared/LandingPageClient";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("LandingPageClient - Hero Section", () => {
  describe("hero text content", () => {
    it("displays the tagline with sparkles icon", () => {
      render(<LandingPageClient />);
      expect(
        screen.getByText("Your personal guide to the world")
      ).toBeInTheDocument();
      // Icon is decorative (aria-hidden), check it's in the DOM
      const taglineContainer = screen.getByText("Your personal guide to the world").parentElement;
      expect(taglineContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it("displays the headline as h1", () => {
      render(<LandingPageClient />);
      const headline = screen.getByRole("heading", { level: 1 });
      expect(headline).toHaveTextContent("Curate and share your favourite places");
    });

    it("displays the subheading", () => {
      render(<LandingPageClient />);
      expect(
        screen.getByText(/Build focused, meaningful collections/i)
      ).toBeInTheDocument();
    });

    it("displays the CTA button", () => {
      render(<LandingPageClient />);
      expect(
        screen.getByRole("button", { name: "Create Your First List" })
      ).toBeInTheDocument();
    });
  });

  describe("hero section interactions", () => {
    it("opens signup modal when hero CTA is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const ctaButton = screen.getByRole("button", { name: "Create Your First List" });
      await user.click(ctaButton);

      // Signup modal should be visible
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Create your account")).toBeInTheDocument();
    });
  });

  describe("semantic structure", () => {
    it("uses main element for hero section", () => {
      const { container } = render(<LandingPageClient />);
      expect(container.querySelector("main")).toBeInTheDocument();
    });

    it("has proper heading hierarchy", () => {
      render(<LandingPageClient />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("Curate and share your favourite places");
    });
  });
});
```

### Responsive Layout Tests

**File**: `tests/component/landing-page/landing-page-responsive.test.tsx`

Add tests for responsive layout behavior:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/components/shared/LandingPageClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("LandingPageClient - Responsive Layout", () => {
  describe("desktop layout", () => {
    it("applies grid layout classes for two-column display", () => {
      const { container } = render(<LandingPageClient />);
      const gridContainer = container.querySelector(".grid");
      
      expect(gridContainer?.className).toContain("grid-cols-1");
      expect(gridContainer?.className).toContain("lg:grid-cols-5");
    });

    it("allocates correct column spans for text and images", () => {
      const { container } = render(<LandingPageClient />);
      
      // Text column should be col-span-1 lg:col-span-2
      const textColumn = screen.getByRole("heading", { level: 1 }).closest(".col-span-1");
      expect(textColumn?.className).toContain("lg:col-span-2");
      
      // Image column should be col-span-1 lg:col-span-3
      const imageColumn = container.querySelector(".lg\\:col-span-3");
      expect(imageColumn).toBeInTheDocument();
    });
  });

  describe("mobile layout", () => {
    it("stacks content vertically on mobile", () => {
      const { container } = render(<LandingPageClient />);
      const gridContainer = container.querySelector(".grid");
      
      // Both columns should have col-span-1 (full width on mobile)
      expect(gridContainer?.className).toContain("grid-cols-1");
    });
  });

  describe("spacing and padding", () => {
    it("applies responsive padding to main element", () => {
      const { container } = render(<LandingPageClient />);
      const main = container.querySelector("main");
      
      expect(main?.className).toContain("px-4");
      expect(main?.className).toContain("md:px-8");
      expect(main?.className).toContain("py-12");
      expect(main?.className).toContain("md:py-16");
    });

    it("constrains content to max-width", () => {
      const { container } = render(<LandingPageClient />);
      const heroContainer = container.querySelector(".max-w-7xl");
      
      expect(heroContainer).toBeInTheDocument();
    });
  });
});
```

### Accessibility Tests

**File**: `tests/component/landing-page/landing-page-accessibility.test.tsx`

Add tests for accessibility compliance:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPageClient from "@/components/shared/LandingPageClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("LandingPageClient - Accessibility", () => {
  describe("heading hierarchy", () => {
    it("has exactly one h1 element", () => {
      render(<LandingPageClient />);
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
    });

    it("uses h1 for the main headline", () => {
      render(<LandingPageClient />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("Curate and share your favourite places");
    });
  });

  describe("interactive elements", () => {
    it("CTA button is keyboard focusable", () => {
      render(<LandingPageClient />);
      const ctaButton = screen.getByRole("button", { name: "Create Your First List" });
      
      ctaButton.focus();
      expect(ctaButton).toHaveFocus();
    });

    it("CTA button has accessible name", () => {
      render(<LandingPageClient />);
      const ctaButton = screen.getByRole("button", { name: "Create Your First List" });
      
      expect(ctaButton).toHaveAccessibleName("Create Your First List");
    });
  });

  describe("decorative elements", () => {
    it("marks sparkles icon as decorative", () => {
      const { container } = render(<LandingPageClient />);
      const sparklesIcon = container.querySelector('[aria-hidden="true"]');
      
      expect(sparklesIcon).toBeInTheDocument();
    });
  });

  describe("semantic HTML", () => {
    it("uses button element for CTA", () => {
      render(<LandingPageClient />);
      const cta = screen.getByRole("button", { name: "Create Your First List" });
      
      expect(cta.tagName).toBe("BUTTON");
    });

    it("uses main landmark for primary content", () => {
      render(<LandingPageClient />);
      const main = screen.getByRole("main");
      
      expect(main).toBeInTheDocument();
    });
  });
});
```

### Integration Tests

**File**: `tests/integration/landing-page/navigation.test.tsx`

Add test for hero CTA → modal flow:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPageClient from "@/components/shared/LandingPageClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("LandingPageClient - Navigation Flows", () => {
  describe("hero CTA to signup flow", () => {
    it("opens signup modal when hero CTA button is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const heroCTA = screen.getByRole("button", { name: "Create Your First List" });
      await user.click(heroCTA);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Create your account")).toBeInTheDocument();
    });

    it("closes signup modal and returns to landing page", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      // Open modal
      const heroCTA = screen.getByRole("button", { name: "Create Your First List" });
      await user.click(heroCTA);

      // Close modal (assuming dialog has close button or clicking outside)
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // After closing, hero section should still be visible
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });

  describe("modal state isolation", () => {
    it("only shows signup modal when hero CTA is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const heroCTA = screen.getByRole("button", { name: "Create Your First List" });
      await user.click(heroCTA);

      // Only signup modal should be open
      expect(screen.getByText("Create your account")).toBeInTheDocument();
      expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    });

    it("only shows signup modal when header CTA is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const headerCTA = screen.getByRole("button", { name: "Start Curating" });
      await user.click(headerCTA);

      // Only signup modal should be open
      expect(screen.getByText("Create your account")).toBeInTheDocument();
      expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    });

    it("only shows login modal when header login is clicked", async () => {
      const user = userEvent.setup();
      render(<LandingPageClient />);

      const loginButton = screen.getByRole("button", { name: "Log In" });
      await user.click(loginButton);

      // Only login modal should be open
      expect(screen.getByText("Sign In")).toBeInTheDocument();
      expect(screen.queryByText("Create your account")).not.toBeInTheDocument();
    });
  });
});
```

### E2E Tests

**File**: `tests/e2e/landing-page.spec.ts`

Add Playwright tests for complete user flows:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Landing Page Hero Section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays all hero section content", async ({ page }) => {
    // Tagline
    await expect(page.getByText("Your personal guide to the world")).toBeVisible();

    // Headline
    await expect(
      page.getByRole("heading", { name: "Curate and share your favourite places" })
    ).toBeVisible();

    // Subheading
    await expect(
      page.getByText(/Build focused, meaningful collections/i)
    ).toBeVisible();

    // CTA Button
    await expect(
      page.getByRole("button", { name: "Create Your First List" })
    ).toBeVisible();

    // Hero Image Grid
    await expect(page.locator('[alt*="coffee"]')).toBeVisible();
  });

  test("complete signup flow from hero CTA", async ({ page }) => {
    // Click hero CTA button
    await page.getByRole("button", { name: "Create Your First List" }).click();

    // Signup modal should appear
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Create your account")).toBeVisible();

    // Close modal
    await page.keyboard.press("Escape");

    // Should return to landing page
    await expect(
      page.getByRole("heading", { name: "Curate and share your favourite places" })
    ).toBeVisible();
  });

  test("responsive layout on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // All content should be visible and stacked
    await expect(
      page.getByRole("heading", { name: "Curate and share your favourite places" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Your First List" })).toBeVisible();

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBe(clientWidth);
  });

  test("responsive layout on desktop", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // All content should be visible side-by-side
    await expect(
      page.getByRole("heading", { name: "Curate and share your favourite places" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Your First List" })).toBeVisible();

    // Image grid should be visible
    await expect(page.locator('[alt*="coffee"]')).toBeVisible();
  });

  test("keyboard navigation works for CTA button", async ({ page }) => {
    // Tab to CTA button
    await page.keyboard.press("Tab"); // Skip to first focusable (likely header logo)
    await page.keyboard.press("Tab"); // Header login
    await page.keyboard.press("Tab"); // Header signup
    await page.keyboard.press("Tab"); // Hero CTA

    // Should focus CTA button
    await expect(page.getByRole("button", { name: "Create Your First List" })).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press("Enter");

    // Modal should open
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
```

---

## Running Tests

### Component and Integration Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test landing-page-client.test.tsx

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### E2E Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run specific E2E test
pnpm test:e2e landing-page.spec.ts
```

---

## Validation Checklist

Before marking implementation complete, verify:

- [ ] Hero section displays tagline with Sparkles icon
- [ ] Headline uses h1 semantic HTML
- [ ] Subheading text is muted (zinc-600/400)
- [ ] CTA button opens signup modal on click
- [ ] Desktop layout uses 2:3 column ratio (40%:60%)
- [ ] Mobile layout stacks text above images
- [ ] No horizontal scroll at any viewport (320px - 1920px)
- [ ] Header "Start Curating" button still opens signup modal
- [ ] Header "Log In" button still opens login modal
- [ ] Only one modal visible at a time
- [ ] All component tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] TypeScript compiles without errors
- [ ] ESLint shows no errors
- [ ] Prettier formatting applied

---

## Common Issues and Solutions

### Issue: Text column too wide on desktop
**Solution**: Verify `lg:col-span-2` class is applied to text column. Should take 2 of 5 grid columns.

### Issue: Layout not responsive
**Solution**: Check Tailwind breakpoint classes (`lg:` prefix). Verify `grid-cols-1 lg:grid-cols-5` on grid container.

### Issue: CTA button not opening modal
**Solution**: Verify `onClick={openSignupModal}` is on the Button component. Check that `openSignupModal` function sets `setIsSignupModalOpen(true)`.

### Issue: Multiple modals opening simultaneously
**Solution**: Check that `isLoginModalOpen` and `isSignupModalOpen` are separate state variables. Verify each modal only responds to its own state.

### Issue: Sparkles icon not showing
**Solution**: Verify `import { Sparkles } from "lucide-react"` at top of file. Check icon is rendered with `<Sparkles className="..." />`.

### Issue: Tests failing after implementation
**Solution**: Update existing tests that check for old content ("YourFavs" heading). Replace with new hero section content checks.

---

## Performance Notes

- Hero section is server-rendered (no client-side JS for initial display)
- Only modal state requires client-side JavaScript
- No new images loaded (Sparkles icon is SVG)
- No layout shift on load (grid structure established immediately)
- CLS should remain 0

---

## Accessibility Notes

- h1 used for main headline (proper semantic hierarchy)
- Sparkles icon marked `aria-hidden="true"` (decorative)
- CTA button uses native `<button>` element (keyboard accessible)
- Color contrast:
  - Headline: black/white (21:1 ratio - WCAG AAA)
  - Subheading: zinc-600/400 (4.5:1+ ratio - WCAG AA)
  - Tagline: zinc-600/400 (4.5:1+ ratio - WCAG AA)

---

## Next Steps

1. Implement LandingPageClient.tsx changes
2. Run existing tests to identify breaking changes
3. Update existing tests to match new content
4. Add new component tests for hero section
5. Add responsive layout tests
6. Add accessibility tests
7. Add integration tests for CTA flows
8. Add E2E tests for complete user journeys
9. Run full test suite and fix any failures
10. Verify visual appearance in browser (mobile + desktop)
11. Run linter and formatter
12. Request code review

---

## Related Documentation

- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Task Breakdown](./tasks.md) - Generated by `/speckit.tasks` command
- [Constitution](./.specify/memory/constitution.md)
- [Repository Instructions](.github/copilot-instructions.md)
