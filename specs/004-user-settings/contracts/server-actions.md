# Server Actions Contract: User Settings

**Feature**: `004-user-settings`  
**Date**: 2026-03-03

---

## Overview

Two new server actions are introduced in `src/actions/profile-actions.ts`.  
The existing `passwordChangeAction` in `src/actions/auth-actions.ts` is **reused unchanged**.

All actions follow the established `ActionState<T>` contract from `src/types/forms.ts`.

---

## 1. `updateNameAction`

Updates the authenticated user's display name.

**File**: `src/actions/profile-actions.ts`

**Signature**:
```typescript
export async function updateNameAction(
  prevState: ActionState<UpdateNameSuccessData>,
  formData: FormData
): Promise<ActionState<UpdateNameSuccessData>>;
```

**FormData Fields**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | Non-empty, max 255 chars |

**Success Response**:
```typescript
interface UpdateNameSuccessData {
  name: string; // the saved name value
}
// isSuccess: true, error: null, fieldErrors: {}
```

**Error Responses**:

| Scenario | `error` | `fieldErrors` |
|----------|---------|---------------|
| Not authenticated | `"You must be logged in to update your profile"` | `{}` |
| Empty name | `null` | `{ name: ["Name is required"] }` |
| Name too long | `null` | `{ name: ["Name is too long"] }` |
| DB write failure | `"Failed to update name. Please try again."` | `{}` |

---

## 2. `updateSlugAction`

Updates the authenticated user's vanity slug (profile URL). Performs a uniqueness check before writing.

**File**: `src/actions/profile-actions.ts`

**Signature**:
```typescript
export async function updateSlugAction(
  prevState: ActionState<UpdateSlugSuccessData>,
  formData: FormData
): Promise<ActionState<UpdateSlugSuccessData>>;
```

**FormData Fields**:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `vanitySlug` | string | Yes | 2–50 chars, `^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$` |

**Success Response**:
```typescript
interface UpdateSlugSuccessData {
  vanitySlug: string; // the saved slug value
}
// isSuccess: true, error: null, fieldErrors: {}
```

**Error Responses**:

| Scenario | `error` | `fieldErrors` |
|----------|---------|---------------|
| Not authenticated | `"You must be logged in to update your profile"` | `{}` |
| Validation failure (format/length) | `null` | `{ vanitySlug: ["<human-friendly message>"] }` |
| Slug taken — application pre-check | `null` | `{ vanitySlug: ["This URL is already taken. Please choose a different one."] }` |
| Slug taken — race-condition DB `23505` | `null` | `{ vanitySlug: ["This URL is already taken. Please choose a different one."] }` |
| DB write failure (other) | `"Failed to update profile URL. Please try again."` | `{}` |

**Uniqueness check behaviour**:
- **Layer 1**: Queries `users` WHERE `vanity_slug = :slug AND id != :currentUserId AND deleted_at IS NULL` — if any row found, returns the field error immediately (no write attempted).
- **Layer 2**: The `db.update()` is wrapped in `try/catch`; if the `postgres` driver throws `code === "23505"` (race-condition unique violation), the action catches it and returns the **same** field error as Layer 1. No raw DB error is ever surfaced to the client.
- Own unchanged slug → not a conflict (excluded by `id != currentUserId`).

---

## 3. `passwordChangeAction` (existing — reused)

No changes. See `src/actions/auth-actions.ts` and the existing contract in `specs/001-auth-pages/contracts/server-actions.md`.

**FormData Fields**: `currentPassword`, `password`, `confirmPassword`  
**Success**: `{ message: "Password updated successfully" }`  
**Key errors**: incorrect current password → `"Current password is incorrect"`, mismatch → field error on `confirmPassword`

---

## Shared Types

```typescript
// src/types/forms.ts (existing — unchanged)
export type ActionState<T = unknown> = {
  data: T | null;
  error: string | null;
  fieldErrors: Record<string, string[]>;
  isSuccess: boolean;
};
```
