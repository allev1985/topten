# Component API Contract: LoginModal

**Component**: `LoginModal`  
**Location**: `src/components/shared/LoginModal.tsx`  
**Type**: Client Component ("use client")  
**Version**: 1.0.0

---

## Purpose

A modal dialog wrapper component that presents the login form in an overlay, enabling authentication without navigating away from the current page.

---

## TypeScript Interface

```typescript
interface LoginModalProps {
  /**
   * Controls the visibility of the modal dialog
   * When true, modal is displayed; when false, modal is hidden
   */
  isOpen: boolean;

  /**
   * Callback invoked when the modal should close
   * Triggered by:
   * - User pressing Escape key
   * - User clicking outside modal
   * - User clicking close button (X)
   * - Successful authentication completion
   */
  onClose: () => void;

  /**
   * Optional URL to redirect to after successful authentication
   * If not provided, defaults to application's default post-login route
   * @default undefined
   */
  redirectTo?: string;
}
```

---

## Props

### `isOpen` (required)

- **Type**: `boolean`
- **Description**: Controls modal visibility state
- **Behavior**:
  - `true`: Modal is rendered and visible
  - `false`: Modal is hidden (may be unmounted depending on Dialog implementation)
- **Validation**: TypeScript enforces boolean type
- **Examples**:
  ```typescript
  <LoginModal isOpen={true} onClose={handleClose} />  // Visible
  <LoginModal isOpen={false} onClose={handleClose} /> // Hidden
  ```

### `onClose` (required)

- **Type**: `() => void`
- **Description**: Callback function invoked when modal should close
- **Trigger Events**:
  - User presses Escape key
  - User clicks overlay (outside modal content)
  - User clicks close button (X in top-right)
  - Successful authentication completes
- **Expected Behavior**: Should update parent component state to set `isOpen` to `false`
- **Examples**:
  ```typescript
  const [isOpen, setIsOpen] = useState(false);
  <LoginModal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
  />
  ```

### `redirectTo` (optional)

- **Type**: `string | undefined`
- **Description**: Target URL for navigation after successful login
- **Default**: `undefined` (uses LoginForm's default redirect behavior)
- **Validation**: URL validation performed by LoginForm component
- **Examples**:
  ```typescript
  <LoginModal
    isOpen={true}
    onClose={handleClose}
    redirectTo="/dashboard"
  />
  ```

---

## Component Behavior

### Rendering

```typescript
// When isOpen is false
<LoginModal isOpen={false} onClose={handleClose} />
// Result: Nothing rendered (or hidden via CSS)

// When isOpen is true
<LoginModal isOpen={true} onClose={handleClose} />
// Result: Modal overlay + dialog + login form rendered
```

### Component Structure

```typescript
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sign In</DialogTitle>
      <DialogDescription>
        Enter your credentials to access your account
      </DialogDescription>
    </DialogHeader>
    <LoginForm
      redirectTo={redirectTo}
      onSuccess={handleSuccess}
    />
  </DialogContent>
</Dialog>
```

### Internal Event Handlers

#### `handleSuccess`

```typescript
const handleSuccess = (data: { redirectTo: string }) => {
  onClose(); // Close modal first
  router.push(data.redirectTo); // Then navigate
};
```

**Behavior**:

1. Modal closes immediately on successful authentication
2. Navigation occurs after modal close for smooth transition
3. LoginForm's authentication logic remains unchanged

---

## Usage Examples

### Basic Usage

```typescript
"use client";

import { useState } from "react";
import LoginModal from "@/components/shared/LoginModal";
import { Button } from "@/components/ui/button";

export default function MyPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        Log In
      </Button>

      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

### With Custom Redirect

```typescript
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import LoginModal from "@/components/shared/LoginModal";

export default function ProtectedPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  return (
    <LoginModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      redirectTo={pathname}  // Return to current page after login
    />
  );
}
```

### Integration with LandingPageClient

```typescript
"use client";

import { useState } from "react";
import Header from "@/components/shared/Header";
import LoginModal from "@/components/shared/LoginModal";

export default function LandingPageClient() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogin = () => setIsLoginModalOpen(true);
  const handleSignup = () => {
    // TODO: Open signup modal (future feature)
  };

  return (
    <div>
      <Header onLogin={handleLogin} onSignup={handleSignup} />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectTo="/dashboard"
      />

      {/* Other landing page content */}
    </div>
  );
}
```

---

## Accessibility

### ARIA Attributes (Inherited from Dialog)

| Attribute          | Value             | Source                      |
| ------------------ | ----------------- | --------------------------- |
| `role`             | `"dialog"`        | Radix Dialog                |
| `aria-modal`       | `"true"`          | Radix Dialog                |
| `aria-labelledby`  | `{titleId}`       | DialogTitle component       |
| `aria-describedby` | `{descriptionId}` | DialogDescription component |

### Keyboard Navigation

| Key         | Action                                              |
| ----------- | --------------------------------------------------- |
| `Escape`    | Closes modal (triggers `onClose`)                   |
| `Tab`       | Cycles focus through modal elements (focus trapped) |
| `Shift+Tab` | Reverse tab order (focus trapped)                   |
| `Enter`     | Submits form (when focused on submit button)        |

### Focus Management

1. **On Open**: Focus automatically moves to first input (email field)
2. **While Open**: Focus is trapped within modal (cannot Tab outside)
3. **On Close**: Focus returns to element that triggered modal (e.g., "Log In" button)

**Managed By**: Radix UI Dialog primitive (automatic)

---

## Error Handling

### Component-Level Errors

| Error Scenario           | Handling                 | User Experience         |
| ------------------------ | ------------------------ | ----------------------- |
| Invalid `onClose` prop   | TypeScript compile error | Development-time catch  |
| Missing `isOpen` prop    | TypeScript compile error | Development-time catch  |
| Invalid `redirectTo` URL | Handled by LoginForm     | Error displayed in form |

### Authentication Errors

**Delegated to LoginForm** - All auth errors display within the modal:

- Invalid credentials → Error message in form
- Network errors → Error message in form
- Validation errors → Field-level error messages

**Modal stays open** during error states to allow user to correct and retry.

---

## Performance

### Bundle Size

- **LoginModal**: ~1-2 KB (wrapper component only)
- **Dependencies**: Dialog components already in bundle
- **Total Impact**: Minimal (no new heavy dependencies)

### Runtime Performance

| Metric              | Target | Actual (Expected)       |
| ------------------- | ------ | ----------------------- |
| Modal open time     | <500ms | ~50ms                   |
| Time to interactive | <100ms | ~30ms                   |
| Animation duration  | N/A    | ~200ms (Dialog default) |

### Optimizations

- **No dynamic imports needed**: Component is lightweight
- **No memoization needed**: Simple props, minimal re-renders
- **Leverages React 19**: Automatic batching, concurrent features

---

## Testing Contract

### Unit Test Requirements

```typescript
describe("LoginModal", () => {
  it("renders when isOpen is true");
  it("does not render when isOpen is false");
  it("renders LoginForm inside Dialog");
  it("passes redirectTo prop to LoginForm");
  it("calls onClose when Dialog triggers onOpenChange with false");
  it("calls onClose on successful authentication");
  it("includes proper accessibility attributes");
});
```

### Integration Test Requirements

```typescript
describe("LoginModal Integration", () => {
  it("opens when Header Log In button is clicked");
  it("closes when Escape key is pressed");
  it("closes when clicking outside modal");
  it("closes on successful login and redirects");
  it("remains open on authentication errors");
  it("returns focus to trigger button on close");
});
```

### E2E Test Requirements

```typescript
test("Login Modal Flow", async ({ page }) => {
  // Navigate to landing page
  // Click "Log In" button
  // Verify modal opens
  // Enter credentials
  // Submit form
  // Verify redirect to dashboard
  // Verify modal is closed
});
```

---

## Dependencies

### Internal Dependencies

```typescript
import { useRouter } from "next/navigation"; // Next.js router for redirect
import { LoginForm } from "@/app/(auth)/login/login-form"; // Form component
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"; // shadcn/ui Dialog (DO NOT MODIFY)
```

### External Dependencies

- `@radix-ui/react-dialog`: ^1.1.15 (via shadcn/ui)
- `next`: 16.0.5
- `react`: 19.2.0

---

## Constraints

### Do's ✅

- ✅ Pass `isOpen` as controlled prop
- ✅ Always provide `onClose` callback
- ✅ Use `redirectTo` for custom post-login navigation
- ✅ Rely on Dialog's built-in accessibility features
- ✅ Test with keyboard and screen readers

### Don'ts ❌

- ❌ Modify `components/ui/dialog.tsx` (shadcn/ui component)
- ❌ Manage modal state inside LoginModal (must be controlled)
- ❌ Duplicate LoginForm logic inside LoginModal
- ❌ Implement custom focus management (use Dialog's)
- ❌ Add unrelated features (keep focused on login only)

---

## Versioning

- **1.0.0**: Initial implementation (current)
- Future versions may add:
  - Sign-up modal support
  - Social login in modal
  - Password reset modal

---

## Related Components

- **LoginForm**: `src/app/(auth)/login/login-form.tsx` (renders inside modal)
- **Header**: `src/components/shared/Header.tsx` (triggers modal open)
- **LandingPageClient**: `src/components/shared/LandingPageClient.tsx` (manages modal state)
- **Dialog**: `src/components/ui/dialog.tsx` (base modal primitive - DO NOT MODIFY)

---

## Implementation Checklist

- [ ] Create `LoginModal.tsx` in `src/components/shared/`
- [ ] Add `onSuccess` prop to `LoginForm`
- [ ] Update `LandingPageClient` to manage modal state
- [ ] Update `Header` to trigger modal (already has `onLogin` callback)
- [ ] Write unit tests for `LoginModal`
- [ ] Write integration tests for modal state flow
- [ ] Write E2E tests for complete login journey
- [ ] Verify accessibility with keyboard and screen reader
- [ ] Test on various viewport sizes (mobile, tablet, desktop)
- [ ] Verify no regressions to standalone `/login` page
