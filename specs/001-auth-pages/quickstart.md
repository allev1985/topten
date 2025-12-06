# Quickstart: Authentication Pages

**Feature**: 001-auth-pages  
**Date**: 2025-11-29  
**Status**: Complete

This guide provides a quick reference for implementing authentication pages components.

---

## Prerequisites

Before starting implementation, ensure you have:

1. **Environment Setup**
   - Node.js 20+
   - pnpm 8+
   - Supabase CLI (for local development)

2. **Running Services**

   ```bash
   # Start Supabase locally
   pnpm supabase:start

   # Start Next.js dev server
   pnpm dev
   ```

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

---

## Implementation Order

Follow this order to minimize dependencies:

### Phase 1: Foundation

1. `src/types/forms.ts` - Form state types
2. `src/hooks/use-form-state.ts` - Form state hook
3. `src/actions/auth-actions.ts` - Server actions

### Phase 2: Atomic Components

4. `src/components/auth/form-input.tsx`
5. `src/components/auth/password-input.tsx`
6. `src/components/auth/form-button.tsx`
7. `src/components/auth/error-message.tsx`
8. `src/components/auth/auth-card.tsx`

### Phase 3: Composed Components

9. `src/components/auth/login-form.tsx`
10. `src/components/auth/password-reset-form.tsx`

### Phase 4: Pages

11. `src/app/(auth)/signup/page.tsx`
12. `src/app/(auth)/verify-email/page.tsx`
13. `src/app/(auth)/auth/verify/page.tsx`
14. `src/app/(auth)/login/page.tsx`
15. `src/app/(auth)/forgot-password/page.tsx`
16. `src/app/(auth)/reset-password/page.tsx`
17. `src/app/(dashboard)/settings/password/page.tsx`

---

## Quick Implementation Templates

### Form State Types

```typescript
// src/types/forms.ts
export interface FormState<T = unknown> {
  data: T | null;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  isPending: boolean;
  isSuccess: boolean;
}

export type ActionState<T = unknown> = Omit<FormState<T>, "isPending">;

export function initialFormState<T = unknown>(): FormState<T> {
  return {
    data: null,
    error: null,
    fieldErrors: {},
    isPending: false,
    isSuccess: false,
  };
}
```

### useFormState Hook

```typescript
// src/hooks/use-form-state.ts
"use client";

import { useActionState } from "react";
import type { ActionState, FormState } from "@/types/forms";

export function useFormState<T>(
  action: (
    prevState: ActionState<T>,
    formData: FormData
  ) => Promise<ActionState<T>>,
  initialState?: Partial<ActionState<T>>
) {
  const [state, formAction, isPending] = useActionState(action, {
    data: null,
    error: null,
    fieldErrors: {},
    isSuccess: false,
    ...initialState,
  });

  const formState: FormState<T> = {
    ...state,
    isPending,
  };

  return { state: formState, formAction };
}
```

### FormInput Component

```typescript
// src/components/auth/form-input.tsx
export interface FormInputProps {
  id: string;
  name: string;
  type: 'text' | 'email';
  label: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  defaultValue?: string;
}

export function FormInput({
  id, name, type, label, required, autoComplete, error, defaultValue
}: FormInputProps) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span id={`${id}-error`} role="alert">{error}</span>
      )}
    </div>
  );
}
```

### PasswordInput Component

```typescript
// src/components/auth/password-input.tsx
'use client';

import { useState } from 'react';
import { validatePassword } from '@/lib/utils/validation/password';

export interface PasswordInputProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  autoComplete?: 'current-password' | 'new-password';
  error?: string;
  showStrength?: boolean;
}

export function PasswordInput({
  id, name, label, required, autoComplete, error, showStrength
}: PasswordInputProps) {
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showStrength) {
      const result = validatePassword(e.target.value);
      setStrength(result.strength);
    }
  };

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type="password"
        required={required}
        autoComplete={autoComplete}
        onChange={handleChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {showStrength && (
        <span aria-live="polite">Strength: {strength}</span>
      )}
      {error && (
        <span id={`${id}-error`} role="alert">{error}</span>
      )}
    </div>
  );
}
```

### Server Action Example

```typescript
// src/actions/auth-actions.ts
"use server";

import { signupSchema } from "@/schemas/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/forms";

interface SignupSuccessData {
  message: string;
  redirectTo: string;
}

export async function signupAction(
  prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>> {
  const email = formData.get("email");
  const password = formData.get("password");

  const result = signupSchema.safeParse({ email, password });

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    });
    return { data: null, error: null, fieldErrors, isSuccess: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify`,
    },
  });

  if (error) {
    // Still return success for user enumeration protection
  }

  return {
    data: {
      message: "Please check your email to verify your account",
      redirectTo: "/verify-email",
    },
    error: null,
    fieldErrors: {},
    isSuccess: true,
  };
}
```

### Page Example

```typescript
// src/app/(auth)/signup/page.tsx
import { signupAction } from '@/actions/auth-actions';
import { AuthCard } from '@/components/auth/auth-card';
import { FormInput } from '@/components/auth/form-input';
import { PasswordInput } from '@/components/auth/password-input';
import { FormButton } from '@/components/auth/form-button';
import { ErrorMessage } from '@/components/auth/error-message';
import { SignupForm } from './signup-form'; // Client component

export default function SignupPage() {
  return (
    <AuthCard
      title="Create Account"
      description="Enter your email and password to sign up"
      footer={<a href="/login">Already have an account? Sign in</a>}
    >
      <SignupForm />
    </AuthCard>
  );
}

// Client component for form interactivity
// src/app/(auth)/signup/signup-form.tsx
'use client';

import { useFormState } from '@/hooks/use-form-state';
import { signupAction } from '@/actions/auth-actions';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export function SignupForm() {
  const { state, formAction } = useFormState(signupAction);

  useEffect(() => {
    if (state.isSuccess && state.data?.redirectTo) {
      redirect(state.data.redirectTo);
    }
  }, [state.isSuccess, state.data]);

  return (
    <form action={formAction}>
      <ErrorMessage message={state.error} />
      <FormInput
        id="email"
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        error={state.fieldErrors.email?.[0]}
      />
      <PasswordInput
        id="password"
        name="password"
        label="Password"
        required
        autoComplete="new-password"
        showStrength
        error={state.fieldErrors.password?.[0]}
      />
      <FormButton pending={state.isPending}>Sign Up</FormButton>
    </form>
  );
}
```

---

## Testing Quick Reference

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test tests/unit/hooks/use-form-state.test.ts

# Run in watch mode
pnpm test:watch
```

### Test File Locations

| Component         | Test Location                                       |
| ----------------- | --------------------------------------------------- |
| useFormState      | `tests/unit/hooks/use-form-state.test.ts`           |
| FormInput         | `tests/component/auth/form-input.test.tsx`          |
| PasswordInput     | `tests/component/auth/password-input.test.tsx`      |
| FormButton        | `tests/component/auth/form-button.test.tsx`         |
| ErrorMessage      | `tests/component/auth/error-message.test.tsx`       |
| AuthCard          | `tests/component/auth/auth-card.test.tsx`           |
| LoginForm         | `tests/component/auth/login-form.test.tsx`          |
| PasswordResetForm | `tests/component/auth/password-reset-form.test.tsx` |

### Test Example

```typescript
// tests/component/auth/form-input.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormInput } from '@/components/auth/form-input';

describe('FormInput', () => {
  it('renders label and input', () => {
    render(
      <FormInput id="email" name="email" type="email" label="Email" />
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <FormInput
        id="email"
        name="email"
        type="email"
        label="Email"
        error="Invalid email"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('sets aria-invalid when error exists', () => {
    render(
      <FormInput
        id="email"
        name="email"
        type="email"
        label="Email"
        error="Invalid email"
      />
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});
```

---

## Common Patterns

### Handling Redirects After Form Success

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function MyForm() {
  const router = useRouter();
  const { state, formAction } = useFormState(myAction);

  useEffect(() => {
    if (state.isSuccess && state.data?.redirectTo) {
      router.push(state.data.redirectTo);
    }
  }, [state.isSuccess, state.data, router]);

  return <form action={formAction}>...</form>;
}
```

### Preserving Form Values on Error

```typescript
// Pass initial values from searchParams or state
<FormInput
  id="email"
  name="email"
  type="email"
  label="Email"
  defaultValue={defaultEmail}
  error={state.fieldErrors.email?.[0]}
/>
```

### Conditional Password Strength Display

```typescript
<PasswordInput
  id="password"
  name="password"
  label="New Password"
  showStrength={true}  // Show for new password
/>

<PasswordInput
  id="currentPassword"
  name="currentPassword"
  label="Current Password"
  showStrength={false} // Don't show for current password
/>
```

---

## Troubleshooting

### Common Issues

1. **Form not submitting**: Ensure button has `type="submit"` and form has `action={formAction}`

2. **Redirect not working**: Check that `redirect()` is called inside `useEffect`, not directly in render

3. **Validation errors not showing**: Verify `fieldErrors` key matches input `name` attribute

4. **Password strength not updating**: Ensure `showStrength={true}` and `onChange` handler is connected

5. **Server action not found**: Ensure file has `'use server'` directive at top

### Debug Tips

```typescript
// Log form state for debugging
console.log("Form state:", state);

// Log form data in server action
export async function myAction(prevState, formData) {
  console.log("Received:", Object.fromEntries(formData));
  // ...
}
```

---

## Resources

- [spec.md](./spec.md) - Full feature specification
- [research.md](./research.md) - Design decisions and rationale
- [data-model.md](./data-model.md) - TypeScript interfaces
- [contracts/server-actions.md](./contracts/server-actions.md) - Server action contracts
- [React 19 useActionState](https://react.dev/reference/react/useActionState)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
