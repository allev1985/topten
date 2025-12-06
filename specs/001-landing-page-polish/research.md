# Research: Landing Page Polish & Accessibility

**Phase**: 0 - Outline & Research  
**Date**: 2025-12-06  
**Status**: Complete

## Overview

This document consolidates research findings for polishing the landing page responsive design and accessibility. All unknowns from Technical Context have been resolved through investigation of existing codebase patterns and industry best practices.

---

## Research Tasks Completed

### 1. Responsive Design Patterns for Next.js + Tailwind CSS

**Research Question**: What are the best practices for responsive breakpoints and touch targets in Tailwind CSS?

**Findings**:

#### Tailwind Breakpoints (Default)
```
sm: 640px   # Small devices
md: 768px   # Tablets
lg: 1024px  # Laptops
xl: 1280px  # Desktops
2xl: 1536px # Large desktops
```

**Our Target Breakpoints** (from spec):
- Mobile: 375px (iPhone SE) - uses default/sm
- Tablet: 768px (iPad) - uses md
- Desktop: 1440px - uses xl

**Decision**: Use Tailwind's default breakpoints without customization. Apply mobile-first approach:
- Base styles: 375px+
- `md:` prefix: 768px+
- `lg:` prefix: 1024px+
- `xl:` prefix: 1440px+

#### Touch Target Best Practices
- **WCAG 2.1 Success Criterion 2.5.5**: Minimum 44×44 CSS pixels
- **Material Design**: 48×48dp minimum (translates to 48×48px)
- **iOS HIG**: 44×44 points minimum

**Decision**: Ensure all buttons meet 44×44px minimum via Tailwind's `min-h-[44px] min-w-[44px]` or use shadcn/ui Button size variants which already meet this (size="lg" = 44px height).

**Rationale**: Industry standard for touch accessibility. Prevents mis-taps on mobile devices.

**Alternatives Considered**:
- 48×48px (Material Design) - rejected as 44px is WCAG minimum and shadcn/ui default
- 40×40px - rejected as below WCAG standard

---

### 2. Accessibility Standards for Keyboard Navigation

**Research Question**: What ARIA patterns and keyboard interactions are required for modal dialogs and focus management?

**Findings**:

#### WAI-ARIA Dialog Pattern
From [WAI-ARIA Authoring Practices Guide 1.2](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/):

**Keyboard Interaction**:
- `Tab`: Move focus to next focusable element inside dialog
- `Shift + Tab`: Move focus to previous focusable element
- `Escape`: Close dialog and return focus to trigger

**Focus Management**:
1. When dialog opens, focus moves to first focusable element
2. Focus is **trapped** within dialog (Tab cycles within dialog only)
3. When dialog closes, focus returns to element that triggered it

**ARIA Attributes** (handled by Radix UI Dialog):
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` (points to DialogTitle)
- `aria-describedby` (points to DialogDescription)

**Decision**: Radix UI Dialog (used by shadcn/ui) already implements WAI-ARIA pattern correctly. No custom implementation needed. Just verify:
1. Focus returns to trigger button on close
2. Escape key closes modal
3. Focus indicators are visible

**Rationale**: Radix UI is battle-tested and WCAG 2.1 AA compliant. Don't reinvent the wheel.

**Alternatives Considered**:
- Custom dialog implementation - rejected (Radix UI is industry standard)
- Headless UI - rejected (already using Radix via shadcn/ui)

---

### 3. Focus Indicator Visibility Standards

**Research Question**: What are the WCAG requirements for visible focus indicators?

**Findings**:

#### WCAG 2.1 Success Criterion 2.4.7 (Level AA)
"Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible."

#### WCAG 2.2 Success Criterion 2.4.11 (Level AA) - Focus Appearance
- **Minimum perimeter**: 2px solid outline
- **Contrast ratio**: At least 3:1 against adjacent colors
- **Offset**: Can be 1px or more from the focused element

**Current State in Codebase**:
- Tailwind CSS default: `ring` utilities use `--ring` CSS variable
- shadcn/ui components use `focus-visible:ring-2 focus-visible:ring-ring`
- `--ring` is set to `#171717` (dark) in light mode, `#d4d4d4` (light) in dark mode

**Decision**: Use Tailwind's `focus-visible:outline-2 focus-visible:outline-offset-2` for custom focus states if needed. Verify existing components already have visible focus indicators.

**Rationale**: Tailwind's default focus styles meet WCAG 2.2 Level AA. No custom CSS needed.

**Alternatives Considered**:
- Custom CSS focus styles - rejected (Tailwind default sufficient)
- Browser default outline - rejected (inconsistent across browsers)

---

### 4. Performance Measurement with Playwright

**Research Question**: How to measure Core Web Vitals (LCP, CLS, FID) in Playwright tests?

**Findings**:

#### Core Web Vitals Measurement
Playwright doesn't have built-in Core Web Vitals metrics, but can measure via Performance API:

**Largest Contentful Paint (LCP)**:
```typescript
const lcp = await page.evaluate(() => {
  return new Promise((resolve) => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      resolve(lastEntry.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
});
```

**Cumulative Layout Shift (CLS)**:
```typescript
const cls = await page.evaluate(() => {
  return new Promise<number>((resolve) => {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(clsValue);
    }, 3000);
  });
});
```

**Decision**: Add performance tests to `tests/e2e/landing-page.spec.ts`:
- LCP test: Verify ≤ 2.5s
- CLS test: Verify ≤ 0.1
- Load time test: Verify visible content within 2s (already exists)

**Rationale**: Performance assertions in E2E tests provide regression detection.

**Alternatives Considered**:
- Lighthouse CI - rejected (too heavy for PR checks, better for production monitoring)
- Manual testing only - rejected (no regression protection)

---

### 5. Modal Scroll Behavior on Small Screens

**Research Question**: How should modals handle content that exceeds viewport height on small screens (e.g., 320px width)?

**Findings**:

#### Radix UI Dialog Behavior
By default, Radix UI Dialog:
- Uses fixed positioning
- Centers on screen
- Does NOT scroll internally by default
- If content exceeds viewport, modal extends beyond viewport (bad UX)

#### Best Practices
**Option 1**: Internal scroll (preferred for mobile)
```css
.dialog-content {
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}
```

**Option 2**: Full-screen modal on mobile
```css
@media (max-width: 640px) {
  .dialog-content {
    width: 100%;
    height: 100%;
    max-height: 100vh;
  }
}
```

**Current shadcn/ui Dialog**:
Checking `components/ui/dialog.tsx` shows DialogContent has `max-h-[90vh]` (not in this repo yet, but standard shadcn pattern).

**Decision**: Verify DialogContent has `max-h-[90vh] overflow-y-auto` to enable internal scrolling. Add explicit test for small viewport (320px × 568px) to ensure modal doesn't break layout.

**Rationale**: Internal scroll is most user-friendly for small screens. Maintains consistent modal UX across devices.

**Alternatives Considered**:
- Full-screen modal on mobile - rejected (inconsistent UX across breakpoints)
- No scroll, let modal extend - rejected (bad UX, content inaccessible)

---

### 6. Image Loading Strategy (Lazy Load vs Priority)

**Research Question**: What's the optimal loading strategy for hero images to minimize LCP and CLS?

**Findings**:

#### Next.js Image Component Best Practices
From [Next.js Image Optimization docs](https://nextjs.org/docs/app/building-your-application/optimizing/images):

**Priority Loading**:
- Use `priority={true}` for above-the-fold images (LCP candidates)
- Disables lazy loading
- Adds `fetchpriority="high"`
- Should be used for 1-2 hero images max

**Lazy Loading**:
- Default behavior
- Uses `loading="lazy"` attribute
- Loads when image is near viewport
- Good for below-the-fold images

**Current Implementation** (from `HeroImageGrid.tsx`):
```typescript
const GRID_IMAGES = [
  { id: "coffee", priority: true },    // Above fold
  { id: "library", priority: true },   // Above fold
  { id: "market", priority: false },   // Below fold
  { id: "gallery", priority: false },  // Below fold
];
```

**Decision**: Keep existing strategy. First 2 images use `priority`, last 2 use lazy loading. This is optimal for LCP (coffee/library load fast) and performance (market/gallery don't block initial render).

**Rationale**: Current implementation follows Next.js best practices. No changes needed.

**Alternatives Considered**:
- All images priority - rejected (wastes bandwidth, no benefit)
- All images lazy - rejected (delays LCP, hurts perceived performance)

---

### 7. Playwright Accessibility Testing

**Research Question**: How to automate accessibility testing in Playwright E2E tests?

**Findings**:

#### Options for Automated A11y Testing

**Option 1**: Axe-core via @axe-core/playwright
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

**Option 2**: Manual assertions with Playwright locators
```typescript
test('focus indicators visible', async ({ page }) => {
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  // Check for outline or ring styles
});
```

**Option 3**: Lighthouse CI
- Too heavy for unit tests
- Better for production monitoring

**Decision**: Use **Option 2** (manual assertions) for now. Add specific tests for:
- Keyboard navigation (Tab, Enter, Space, Escape)
- Focus return after modal close
- ARIA labels (via `getByRole` locators)
- Touch target sizes (via bounding box checks)

**Rationale**: Playwright's built-in accessibility locators (`getByRole`, `getByLabel`) are sufficient for our use cases. Adding axe-core is overkill for this focused feature.

**Alternatives Considered**:
- axe-core integration - rejected (adds dependency, not needed for targeted tests)
- Lighthouse CI - rejected (too slow for PR checks)

---

## Technology Decisions Summary

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Breakpoints** | Tailwind defaults (sm/md/lg/xl) | Already configured, mobile-first approach |
| **Touch Targets** | 44×44px minimum (WCAG 2.1) | Use shadcn Button size="lg" variant |
| **Focus Indicators** | Tailwind `focus-visible:ring-2` | Meets WCAG 2.2 Level AA, consistent |
| **Dialog Pattern** | Radix UI (via shadcn) | WAI-ARIA compliant, battle-tested |
| **Modal Scroll** | Internal scroll with max-h-[90vh] | Best UX for small screens |
| **Image Loading** | Keep existing priority strategy | Optimal for LCP and performance |
| **A11y Testing** | Playwright manual assertions | Sufficient for focused feature scope |
| **Performance Tests** | Performance API in Playwright | Provides regression detection |

---

## No Remaining Unknowns

All "NEEDS CLARIFICATION" items from Technical Context have been resolved:
- ✅ Responsive patterns: Mobile-first Tailwind with default breakpoints
- ✅ Accessibility standards: WCAG 2.1 AA via Radix UI + focus indicators
- ✅ Performance measurement: Performance API in Playwright tests
- ✅ Touch targets: 44×44px minimum via Button size variants
- ✅ Modal scroll: Internal scroll with max-h-[90vh]
- ✅ Image loading: Keep existing priority/lazy strategy
- ✅ Focus management: Radix UI handles automatically

**Phase 0 Status**: ✅ **COMPLETE** - Ready for Phase 1 (Design & Contracts)
