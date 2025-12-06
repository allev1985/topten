# Quickstart Guide: Header Component Implementation

**Feature**: 001-header-component  
**Audience**: Developers implementing this feature  
**Estimated Time**: 2-4 hours

## Overview

This guide walks you through implementing the YourFavs landing page Header component. You'll create a reusable header with brand identity and authentication buttons, integrate it into the landing page, and write comprehensive tests.

## Prerequisites

- Node.js 20+ and pnpm 8+ installed
- Repository cloned and dependencies installed (`pnpm install`)
- Familiarity with React, TypeScript, and Next.js App Router
- Understanding of React Testing Library for component testing

## Implementation Steps

### Step 1: Create the Header Component (30 minutes)

**File**: `src/components/shared/Header.tsx`

```tsx
"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function Header({ onLogin, onSignup }: HeaderProps) {
  return (
    <header className="w-full px-4 py-4 md:px-8">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <Link 
          href="/" 
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="YourFavs home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500">
            <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold text-black dark:text-white">
            YourFavs
          </span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onLogin}>
            Log In
          </Button>
          <Button variant="default" onClick={onSignup}>
            Start Curating
          </Button>
        </div>
      </div>
    </header>
  );
}
```

**Key Implementation Notes**:
- `"use client"` directive required for onClick handlers
- Props interface for type safety and clarity
- Link with `aria-label` for screen reader accessibility
- MapPin icon with `aria-hidden="true"` (decorative, label is on Link)
- Responsive padding (`px-4 md:px-8`)
- Dark mode support with Tailwind dark: variants

### Step 2: Integrate Header into Landing Page (15 minutes)

**File**: `src/components/shared/LandingPageClient.tsx` (MODIFY)

```tsx
"use client";

import Header from "@/components/shared/Header";

export default function LandingPageClient() {
  const handleLogin = () => {
    // TODO: Open login modal (future feature)
    console.log("Login clicked");
  };

  const handleSignup = () => {
    // TODO: Open signup modal (future feature)
    console.log("Signup clicked");
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      
      <main className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
            YourFavs
          </h1>
          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            Curate and share your favorite places
          </p>
        </div>
      </main>
    </div>
  );
}
```

**Key Changes**:
- Import new Header component
- Add `handleLogin` and `handleSignup` placeholder functions
- Render Header at top of page
- Adjust main content to use flex-1 for proper layout

**No changes needed** to `src/app/page.tsx` - it remains a Server Component.

### Step 3: Create Component Tests - Rendering (30 minutes)

**File**: `tests/component/header/header-rendering.test.tsx` (NEW)

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "@/components/shared/Header";

describe("Header - Brand Identity and Visual Elements (User Story 1)", () => {
  const mockHandlers = {
    onLogin: vi.fn(),
    onSignup: vi.fn(),
  };

  it("renders the YourFavs logo with MapPin icon and text", () => {
    render(<Header {...mockHandlers} />);
    
    // Verify logo link is present
    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink).toBeInTheDocument();
    
    // Verify brand text is present
    expect(screen.getByText("YourFavs")).toBeInTheDocument();
  });

  it("displays both action buttons with correct labels", () => {
    render(<Header {...mockHandlers} />);
    
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Curating" })).toBeInTheDocument();
  });

  it("renders header as a landmark element", () => {
    render(<Header {...mockHandlers} />);
    
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });

  it("applies correct styling to create visual hierarchy", () => {
    render(<Header {...mockHandlers} />);
    
    const loginButton = screen.getByRole("button", { name: "Log In" });
    const signupButton = screen.getByRole("button", { name: "Start Curating" });
    
    // Login button should be more subtle (ghost variant)
    expect(loginButton).toHaveClass("hover:bg-accent");
    
    // Signup button should be prominent (default/primary variant)
    expect(signupButton).toHaveClass("bg-primary");
  });
});
```

### Step 4: Create Component Tests - Navigation (20 minutes)

**File**: `tests/component/header/header-navigation.test.tsx` (NEW)

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "@/components/shared/Header";

describe("Header - Logo Navigation (User Story 2)", () => {
  const mockHandlers = {
    onLogin: vi.fn(),
    onSignup: vi.fn(),
  };

  it("renders logo as a clickable link to homepage", () => {
    render(<Header {...mockHandlers} />);
    
    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("provides visual feedback when logo is hovered", () => {
    render(<Header {...mockHandlers} />);
    
    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink).toHaveClass("hover:opacity-80");
  });

  it("logo link is keyboard accessible", () => {
    render(<Header {...mockHandlers} />);
    
    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink.tagName).toBe("A");
  });
});
```

### Step 5: Create Component Tests - Actions (25 minutes)

**File**: `tests/component/header/header-actions.test.tsx` (NEW)

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "@/components/shared/Header";

describe("Header - Authentication Actions (User Story 3)", () => {
  it("triggers login action when Log In button is clicked", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();
    
    render(<Header onLogin={onLogin} onSignup={onSignup} />);
    
    const loginButton = screen.getByRole("button", { name: "Log In" });
    await user.click(loginButton);
    
    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onSignup).not.toHaveBeenCalled();
  });

  it("triggers signup action when Start Curating button is clicked", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();
    
    render(<Header onLogin={onLogin} onSignup={onSignup} />);
    
    const signupButton = screen.getByRole("button", { name: "Start Curating" });
    await user.click(signupButton);
    
    expect(onSignup).toHaveBeenCalledTimes(1);
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("triggers login action when Log In button is activated with Enter key", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();
    
    render(<Header onLogin={onLogin} onSignup={onSignup} />);
    
    const loginButton = screen.getByRole("button", { name: "Log In" });
    loginButton.focus();
    await user.keyboard("{Enter}");
    
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("triggers signup action when Start Curating button is activated with Enter key", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();
    
    render(<Header onLogin={onLogin} onSignup={onSignup} />);
    
    const signupButton = screen.getByRole("button", { name: "Start Curating" });
    signupButton.focus();
    await user.keyboard("{Enter}");
    
    expect(onSignup).toHaveBeenCalledTimes(1);
  });
});
```

### Step 6: Create Component Tests - Accessibility (25 minutes)

**File**: `tests/component/header/header-accessibility.test.tsx` (NEW)

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "@/components/shared/Header";

describe("Header - Accessibility (User Story 4)", () => {
  const mockHandlers = {
    onLogin: vi.fn(),
    onSignup: vi.fn(),
  };

  it("all interactive elements are keyboard accessible in logical order", async () => {
    const user = userEvent.setup();
    render(<Header {...mockHandlers} />);
    
    // Tab through elements
    await user.tab();
    expect(screen.getByLabelText("YourFavs home")).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole("button", { name: "Log In" })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole("button", { name: "Start Curating" })).toHaveFocus();
  });

  it("logo link has descriptive accessible label", () => {
    render(<Header {...mockHandlers} />);
    
    const logoLink = screen.getByLabelText("YourFavs home");
    expect(logoLink).toBeInTheDocument();
  });

  it("buttons have clear accessible labels", () => {
    render(<Header {...mockHandlers} />);
    
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Curating" })).toBeInTheDocument();
  });

  it("header is identified as a banner landmark for screen readers", () => {
    render(<Header {...mockHandlers} />);
    
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });

  it("activating buttons with Space key triggers actions", async () => {
    const onLogin = vi.fn();
    const onSignup = vi.fn();
    const user = userEvent.setup();
    
    render(<Header onLogin={onLogin} onSignup={onSignup} />);
    
    const loginButton = screen.getByRole("button", { name: "Log In" });
    loginButton.focus();
    await user.keyboard(" "); // Space key
    
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});
```

### Step 7: Run Tests (10 minutes)

```bash
# Run all header component tests
pnpm test tests/component/header

# Run with coverage
pnpm test:coverage tests/component/header

# Run in watch mode during development
pnpm test:watch tests/component/header
```

**Expected Results**:
- All tests should pass
- Coverage should exceed 65% (target: 85%+)
- No linting errors

### Step 8: Manual Testing Checklist (15 minutes)

1. **Visual Verification**:
   - [ ] Start dev server: `pnpm dev`
   - [ ] Navigate to http://localhost:3000
   - [ ] Verify header appears at top with orange MapPin icon
   - [ ] Verify "YourFavs" text is visible
   - [ ] Verify "Log In" and "Start Curating" buttons are visible
   - [ ] Verify "Start Curating" button is more prominent

2. **Interaction Testing**:
   - [ ] Click logo - should log "navigating home" (check browser console or network tab)
   - [ ] Hover logo - should show opacity change
   - [ ] Click "Log In" - should log "Login clicked"
   - [ ] Click "Start Curating" - should log "Signup clicked"

3. **Keyboard Navigation**:
   - [ ] Press Tab - focus should move to logo
   - [ ] Press Tab - focus should move to "Log In" button
   - [ ] Press Tab - focus should move to "Start Curating" button
   - [ ] Press Enter on any focused element - should trigger action

4. **Responsive Testing**:
   - [ ] Resize browser to mobile width (< 768px)
   - [ ] Verify header spacing is appropriate
   - [ ] Resize to desktop width
   - [ ] Verify increased padding on larger screens

5. **Accessibility Testing**:
   - [ ] Use browser DevTools Lighthouse to run accessibility audit
   - [ ] Should score 95+ on accessibility
   - [ ] Use screen reader (if available) to verify announcements

### Step 9: Update Existing Tests (10 minutes)

Some existing landing page tests may need minor updates to account for the new Header:

**File**: `tests/component/landing-page/landing-page-auth.test.tsx`

Add assertion to verify Header is rendered:

```tsx
it("renders with header for all users", () => {
  render(<LandingPageClient />);
  
  expect(screen.getByRole("banner")).toBeInTheDocument(); // Header
  expect(screen.getByRole("heading", { name: "YourFavs" })).toBeInTheDocument();
});
```

### Step 10: Final Validation (15 minutes)

```bash
# Run full test suite
pnpm test

# Check TypeScript types
pnpm typecheck

# Lint code
pnpm lint

# Format code
pnpm format
```

**All checks should pass before considering the feature complete.**

## Common Issues and Solutions

### Issue: Tests fail with "Cannot find module"
**Solution**: Ensure path aliases are correct in `vitest.config.ts`. Check that `@/components/shared/Header` resolves correctly.

### Issue: Header doesn't appear on page
**Solution**: Verify you imported and rendered `<Header>` in `LandingPageClient.tsx`. Check browser console for errors.

### Issue: Buttons don't have correct styling
**Solution**: Verify Button component is imported from `@/components/ui/button`. Check that `variant` props are spelled correctly.

### Issue: Logo click doesn't navigate
**Solution**: Verify Next.js Link is imported from `next/link`. Check that `href="/"` is set correctly.

### Issue: Accessibility tests fail
**Solution**: Ensure `aria-label="YourFavs home"` is on the Link component. Verify header element is `<header>` tag.

## Success Criteria Verification

After completing all steps, verify against success criteria from spec:

- ✅ SC-001: Brand visible within 1 second (header renders immediately)
- ✅ SC-002: Buttons locatable within 2 seconds (always visible in header)
- ✅ SC-003: 100% keyboard accessibility (all tests pass)
- ✅ SC-004: Cross-browser consistency (Tailwind CSS ensures consistency)
- ✅ SC-005: 100% button reliability (onClick handlers always fire)
- ✅ SC-006: 100% logo navigation (Link always works)
- ✅ SC-007: >65% test coverage (4 test files cover all user stories)
- ✅ SC-008: Screen reader accessible (proper ARIA labels)

## Next Steps

After completing this implementation:

1. **Integration**: The Header is now ready to be integrated with authentication modals (future feature)
2. **Enhancement**: Consider adding mobile menu for responsive navigation (if needed)
3. **Analytics**: Add tracking to login/signup button clicks (if analytics required)

## Resources

- [Next.js Link Documentation](https://nextjs.org/docs/app/api-reference/components/link)
- [lucide-react Icons](https://lucide.dev/)
- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Tailwind CSS](https://tailwindcss.com/docs)
