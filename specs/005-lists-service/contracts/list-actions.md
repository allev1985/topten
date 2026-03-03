# Contracts: List Server Actions

**Branch**: `005-lists-service` | **Date**: 2026-03-03  
**File**: `src/actions/list-actions.ts`

All actions follow the five-step Server Action contract from Constitution §VI:
`authenticate → validate → delegate → map errors → revalidate`.

---

## Shared Types

```typescript
// Re-exported from src/types/forms.ts — no change needed
type ActionState<T> = {
  data: T | null;
  error: string | null;          // top-level error message
  fieldErrors: Record<string, string[]>;  // per-field validation errors
  isSuccess: boolean;
};
```

---

## `createListAction`

**Purpose**: Create a new draft list for the authenticated user.

```typescript
export async function createListAction(
  _prevState: ActionState<CreateListSuccessData>,
  formData: FormData
): Promise<ActionState<CreateListSuccessData>>
```

| Step | Detail |
|------|--------|
| Auth | `getSession()` — return `error: "You must be logged in"` if unauthenticated |
| Validate | `createListSchema.safeParse({ title: formData.get('title') })` |
| Delegate | `createList({ userId, title })` from `src/lib/list/service.ts` |
| Map errors | `ListServiceError(SLUG_COLLISION)` → `error: 'Could not generate a unique list identifier. Please try again.'`; `ListServiceError(SERVICE_ERROR)` → `error: err.message` |
| Revalidate | `revalidatePath('/dashboard')` |

**Success data**:
```typescript
type CreateListSuccessData = {
  id: string;
  title: string;
  slug: string;
};
```

---

## `updateListAction`

**Purpose**: Update a list's title and/or description.

```typescript
export async function updateListAction(
  _prevState: ActionState<UpdateListSuccessData>,
  formData: FormData
): Promise<ActionState<UpdateListSuccessData>>
```

| Step | Detail |
|------|--------|
| Auth | `getSession()` |
| Validate | `updateListSchema.safeParse({ title, description })`; also read `listId` from `formData` (hidden field) — validate as non-empty string |
| Delegate | `updateList({ listId, userId, title?, description? })` |
| Map errors | `NOT_FOUND` → `error: 'List not found or you do not have permission to edit it.'`; `SERVICE_ERROR` → `error: err.message` |
| Revalidate | `revalidatePath('/dashboard')` |

**Success data**:
```typescript
type UpdateListSuccessData = {
  id: string;
  title: string;
  description: string | null;
};
```

---

## `deleteListAction`

**Purpose**: Soft-delete a list (set `deletedAt`).

```typescript
export async function deleteListAction(
  _prevState: ActionState<DeleteListSuccessData>,
  formData: FormData
): Promise<ActionState<DeleteListSuccessData>>
```

| Step | Detail |
|------|--------|
| Auth | `getSession()` |
| Validate | `listId` from `formData` — non-empty string check (no Zod schema needed) |
| Delegate | `deleteList({ listId, userId })` |
| Map errors | `NOT_FOUND` → `error: 'List not found.'`; `SERVICE_ERROR` → `error: err.message` |
| Revalidate | `revalidatePath('/dashboard')` |

**Success data**:
```typescript
type DeleteListSuccessData = { success: true };
```

---

## `publishListAction`

**Purpose**: Publish a draft list (set `isPublished = true`, `publishedAt = now()`).

```typescript
export async function publishListAction(
  _prevState: ActionState<PublishListSuccessData>,
  formData: FormData
): Promise<ActionState<PublishListSuccessData>>
```

| Step | Detail |
|------|--------|
| Auth | `getSession()` |
| Validate | `listId` from `formData` — non-empty string |
| Delegate | `publishList({ listId, userId })` |
| Map errors | `NOT_FOUND` → `error: 'List not found or already deleted.'`; `SERVICE_ERROR` → `error: err.message` |
| Revalidate | `revalidatePath('/dashboard')` |

**Success data**:
```typescript
type PublishListSuccessData = {
  id: string;
  isPublished: true;
  publishedAt: string; // ISO timestamp
};
```

---

## `unpublishListAction`

**Purpose**: Unpublish a list (set `isPublished = false`, `publishedAt = null`).

```typescript
export async function unpublishListAction(
  _prevState: ActionState<UnpublishListSuccessData>,
  formData: FormData
): Promise<ActionState<UnpublishListSuccessData>>
```

| Step | Detail |
|------|--------|
| Auth | `getSession()` |
| Validate | `listId` from `formData` — non-empty string |
| Delegate | `unpublishList({ listId, userId })` |
| Map errors | `NOT_FOUND` → `error: 'List not found or already deleted.'`; `SERVICE_ERROR` → `error: err.message` |
| Revalidate | `revalidatePath('/dashboard')` |

**Success data**:
```typescript
type UnpublishListSuccessData = {
  id: string;
  isPublished: false;
  publishedAt: null;
};
```

---

## `getListsByUserAction` — NOT an action

`getListsByUser` is a **service query called directly from the Server Component** (`DashboardServer.tsx`), not wrapped in a Server Action. Server Actions are for mutations only (Constitution §VI: no new API routes; reads are handled in Server Components).

```typescript
// In src/app/(dashboard)/dashboard/DashboardServer.tsx (Server Component):
import { getListsByUser } from '@/lib/list/service';

const lists = await getListsByUser(userId); // called directly, no action wrapper
```

---

## Error Mapping Reference

| `ListServiceError.code` | User-facing message |
|------------------------|---------------------|
| `NOT_FOUND` | "List not found or you do not have permission to perform this action." |
| `SLUG_COLLISION` | "Could not generate a unique list identifier. Please try again." |
| `SERVICE_ERROR` | `err.message` (already user-safe; set by service factory) |
