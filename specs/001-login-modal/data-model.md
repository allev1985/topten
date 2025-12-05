# Phase 1: Data Model

## Login Modal Panel Component

**Date**: 2025-12-05  
**Feature Branch**: `001-login-modal`

---

## Overview

This feature does not introduce new data entities or database schemas. It operates entirely in the presentation layer, managing ephemeral UI state (modal open/closed) and leveraging existing authentication data structures.

---

## State Entities

### 1. Modal State (Client-Side Ephemeral)

**Entity**: `LoginModalState`  
**Lifecycle**: Component mount/unmount (LandingPageClient component)  
**Persistence**: None (ephemeral React state)

| Field              | Type      | Description                        | Validation |
| ------------------ | --------- | ---------------------------------- | ---------- |
| `isLoginModalOpen` | `boolean` | Controls visibility of login modal | N/A        |

**State Transitions**:

```
[Closed] --[User clicks "Log In"]--> [Open]
[Open] --[User presses Escape]--> [Closed]
[Open] --[User clicks outside]--> [Closed]
[Open] --[User clicks close button]--> [Closed]
[Open] --[Successful authentication]--> [Closed] --> [Redirect]
```

**State Management**:

- Managed via React `useState` hook in `LandingPageClient`
- Passed to `LoginModal` as controlled prop
- Updated via callbacks from Header (`onLogin`) and LoginModal (`onClose`)

---

### 2. Authentication State (Existing)

**Entity**: `FormState<LoginResult>`  
**Location**: `@/hooks/use-form-state.ts` (existing)  
**Managed By**: `LoginForm` component

**No changes needed** - LoginForm already manages:

- Form submission state (isPending, isSuccess, error)
- Field validation errors
- Authentication result data

**Relationship to Modal**:

- LoginForm state is **independent** of modal state
- Modal observes auth success via `onSuccess` callback (new prop)
- Auth failure keeps modal open, displays errors inline

---

## Component Data Flow

### Props Interfaces

#### LoginModal (New Component)

```typescript
interface LoginModalProps {
  /** Controls modal visibility */
  isOpen: boolean;

  /** Callback when modal should close */
  onClose: () => void;

  /** Optional redirect URL after successful login */
  redirectTo?: string;
}
```

**Validation**:

- `isOpen`: boolean type enforced by TypeScript
- `onClose`: function type enforced by TypeScript
- `redirectTo`: URL validation handled by existing LoginForm logic

---

#### LoginForm (Modified - Backward Compatible)

```typescript
interface LoginFormProps {
  /** Redirect URL after successful login */
  redirectTo?: string;

  /** Initial email value (e.g., from URL params) */
  defaultEmail?: string;

  /** NEW: Callback invoked on successful authentication (before redirect) */
  onSuccess?: (data: { redirectTo: string }) => void;
}
```

**Changes**:

- **Added**: `onSuccess` prop (optional, backward compatible)
- **Existing props unchanged**: `redirectTo`, `defaultEmail` remain as-is

**Validation**:

- `onSuccess`: Optional callback; if provided, called before redirect
- All other validation remains unchanged from existing implementation

---

#### Header (Modified)

```typescript
interface HeaderProps {
  /** Callback when Log In button is clicked */
  onLogin: () => void;

  /** Callback when Start Curating button is clicked */
  onSignup: () => void;
}
```

**Changes**: None (interface already suitable)

---

#### LandingPageClient (Modified)

No formal props interface (root component), but internal state:

```typescript
// Internal state
const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

// Callbacks passed to children
const handleLogin = () => setIsLoginModalOpen(true);
const handleCloseModal = () => setIsLoginModalOpen(false);
```

---

## Data Validation Rules

### Modal State Validation

| Rule              | Description                                       | Enforcement                                          |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------- |
| **Single Modal**  | Only one modal can be open at a time              | Implicit (only one modal exists in current design)   |
| **Boolean State** | Modal state is strictly boolean                   | TypeScript type system                               |
| **Sync on Close** | Modal state resets to false on all close triggers | Controlled component pattern + Dialog's onOpenChange |

### Authentication Data (Existing)

**No changes** - All validation handled by existing:

- `loginAction` server action (email format, password requirements)
- Zod schemas in `@/schemas/auth.ts`
- `use-form-state` hook for field-level errors

---

## State Relationships

```
LandingPageClient (owns modal state)
    │
    ├─→ isLoginModalOpen: boolean
    │
    ├─→ Header (consumes)
    │     └─→ onLogin={() => setIsLoginModalOpen(true)}
    │
    └─→ LoginModal (consumes)
          ├─→ isOpen={isLoginModalOpen}
          ├─→ onClose={() => setIsLoginModalOpen(false)}
          │
          └─→ LoginForm (nested)
                ├─→ onSuccess={(data) => {
                │     setIsLoginModalOpen(false);
                │     router.push(data.redirectTo);
                │   }}
                │
                └─→ Manages own form state (existing)
                      ├─→ isPending
                      ├─→ error
                      ├─→ fieldErrors
                      └─→ isSuccess
```

---

## Error States

### Modal-Specific Errors

| Error Scenario       | State Impact             | User Feedback                                   | Recovery                          |
| -------------------- | ------------------------ | ----------------------------------------------- | --------------------------------- |
| Modal fails to open  | `isOpen` remains `false` | (No error - unlikely with simple boolean state) | Re-click "Log In" button          |
| Modal fails to close | `isOpen` remains `true`  | User can press Escape or click outside          | Multiple close triggers available |

### Authentication Errors (Handled by LoginForm)

**No changes** - Existing error handling:

- Invalid credentials → Error displayed in modal, modal stays open
- Network failure → Error displayed in modal, modal stays open
- Validation errors → Field-level errors shown, modal stays open
- Successful auth → Modal closes, redirect occurs

---

## Performance Considerations

### State Updates

| Operation                  | Performance Impact               | Optimization             |
| -------------------------- | -------------------------------- | ------------------------ |
| Toggle modal state         | Minimal (single boolean update)  | React re-render batching |
| Render LoginModal          | Minimal (lightweight components) | No optimization needed   |
| Unmount LoginForm on close | Minimal (no heavy cleanup)       | Natural React lifecycle  |

### Memory

- **Modal State**: 1 boolean in memory (~4 bytes)
- **Component Tree**: LoginModal + Dialog + LoginForm (~few KB when mounted)
- **Cleanup**: Automatic on unmount; no manual cleanup required

---

## Testing Data

### Test Fixtures

#### Mock Modal State

```typescript
const mockModalProps = {
  isOpen: true,
  onClose: vi.fn(),
  redirectTo: "/dashboard",
};
```

#### Mock Form State (Existing)

```typescript
const mockFormState = {
  isPending: false,
  isSuccess: false,
  error: null,
  fieldErrors: {},
  data: null,
};
```

### Test Scenarios

| Scenario           | Initial State                    | Expected Final State                         |
| ------------------ | -------------------------------- | -------------------------------------------- |
| Open modal         | `isOpen: false`                  | `isOpen: true`                               |
| Close via Escape   | `isOpen: true`                   | `isOpen: false`                              |
| Close via callback | `isOpen: true`                   | `isOpen: false`                              |
| Auth success       | `isOpen: true, isSuccess: false` | `isOpen: false, isSuccess: true, redirected` |
| Auth failure       | `isOpen: true, error: null`      | `isOpen: true, error: "..."`                 |

---

## No Database Impact

**This feature has ZERO database impact**:

- ✅ No new tables
- ✅ No schema changes
- ✅ No migrations required
- ✅ No data persistence
- ✅ No database queries (auth queries remain unchanged)

All state is ephemeral and lives in the React component tree.

---

## Accessibility State

### ARIA Attributes (Provided by Radix Dialog)

| Attribute          | Value             | Purpose                      |
| ------------------ | ----------------- | ---------------------------- |
| `role`             | `dialog`          | Identifies modal dialog      |
| `aria-modal`       | `true`            | Indicates modal behavior     |
| `aria-labelledby`  | `{dialogTitleId}` | Points to dialog title       |
| `aria-describedby` | `{dialogDescId}`  | Points to dialog description |

### Focus State

- **On Open**: Focus moves to first focusable element (email input)
- **While Open**: Focus trapped within modal
- **On Close**: Focus returns to "Log In" button (trigger element)

**Managed By**: Radix UI Dialog (no custom implementation needed)

---

## Summary

This feature operates entirely in the **presentation layer** with ephemeral UI state. There are:

- **No new data entities**
- **No database changes**
- **No data persistence**
- **Minimal state management** (single boolean in React state)

The data model is intentionally simple, relying on React's built-in state management and existing authentication data structures. This aligns with the constitution's simplicity and maintainability principles.
