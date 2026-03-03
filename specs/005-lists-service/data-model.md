# Data Model: Lists Service

**Branch**: `005-lists-service` | **Date**: 2026-03-03

---

## Entities

### List (existing table `lists`)

No schema migration required. The `lists` table already exists with all required columns.

| Column | Type | Nullable | Constraints | Notes |
|--------|------|----------|-------------|-------|
| `id` | `uuid` | NO | PK, default `gen_random_uuid()` | — |
| `user_id` | `uuid` | NO | FK → `users.id` | Ownership |
| `title` | `varchar(255)` | NO | — | Required, non-whitespace |
| `slug` | `varchar(255)` | NO | UNIQUE per user (via `lists_user_slug_idx`) | 4-char hex, system-assigned, immutable |
| `description` | `text` | YES | — | Optional, user-editable |
| `is_published` | `boolean` | NO | default `false` | `true` = visible at public URL |
| `published_at` | `timestamptz` | YES | — | Set on publish, cleared on unpublish |
| `created_at` | `timestamptz` | NO | default `now()` | — |
| `updated_at` | `timestamptz` | NO | default `now()` | Refreshed on every mutation |
| `deleted_at` | `timestamptz` | YES | — | Soft delete; `null` = active |

**Existing indexes**:
- `lists_user_slug_idx` — `UNIQUE (user_id, slug)` — slug uniqueness is per-user, not global
- `lists_user_deleted_at_idx` — `(user_id, deleted_at)` — optimises dashboard query

---

## Validation Rules

### `createList` input

| Field | Rule |
|-------|------|
| `userId` | Required, valid UUID (provided by session — not from user input) |
| `title` | Required; `.trim()` must produce a non-empty string; max 255 chars |

### `updateList` input

| Field | Rule |
|-------|------|
| `listId` | Required, valid UUID |
| `userId` | Required, valid UUID (from session) |
| `title` | Optional; if provided, `.trim()` must produce non-empty string; max 255 chars |
| `description` | Optional; if provided, max 2000 chars (reasonable cap; not in schema but validated at service) |

> `slug` is **never** an accepted parameter for `updateList`. Any caller passing it receives a TypeScript compile error.

### Slug generation

```
slug = crypto.randomUUID().replace(/-/g, '').slice(0, 4)
// e.g. "a3f2", "00bc", "ff01"
// Pattern: ^[0-9a-f]{4}$
```

On collision (vanishingly rare — 65,536 values per user), retry once with a fresh UUID before throwing `ListServiceError(SLUG_COLLISION)`.

---

## State Transitions

```
                  createList
                     │
                     ▼
               ┌──────────┐
               │  DRAFT   │◄─── unpublishList
               │ (active) │
               └──────────┘
                     │
               publishList
                     │
                     ▼
             ┌─────────────┐
             │  PUBLISHED  │
             │  (active)   │
             └─────────────┘
                     │
         ┌───────────┴───────────┐
    deleteList               deleteList
         │                       │
         ▼                       ▼
   ┌──────────┐           ┌──────────┐
   │  DRAFT   │           │PUBLISHED │
   │ (deleted)│           │ (deleted)│
   └──────────┘           └──────────┘
```

- `deleteList` (soft delete) is valid from any active state.
- `publishList` / `unpublishList` are rejected when `deletedAt IS NOT NULL`.
- No state supports un-deletion (out of scope for MVP).

---

## TypeScript Types (new)

### `src/lib/list/service/types.ts`

```typescript
/** Minimal list data needed for the dashboard grid */
export interface ListSummary {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: Date;
}

/** Full list data returned after a mutation */
export interface ListRecord {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateListResult { list: ListRecord }
export interface UpdateListResult { list: Pick<ListRecord, 'id' | 'title' | 'description' | 'updatedAt'> }
export interface DeleteListResult { success: true }
export interface PublishListResult { list: Pick<ListRecord, 'id' | 'isPublished' | 'publishedAt'> }
export interface UnpublishListResult { list: Pick<ListRecord, 'id' | 'isPublished' | 'publishedAt'> }
```

### `src/lib/list/service/errors.ts`

```typescript
export type ListServiceErrorCode =
  | 'NOT_FOUND'          // list does not exist or belongs to another user
  | 'SLUG_COLLISION'     // extremely rare: UUID retry exhausted
  | 'SERVICE_ERROR';     // unexpected DB / runtime error

export class ListServiceError extends Error { ... }
```

### `src/types/list.ts` (updated)

The existing `List` interface will be extended to include `slug` and `description` for completeness; `placeCount` remains as-is for backward compatibility with the existing `ListCard` component (defaults to `0` until a future feature adds the join).

---

## Zod Schemas — `src/schemas/list.ts`

```typescript
export const createListSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
});

export const updateListSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255).optional(),
  description: z.string().max(2000).optional(),
}).refine(
  (data) => data.title !== undefined || data.description !== undefined,
  { message: 'At least one field must be provided' }
);
```
