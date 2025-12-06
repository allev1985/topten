# Data Model: Fix Duplicate Headers in Auth Modals

**Date**: 2025-12-06  
**Feature**: 003-fix-modal-headers  
**Status**: Complete

## Overview

This document defines the component interfaces and type contracts for the authentication form components with variant support.

## Component Entities

### LoginForm

**Purpose**: Renders login form with configurable presentation wrapper.

**Type Definition**:
```typescript
export interface LoginFormProps {
  /**
   * Controls the presentation wrapper.
   * - "card": Renders form wrapped in Card with header (standalone page usage)
   * - "inline": Renders form content only without Card wrapper (modal usage)
   * @default "card"
   */
  variant?: "card" | "inline";
  
  /**
   * Redirect URL after successful login
   */
  redirectTo?: string;
  
  /**
   * Initial email value (e.g., from URL params)
   */
  defaultEmail?: string;
  
  /**
   * Callback invoked on successful authentication (before redirect).
   * When provided: callback is invoked instead of redirecting
   * When omitted: redirects to redirectTo URL
   */
  onSuccess?: (data: { redirectTo: string }) => void;
}
```

**Component Structure**:
```
LoginForm
├── variant="card" (default)
│   └── Card
│       ├── CardHeader (Title: "Sign In", Description: "Enter your credentials...")
│       ├── CardContent
│       │   └── <form>
│       │       ├── Error Alert (if present)
│       │       ├── Email Input (with Label, validation)
│       │       ├── Password Input (with Label, validation)
│       │       ├── Remember Me Checkbox
│       │       └── Submit Button
│       └── CardFooter
│           ├── Signup Link
│           ├── Forgot Password Link
│           └── Google Sign-in (disabled)
│
└── variant="inline"
    └── <div className="space-y-4">
        ├── <form> (same as above)
        └── Footer Content (same as CardFooter)
```

**State Management**:
- Form state managed by `useFormState` hook
- Validation state (fieldErrors)
- Submission state (isPending)
- Success state (isSuccess, data)

**Validation Rules**:
- Email: Required, valid email format
- Password: Required
- All rules enforced server-side via loginAction

**Behavior**:
- On success with `onSuccess` callback: invokes callback (modal context)
- On success without `onSuccess`: redirects to redirectTo URL (standalone context)

---

### SignupForm

**Purpose**: Renders signup form with configurable presentation wrapper.

**Type Definition**:
```typescript
export interface SignupFormProps {
  /**
   * Controls the presentation wrapper.
   * - "card": Renders form wrapped in Card with header (standalone page usage)
   * - "inline": Renders form content only without Card wrapper (modal usage)
   * @default "card"
   */
  variant?: "card" | "inline";
  
  /**
   * Callback invoked on successful signup (prevents default redirect).
   * When provided (modal context): Callback is invoked instead of redirecting
   * When omitted (standalone page): Redirects to /verify-email after signup
   */
  onSuccess?: () => void;
}
```

**Component Structure**:
```
SignupForm
├── variant="card" (default)
│   └── Card
│       ├── CardHeader (Title: "Create Account", Description: "Enter your email...")
│       ├── CardContent
│       │   └── <form>
│       │       ├── Error Alert (if present)
│       │       ├── Email Input (with Label, validation)
│       │       ├── Password Input (with Label, validation, strength indicator)
│       │       └── Submit Button
│       └── CardFooter
│           └── Login Link
│
└── variant="inline"
    └── <div className="space-y-4">
        ├── <form> (same as above)
        └── Footer Content (same as CardFooter)
```

**State Management**:
- Form state managed by `useFormState` hook
- Validation state (fieldErrors)
- Submission state (isPending)
- Success state (isSuccess, data)
- Password strength state (weak/medium/strong)
- Password input tracking (hasInput)

**Validation Rules**:
- Email: Required, valid email format
- Password: Required, minimum strength validation
- All rules enforced server-side via signupAction
- Client-side password strength indicator (non-blocking)

**Behavior**:
- Password strength updates on input change
- On success with `onSuccess` callback: invokes callback (modal context)
- On success without `onSuccess`: redirects to /verify-email (standalone context)

---

### LoginModal

**Purpose**: Displays LoginForm in modal dialog context.

**Type Definition**:
```typescript
export interface LoginModalProps {
  /**
   * Controls modal visibility
   */
  isOpen: boolean;
  
  /**
   * Callback invoked when modal should close
   */
  onClose: () => void;
  
  /**
   * Redirect URL after successful login
   */
  redirectTo?: string;
}
```

**Component Structure**:
```
LoginModal
└── Dialog (open={isOpen}, onOpenChange={onClose})
    └── DialogContent
        ├── DialogHeader
        │   ├── DialogTitle: "Sign In"
        │   └── DialogDescription: "Enter your credentials to access your account"
        └── LoginForm (variant="inline", redirectTo={redirectTo}, onSuccess={handleSuccess})
```

**Behavior**:
- `handleSuccess`: Closes modal, then navigates to redirectTo URL
- DialogHeader provides modal context and accessibility

**Changes Required**:
- Add `variant="inline"` prop to LoginForm

---

### SignupModal

**Purpose**: Displays SignupForm in modal dialog context with success message.

**Type Definition**:
```typescript
export interface SignupModalProps {
  /**
   * Controls modal visibility
   */
  isOpen: boolean;
  
  /**
   * Callback invoked when modal should close
   */
  onClose: () => void;
}
```

**Component Structure**:
```
SignupModal
└── Dialog (open={isOpen}, onOpenChange={handleOpenChange})
    └── DialogContent
        ├── DialogHeader
        │   ├── DialogTitle: "Create your account"
        │   └── DialogDescription: "Start curating your favorite places"
        └── [Conditional]
            ├── Success Alert (if showSuccess)
            └── SignupForm (variant="inline", onSuccess={handleSuccess})
```

**State Management**:
- `showSuccess`: boolean state for success message display

**Behavior**:
- `handleSuccess`: Sets showSuccess to true
- `handleOpenChange`: Resets showSuccess when modal closes
- Success alert replaces form after successful signup

**Changes Required**:
- Add `variant="inline"` prop to SignupForm

---

## Type Exports

All prop interfaces should be exported from their respective component files for reusability:

```typescript
// From src/app/(auth)/login/login-form.tsx
export interface LoginFormProps { ... }

// From src/components/auth/signup-form.tsx
export interface SignupFormProps { ... }

// Already exported from src/types/components.ts
export interface LoginModalProps { ... }
export interface SignupModalProps { ... }
```

## Validation Summary

### LoginForm Validation
| Field | Rule | Error Message |
|-------|------|---------------|
| email | Required | "Email is required" |
| email | Valid format | "Invalid email format" |
| password | Required | "Password is required" |

### SignupForm Validation
| Field | Rule | Error Message |
|-------|------|---------------|
| email | Required | "Email is required" |
| email | Valid format | "Invalid email format" |
| password | Required | "Password is required" |
| password | Minimum strength | "Password is too weak" |

Note: Exact error messages are defined in server actions (auth-actions.ts).

## Accessibility Attributes

### LoginForm
- Form inputs have associated labels via `htmlFor`
- Email input:
  - `aria-invalid`: Set when fieldError exists
  - `aria-describedby`: References error message ID
- Password input:
  - `aria-invalid`: Set when fieldError exists
  - `aria-describedby`: References error message ID
- Submit button:
  - `aria-busy`: Set when form is submitting
- Error messages:
  - `role="alert"`: Announced to screen readers
  - Unique `id`: Referenced by aria-describedby

### SignupForm
- All LoginForm attributes plus:
- Password strength indicator:
  - `aria-live="polite"`: Announces changes to screen readers
  - Non-blocking feedback (doesn't prevent submission)

### Modals
- Dialog component provides:
  - `aria-labelledby`: References DialogTitle
  - `aria-describedby`: References DialogDescription
  - Focus trap when open
  - Escape key to close

## State Transitions

### LoginForm State Diagram
```
Initial
  ├─> Submitting (isPending=true)
  │     ├─> Success (isSuccess=true) -> [onSuccess callback OR redirect]
  │     └─> Error (error set) -> Display error, return to Initial
  └─> Initial (ready for input)
```

### SignupForm State Diagram
```
Initial
  ├─> Typing Password -> Update strength indicator
  └─> Submitting (isPending=true)
        ├─> Success (isSuccess=true) -> [onSuccess callback OR redirect]
        └─> Error (error set) -> Display error, return to Initial
```

### SignupModal State Diagram
```
Closed (isOpen=false)
  └─> Open (isOpen=true)
        ├─> Form Displayed (showSuccess=false)
        │     └─> Success -> showSuccess=true
        │           └─> Success Message Displayed
        │                 └─> Close -> Reset showSuccess -> Closed
        └─> Close -> Reset showSuccess -> Closed
```

## Backward Compatibility

### Breaking Changes
**None.** All changes are additive.

### Default Behavior
- `variant` prop defaults to `"card"` in both forms
- Existing usage without variant prop continues to work identically
- No changes to props API for modals (only internal implementation)

### Migration Path
Not required - changes are backward compatible.

## Testing Considerations

### Unit Test Coverage Required
1. **LoginForm**:
   - Renders with variant="card" (default)
   - Renders with variant="inline"
   - Validation errors display correctly in both variants
   - onSuccess callback invoked in both variants
   - Redirect behavior works in both variants

2. **SignupForm**:
   - Renders with variant="card" (default)
   - Renders with variant="inline"
   - Password strength indicator works in both variants
   - Validation errors display correctly in both variants
   - onSuccess callback invoked in both variants

3. **LoginModal**:
   - Passes variant="inline" to LoginForm
   - No duplicate headers visible
   - Success flow closes modal and redirects

4. **SignupModal**:
   - Passes variant="inline" to SignupForm
   - No duplicate headers visible
   - Success flow displays success message

### E2E Test Scenarios
1. Login via modal - verify single header
2. Signup via modal - verify single header
3. Login via /login page - verify card styling preserved
4. Signup via /signup page - verify card styling preserved
5. Keyboard navigation works in both contexts
6. Screen reader announces form correctly in both contexts

## Summary

This data model defines the component interfaces required to eliminate duplicate headers in authentication modals while maintaining full backward compatibility with standalone pages. The variant prop pattern is well-established in React and provides a type-safe, extensible solution.

**Key Changes**:
- LoginFormProps: Add `variant?: "card" | "inline"`
- SignupFormProps: Add `variant?: "card" | "inline"`
- LoginModal: Pass `variant="inline"` to LoginForm
- SignupModal: Pass `variant="inline"` to SignupForm

**Impact**: Zero breaking changes, improved UX in modal contexts.
