# Research: Dialog Component and Image Configuration

**Feature**: 001-dialog-component-setup  
**Date**: 2025-12-04  
**Status**: Complete

## Overview

This document consolidates research findings for installing the shadcn/ui Dialog component and configuring Next.js for external placeholder images. All technical unknowns identified in the implementation plan have been resolved.

---

## R1: shadcn/ui Dialog Component Installation

### Decision
Install Dialog component using the official shadcn CLI command: `pnpm dlx shadcn@latest add dialog`

### Installation Process

**Command**:
```bash
pnpm dlx shadcn@latest add dialog
```

**What Happens**:
1. CLI reads `components.json` to determine project configuration
2. Downloads Dialog component template from shadcn/ui registry
3. Installs required dependencies: `@radix-ui/react-dialog`
4. Generates `src/components/ui/dialog.tsx` with TypeScript component code
5. No modifications to `components.json` required (already configured)

**Dependencies Added**:
- `@radix-ui/react-dialog` - Core dialog primitive from Radix UI
  - Version: Latest compatible with React 19
  - Bundle size: ~15KB gzipped (tree-shakeable)
  - Peer dependencies: react, react-dom (already installed)

**Files Modified/Created**:
- ✅ **Created**: `src/components/ui/dialog.tsx` (Dialog component exports)
- ✅ **Modified**: `package.json` (adds @radix-ui/react-dialog dependency)
- ✅ **Modified**: `pnpm-lock.yaml` (dependency resolution)
- ℹ️ **No change**: `components.json` (already has correct configuration)
- ℹ️ **No change**: `src/app/globals.css` (Dialog uses existing CSS variables)

### Compatibility Verification

- ✅ **Next.js 16.0.5**: Fully compatible (Dialog is client component, works with App Router)
- ✅ **React 19.2.0**: Radix UI Dialog supports React 19
- ✅ **TypeScript 5.x**: Type definitions included
- ✅ **Tailwind CSS 4.x**: Uses utility classes, no configuration changes needed
- ✅ **Existing components.json**: Configuration already correct (new-york style, RSC: true, paths configured)

### Component Structure Generated

The installed Dialog component exports:
- `Dialog` - Root wrapper (controlled or uncontrolled)
- `DialogPortal` - Portal for rendering outside DOM hierarchy
- `DialogOverlay` - Backdrop overlay
- `DialogClose` - Close button component
- `DialogTrigger` - Trigger element wrapper
- `DialogContent` - Main content container (includes overlay + close button)
- `DialogHeader` - Semantic header wrapper
- `DialogFooter` - Semantic footer wrapper
- `DialogTitle` - Accessible title component
- `DialogDescription` - Accessible description component

### Rationale

- **Official tooling**: shadcn CLI is the supported installation method
- **Automated**: Handles file generation, dependency installation, path resolution
- **Consistent**: Matches installation of existing components (Button, Card, Alert, Input, Label)
- **No manual work**: Reduces human error in component setup

### Alternatives Considered

❌ **Manual installation**: Copy-paste component code from shadcn/ui website
  - Rejected because: Error-prone, doesn't handle dependencies, inconsistent with existing setup

❌ **Direct Radix UI usage**: Install @radix-ui/react-dialog and write custom wrapper
  - Rejected because: Violates DRY principle (shadcn wrapper already solves styling/structure), inconsistent with project pattern

---

## R2: Next.js Image Domain Configuration

### Decision
Use `remotePatterns` configuration in `next.config.ts` (Next.js 13+ recommended approach)

### Configuration Syntax

**File**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

### Configuration Details

| Property | Value | Explanation |
|----------|-------|-------------|
| `protocol` | `'https'` | placehold.co requires HTTPS (HTTP will fail) |
| `hostname` | `'placehold.co'` | Exact domain match (no wildcards needed) |
| `port` | `''` | Empty string = default port (443 for HTTPS) |
| `pathname` | `'/**'` | Matches all paths (e.g., `/400x300`, `/600x400?text=Hello`) |

### Pattern Matching Rules

✅ **Allowed URLs**:
- `https://placehold.co/400`
- `https://placehold.co/600x400`
- `https://placehold.co/400x300?text=My+Image`
- `https://placehold.co/any/nested/path`

❌ **Blocked URLs**:
- `http://placehold.co/400` (wrong protocol)
- `https://subdomain.placehold.co/400` (different hostname)
- `https://placehold.co:8080/400` (non-empty port)

### TypeScript Typing

The `NextConfig` type is imported from `"next"` and ensures type safety:
- `images.remotePatterns` is typed as `RemotePattern[]`
- Each pattern requires `protocol`, `hostname`, and `pathname`
- Invalid properties cause TypeScript compilation errors

### Build-Time Validation

Next.js validates configuration at build time:
- ✅ Missing required properties → Build error with clear message
- ✅ Invalid protocol values → Build error
- ✅ Runtime: Unauthorized image URLs → Console warning + image fails to load

### Usage with Next.js Image Component

```tsx
import Image from 'next/image';

// Basic usage
<Image
  src="https://placehold.co/600x400"
  alt="Placeholder image"
  width={600}
  height={400}
/>

// With custom text
<Image
  src="https://placehold.co/400x300?text=Coffee+Shop"
  alt="Coffee shop placeholder"
  width={400}
  height={300}
  className="rounded-lg"
/>
```

### Rationale

- **`remotePatterns` vs `domains`**: Next.js 13+ recommends `remotePatterns` for more granular control
  - `domains` is deprecated in favor of `remotePatterns`
  - `remotePatterns` allows protocol and path restrictions
  - Better security (prevents unauthorized subdomains/protocols)

- **`/**` pathname**: Allows all placehold.co URL patterns
  - placehold.co uses various path formats (`/400`, `/600x400`, `/custom/path`)
  - Wildcard ensures all valid URLs work without restrictive patterns

### Alternatives Considered

❌ **Using deprecated `domains` property**:
```typescript
images: {
  domains: ['placehold.co'], // DEPRECATED
}
```
  - Rejected because: Next.js documentation recommends `remotePatterns`
  - Less secure (no protocol/path restrictions)
  - Will be removed in future Next.js versions

❌ **Specific pathname patterns** (e.g., `'/[0-9]*x[0-9]*'`):
  - Rejected because: Too restrictive, doesn't cover all placehold.co URL formats
  - Maintenance burden when adding new placeholder patterns

---

## R3: Dialog Accessibility Patterns

### WCAG 2.1 AA Requirements for Modal Dialogs

#### Required ARIA Attributes
1. ✅ `role="dialog"` - Identifies element as dialog
2. ✅ `aria-modal="true"` - Indicates modal behavior (blocks outside interaction)
3. ✅ `aria-labelledby` - References dialog title for screen readers
4. ✅ `aria-describedby` - References dialog description for context

#### Required Keyboard Interactions
1. ✅ **ESC key** - Closes dialog and returns focus to trigger
2. ✅ **Tab key** - Cycles focus within dialog (focus trap)
3. ✅ **Shift+Tab** - Reverse tab navigation within dialog
4. ✅ **Enter/Space on close button** - Closes dialog

#### Required Focus Management
1. ✅ **Focus on open** - Focus moves to first focusable element or dialog container
2. ✅ **Focus trap** - Tab navigation confined to dialog (cannot tab outside)
3. ✅ **Focus return** - Focus returns to trigger element on close
4. ✅ **Initial focus** - First focusable element receives focus (or dialog content if no focusable elements)

#### Required Visual Indicators
1. ✅ **Overlay/backdrop** - Visual separation from background content
2. ✅ **Focus indicators** - Visible focus rings on interactive elements
3. ✅ **Close affordance** - Visible close button or dismiss instruction

### Radix UI Dialog Accessibility Features (Out-of-the-Box)

**Radix UI Dialog provides**:
- ✅ `role="dialog"` automatically applied to `DialogContent`
- ✅ `aria-modal="true"` automatically set
- ✅ `aria-labelledby` automatically linked to `DialogTitle`
- ✅ `aria-describedby` automatically linked to `DialogDescription`
- ✅ **ESC key handler** - Built-in, can be disabled via `onEscapeKeyDown`
- ✅ **Focus trap** - Automatically traps focus within dialog
- ✅ **Focus return** - Automatically returns focus to trigger on close
- ✅ **Overlay click** - Closes dialog when clicking backdrop (configurable)
- ✅ **Portal rendering** - Renders at document root to avoid z-index issues
- ✅ **Scroll lock** - Prevents body scroll when dialog open

### shadcn/ui Dialog Additional Features

**shadcn wrapper adds**:
- ✅ **Close button** - Accessible close button in top-right corner
- ✅ **Semantic structure** - `DialogHeader`, `DialogFooter` for consistent layout
- ✅ **Styling** - Tailwind classes for proper contrast, spacing, focus rings
- ✅ **Animation** - Smooth enter/exit animations (respects `prefers-reduced-motion`)

### Implementation Requirements for TopTen

**What we MUST do**:
1. ✅ Always provide `<DialogTitle>` for every dialog (required for `aria-labelledby`)
2. ✅ Provide `<DialogDescription>` for context (recommended, not strictly required)
3. ✅ Ensure focusable elements within dialog have visible focus indicators
4. ✅ Test keyboard navigation (ESC, Tab, Enter)
5. ✅ Test screen reader announcements

**What Radix UI handles automatically**:
- ❌ No manual ARIA attributes needed
- ❌ No custom focus trap logic needed
- ❌ No manual ESC key handler needed
- ❌ No portal/z-index management needed

### Accessibility Testing Checklist

**Automated Tests** (React Testing Library + jest-axe):
- [ ] Dialog has `role="dialog"` attribute
- [ ] Dialog has `aria-modal="true"` attribute
- [ ] `DialogTitle` correctly linked via `aria-labelledby`
- [ ] `DialogDescription` correctly linked via `aria-describedby`
- [ ] No accessibility violations detected by axe-core

**Keyboard Tests** (React Testing Library + userEvent):
- [ ] ESC key closes dialog
- [ ] Tab key cycles through focusable elements
- [ ] Shift+Tab reverses tab direction
- [ ] Focus trapped within dialog (cannot tab outside)
- [ ] Focus returns to trigger on close

**Screen Reader Tests** (Manual + Playwright):
- [ ] Screen reader announces dialog when opened
- [ ] Title and description read correctly
- [ ] Interactive elements have clear labels
- [ ] Close button announced as "Close" or "Dismiss"

### Rationale

- **Radix UI chosen**: Industry-standard primitive with built-in accessibility
  - Used by shadcn/ui, Vercel, Clerk, and many production apps
  - Maintained by WorkOS team with accessibility expertise
  - Fully WCAG 2.1 AA compliant out-of-the-box

- **No custom implementation**: Radix UI solves all accessibility requirements
  - DRY principle: Don't reimplement what Radix provides
  - Quality: Battle-tested implementation better than custom code
  - Maintenance: Updates handled by Radix team

### Alternatives Considered

❌ **Headless UI (by Tailwind Labs)**:
  - Rejected because: Already using Radix UI ecosystem (Label, Slot)
  - Inconsistent to mix component libraries

❌ **Custom dialog implementation**:
  - Rejected because: Violates DRY, error-prone, no accessibility guarantees
  - Would require extensive ARIA/focus management code

❌ **React-Modal or other libraries**:
  - Rejected because: Not compatible with shadcn/ui ecosystem
  - Less flexible, harder to style with Tailwind

---

## R4: Modal Stacking and Edge Cases

### Edge Case Analysis

#### 1. Multiple Simultaneous Modals

**Question**: What happens when user attempts to open multiple dialogs?

**Radix UI Behavior**:
- Multiple `<Dialog>` components can coexist in React tree
- Each manages its own open/close state independently
- If multiple dialogs open simultaneously:
  - ✅ Each gets its own overlay (stacked overlays)
  - ✅ Focus trapped in most recently opened dialog
  - ✅ ESC closes most recently opened dialog
  - ⚠️ Z-index determined by DOM order (later = higher)

**TopTen Decision**: **Prevent modal stacking** (single modal at a time)

**Rationale**:
- **UX Simplicity**: Multiple overlays confusing for users
- **Accessibility**: Screen readers struggle with nested modals
- **Mobile**: Limited screen space makes stacking problematic
- **Consistency**: Most web apps use single modal pattern

**Implementation Approach**:
1. No enforcement needed at Dialog component level (allow flexibility)
2. Document best practice: "Use single modal at a time"
3. App-level state management should coordinate modals if needed
4. For rare nested scenarios (e.g., confirmation inside form dialog), consider:
   - Option A: Replace current dialog content
   - Option B: Use inline confirmation (no nested modal)

#### 2. Navigation During Modal Display

**Question**: What happens when Next.js App Router navigation occurs while dialog is open?

**Behavior Investigation**:
- Radix UI Dialog state is component-local (React state)
- Next.js navigation unmounts current page component
- Dialog component unmounts → dialog closes automatically
- No memory leaks or orphaned overlays

**TopTen Decision**: **Allow default behavior** (dialog closes on navigation)

**Rationale**:
- **Expected behavior**: Users expect modals to close on navigation
- **No action needed**: Default behavior is correct
- **Clean state**: Prevents stale modal state across routes

**Edge Case**: User clicks link inside dialog content
- ✅ Dialog unmounts automatically
- ✅ Navigation proceeds normally
- ✅ Focus returns to new page (not previous trigger)

#### 3. Modal Content Changes

**Question**: What happens when underlying page content changes while modal is open?

**Scenarios**:
1. **Real-time data update**: Background data fetches while modal open
   - ✅ Safe: Modal content is separate component tree
   - ✅ Portal rendering prevents layout shifts

2. **List reordering/filtering**: User has list open in modal, background list updates
   - ✅ Modal state independent of page state
   - ⚠️ Consider: Should modal data be "stale" snapshot or live?
   - **Decision**: Use stale snapshot (simpler, more predictable)

3. **Permission changes**: User loses permission while modal open
   - ℹ️ Handle at data layer, not modal layer
   - Show error message in modal content or close modal

#### 4. External Image Unavailability

**Question**: What happens when placehold.co is temporarily unavailable?

**Next.js Image Component Behavior**:
- Network error → Broken image placeholder in browser
- Console warning: "Failed to load external image"
- Does not block page rendering
- Does not crash application

**TopTen Decision**: **Accept graceful degradation** for development placeholders

**Rationale**:
- **Development-only**: Placeholder images temporary (will be replaced)
- **No production impact**: placehold.co not used in production
- **Graceful failure**: Browser shows broken image, not blank space
- **No additional handling**: Not worth error boundaries for dev-only feature

**Mitigation**:
- Use `<Image>` with `alt` text (screen readers get context)
- Consider `placeholder="blur"` for smoother loading (optional)

#### 5. Modal Content Exceeds Viewport Height

**Question**: How does modal handle overflow on small screens?

**Radix UI + shadcn Behavior**:
- ✅ `DialogContent` has `max-height: calc(100vh - 2rem)`
- ✅ Content scrolls within modal (not behind modal)
- ✅ Header and footer can be sticky (implementation choice)
- ✅ Mobile-responsive (full-width on small screens)

**TopTen Decision**: **Use default scrolling behavior**

**Implementation**:
- Modal content scrollable by default (shadcn provides this)
- For long forms: Consider pagination or multi-step modal
- For long lists: Consider virtual scrolling if performance issue

### Summary of Edge Case Decisions

| Edge Case | Decision | Implementation |
|-----------|----------|----------------|
| Multiple modals | Prevent (best practice) | Document pattern, no code enforcement |
| Navigation with modal open | Allow default close | No custom code needed |
| Page content changes | Stale snapshot in modal | Design pattern, not code requirement |
| External images fail | Graceful degradation | Accept browser default (broken image) |
| Content overflow | Scrollable modal | Use shadcn default styles |

### Alternatives Considered

❌ **Global modal state manager**:
  - Rejected because: Overengineering for initial setup
  - Can add later if needed (e.g., Redux-managed modal queue)

❌ **Programmatic modal close on navigation**:
  - Rejected because: Default behavior already correct
  - Would require Next.js router integration (complex)

❌ **Custom image error handling**:
  - Rejected because: Not needed for development placeholders
  - Can add later for production images if required

---

## R5: Testing Strategy for Dialog Component

### Testing Approach Overview

**Testing Pyramid**:
1. **Unit Tests** (Vitest + RTL) - 70% of tests
   - Component rendering
   - Accessibility attributes
   - Keyboard interactions
   - Focus management

2. **Integration Tests** (Vitest + RTL) - 20% of tests
   - Dialog with form submission
   - Dialog with data fetching
   - Multiple dialog instances (verify stacking behavior)

3. **E2E Tests** (Playwright) - 10% of tests
   - Critical user flows (delete confirmation)
   - Cross-browser keyboard navigation
   - Visual regression (optional)

### Unit Testing Strategy (React Testing Library)

**Tool**: Vitest + @testing-library/react + @testing-library/user-event

**Test File**: `tests/unit/components/ui/dialog.test.tsx`

**Test Scenarios**:

#### T1: Rendering and Basic Interaction
```typescript
describe('Dialog Component', () => {
  it('renders trigger button', () => {
    render(<DialogExample />);
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
  });

  it('does not render dialog content initially', () => {
    render(<DialogExample />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens dialog when trigger clicked', async () => {
    const user = userEvent.setup();
    render(<DialogExample />);
    await user.click(screen.getByRole('button', { name: /open/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

#### T2: Accessibility Attributes
```typescript
it('has correct ARIA attributes', async () => {
  const user = userEvent.setup();
  render(<DialogExample />);
  await user.click(screen.getByRole('button', { name: /open/i }));
  
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAttribute('aria-labelledby');
  expect(dialog).toHaveAttribute('aria-describedby');
});

it('links title via aria-labelledby', async () => {
  const user = userEvent.setup();
  render(<DialogExample />);
  await user.click(screen.getByRole('button', { name: /open/i }));
  
  const dialog = screen.getByRole('dialog');
  const title = screen.getByText(/dialog title/i);
  const labelId = dialog.getAttribute('aria-labelledby');
  expect(title.id).toBe(labelId);
});
```

#### T3: Keyboard Interactions
```typescript
it('closes dialog when ESC pressed', async () => {
  const user = userEvent.setup();
  render(<DialogExample />);
  await user.click(screen.getByRole('button', { name: /open/i }));
  
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('traps focus within dialog', async () => {
  const user = userEvent.setup();
  render(<DialogWithMultipleButtons />);
  await user.click(screen.getByRole('button', { name: /open/i }));
  
  // Tab through all focusable elements
  await user.tab();
  expect(document.activeElement).toBeInTheDocument();
  // After last element, focus should cycle to first
  // (Implementation depends on specific dialog content)
});
```

#### T4: Focus Management
```typescript
it('returns focus to trigger on close', async () => {
  const user = userEvent.setup();
  render(<DialogExample />);
  
  const trigger = screen.getByRole('button', { name: /open/i });
  await user.click(trigger);
  await user.keyboard('{Escape}');
  
  expect(trigger).toHaveFocus();
});

it('moves focus to dialog on open', async () => {
  const user = userEvent.setup();
  render(<DialogExample />);
  await user.click(screen.getByRole('button', { name: /open/i }));
  
  const dialog = screen.getByRole('dialog');
  // Focus should be on dialog or first focusable element inside
  expect(document.activeElement).toBe(dialog) || 
  expect(dialog.contains(document.activeElement)).toBe(true);
});
```

#### T5: Controlled State
```typescript
it('respects controlled open state', () => {
  const { rerender } = render(<ControlledDialog open={false} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  
  rerender(<ControlledDialog open={true} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('calls onOpenChange when state changes', async () => {
  const onOpenChange = vi.fn();
  const user = userEvent.setup();
  render(<ControlledDialog onOpenChange={onOpenChange} />);
  
  await user.click(screen.getByRole('button', { name: /open/i }));
  expect(onOpenChange).toHaveBeenCalledWith(true);
  
  await user.keyboard('{Escape}');
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
```

### Integration Testing Strategy

**Test File**: `tests/integration/dialog-forms.test.tsx`

**Test Scenarios**:

#### I1: Form Submission in Dialog
```typescript
it('submits form data and closes dialog', async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<DialogWithForm onSubmit={onSubmit} />);
  
  await user.click(screen.getByRole('button', { name: /create/i }));
  await user.type(screen.getByLabelText(/name/i), 'New List');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(onSubmit).toHaveBeenCalledWith({ name: 'New List' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

#### I2: Error Handling in Dialog
```typescript
it('displays validation errors without closing dialog', async () => {
  const user = userEvent.setup();
  render(<DialogWithValidation />);
  
  await user.click(screen.getByRole('button', { name: /create/i }));
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

### E2E Testing Strategy (Playwright)

**Test File**: `tests/e2e/dialog-interactions.spec.ts`

**Test Scenarios**:

#### E1: Delete Confirmation Flow
```typescript
test('user can delete list with confirmation', async ({ page }) => {
  await page.goto('/lists/my-coffee-shops');
  
  // Open delete confirmation dialog
  await page.click('button:has-text("Delete List")');
  await expect(page.locator('role=dialog')).toBeVisible();
  await expect(page.locator('text=Are you sure?')).toBeVisible();
  
  // Confirm deletion
  await page.click('button:has-text("Delete")');
  
  // Dialog should close and navigate away
  await expect(page.locator('role=dialog')).not.toBeVisible();
  await expect(page).toHaveURL('/dashboard');
});

test('user can cancel deletion', async ({ page }) => {
  await page.goto('/lists/my-coffee-shops');
  
  await page.click('button:has-text("Delete List")');
  await page.keyboard.press('Escape');
  
  // Still on same page
  await expect(page).toHaveURL('/lists/my-coffee-shops');
});
```

#### E2: Keyboard Navigation Across Browsers
```typescript
test('dialog keyboard navigation works', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Create List")');
  
  // Tab through dialog elements
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="title"]')).toBeFocused();
  
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="description"]')).toBeFocused();
  
  // ESC closes dialog
  await page.keyboard.press('Escape');
  await expect(page.locator('role=dialog')).not.toBeVisible();
});
```

### Image Loading Tests

**Test File**: `tests/unit/components/placeholder-image.test.tsx`

**Test Scenarios**:

#### IMG1: External Image Configuration
```typescript
it('loads images from placehold.co domain', async () => {
  render(
    <Image 
      src="https://placehold.co/400x300" 
      alt="Placeholder"
      width={400}
      height={300}
    />
  );
  
  const img = screen.getByAltText('Placeholder');
  await waitFor(() => {
    expect(img).toHaveAttribute('src');
    expect(img.getAttribute('src')).toContain('placehold.co');
  });
});
```

#### IMG2: Build Configuration Test (E2E)
```typescript
test('placeholder images render on page', async ({ page }) => {
  await page.goto('/front-page');
  
  const images = page.locator('img[src*="placehold.co"]');
  await expect(images.first()).toBeVisible();
  
  // Check that image actually loaded (not broken)
  const isLoaded = await images.first().evaluate((img: HTMLImageElement) => 
    img.complete && img.naturalHeight !== 0
  );
  expect(isLoaded).toBe(true);
});
```

### Testing Tools Summary

| Tool | Purpose | Installation |
|------|---------|------------|
| Vitest | Test runner | ✅ Already installed |
| @testing-library/react | Component testing | ✅ Already installed |
| @testing-library/user-event | User interaction simulation | ⚠️ Need to install |
| @testing-library/jest-dom | DOM matchers | ✅ Already installed |
| Playwright | E2E testing | ✅ Already installed |
| @axe-core/react | Accessibility testing | ⚠️ Optional (can use jest-axe) |

### Test Coverage Goals

- **Minimum coverage**: 80% of Dialog component code
- **Critical paths**: 100% coverage
  - Open/close interactions
  - Keyboard navigation
  - Accessibility attributes
  - Focus management

### Rationale

- **Testing pyramid**: More unit tests (fast, cheap) than E2E tests (slow, expensive)
- **React Testing Library**: Encourages testing user behavior, not implementation
- **Playwright for E2E**: Cross-browser testing for critical flows
- **No snapshot tests**: Dialog appearance will change, snapshots fragile
- **Accessibility first**: Automated accessibility tests catch common issues

### Alternatives Considered

❌ **Cypress instead of Playwright**:
  - Rejected because: Playwright already in project, better TypeScript support

❌ **Enzyme for component testing**:
  - Rejected because: React Testing Library is modern standard, better practices

❌ **Manual accessibility testing only**:
  - Rejected because: Automated tests catch regressions, faster feedback

---

## Summary of Research Decisions

| Research Area | Decision | Key Rationale |
|---------------|----------|---------------|
| **R1: Installation** | Use shadcn CLI: `pnpm dlx shadcn@latest add dialog` | Official tooling, automated, consistent with existing components |
| **R2: Image Config** | `remotePatterns` in next.config.ts with placehold.co | Next.js 13+ recommended approach, more secure than `domains` |
| **R3: Accessibility** | Use Radix UI built-in features, always provide DialogTitle | WCAG 2.1 AA compliant out-of-the-box, no custom implementation |
| **R4: Edge Cases** | Single modal pattern (best practice), allow default navigation behavior | UX simplicity, accessibility, matches common web patterns |
| **R5: Testing** | 70% unit (RTL), 20% integration, 10% E2E (Playwright) | Testing pyramid, focus on accessibility and keyboard interaction |

---

## Implementation Readiness

✅ **All technical unknowns resolved**  
✅ **Installation process documented**  
✅ **Configuration syntax defined**  
✅ **Accessibility requirements clear**  
✅ **Edge cases analyzed and decisions made**  
✅ **Testing strategy established**

**Next Step**: Proceed to Phase 1 (Design & Contracts) to define component API and create quickstart guide.
