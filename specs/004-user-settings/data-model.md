# Data Model: User Settings Page

**Feature**: `004-user-settings`  
**Date**: 2026-03-03

---

## No Schema Changes Required

All data for this feature lives in the **existing** `public.users` table. No migrations are needed.

---

## Relevant Entities

### `users` (existing table — `src/db/schema/user.ts`)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, FK → `auth.users.id` (RESTRICT on delete) | Set by Supabase Auth on first sign-in |
| `name` | `varchar(255)` | NOT NULL | Display name — updated by `updateNameAction` |
| `vanity_slug` | `varchar(50)` | NOT NULL, UNIQUE (`users_vanity_slug_idx`) | User's unique public URL segment — updated by `updateSlugAction` |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Set to `new Date()` on every write |
| `deleted_at` | `timestamptz` | nullable | Soft-delete timestamp — all queries must include `deleted_at IS NULL` |

> **Auth-owned fields** (`email`, `password`, `email_confirmed_at`, `last_sign_in_at`) live in `auth.users` and are NOT read or written by this feature directly. Password change goes through Supabase Auth via the existing `passwordChangeAction`.

---

## Validation Rules

### Name (`users.name`)

| Rule | Detail |
|------|--------|
| Required | Must not be empty |
| Max length | ≤ 255 characters (enforced by DB column) |
| Client validation | Zod `z.string().min(1, "Name is required").max(255)` |
| Error message (empty) | `"Name is required"` |

### Vanity Slug (`users.vanity_slug`)

| Rule | Detail |
|------|--------|
| Required | Must not be empty |
| Length | 2–50 characters |
| Format | Lowercase alphanumeric and hyphens only; must start and end with alphanumeric |
| Regex | `^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$` |
| Unique | Globally unique across all non-deleted users; current user's own slug is NOT a conflict |
| Max length | ≤ 50 characters (enforced by DB column) |
| Error messages | See table below |

| Scenario | Human-friendly message |
|----------|----------------------|
| Empty | `"Profile URL is required"` |
| Too short (< 2 chars) | `"URL must be at least 2 characters"` |
| Invalid characters | `"URL can only contain lowercase letters, numbers, and hyphens"` |
| Starts/ends with hyphen | `"URL must start and end with a letter or number"` |
| Already taken (server) | `"This URL is already taken. Please choose a different one."` |

---

## Zod Schemas (new — `src/schemas/profile.ts`)

```typescript
// updateNameSchema
z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long").trim(),
})

// updateSlugSchema
z.object({
  vanitySlug: z
    .string()
    .min(1, "Profile URL is required")
    .min(2, "URL must be at least 2 characters")
    .max(50, "URL must be 50 characters or fewer")
    .regex(
      /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/,
      "URL can only contain lowercase letters, numbers, and hyphens, and must start and end with a letter or number"
    ),
})
```

---

## Read Query (Settings Page Load)

```typescript
// In settings/page.tsx (server component)
const profile = await db
  .select({ name: users.name, vanitySlug: users.vanitySlug })
  .from(users)
  .where(and(eq(users.id, currentUserId), isNull(users.deletedAt)))
  .limit(1)
  .then((rows) => rows[0] ?? null);
```

---

## Write Queries

### Helpers (`src/actions/profile-actions.ts`)

```typescript
/** Detects a Postgres unique-constraint violation from the postgres.js driver */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}

/** Returns the canonical human-friendly slug-taken ActionState */
function slugTakenError(): ActionState<UpdateSlugSuccessData> {
  return {
    data: null,
    error: null,
    fieldErrors: { vanitySlug: ["This URL is already taken. Please choose a different one."] },
    isSuccess: false,
  };
}
```

### Update Name

```typescript
await db
  .update(users)
  .set({ name: validatedName, updatedAt: new Date() })
  .where(and(eq(users.id, currentUserId), isNull(users.deletedAt)));
```

### Update Slug (two-layer uniqueness defence)

```typescript
// Layer 1 — application pre-check (handles common case cleanly)
const existing = await db
  .select({ id: users.id })
  .from(users)
  .where(
    and(
      eq(users.vanitySlug, validatedSlug),
      ne(users.id, currentUserId),
      isNull(users.deletedAt)
    )
  )
  .limit(1);

if (existing.length > 0) {
  return slugTakenError(); // human-friendly field error
}

// Layer 2 — write with race-condition catch
// If another user claims the slug between Layer 1 and this write,
// the DB unique index fires a 23505 error — caught and mapped to the
// same human-friendly field error (never surfaces raw to the client).
try {
  await db
    .update(users)
    .set({ vanitySlug: validatedSlug, updatedAt: new Date() })
    .where(and(eq(users.id, currentUserId), isNull(users.deletedAt)));
} catch (err) {
  if (isUniqueViolation(err)) return slugTakenError();
  throw err; // re-throw other DB errors for outer catch to handle as generic error
}
```
