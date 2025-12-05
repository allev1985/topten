# Header Component API Contract

**Component**: `Header`  
**Path**: `src/components/shared/Header.tsx`  
**Type**: React Client Component  
**Version**: 1.0.0  
**Date**: 2025-12-05

## Overview

The Header component provides the top navigation bar for the YourFavs landing page, displaying brand identity and authentication action buttons. This contract defines the component's public API, behavior guarantees, and integration requirements.

## Component Signature

```typescript
interface HeaderProps {
  /**
   * Callback function invoked when the "Log In" button is clicked.
   * Should handle opening the login modal or navigating to login page.
   * 
   * @returns void
   */
  onLogin: () => void;

  /**
   * Callback function invoked when the "Start Curating" button is clicked.
   * Should handle opening the signup modal or navigating to signup page.
   * 
   * @returns void
   */
  onSignup: () => void;
}

export default function Header(props: HeaderProps): JSX.Element;
```

## Props Contract

### Required Props

| Prop | Type | Description | Validation |
|------|------|-------------|------------|
| `onLogin` | `() => void` | Handler for login button clicks | Must be a function; will be called with no arguments |
| `onSignup` | `() => void` | Handler for signup button clicks | Must be a function; will be called with no arguments |

### Optional Props

None. All props are required.

## Behavioral Contract

### Rendering Guarantees

1. **Logo Display**:
   - MUST render a clickable link containing:
     - MapPin icon (from lucide-react) in an orange circular background
     - "YourFavs" text in bold font
   - Link MUST have `href="/"` pointing to homepage
   - Link MUST have `aria-label="YourFavs home"` for screen readers

2. **Action Buttons**:
   - MUST render two buttons:
     - "Log In" button with ghost variant (subtle styling)
     - "Start Curating" button with default variant (prominent styling)
   - Buttons MUST be rendered in this order: Log In, then Start Curating
   - Buttons MUST be interactive and keyboard accessible

3. **Layout**:
   - MUST use full width (`w-full`)
   - MUST have responsive horizontal padding (`px-4 md:px-8`)
   - Logo MUST be left-aligned
   - Buttons MUST be right-aligned
   - MUST render as HTML `<header>` element (banner landmark)

### Interaction Guarantees

1. **Logo Click**:
   - Clicking logo MUST navigate to "/" (handled by Next.js Link)
   - MUST be keyboard accessible (receives focus, activates with Enter/Space)
   - MUST show visual feedback on hover (opacity change)

2. **Button Click - Log In**:
   - Clicking "Log In" MUST invoke `onLogin()` callback exactly once
   - MUST work with mouse click
   - MUST work with keyboard activation (Enter, Space)
   - MUST NOT invoke `onSignup()` callback

3. **Button Click - Start Curating**:
   - Clicking "Start Curating" MUST invoke `onSignup()` callback exactly once
   - MUST work with mouse click
   - MUST work with keyboard activation (Enter, Space)
   - MUST NOT invoke `onLogin()` callback

### Accessibility Guarantees

1. **Keyboard Navigation**:
   - Tab order MUST be: Logo link → Log In button → Start Curating button
   - All interactive elements MUST receive visible focus indicators
   - All interactive elements MUST be activatable with Enter key
   - Buttons MUST be activatable with Space key

2. **Screen Reader Support**:
   - Logo link MUST be announced with descriptive label "YourFavs home"
   - Buttons MUST be announced with their text content ("Log In", "Start Curating")
   - Header MUST be identified as banner landmark
   - Icon MUST have `aria-hidden="true"` (decorative)

3. **Focus Management**:
   - Component MUST NOT trap focus
   - Component MUST NOT automatically move focus
   - Component MUST use browser's native focus management

### Styling Guarantees

1. **Theme Support**:
   - MUST support light mode (default)
   - MUST support dark mode via Tailwind `dark:` variants
   - Text color MUST adapt to theme (black in light, white in dark)

2. **Responsive Behavior**:
   - MUST maintain layout integrity on all screen sizes (mobile to desktop)
   - MUST use responsive padding: `px-4` (mobile) → `px-8` (md+)
   - Buttons MUST maintain minimum touch target size (44x44px)

3. **Visual Hierarchy**:
   - "Start Curating" button MUST be more visually prominent than "Log In"
   - Logo MUST be clearly visible and recognizable
   - Buttons MUST have sufficient contrast for readability

## Error Handling

### Invalid Props

- **Missing required prop**: TypeScript will prevent compilation. Runtime behavior undefined.
- **Non-function prop**: May cause runtime error when callback is invoked. TypeScript prevents this.

### Runtime Errors

- Component will NOT handle errors thrown by `onLogin` or `onSignup` callbacks
- Errors in callbacks will propagate to parent component error boundary
- Component assumes callbacks are safe to invoke

## Performance Characteristics

### Rendering Performance

- **Initial Render**: < 16ms (single frame at 60fps)
- **Re-render**: < 5ms (component is lightweight, no heavy computations)
- **Bundle Size**: ~2KB (including dependencies already in bundle)

### Optimization Features

- Component is pure - re-renders only when props change
- Uses Next.js Link for client-side navigation (no full page reload)
- Icons from lucide-react are tree-shakeable (only MapPin included)

## Integration Requirements

### Parent Component Responsibilities

1. **Provide Callbacks**:
   - MUST provide stable function references for `onLogin` and `onSignup`
   - SHOULD use `useCallback` to prevent unnecessary re-renders
   - MUST handle all authentication logic (modals, navigation, etc.)

2. **Layout Context**:
   - Header assumes it is rendered at the top of the page
   - Header uses natural flow (not position:fixed)
   - Parent should provide appropriate container/layout

### Example Integration

```tsx
"use client";

import { useCallback } from "react";
import Header from "@/components/shared/Header";

export default function LandingPageClient() {
  const handleLogin = useCallback(() => {
    // Open login modal or navigate to login page
    console.log("Login clicked");
  }, []);

  const handleSignup = useCallback(() => {
    // Open signup modal or navigate to signup page
    console.log("Signup clicked");
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogin={handleLogin} onSignup={handleSignup} />
      <main>{/* Page content */}</main>
    </div>
  );
}
```

## Testing Contract

### Required Test Coverage

Components integrating Header MUST verify:

1. **Callback Invocation**:
   - Verify `onLogin` is called when "Log In" is clicked
   - Verify `onSignup` is called when "Start Curating" is clicked
   - Verify callbacks are NOT called on component mount

2. **Accessibility**:
   - Verify all interactive elements are keyboard accessible
   - Verify proper ARIA labels are present
   - Verify tab order is logical

3. **Visual Rendering**:
   - Verify logo and buttons render correctly
   - Verify correct button variants are applied

### Mock Strategy

```tsx
import { vi } from "vitest";

const mockHandlers = {
  onLogin: vi.fn(),
  onSignup: vi.fn(),
};

render(<Header {...mockHandlers} />);

// Verify behavior
expect(mockHandlers.onLogin).toHaveBeenCalledTimes(1);
```

## Versioning and Changes

### Version 1.0.0 (Current)

- Initial implementation
- Basic authentication button actions
- Logo navigation to homepage

### Future Considerations

Potential future enhancements (NOT in current contract):

- Mobile responsive menu (hamburger menu for small screens)
- User profile avatar when authenticated
- Notification badges
- Search functionality
- Additional navigation links

**Breaking Changes Policy**: Changes to the public API (props interface, behavior guarantees) will require a major version bump and migration guide.

## Dependencies

### Direct Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2.0 | Component rendering |
| `next` | 16.0.5 | Link component for navigation |
| `lucide-react` | 0.555.0 | MapPin icon |
| `@/components/ui/button` | - | Reusable Button component |

### Peer Dependencies

- TypeScript 5.x (for type definitions)
- Tailwind CSS 4.x (for styling)

## Browser Support

- Modern browsers with ES2020+ support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

No polyfills required for supported browsers.

## Compliance and Standards

- ✅ **WCAG 2.1 Level AA**: Meets accessibility standards
- ✅ **React Best Practices**: Follows React component design patterns
- ✅ **TypeScript Strict Mode**: Full type safety
- ✅ **Next.js App Router**: Compatible with Server/Client Component model
- ✅ **TopTen Constitution**: Complies with all code quality principles

## Contact and Support

For questions about this contract or Header component behavior:

- See implementation: `src/components/shared/Header.tsx`
- See tests: `tests/component/header/*.test.tsx`
- See quickstart: `specs/001-header-component/quickstart.md`
- See specification: `specs/001-header-component/spec.md`
