# Quickstart Guide: Login Modal Panel Component

**Feature**: Login Modal Panel Component  
**Branch**: `001-login-modal`  
**Target Audience**: Developers implementing this feature  
**Estimated Time**: 2-3 hours

---

## Overview

This guide walks you through implementing a modal-based login experience on the landing page. You'll create a `LoginModal` component, make the existing `LoginForm` reusable, and wire everything together with proper state management.

**What You'll Build**:

- A modal dialog that displays the login form
- Enhanced `LoginForm` that works in both modal and standalone contexts
- State management in `LandingPageClient` to control modal visibility
- Comprehensive tests covering the new functionality

---

## Prerequisites

Before starting, ensure you have:

- [x] Node.js 20+ and pnpm installed
- [x] Project dependencies installed (`pnpm install`)
- [x] Local development server running (`pnpm dev`)
- [x] Feature branch checked out (`git checkout 001-login-modal`)
- [x] Familiarity with Next.js App Router, React hooks, and TypeScript

---

## Implementation Steps

### Step 1: Modify LoginForm to Support Callback (15 minutes)

**File**: `src/app/(auth)/login/login-form.tsx`

**Goal**: Add optional `onSuccess` callback to enable modal usage

**Changes**:

1. Update the `LoginFormProps` interface:

   ```typescript
   export interface LoginFormProps {
     redirectTo?: string;
     defaultEmail?: string;
     onSuccess?: (data: { redirectTo: string }) => void; // ADD THIS
   }
   ```

2. Update the function signature:

   ```typescript
   export function LoginForm({ redirectTo, defaultEmail, onSuccess }: LoginFormProps) {
   ```

3. Modify the redirect logic in the `useEffect`:
   ```typescript
   useEffect(() => {
     if (state.isSuccess && state.data?.redirectTo) {
       if (onSuccess) {
         onSuccess(state.data); // Call callback if provided
       } else {
         router.push(state.data.redirectTo); // Otherwise redirect
       }
     }
   }, [state.isSuccess, state.data, router, onSuccess]); // Add onSuccess to deps
   ```

**Verification**:

```bash
# Ensure no TypeScript errors
pnpm typecheck

# Verify standalone login page still works
# Navigate to http://localhost:3000/login
# Try logging in - should redirect normally
```

---

### Step 2: Create LoginModal Component (30 minutes)

**File**: `src/components/shared/LoginModal.tsx` (NEW FILE)

**Goal**: Create modal wrapper that contains the login form

**Implementation**:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/app/(auth)/login/login-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Optional redirect URL after successful login */
  redirectTo?: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  redirectTo,
}: LoginModalProps) {
  const router = useRouter();

  const handleSuccess = (data: { redirectTo: string }) => {
    onClose(); // Close modal first
    router.push(data.redirectTo); // Then navigate
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>
        <LoginForm redirectTo={redirectTo} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
```

**Key Points**:

- `"use client"` directive required (modal needs client-side interactivity)
- Dialog component from shadcn/ui provides accessibility automatically
- `handleSuccess` closes modal before redirect for smooth UX
- `DialogHeader` provides proper ARIA labels for screen readers

**Verification**:

```bash
# No TypeScript errors
pnpm typecheck
```

---

### Step 3: Update LandingPageClient State Management (20 minutes)

**File**: `src/components/shared/LandingPageClient.tsx`

**Goal**: Add modal state and wire up event handlers

**Changes**:

1. Add state hook at the top of the component:

   ```typescript
   const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
   ```

2. Update the `handleLogin` function:

   ```typescript
   const handleLogin = () => {
     setIsLoginModalOpen(true); // Open modal instead of console.log
   };
   ```

3. Import the `LoginModal` component:

   ```typescript
   import LoginModal from "@/components/shared/LoginModal";
   ```

4. Add `LoginModal` to the JSX, after the `Header`:

   ```typescript
   return (
     <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
       <Header onLogin={handleLogin} onSignup={handleSignup} />

       {/* ADD THIS */}
       <LoginModal
         isOpen={isLoginModalOpen}
         onClose={() => setIsLoginModalOpen(false)}
         redirectTo="/dashboard"
       />

       <main className="flex flex-1 flex-col items-center justify-center">
         {/* existing content */}
       </main>
     </div>
   );
   ```

**Complete Updated File**:

```typescript
"use client";

import { useState } from "react";
import Header from "@/components/shared/Header";
import LoginModal from "@/components/shared/LoginModal";

export default function LandingPageClient() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleSignup = () => {
    // TODO: Open signup modal (future feature)
    console.log("Signup clicked");
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header onLogin={handleLogin} onSignup={handleSignup} />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectTo="/dashboard"
      />

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

**Verification**:

```bash
# Start dev server if not running
pnpm dev

# Manual test:
# 1. Navigate to http://localhost:3000
# 2. Click "Log In" button
# 3. Modal should open with login form
# 4. Press Escape - modal should close
# 5. Click "Log In" again - modal should reopen
# 6. Click outside modal - modal should close
# 7. Enter credentials and submit - should redirect after modal closes
```

---

### Step 4: Write Unit Tests (45 minutes)

#### 4a. LoginModal Component Tests

**File**: `tests/unit/components/shared/LoginModal.test.tsx` (NEW FILE)

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginModal from "@/components/shared/LoginModal";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock LoginForm to isolate LoginModal tests
vi.mock("@/app/(auth)/login/login-form", () => ({
  LoginForm: ({ onSuccess, redirectTo }: any) => (
    <div data-testid="mock-login-form">
      <button onClick={() => onSuccess?.({ redirectTo: redirectTo || "/dashboard" })}>
        Mock Success
      </button>
    </div>
  ),
}));

describe("LoginModal - Rendering", () => {
  it("renders dialog when isOpen is true", () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("does not render dialog when isOpen is false", () => {
    render(<LoginModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders LoginForm inside dialog", () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId("mock-login-form")).toBeInTheDocument();
  });
});

describe("LoginModal - Interaction", () => {
  it("calls onClose when dialog requests to close", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<LoginModal isOpen={true} onClose={onClose} />);

    // Press Escape key
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on successful authentication", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<LoginModal isOpen={true} onClose={onClose} />);

    // Trigger success via mocked LoginForm
    const successButton = screen.getByText("Mock Success");
    await user.click(successButton);

    expect(onClose).toHaveBeenCalled();
  });
});

describe("LoginModal - Accessibility", () => {
  it("has proper dialog role", () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("includes accessible title", () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("includes accessible description", () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Enter your credentials to access your account")).toBeInTheDocument();
  });
});
```

#### 4b. LoginForm Updates Tests

**File**: `tests/unit/components/auth/LoginForm.test.tsx` (NEW FILE)

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/app/(auth)/login/login-form";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-form-state", () => ({
  useFormState: () => ({
    state: {
      isPending: false,
      isSuccess: false,
      error: null,
      fieldErrors: {},
      data: null,
    },
    formAction: vi.fn(),
  }),
}));

describe("LoginForm - onSuccess Callback", () => {
  it("calls onSuccess callback when provided and auth succeeds", async () => {
    const onSuccess = vi.fn();

    // Mock successful auth state
    vi.mock("@/hooks/use-form-state", () => ({
      useFormState: () => ({
        state: {
          isPending: false,
          isSuccess: true,
          error: null,
          fieldErrors: {},
          data: { redirectTo: "/dashboard" },
        },
        formAction: vi.fn(),
      }),
    }));

    render(<LoginForm onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ redirectTo: "/dashboard" });
    });
  });

  it("auto-redirects when onSuccess not provided", () => {
    // This test would verify the original behavior is preserved
    // Implementation depends on your testing setup for router.push
  });
});
```

#### 4c. Integration Tests

**File**: `tests/integration/auth/login-modal.test.tsx` (NEW FILE)

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPageClient from "@/components/shared/LandingPageClient";

describe("Login Modal Integration", () => {
  it("opens modal when Log In button is clicked", async () => {
    const user = userEvent.setup();
    render(<LandingPageClient />);

    // Modal should not be visible initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click Log In button
    const loginButton = screen.getByRole("button", { name: "Log In" });
    await user.click(loginButton);

    // Modal should now be visible
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("closes modal when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<LandingPageClient />);

    // Open modal
    await user.click(screen.getByRole("button", { name: "Log In" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Press Escape
    await user.keyboard("{Escape}");

    // Modal should close
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

**Run Tests**:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test LoginModal.test.tsx

# Run with coverage
pnpm test:coverage
```

---

### Step 5: Write E2E Tests (30 minutes)

**File**: `tests/e2e/login-modal.spec.ts` (NEW FILE)

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login Modal Flow", () => {
  test("opens modal from landing page and logs in successfully", async ({
    page,
  }) => {
    // Navigate to landing page
    await page.goto("http://localhost:3000");

    // Verify modal is not visible
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Click Log In button
    await page.getByRole("button", { name: "Log In" }).click();

    // Verify modal opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Sign In")).toBeVisible();

    // Fill in credentials
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");

    // Submit form
    await page.getByRole("button", { name: "Sign In" }).click();

    // Verify redirect to dashboard (after modal closes)
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Verify modal is closed
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("closes modal when Escape key is pressed", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Open modal
    await page.getByRole("button", { name: "Log In" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("closes modal when clicking outside", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Open modal
    await page.getByRole("button", { name: "Log In" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Click outside modal (on overlay)
    await page.mouse.click(10, 10); // Top-left corner, outside modal

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("returns focus to Log In button after closing", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const loginButton = page.getByRole("button", { name: "Log In" });

    // Open modal
    await loginButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");

    // Focus should return to trigger button
    await expect(loginButton).toBeFocused();
  });
});
```

**Run E2E Tests**:

```bash
# Run E2E tests
pnpm test:e2e

# Run in UI mode for debugging
pnpm test:e2e:ui
```

---

### Step 6: Manual Testing Checklist (15 minutes)

Use this checklist to verify all functionality:

#### Functional Tests

- [ ] Click "Log In" button on landing page → modal opens
- [ ] Enter valid credentials → successful login → redirect to dashboard
- [ ] Enter invalid credentials → error displays in modal → modal stays open
- [ ] Press Escape while modal is open → modal closes
- [ ] Click outside modal → modal closes
- [ ] Click close button (X) → modal closes
- [ ] Close and reopen modal → form is reset (no stale data)

#### Accessibility Tests

- [ ] Tab through page → can reach "Log In" button
- [ ] Press Enter on "Log In" button → modal opens
- [ ] Modal opens → focus moves to email field
- [ ] Tab within modal → focus stays trapped
- [ ] Last element → Tab → cycles back to first element
- [ ] Close modal → focus returns to "Log In" button
- [ ] Screen reader announces dialog role (test with NVDA/JAWS if available)

#### Responsive Tests

- [ ] Test on mobile (320px width) → modal is scrollable, usable
- [ ] Test on tablet (768px width) → modal displays correctly
- [ ] Test on desktop (1920px width) → modal centered, appropriate size

#### Regression Tests

- [ ] Navigate to `/login` standalone page → still works normally
- [ ] Standalone page login → redirects correctly (no modal behavior)

---

## Common Issues & Solutions

### Issue: Modal doesn't open when clicking "Log In"

**Solution**: Check that:

1. `isLoginModalOpen` state is being set to `true` in `handleLogin`
2. `LoginModal` is receiving `isOpen={isLoginModalOpen}` prop
3. No TypeScript errors in console
4. `LoginModal` is imported correctly in `LandingPageClient`

### Issue: Form doesn't submit / redirect doesn't happen

**Solution**: Check that:

1. `onSuccess` callback in `LoginModal` calls both `onClose()` and `router.push()`
2. `LoginForm` is passing `onSuccess` prop correctly
3. Authentication action is working (test on `/login` standalone page)

### Issue: TypeScript errors about missing props

**Solution**: Ensure:

1. `LoginFormProps` interface includes optional `onSuccess?: (data: { redirectTo: string }) => void`
2. `LoginModal` imports are correct
3. Run `pnpm typecheck` to see detailed errors

### Issue: Tests failing

**Solution**:

1. Ensure all mocks are set up correctly (`next/navigation`, `use-form-state`)
2. Check test environment setup in `vitest.config.ts`
3. Run individual test files to isolate issues
4. Check test output for specific assertion failures

---

## Performance Checklist

After implementation, verify:

- [ ] Modal opens in <500ms (measured from click to visible)
- [ ] No console errors or warnings
- [ ] No unnecessary re-renders (use React DevTools Profiler)
- [ ] Bundle size hasn't increased significantly (`pnpm build` and check output)

---

## Code Review Checklist

Before marking as complete:

- [ ] All TypeScript types are explicit (no `any`)
- [ ] No modifications to `components/ui/dialog.tsx` (shadcn/ui component)
- [ ] Backward compatibility maintained for standalone `/login` page
- [ ] All tests passing (`pnpm test` and `pnpm test:e2e`)
- [ ] Test coverage meets 65% minimum
- [ ] No linter errors (`pnpm lint`)
- [ ] Code formatted (`pnpm format`)
- [ ] Accessibility verified (keyboard and screen reader)
- [ ] Manual testing checklist completed

---

## Next Steps

After completing this implementation:

1. **Request Code Review**: Create PR and request review from team
2. **QA Testing**: Share feature with QA for comprehensive testing
3. **Monitor Performance**: Check bundle size and runtime performance in staging
4. **Document**: Update any relevant user-facing docs if needed
5. **Deploy**: Merge to main after approval

---

## Additional Resources

- **Radix UI Dialog Documentation**: https://www.radix-ui.com/primitives/docs/components/dialog
- **shadcn/ui Dialog**: https://ui.shadcn.com/docs/components/dialog
- **Next.js App Router**: https://nextjs.org/docs/app
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro
- **Playwright**: https://playwright.dev/

---

## Estimated Timeline

| Step                             | Estimated Time |
| -------------------------------- | -------------- |
| Step 1: Modify LoginForm         | 15 minutes     |
| Step 2: Create LoginModal        | 30 minutes     |
| Step 3: Update LandingPageClient | 20 minutes     |
| Step 4: Write Unit Tests         | 45 minutes     |
| Step 5: Write E2E Tests          | 30 minutes     |
| Step 6: Manual Testing           | 15 minutes     |
| **Total**                        | **~2.5 hours** |

_Note: Actual time may vary based on familiarity with the codebase and testing frameworks._
