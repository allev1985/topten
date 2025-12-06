# Data Model: Authentication Pages

**Feature**: 001-auth-pages  
**Date**: 2025-11-29  
**Status**: Complete

This document defines the TypeScript interfaces, component props, and state shapes for the Authentication Pages feature.

---

## 1. Form State Types

### FormState Interface

Core state interface used by `useFormState` hook and server actions.

```typescript
// src/types/forms.ts

/**
 * Generic form state for server action responses
 * @template T - Type of successful response data
 */
export interface FormState<T = unknown> {
  /** Successful response data */
  data: T | null;
  /** Form-level error message */
  error: string | null;
  /** Field-level validation errors */
  fieldErrors: Record<string, string[]>;
  /** Whether form submission is in progress */
  isPending: boolean;
  /** Whether last submission was successful */
  isSuccess: boolean;
}

/**
 * Initial form state factory
 */
export function initialFormState<T = unknown>(): FormState<T> {
  return {
    data: null,
    error: null,
    fieldErrors: {},
    isPending: false,
    isSuccess: false,
  };
}

/**
 * Action state for server actions (excludes isPending which comes from useActionState)
 */
export type ActionState<T = unknown> = Omit<FormState<T>, "isPending">;
```

---

## 2. Component Props Interfaces

### FormInput Props

```typescript
// src/components/auth/form-input.tsx

export interface FormInputProps {
  /** Unique identifier for input and label association */
  id: string;
  /** Form field name */
  name: string;
  /** Input type */
  type: "text" | "email";
  /** Label text */
  label: string;
  /** Whether field is required */
  required?: boolean;
  /** HTML autocomplete attribute */
  autoComplete?: string;
  /** Error message to display */
  error?: string;
  /** Default value for server-side rendering */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}
```

### PasswordInput Props

```typescript
// src/components/auth/password-input.tsx

export interface PasswordInputProps {
  /** Unique identifier for input and label association */
  id: string;
  /** Form field name */
  name: string;
  /** Label text */
  label: string;
  /** Whether field is required */
  required?: boolean;
  /** HTML autocomplete attribute */
  autoComplete?: "current-password" | "new-password";
  /** Error message to display */
  error?: string;
  /** Default value for server-side rendering */
  defaultValue?: string;
  /** Whether to show password strength indicator */
  showStrength?: boolean;
  /** Label for strength indicator (accessibility) */
  strengthLabel?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}
```

### FormButton Props

```typescript
// src/components/auth/form-button.tsx

export interface FormButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Whether form submission is pending */
  pending?: boolean;
  /** Button type */
  type?: "submit" | "button";
  /** Click handler (for non-submit buttons) */
  onClick?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}
```

### ErrorMessage Props

```typescript
// src/components/auth/error-message.tsx

export interface ErrorMessageProps {
  /** Error message to display */
  message?: string | null;
  /** Additional CSS classes */
  className?: string;
}
```

### AuthCard Props

```typescript
// src/components/auth/auth-card.tsx

export interface AuthCardProps {
  /** Card title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Card content (form) */
  children: React.ReactNode;
  /** Optional footer content (links, etc.) */
  footer?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}
```

### LoginForm Props

```typescript
// src/components/auth/login-form.tsx

export interface LoginFormProps {
  /** Redirect URL after successful login */
  redirectTo?: string;
  /** Initial email value (e.g., from URL params) */
  defaultEmail?: string;
}
```

### PasswordResetForm Props

```typescript
// src/components/auth/password-reset-form.tsx

export interface PasswordResetFormProps {
  /** Callback after successful password reset */
  onSuccess?: () => void;
  /** Whether this is for authenticated password change */
  requireCurrentPassword?: boolean;
}
```

---

## 3. Server Action Types

### Action Response Types

```typescript
// src/actions/auth-actions.ts

/** Signup action success data */
export interface SignupSuccessData {
  message: string;
  redirectTo: string;
}

/** Login action success data */
export interface LoginSuccessData {
  redirectTo: string;
}

/** Password reset request success data */
export interface PasswordResetRequestSuccessData {
  message: string;
}

/** Password update success data */
export interface PasswordUpdateSuccessData {
  message: string;
}
```

### Server Action Signatures

```typescript
// Server action function signatures

/** Signup form submission */
export async function signupAction(
  prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>>;

/** Login form submission */
export async function loginAction(
  prevState: ActionState<LoginSuccessData>,
  formData: FormData
): Promise<ActionState<LoginSuccessData>>;

/** Password reset request submission */
export async function passwordResetRequestAction(
  prevState: ActionState<PasswordResetRequestSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordResetRequestSuccessData>>;

/** Password update submission (reset flow) */
export async function passwordUpdateAction(
  prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>>;

/** Password change submission (authenticated user) */
export async function passwordChangeAction(
  prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>>;
```

---

## 4. Hook Interfaces

### useFormState Hook

```typescript
// src/hooks/use-form-state.ts

/**
 * Hook for managing form state with server actions
 * Wraps React 19's useActionState with consistent interface
 */
export function useFormState<T>(
  action: (
    prevState: ActionState<T>,
    formData: FormData
  ) => Promise<ActionState<T>>,
  initialState?: Partial<ActionState<T>>
): {
  /** Current form state */
  state: FormState<T>;
  /** Form action to bind to form element */
  formAction: (formData: FormData) => void;
  /** Reset form state to initial */
  reset: () => void;
};
```

---

## 5. Password Validation Types (Existing)

```typescript
// src/lib/utils/validation/password.ts (existing - referenced for completeness)

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
  checks: {
    minLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasDigit: boolean;
    hasSymbol: boolean;
  };
}
```

---

## 6. Auth Schema Types (Existing)

```typescript
// src/schemas/auth.ts (existing - referenced for completeness)

export type SignupInput = {
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
  redirectTo?: string;
};

export type PasswordResetInput = {
  email: string;
};

export type PasswordUpdateInput = {
  password: string;
};
```

---

## 7. Page Component Interfaces

### Page Props (Next.js App Router)

```typescript
// Standard Next.js page props

interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Signup page - no special props
// src/app/(auth)/signup/page.tsx

// Login page - reads redirectTo from searchParams
// src/app/(auth)/login/page.tsx
interface LoginPageSearchParams {
  redirectTo?: string;
  email?: string;
}

// Verify email page - no special props
// src/app/(auth)/verify-email/page.tsx

// Auth verify handler - reads token params
// src/app/(auth)/auth/verify/page.tsx
interface AuthVerifySearchParams {
  token_hash?: string;
  type?: string;
  code?: string;
  error?: string;
  error_description?: string;
}

// Forgot password page - no special props
// src/app/(auth)/forgot-password/page.tsx

// Reset password page - reads code from URL
// src/app/(auth)/reset-password/page.tsx
interface ResetPasswordSearchParams {
  code?: string;
}

// Password settings page - protected, no special props
// src/app/(dashboard)/settings/password/page.tsx
```

---

## 8. Error Types (Extended)

```typescript
// src/types/forms.ts

/**
 * Field error detail from API validation
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Map API error details to field errors record
 */
export function mapFieldErrors(
  details: FieldError[]
): Record<string, string[]> {
  return details.reduce(
    (acc, { field, message }) => {
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push(message);
      return acc;
    },
    {} as Record<string, string[]>
  );
}
```

---

## 9. State Diagrams

### Form State Transitions

```
INITIAL
  ├─ [user submits] → PENDING
  │
PENDING
  ├─ [success] → SUCCESS
  ├─ [validation error] → ERROR (with fieldErrors)
  └─ [server error] → ERROR (with error message)
  │
SUCCESS
  ├─ [redirect] → (navigate away)
  └─ [show message] → (display success)
  │
ERROR
  └─ [user submits again] → PENDING
```

### Password Strength States

```
EMPTY → (no input)
  │
  ├─ [< 3 checks pass] → WEAK
  ├─ [3-4 checks pass] → MEDIUM
  └─ [5 checks pass] → STRONG
```

---

## 10. Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page Components                          │
│  (signup, login, forgot-password, reset-password, verify-email) │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Form Components                           │
│  (AuthCard, LoginForm, PasswordResetForm)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Atomic Components                          │
│  (FormInput, PasswordInput, FormButton, ErrorMessage)           │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          useFormState                            │
│  (wraps useActionState, manages FormState)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Server Actions                            │
│  (signupAction, loginAction, passwordResetRequestAction, etc.)  │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Existing Infrastructure                      │
│  (Zod schemas, Supabase client, validatePassword, config)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notes

1. All component props use optional properties where sensible to minimize required configuration
2. Error messages are always string | null | undefined for consistency
3. Form state is designed to be serializable for server actions
4. Password strength updates are client-side only (real-time feedback requirement)
5. Server actions return ActionState (without isPending) as pending state comes from useActionState
