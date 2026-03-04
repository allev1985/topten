# Contracts: Place Server Actions

**Branch**: `006-places-service` | **Date**: 2026-03-04  
**File**: `src/actions/place-actions.ts`

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

## `createPlaceAction`

**Purpose**: Create a new place and attach it to a specific list.

```typescript
export async function createPlaceAction(
  _prevState: ActionState<CreatePlaceSuccessData>,
  formData: FormData
): Promise<ActionState<CreatePlaceSuccessData>>
```

| Step | Detail |
|------|--------|
| Auth | `getSession()` — return `error: "You must be logged in"` if unauthenticated |
| Validate | `createPlaceSchema.safeParse({ name: formData.get('name'), address: formData.get('address') })`; also read `listId` from `formData` (hidden field) — validate as non-empty string |
| Delegate | `createPlace({ listId, userId, name, address })` from `src/lib/place/service.ts` |
| Map errors | `PlaceServiceError(NOT_FOUND)` → `error: 'List not found or you do not have permission to add places to it.'`; `PlaceServiceError(ALREADY_IN_LIST)` → `error: 'This place is already in the list.'`; `PlaceServiceError(SERVICE_ERROR)` → `error: err.message` |
| Revalidate | `revalidatePath('/dashboard/lists/[listId]', 'page')` |

**Success data**:
```typescript
type CreatePlaceSuccessData = {
  placeId: string;
  listPlaceId: string;
  name: string;
};
```

**Zod schema** (`src/schemas/place.ts`):
```typescript
export const createPlaceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  address: z.string().trim().min(1, 'Address is required').max(500),
});
```

---

## `addExistingPlaceToListAction`

**Purpose**: Attach an existing place (from another list) to the current list.

```typescript
export async function addExistingPlaceToListAction(
  _prevState: ActionState<AddExistingPlaceSuccessData>,
  formData: FormData
): Promise<ActionState<AddExistingPlaceSuccessData>>
```

| Step | Detail |
|------|--------|
| Auth | `getSession()` |
| Validate | Read `listId` and `placeId` from `formData` — validate both as non-empty UUID strings (no Zod schema needed; simple `uuid4` regex or non-empty check) |
| Delegate | `addExistingPlaceToList({ listId, placeId, userId })` from `src/lib/place/service.ts` |
| Map errors | `PlaceServiceError(NOT_FOUND)` → `error: 'List or place not found.'`; `PlaceServiceError(ALREADY_IN_LIST)` → `error: 'This place is already in the list.'`; `PlaceServiceError(SERVICE_ERROR)` → `error: err.message` |
| Revalidate | `revalidatePath('/dashboard/lists/[listId]', 'page')` |

**Success data**:
```typescript
type AddExistingPlaceSuccessData = {
  listPlaceId: string;
};
```

---

## `updatePlaceAction`

**Purpose**: Update a place's name and/or address.

```typescript
export async function updatePlaceAction(
  _prevState: ActionState<UpdatePlaceSuccessData>,
  formData: FormData
): Promise<ActionState<UpdatePlaceSuccessData>>
```

| Step | Detail |
|------|--------|
| Auth | `getSession()` |
| Validate | `updatePlaceSchema.safeParse({ name, address })`; also read `placeId` and `listId` from `formData` (hidden fields) — validate as non-empty strings |
| Delegate | `updatePlace({ placeId, listId, userId, name?, address? })` |
| Map errors | `PlaceServiceError(NOT_FOUND)` → `error: 'Place not found or you do not have permission to edit it.'`; `PlaceServiceError(SERVICE_ERROR)` → `error: err.message` |
| Revalidate | `revalidatePath('/dashboard/lists/[listId]', 'page')` |

**Success data**:
```typescript
type UpdatePlaceSuccessData = {
  placeId: string;
  name: string;
  address: string;
};
```

**Zod schema** (`src/schemas/place.ts`):
```typescript
export const updatePlaceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255).optional(),
  address: z.string().trim().min(1, 'Address is required').max(500).optional(),
}).refine(
  (data) => data.name !== undefined || data.address !== undefined,
  { message: 'At least one field must be provided for update.' }
);
```

---

## `deletePlaceAction`

**Purpose**: Soft-delete a place (set `deletedAt`).

```typescript
export async function deletePlaceAction(
  _prevState: ActionState<DeletePlaceSuccessData>,
  formData: FormData
): Promise<ActionState<DeletePlaceSuccessData>>
```

| Step | Detail |
|------|--------|
| Auth | `getSession()` |
| Validate | Read `placeId` and `listId` from `formData` — non-empty string check |
| Delegate | `deletePlace({ placeId, listId, userId })` |
| Map errors | `PlaceServiceError(NOT_FOUND)` → `error: 'Place not found or you do not have permission to delete it.'`; `PlaceServiceError(SERVICE_ERROR)` → `error: err.message` |
| Revalidate | `revalidatePath('/dashboard/lists/[listId]', 'page')` |

**Success data**:
```typescript
type DeletePlaceSuccessData = {
  placeId: string;
};
```

---

## Error Code → User Message Mapping (summary)

| `PlaceServiceErrorCode` | User-facing message |
|-------------------------|---------------------|
| `NOT_FOUND` | "Place not found or you do not have permission." *(action-specific variant shown above)* |
| `ALREADY_IN_LIST` | "This place is already in the list." |
| `VALIDATION_ERROR` | Field-level errors via `fieldErrors` map |
| `SERVICE_ERROR` | `err.message` (generic fallback) |
