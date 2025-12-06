# Research: Authentication Pages

**Feature**: 001-auth-pages  
**Date**: 2025-11-29  
**Status**: Complete

## Research Tasks

This document resolves all "NEEDS CLARIFICATION" items from the Technical Context and documents key design decisions for the Authentication Pages feature.

---

## 1. Form State Management Hook

### Decision
Create a custom `useFormState` hook that wraps React's `useActionState` (React 19+) to provide consistent form state management across all authentication forms.

### Rationale
- **React 19 native**: `useActionState` is the recommended approach for handling server action state in React 19
- **Progressive enhancement**: Works with `<form action={...}>` for no-JS fallback
- **Consistent API**: Single hook provides loading, error, and success states
- **Type-safe**: Full TypeScript support with generics for form data types

### Alternatives Considered
1. **React Hook Form**: Rejected - adds dependency, overkill for simple forms, doesn't integrate well with server actions
2. **Formik**: Rejected - adds dependency, not designed for server actions
3. **Plain useState**: Rejected - would require duplicating state management logic across components
4. **useFormStatus from react-dom**: Considered but `useActionState` provides more control over the full state lifecycle

### Implementation Notes
```typescript
interface FormState<T> {
  data: T | null;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  isPending: boolean;
  isSuccess: boolean;
}
```

---

## 2. Server Actions vs API Routes

### Decision
Use Next.js server actions as the primary form submission handler, with server actions internally calling existing API route logic (not the HTTP endpoints).

### Rationale
- **Code reuse**: Existing API route validation and error handling already implemented
- **Progressive enhancement**: Server actions work without JavaScript enabled
- **Type safety**: End-to-end TypeScript types from form to response
- **Performance**: No HTTP round-trip overhead; direct function calls
- **Security**: CSRF protection built into server actions

### Alternatives Considered
1. **Direct API route calls from client**: Rejected - requires JavaScript, loses progressive enhancement
2. **Duplicate logic in server actions**: Rejected - violates DRY, divergent maintenance
3. **Shared service layer**: Considered but adds complexity; existing API route handlers are already well-structured

### Implementation Approach
```typescript
// src/actions/auth-actions.ts
'use server'

import { signupSchema } from '@/schemas/auth';
import { createClient } from '@/lib/supabase/server';
// Reuse existing validation and response patterns

export async function signupAction(prevState: FormState, formData: FormData): Promise<FormState> {
  // 1. Parse and validate with existing schema
  // 2. Call Supabase auth directly (same as API route)
  // 3. Return FormState for useActionState consumption
}
```

---

## 3. Component Architecture

### Decision
Create a small set of atomic, reusable components with minimal props interfaces, composed into page-specific forms.

### Rationale
- **Simplicity**: Barebone HTML requirement means minimal component complexity
- **Reusability**: Same input, button, error components across all auth forms
- **Accessibility**: ARIA attributes centralized in base components
- **Testing**: Atomic components are easier to unit test

### Component Hierarchy
```
AuthCard (layout wrapper)
├── FormInput (text/email input with label and error)
├── PasswordInput (FormInput + strength indicator)
├── FormButton (submit button with loading state)
└── ErrorMessage (general error display)

Composed Forms:
├── LoginForm (email + password + remember me + submit)
└── PasswordResetForm (password + confirm + strength + submit)
```

### Props Interfaces (Detailed)

```typescript
// FormInput - Base text/email input
interface FormInputProps {
  id: string;
  name: string;
  type: 'text' | 'email';
  label: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  defaultValue?: string;
}

// PasswordInput - Password with strength indicator
interface PasswordInputProps extends Omit<FormInputProps, 'type'> {
  showStrength?: boolean;
  strengthLabel?: string;
}

// FormButton - Submit button with loading state
interface FormButtonProps {
  children: React.ReactNode;
  pending?: boolean;
  type?: 'submit' | 'button';
}

// ErrorMessage - Error display component
interface ErrorMessageProps {
  message?: string | null;
}

// AuthCard - Page wrapper
interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

### Alternatives Considered
1. **Single monolithic form component per page**: Rejected - violates DRY, harder to test
2. **Headless UI library**: Rejected - adds dependency, unnecessary for barebone HTML
3. **Form component library (Radix, etc.)**: Rejected - barebone HTML requirement

---

## 4. Accessibility Implementation

### Decision
Implement WCAG 2.1 AA compliance through semantic HTML, proper ARIA attributes, and keyboard navigation support.

### Required Accessibility Features

| Feature | Implementation |
|---------|---------------|
| **Form Labels** | `<label htmlFor={id}>` associated with each input |
| **Error Announcements** | `aria-describedby` linking inputs to error messages |
| **Live Regions** | `aria-live="polite"` for dynamic error updates |
| **Invalid State** | `aria-invalid="true"` when field has error |
| **Loading State** | `aria-busy="true"` on form during submission |
| **Focus Management** | Auto-focus first error field on validation failure |
| **Keyboard Navigation** | Standard tab order, Enter to submit |
| **Screen Reader** | Descriptive button text, form landmark |

### Implementation Examples

```tsx
// FormInput with accessibility
<div>
  <label htmlFor={id}>{label}</label>
  <input
    id={id}
    name={name}
    type={type}
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : undefined}
    required={required}
  />
  {error && (
    <span id={`${id}-error`} role="alert">
      {error}
    </span>
  )}
</div>

// Form with loading state
<form action={action} aria-busy={isPending}>
  {/* fields */}
  <button type="submit" disabled={isPending}>
    {isPending ? 'Submitting...' : 'Submit'}
  </button>
</form>
```

### Rationale
- **Legal compliance**: WCAG 2.1 AA is industry standard for web accessibility
- **User experience**: Accessible forms benefit all users (keyboard users, screen readers, cognitive disabilities)
- **SEO**: Semantic HTML improves search engine understanding

### Testing Strategy
- Automated: axe-core via @axe-core/playwright or jest-axe
- Manual: Screen reader testing (VoiceOver, NVDA)
- Keyboard-only navigation testing

---

## 5. Password Strength Display

### Decision
Reuse existing `validatePassword()` utility from `/src/lib/utils/validation/password.ts` for real-time strength feedback.

### Rationale
- **DRY**: Utility already exists and is tested
- **Consistency**: Same validation rules as schema
- **Performance**: Existing implementation is optimized

### Implementation
```tsx
// PasswordInput component
const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const result = validatePassword(e.target.value);
  setStrength(result.strength);
};

// Display as text (barebone HTML)
<span aria-live="polite">
  Strength: {strength}
</span>
```

---

## 6. Route Group Structure

### Decision
Use Next.js App Router route groups: `(auth)` for public auth pages, `(dashboard)` for protected pages.

### Rationale
- **Layout isolation**: Auth pages can have different layout than dashboard
- **Middleware targeting**: Easy to apply auth middleware to route groups
- **URL structure**: Route groups don't affect URL paths

### Route Mapping
| Route | File Path | Route Group | Protection |
|-------|-----------|-------------|------------|
| /signup | `src/app/(auth)/signup/page.tsx` | (auth) | Public |
| /verify-email | `src/app/(auth)/verify-email/page.tsx` | (auth) | Public |
| /auth/verify | `src/app/(auth)/auth/verify/page.tsx` | (auth) | Public |
| /login | `src/app/(auth)/login/page.tsx` | (auth) | Public |
| /forgot-password | `src/app/(auth)/forgot-password/page.tsx` | (auth) | Public |
| /reset-password | `src/app/(auth)/reset-password/page.tsx` | (auth) | Public |
| /dashboard/settings/password | `src/app/(dashboard)/settings/password/page.tsx` | (dashboard) | Protected |

---

## 7. Error Handling Strategy

### Decision
Unified error handling through `FormState` with field-level and form-level errors.

### Error Types
1. **Field Validation Errors**: From Zod schema validation, displayed next to fields
2. **Form-Level Errors**: API errors, network errors, displayed at form top
3. **Success Messages**: Post-action feedback

### Error Response Mapping
```typescript
// Map API error response to FormState
function mapApiErrorToFormState(error: AuthErrorResponse): FormState {
  if (error.error.code === 'VALIDATION_ERROR' && error.error.details) {
    return {
      fieldErrors: error.error.details.reduce((acc, detail) => {
        acc[detail.field] = [detail.message];
        return acc;
      }, {} as Record<string, string[]>),
      error: null,
      // ...
    };
  }
  return {
    error: error.error.message,
    fieldErrors: {},
    // ...
  };
}
```

---

## 8. Progressive Enhancement Strategy

### Decision
Forms must work with JavaScript disabled using native HTML form submission.

### Implementation
1. **Form action**: Use server action bound to form
2. **Validation**: Server-side validation always runs; client-side is enhancement
3. **Redirects**: Server action handles redirects via `redirect()` from next/navigation
4. **Errors**: Server-rendered error messages on page reload

### Testing
- Test all flows with JavaScript disabled in browser
- Verify forms submit and redirect correctly
- Verify errors display on page reload

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Form State | Custom `useFormState` with `useActionState` | React 19 native, type-safe |
| Form Submission | Server actions calling existing API logic | Progressive enhancement, DRY |
| Components | Atomic reusable components | Testability, simplicity |
| Accessibility | WCAG 2.1 AA via semantic HTML + ARIA | Compliance, UX |
| Password Strength | Reuse `validatePassword()` | DRY, consistency |
| Routes | Route groups `(auth)` and `(dashboard)` | Layout isolation |
| Errors | Unified `FormState` with field/form errors | Consistent UX |
| Progressive Enhancement | Native form submission fallback | Accessibility, resilience |

---

## Open Questions (Resolved)

1. ~~How to handle "Remember me" session duration?~~ → Supabase Auth handles via session config
2. ~~Social auth button styling?~~ → Barebone HTML, disabled placeholder buttons
3. ~~Dashboard layout existence?~~ → Will be created as part of route group structure
