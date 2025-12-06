# Quickstart Guide: Landing Page Polish & Accessibility

**Phase**: 1 - Design & Contracts  
**Date**: 2025-12-06  
**Audience**: Developers implementing and testing this feature

## Overview

This guide helps you set up your environment, make changes, and validate the landing page polish and accessibility improvements.

---

## Prerequisites

- Node.js ≥ 20.0.0
- pnpm ≥ 8.0.0
- Git (for checking out branch)

---

## Setup

### 1. Checkout Feature Branch

```bash
git checkout 001-landing-page-polish
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 4. Start Supabase (for Auth Testing)

```bash
pnpm supabase:start
```

Wait for Supabase to initialize (displays API URLs when ready).

---

## Making Changes

### Component Files to Modify

All changes should be **surgical** (minimal) and confined to:

1. **`src/components/shared/LandingPageClient.tsx`**
   - Add responsive utility classes (e.g., `md:px-8`, `lg:py-16`)
   - Verify spacing meets touch target minimums
   - No logic changes

2. **`src/components/shared/Header.tsx`**
   - Ensure buttons use `size="lg"` for 44×44px touch targets
   - Verify button spacing on mobile (gap-3 or gap-4)
   - Add responsive classes if needed (e.g., stack vertically on very small screens)

3. **`src/components/shared/LoginModal.tsx`** & **`SignupModal.tsx`**
   - Verify DialogContent has `max-h-[90vh] overflow-y-auto` for small screens
   - Test keyboard navigation (Tab, Enter, Escape)
   - Ensure focus returns to trigger button on close

4. **`src/app/globals.css`** (if needed)
   - Add global focus indicator styles if Tailwind defaults insufficient
   - Example: `.focus-visible:outline-2 .focus-visible:outline-ring`

### What NOT to Change

❌ **DO NOT modify `src/components/ui/*`** (shadcn/ui generated components)
❌ **DO NOT change component logic or state management**
❌ **DO NOT add new features beyond spec requirements**

---

## Testing Changes

### Manual Testing Checklist

#### Responsive Design
```bash
# Open browser DevTools (F12)
# Test these viewports:
- 375×667 (iPhone SE)
- 414×896 (iPhone 12)
- 768×1024 (iPad)
- 1024×768 (Laptop)
- 1440×900 (Desktop)

# Verify:
- No horizontal scroll at any width
- Text is readable without zooming
- Images scale appropriately
- Buttons are at least 44×44px (use DevTools inspector)
```

#### Keyboard Navigation
```bash
# Start at landing page
1. Press Tab → Focus moves to logo (skip link)
2. Press Tab → Focus on "Log In" button (visible outline)
3. Press Tab → Focus on "Start Curating" button
4. Press Enter → Signup modal opens
5. Press Tab → Focus cycles through form fields
6. Press Escape → Modal closes, focus returns to "Start Curating"
7. Repeat for "Log In" button
```

#### Accessibility
```bash
# Use browser DevTools > Lighthouse
1. Navigate to http://localhost:3000
2. Run Lighthouse audit (Accessibility category)
3. Target: Score ≥ 95/100
4. Fix any violations reported
```

### Automated E2E Tests

#### Run All E2E Tests
```bash
pnpm test:e2e
```

#### Run Specific Test File
```bash
pnpm test:e2e tests/e2e/landing-page.spec.ts
pnpm test:e2e tests/e2e/login-modal.spec.ts
pnpm test:e2e tests/e2e/signup-modal.spec.ts  # NEW file
```

#### Run Tests with UI (Interactive)
```bash
pnpm test:e2e:ui
```

This opens Playwright Test UI where you can:
- Run tests with step-by-step execution
- View screenshots of failures
- Debug specific tests

#### Run Tests at Specific Viewport
```bash
# Edit playwright.config.ts or create custom test:
test.use({ viewport: { width: 375, height: 667 } });
```

### Performance Testing

#### Manual Performance Check
```bash
# Open DevTools > Lighthouse
1. Navigate to http://localhost:3000
2. Run Lighthouse audit (Performance category)
3. Verify Core Web Vitals:
   - LCP ≤ 2.5s (green)
   - CLS ≤ 0.1 (green)
   - FID < 100ms (green)
```

#### Automated Performance Tests
```bash
# These run as part of E2E suite
pnpm test:e2e -- --grep "performance"
```

---

## Writing New Tests

### Test File Structure

Create `tests/e2e/signup-modal.spec.ts` (NEW):

```typescript
import { test, expect } from "@playwright/test";

test.describe("Signup Modal Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("complete signup flow from landing page", async ({ page }) => {
    // Click "Start Curating" button
    await page.getByRole("button", { name: "Start Curating" }).click();

    // Verify modal opens
    await expect(page.getByRole("dialog")).toBeVisible();
    
    // Fill form
    await page.getByLabel("Email").fill("newuser@example.com");
    await page.getByLabel("Password").fill("SecurePass123!");
    
    // Submit
    await page.getByRole("button", { name: "Sign Up" }).click();
    
    // Verify success message
    await expect(page.getByText("Check your email!")).toBeVisible();
  });

  test("shows error for existing email", async ({ page }) => {
    // ... test implementation
  });
});
```

### Viewport Tests

```typescript
test("mobile viewport - no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth
  );
  const clientWidth = await page.evaluate(
    () => document.documentElement.clientWidth
  );
  
  expect(scrollWidth).toBe(clientWidth);
});
```

### Keyboard Navigation Tests

```typescript
test("keyboard navigation through header", async ({ page }) => {
  await page.goto("/");
  
  // Tab through interactive elements
  await page.keyboard.press("Tab"); // Logo
  await page.keyboard.press("Tab"); // Log In
  await expect(page.getByRole("button", { name: "Log In" })).toBeFocused();
  
  await page.keyboard.press("Tab"); // Start Curating
  await expect(
    page.getByRole("button", { name: "Start Curating" })
  ).toBeFocused();
  
  // Activate with Enter
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
});
```

### Accessibility Tests

```typescript
test("focus visible on all interactive elements", async ({ page }) => {
  await page.goto("/");
  
  const buttons = page.getByRole("button");
  const count = await buttons.count();
  
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    await button.focus();
    
    // Verify button has focus-visible ring
    const className = await button.getAttribute("class");
    expect(className).toContain("focus-visible:ring");
  }
});
```

---

## Validation Checklist

Before marking implementation complete, verify:

### ✅ Responsive Design
- [ ] No horizontal scroll on 375px, 768px, 1440px viewports
- [ ] Text readable without zoom on all devices
- [ ] Images scale properly (no distortion)
- [ ] Modal fits in viewport on 375px width

### ✅ Accessibility
- [ ] All buttons ≥ 44×44px touch targets
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape)
- [ ] Focus indicators visible (≥2px outline or ring)
- [ ] Focus returns to trigger button after modal close
- [ ] ARIA labels present on all interactive elements
- [ ] Lighthouse Accessibility score ≥ 95

### ✅ Performance
- [ ] LCP ≤ 2.5s (Lighthouse)
- [ ] CLS ≤ 0.1 (Lighthouse)
- [ ] FID < 100ms (Lighthouse)
- [ ] No console errors or hydration warnings

### ✅ Testing
- [ ] All existing E2E tests pass
- [ ] New E2E tests for signup flow added
- [ ] Responsive tests at 3+ viewports
- [ ] Keyboard navigation tests added
- [ ] Performance tests added
- [ ] Test coverage ≥ 60% of landing page flows

---

## Troubleshooting

### Issue: Horizontal scroll on mobile
**Solution**: Check for fixed widths or large padding. Use DevTools mobile emulator to inspect element widths.

### Issue: Modal extends beyond viewport
**Solution**: Verify DialogContent has `max-h-[90vh]` and `overflow-y-auto`. Test at 320px width.

### Issue: Focus indicator not visible
**Solution**: Check if element has `focus-visible:ring-2` or `focus-visible:outline-2`. Add to component className.

### Issue: Tests fail on CI but pass locally
**Solution**: CI may use different viewport defaults. Explicitly set viewport in test with `page.setViewportSize()`.

### Issue: Supabase auth errors in tests
**Solution**: Ensure Supabase is running (`pnpm supabase:start`). Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL`.

---

## Resources

### Documentation
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [WAI-ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Playwright Testing](https://playwright.dev/docs/intro)

### Code Examples
- Existing test: `tests/e2e/landing-page.spec.ts`
- Existing modal: `src/components/shared/LoginModal.tsx`
- shadcn/ui docs: [https://ui.shadcn.com](https://ui.shadcn.com)

---

## Phase 1 Complete

This quickstart guide provides everything needed to:
1. Set up the development environment
2. Make minimal surgical changes to components
3. Write comprehensive E2E tests
4. Validate responsive design and accessibility

**Next Step**: Proceed to Phase 2 (Task breakdown with `/speckit.tasks` command)
