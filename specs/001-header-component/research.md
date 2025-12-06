# Research: Landing Page Header Component

**Feature**: 001-header-component  
**Phase**: 0 - Outline & Research  
**Date**: 2025-12-05

## Research Overview

This document consolidates research findings for building the Header component. Since this is a UI component using existing, well-established technologies and patterns already present in the codebase, minimal research was required. All technical unknowns from the Technical Context have been resolved through examination of the existing codebase.

## Research Tasks Completed

### 1. Next.js App Router Client Component Patterns

**Research Question**: How to properly structure a Client Component that integrates with Server Components in Next.js App Router?

**Decision**: Use "use client" directive in Header.tsx and accept callback props from parent

**Rationale**:

- Next.js App Router documentation recommends keeping Server Components as default and using Client Components only when needed for interactivity
- The Header requires onClick handlers (client-side JavaScript), necessitating "use client" directive
- Existing codebase already demonstrates this pattern in `LandingPageClient.tsx` (uses "use client")
- Parent `page.tsx` remains a Server Component, passing down authentication handlers

**Alternatives Considered**:

1. **Make entire page a Client Component** - Rejected because it would lose Server Component benefits (better performance, smaller bundle)
2. **Use Server Actions for buttons** - Rejected because authentication actions require client-side modal interactions (future feature)
3. **Create separate Client Components for each button** - Rejected as over-engineering; a single Header component is simpler

**Implementation Pattern**:

```tsx
// src/components/shared/Header.tsx
"use client";

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function Header({ onLogin, onSignup }: HeaderProps) {
  // Component implementation
}
```

**References**:

- Next.js App Router documentation: Server and Client Components
- Existing pattern in `src/components/shared/LandingPageClient.tsx`

---

### 2. shadcn/ui Button Component Usage

**Research Question**: How to use Button component variants for different visual weights (subtle vs prominent)?

**Decision**: Use `variant="ghost"` for "Log In" (subtle) and `variant="default"` for "Start Curating" (prominent)

**Rationale**:

- Examined existing Button component in `src/components/ui/button.tsx`
- Button supports multiple variants via class-variance-authority
- `ghost` variant provides subtle hover effect without background (perfect for "Log In")
- `default` variant provides prominent primary background (perfect for "Start Curating")
- Both variants already exist and are styled - no new variants needed

**Alternatives Considered**:

1. **Use `variant="secondary"` for Log In** - Rejected because ghost is more subtle and matches "less prominent" requirement
2. **Create new custom variant** - Rejected because existing variants perfectly match requirements
3. **Use `variant="outline"` for Log In** - Rejected because border creates more visual weight than needed

**Implementation Pattern**:

```tsx
import { Button } from "@/components/ui/button";

<Button variant="ghost" onClick={onLogin}>Log In</Button>
<Button variant="default" onClick={onSignup}>Start Curating</Button>
```

**References**:

- `src/components/ui/button.tsx` - existing Button component implementation
- Feature spec requirement: "Log In (subtle visual weight)" and "Start Curating (prominent visual weight)"

---

### 3. lucide-react Icon Integration

**Research Question**: How to implement the MapPin icon within an orange circular background?

**Decision**: Use `lucide-react`'s MapPin icon component with custom Tailwind CSS styling for the circular background

**Rationale**:

- lucide-react is already installed (v0.555.0) and used in the project (seen in `src/components/ui/dialog.tsx`)
- MapPin icon is available in lucide-react icon library
- Tailwind CSS provides utilities for circular backgrounds: `rounded-full` for circle shape, `bg-orange-500` for orange color
- This approach is simpler than creating custom SVG or importing external images

**Alternatives Considered**:

1. **Use custom SVG file** - Rejected because lucide-react already provides the icon
2. **Use Next.js Image component with PNG** - Rejected because vector icon is more scalable and performant
3. **Use emoji or Unicode character** - Rejected because inconsistent rendering across browsers

**Implementation Pattern**:

```tsx
import { MapPin } from "lucide-react";

<div className="flex items-center gap-2">
  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500">
    <MapPin className="h-6 w-6 text-white" />
  </div>
  <span className="text-xl font-bold">YourFavs</span>
</div>;
```

**References**:

- lucide-react documentation: https://lucide.dev/
- Existing usage in `src/components/ui/dialog.tsx` (imports `X` icon)
- Feature spec requirement: "MapPin icon within an orange circular background"

---

### 4. Next.js Link Component for Logo Navigation

**Research Question**: How to make the logo navigable to the homepage while maintaining accessibility?

**Decision**: Wrap logo elements in Next.js `<Link href="/">` component with proper accessible labeling

**Rationale**:

- Next.js Link component is the standard for client-side navigation in Next.js applications
- Provides accessibility benefits: proper focus management, keyboard navigation
- Prefetches destination on hover for better performance
- Already used throughout the codebase for navigation

**Alternatives Considered**:

1. **Use anchor tag with onClick handler** - Rejected because Link provides better performance and prefetching
2. **Use button with router.push()** - Rejected because semantically incorrect (logo should be a link, not a button)
3. **Make entire header clickable** - Rejected because confusing UX and poor accessibility

**Implementation Pattern**:

```tsx
import Link from "next/link";

<Link href="/" className="flex items-center gap-2" aria-label="YourFavs home">
  {/* Logo content */}
</Link>;
```

**Accessibility Considerations**:

- `aria-label="YourFavs home"` provides descriptive label for screen readers
- Link receives keyboard focus automatically
- Visual focus indicator provided by Tailwind CSS focus states

**References**:

- Next.js Link documentation
- Feature spec requirement FR-003: "Header MUST render the logo as a clickable link that navigates to the home page"

---

### 5. Component Testing Strategy

**Research Question**: What testing approach should be used to meet the 65%+ coverage requirement?

**Decision**: Use React Testing Library with Vitest following existing test patterns in `tests/component/landing-page/`

**Rationale**:

- React Testing Library already configured in the project (`tests/setup.ts`)
- Existing component tests demonstrate clear patterns to follow
- Testing Library philosophy aligns with accessibility requirements (tests should interact with components as users do)
- Vitest provides fast test execution and good developer experience

**Test Organization Strategy**:

- Create separate test files for each user story area (rendering, navigation, actions, accessibility)
- Follow existing naming pattern: `{component}-{aspect}.test.tsx`
- Use descriptive test names that map back to acceptance criteria
- Organize tests in `tests/component/header/` directory

**Coverage Strategy**:

1. **Rendering Tests** (User Story 1):
   - Verify logo, brand text, and buttons are present
   - Check visual styling (icon, button variants)
   - Test component structure

2. **Navigation Tests** (User Story 2):
   - Verify Link href is correct
   - Test hover states
   - Check accessibility labels

3. **Action Tests** (User Story 3):
   - Mock onClick handlers and verify they're called
   - Test both Login and Start Curating buttons
   - Verify keyboard activation (Enter key)

4. **Accessibility Tests** (User Story 4):
   - Verify keyboard navigation (Tab order)
   - Check ARIA labels
   - Test screen reader announcements

**Implementation Pattern**:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "@/components/shared/Header";

describe("Header - Rendering", () => {
  it("displays YourFavs brand with MapPin icon", () => {
    render(<Header onLogin={vi.fn()} onSignup={vi.fn()} />);
    expect(screen.getByLabelText("YourFavs home")).toBeInTheDocument();
  });
});
```

**References**:

- Existing tests in `tests/component/landing-page/landing-page-accessibility.test.tsx`
- React Testing Library documentation
- Feature spec success criteria SC-007: "at least 65% of user interactions validated"

---

### 6. Layout and Spacing Strategy

**Research Question**: How should the header be positioned and spaced to match design requirements?

**Decision**: Use Tailwind CSS flex utilities with responsive padding for horizontal spacing

**Rationale**:

- Tailwind CSS is already the styling solution used throughout the project
- Flexbox provides simple, reliable layout for header (logo left, buttons right)
- Responsive padding (`px-4 md:px-8`) ensures comfortable margins on all screen sizes
- Natural scroll behavior (not position:fixed) as per requirement FR-011

**Layout Strategy**:

- Container: `w-full` (full width), flex layout with `justify-between` for space distribution
- Logo section: left-aligned, flex with gap for icon+text
- Action buttons: right-aligned, flex with gap for spacing between buttons
- Padding: responsive horizontal padding that increases on larger screens

**Implementation Pattern**:

```tsx
<header className="w-full px-4 py-4 md:px-8">
  <div className="flex items-center justify-between">
    <Link>{/* Logo */}</Link>
    <div className="flex items-center gap-3">{/* Buttons */}</div>
  </div>
</header>
```

**Responsive Considerations**:

- Small screens (mobile): `px-4` provides minimal but sufficient margins
- Medium+ screens: `px-8` provides generous spacing
- Buttons maintain gap between them on all screen sizes
- No fixed positioning to avoid overlay issues and allow natural scroll

**References**:

- Tailwind CSS documentation
- Feature spec requirements FR-007 and FR-008 (spacing and alignment)

---

## Technical Unknowns Resolution Summary

All items marked "NEEDS CLARIFICATION" in the Technical Context have been resolved:

| Original Unknown | Resolution                                                         |
| ---------------- | ------------------------------------------------------------------ |
| N/A              | All technologies already known and documented in Technical Context |

**Note**: No unknowns existed because all required technologies and patterns are already established in the codebase. Research focused on confirming best practices for using existing tools.

---

## Best Practices Summary

### React Component Design

- **Single Responsibility**: Component only handles header presentation and user interactions
- **Props Interface**: Clear TypeScript interface for required callbacks
- **Client Component**: Proper use of "use client" directive for interactivity

### Accessibility

- **Semantic HTML**: Use proper `<header>`, `<nav>` elements where appropriate
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Readers**: Proper ARIA labels for all interactive elements
- **Focus Management**: Visible focus indicators for all interactive elements

### Testing

- **User-Centric Testing**: Test how users interact, not implementation details
- **Coverage Goals**: >65% coverage focusing on user-facing behavior
- **Test Organization**: Separate files for different concerns (rendering, navigation, actions, accessibility)
- **Mock Strategy**: Mock only external dependencies (callbacks), not component internals

### Performance

- **Bundle Size**: Minimal impact using tree-shakeable lucide-react icons
- **Rendering**: Lightweight component with no heavy computations
- **Optimization**: Use Next.js Link for prefetching and optimal navigation

---

## Implementation Readiness

✅ **All research completed** - No blockers identified  
✅ **All technologies confirmed** - All required packages already installed  
✅ **Patterns documented** - Clear implementation patterns established  
✅ **Testing strategy defined** - Clear path to meeting coverage requirements

**Status**: Ready to proceed to Phase 1 (Design & Contracts)
