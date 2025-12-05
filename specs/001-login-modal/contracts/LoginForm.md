# Component API Contract: LoginForm (Modified)

**Component**: `LoginForm`  
**Location**: `src/app/(auth)/login/login-form.tsx`  
**Type**: Client Component ("use client")  
**Version**: 1.1.0 (Modified for modal support)  
**Previous Version**: 1.0.0 (Standalone page only)

---

## Purpose

A reusable login form component that handles email/password authentication. Now supports both standalone page and modal contexts through optional callback props.

---

## TypeScript Interface

```typescript
interface LoginFormProps {
  /**
   * Optional URL to redirect to after successful authentication
   * If not provided, defaults to application's default post-login route
   * @default undefined
   */
  redirectTo?: string;

  /**
   * Initial email value (e.g., from URL params or pre-filled form)
   * @default undefined
   */
  defaultEmail?: string;

  /**
   * NEW (v1.1.0): Optional callback invoked on successful authentication
   * When provided, this is called INSTEAD of automatic redirect
   * Enables parent component (e.g., modal) to handle post-auth behavior
   *
   * @param data - Authentication result containing redirectTo URL
   * @default undefined
   * @since 1.1.0
   */
  onSuccess?: (data: { redirectTo: string }) => void;
}
```

---

## Props

### `redirectTo` (optional) - UNCHANGED

- **Type**: `string | undefined`
- **Description**: Target URL for navigation after successful login
- **Default**: `undefined` (uses default route from auth system)
- **Behavior**: Passed to `loginAction` as hidden form field
- **Validation**: URL validation in server action
- **Examples**:
  ```typescript
  <LoginForm redirectTo="/dashboard" />
  <LoginForm redirectTo="/profile" />
  ```

### `defaultEmail` (optional) - UNCHANGED

- **Type**: `string | undefined`
- **Description**: Pre-populated email value
- **Default**: `undefined`
- **Use Cases**: Email verification flows, "remember email" feature
- **Examples**:
  ```typescript
  <LoginForm defaultEmail="user@example.com" />
  ```

### `onSuccess` (optional) - NEW in v1.1.0

- **Type**: `((data: { redirectTo: string }) => void) | undefined`
- **Description**: Callback for successful authentication
- **Default**: `undefined`
- **Behavior**:
  - **When provided**: Called instead of automatic redirect; parent controls navigation
  - **When undefined**: Form automatically redirects (original behavior)
- **Use Case**: Modal contexts where parent needs to close modal before redirect
- **Examples**:

  ```typescript
  // Modal context
  <LoginForm
    onSuccess={(data) => {
      closeModal();
      router.push(data.redirectTo);
    }}
  />

  // Standalone page (no callback = auto-redirect)
  <LoginForm />
  ```

---

## Behavior Changes (v1.0.0 → v1.1.0)

### Original Behavior (v1.0.0)

```typescript
// In LoginForm
useEffect(() => {
  if (state.isSuccess && state.data?.redirectTo) {
    router.push(state.data.redirectTo); // Always redirects
  }
}, [state.isSuccess, state.data, router]);
```

### New Behavior (v1.1.0)

```typescript
// In LoginForm
useEffect(() => {
  if (state.isSuccess && state.data?.redirectTo) {
    if (onSuccess) {
      onSuccess(state.data); // Parent handles redirect
    } else {
      router.push(state.data.redirectTo); // Auto-redirect (backward compatible)
    }
  }
}, [state.isSuccess, state.data, router, onSuccess]);
```

**Backward Compatibility**: ✅ MAINTAINED

- Existing usage without `onSuccess` prop continues to work identically
- Standalone `/login` page requires zero changes

---

## Usage Examples

### Standalone Page (Original Usage - No Changes)

```typescript
// src/app/(auth)/login/page.tsx
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <LoginForm />  {/* Auto-redirects on success */}
    </div>
  );
}
```

### Modal Context (New Usage)

```typescript
// src/components/shared/LoginModal.tsx
"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export default function LoginModal({ isOpen, onClose, redirectTo }: LoginModalProps) {
  const router = useRouter();

  const handleSuccess = (data: { redirectTo: string }) => {
    onClose();  // Close modal first
    router.push(data.redirectTo);  // Then redirect
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <LoginForm
          redirectTo={redirectTo}
          onSuccess={handleSuccess}  // Custom post-auth behavior
        />
      </DialogContent>
    </Dialog>
  );
}
```

### Pre-filled Email

```typescript
<LoginForm defaultEmail="user@example.com" />
```

### Custom Redirect

```typescript
<LoginForm redirectTo="/custom-dashboard" />
```

---

## Component Structure (Unchanged)

```typescript
<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Sign In</CardTitle>
    <CardDescription>
      Enter your credentials to access your account
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form action={formAction} className="space-y-4">
      {/* Error display */}
      {state.error && <Alert variant="destructive">...</Alert>}

      {/* Hidden redirect field */}
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" ... />
        {/* Field errors */}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" ... />
        {/* Field errors */}
      </div>

      {/* Remember me */}
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="rememberMe" name="rememberMe" />
        <Label htmlFor="rememberMe">Remember me</Label>
      </div>

      {/* Submit button */}
      <Button type="submit" disabled={state.isPending}>
        {state.isPending ? "Submitting..." : "Sign In"}
      </Button>
    </form>
  </CardContent>
  <CardFooter className="flex-col items-start gap-2">
    <p>Don't have an account? <a href="/signup">Sign up</a></p>
    <p><a href="/forgot-password">Forgot your password?</a></p>
    <hr className="w-full" />
    <p><button type="button" disabled>Sign in with Google (coming soon)</button></p>
  </CardFooter>
</Card>
```

---

## Form State Management (Unchanged)

### State Interface

```typescript
interface FormState<T> {
  isPending: boolean;
  isSuccess: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  data: T | null;
}
```

### State Flow

1. **Initial**: `{ isPending: false, isSuccess: false, error: null, ... }`
2. **Submitting**: `{ isPending: true, ... }`
3. **Success**: `{ isSuccess: true, data: { redirectTo: "..." }, ... }`
4. **Error**: `{ error: "Invalid credentials", ... }`
5. **Field Error**: `{ fieldErrors: { email: ["Invalid format"] }, ... }`

---

## Accessibility (Unchanged)

### ARIA Attributes

| Element        | Attribute          | Value                 | Purpose                           |
| -------------- | ------------------ | --------------------- | --------------------------------- |
| Email input    | `aria-invalid`     | `"true"` (if error)   | Indicates validation error        |
| Email input    | `aria-describedby` | `"email-error"`       | Links to error message            |
| Password input | `aria-invalid`     | `"true"` (if error)   | Indicates validation error        |
| Password input | `aria-describedby` | `"password-error"`    | Links to error message            |
| Submit button  | `aria-busy`        | `"true"` (if pending) | Indicates loading state           |
| Error message  | `role`             | `"alert"`             | Announces error to screen readers |

### Form Behavior

- Email and password inputs have `required` attribute
- Autocomplete attributes (`email`, `current-password`) for browser autofill
- Clear focus indicators on all inputs
- Error messages announced to screen readers via `role="alert"`

---

## Error Handling (Unchanged)

### Server-Side Errors

| Error Type    | Display Location     | Example                        |
| ------------- | -------------------- | ------------------------------ |
| General error | Alert at top of form | "Invalid email or password"    |
| Field error   | Below specific field | "Email must be a valid format" |

### Client-Side Validation

- HTML5 required fields (email, password)
- Email type validation (browser-level)
- Server-side validation takes precedence

---

## Testing Contract

### Unit Tests (Existing - May Need Updates)

```typescript
describe("LoginForm", () => {
  it("renders email and password inputs");
  it("renders submit button");
  it("displays general errors in alert");
  it("displays field errors below inputs");
  it("shows loading state while submitting");
  it("calls loginAction on form submit");

  // NEW TESTS for v1.1.0
  it("calls onSuccess callback on successful auth when provided");
  it("auto-redirects on successful auth when onSuccess not provided");
  it("does not redirect when onSuccess callback is provided");
});
```

### Integration Tests

```typescript
describe("LoginForm Authentication", () => {
  it("successfully authenticates with valid credentials");
  it("shows error with invalid credentials");
  it("handles network errors gracefully");
  it("validates email format");
  it("validates password requirements");
});
```

---

## Migration Guide (v1.0.0 → v1.1.0)

### For Existing Standalone Usage

**No changes required!** ✅

```typescript
// Before (v1.0.0)
<LoginForm redirectTo="/dashboard" />

// After (v1.1.0) - works identically
<LoginForm redirectTo="/dashboard" />
```

### For New Modal Usage

**Add `onSuccess` prop** when you need custom post-auth behavior:

```typescript
// New in v1.1.0
<LoginForm
  redirectTo={redirectTo}
  onSuccess={(data) => {
    // Custom logic here (e.g., close modal)
    closeModal();
    router.push(data.redirectTo);
  }}
/>
```

---

## Dependencies (Unchanged)

### Internal Dependencies

```typescript
import { useRouter } from "next/navigation";
import { useFormState } from "@/hooks/use-form-state";
import { loginAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
```

### External Dependencies

- `next`: 16.0.5
- `react`: 19.2.0

---

## Constraints

### Do's ✅

- ✅ Use `onSuccess` for modal contexts
- ✅ Omit `onSuccess` for standalone pages
- ✅ Pass `redirectTo` for custom post-login navigation
- ✅ Use `defaultEmail` for pre-filling email field
- ✅ Maintain all existing tests

### Don'ts ❌

- ❌ Modify Card wrapper structure (maintains visual consistency)
- ❌ Change authentication logic (handled by `loginAction`)
- ❌ Add unrelated form fields (keep focused on login)
- ❌ Break backward compatibility for standalone usage

---

## Performance (Unchanged)

- Lightweight component (~5-10KB including styles)
- No heavy computations
- Server action handles auth asynchronously
- Loading states prevent duplicate submissions

---

## Related Components

- **LoginModal**: `src/components/shared/LoginModal.tsx` (wraps LoginForm in modal)
- **loginAction**: `src/actions/auth-actions.ts` (server action for authentication)
- **use-form-state**: `src/hooks/use-form-state.ts` (form state management hook)

---

## Changelog

### v1.1.0 (2025-12-05)

- **Added**: `onSuccess` prop for custom post-authentication behavior
- **Changed**: Redirect logic now conditional on `onSuccess` presence
- **Maintained**: Full backward compatibility with v1.0.0

### v1.0.0 (Initial)

- Initial implementation with `redirectTo` and `defaultEmail` props
- Auto-redirect on successful authentication
