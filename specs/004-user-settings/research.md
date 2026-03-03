# Research: User Settings Page

**Feature**: `004-user-settings`  
**Date**: 2026-03-03

---

## 1. Slug Uniqueness Check Pattern

**Decision**: Two-layer defence — an explicit application-layer pre-check followed by a DB-level catch for the race window between the two. Both layers return the **same human-friendly field error** so the user never sees a raw DB error.

**Layer 1 — Application pre-check**: Query `public.users` with `and(eq(users.vanitySlug, slug), ne(users.id, currentUserId), isNull(users.deletedAt))` before writing. If any row is returned, return a field error immediately — do not attempt the update. This handles the common case.

**Layer 2 — Race-condition catch**: Wrap the `db.update()` call in a `try/catch`. If the `postgres` driver throws with `code === "23505"` (unique-constraint violation), catch it and return the identical field error as Layer 1. This ensures the rare race-condition path also surfaces a human-friendly message rather than an unhandled server error.

**Rationale**: The application check eliminates the vast majority of conflicts and keeps error messages clean. The `23505` catch is the safety net for the race window between the SELECT and the UPDATE. Both paths converge on the same `fieldErrors` shape so the client behaviour is identical regardless of which layer fires.

**Helper**:
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
```

**Implementation**:
```typescript
// Layer 1 — application pre-check
const existing = await db
  .select({ id: users.id })
  .from(users)
  .where(
    and(
      eq(users.vanitySlug, slug),
      ne(users.id, currentUserId),
      isNull(users.deletedAt)
    )
  )
  .limit(1);

if (existing.length > 0) {
  return slugTakenError();
}

// Layer 2 — DB write with race-condition catch
try {
  await db
    .update(users)
    .set({ vanitySlug: slug, updatedAt: new Date() })
    .where(and(eq(users.id, currentUserId), isNull(users.deletedAt)));
} catch (err) {
  if (isUniqueViolation(err)) {
    return slugTakenError();
  }
  console.error("[updateSlugAction] DB error:", err instanceof Error ? err.message : err);
  return { data: null, error: "Failed to update profile URL. Please try again.", fieldErrors: {}, isSuccess: false };
}
```

Where `slugTakenError()` is a small shared helper:
```typescript
function slugTakenError(): ActionState<UpdateSlugSuccessData> {
  return {
    data: null,
    error: null,
    fieldErrors: { vanitySlug: ["This URL is already taken. Please choose a different one."] },
    isSuccess: false,
  };
}
```

---

## 2. Server Action Pattern

**Decision**: Follow the identical `"use server"` + Zod `.safeParse()` + `ActionState<T>` + `mapZodErrors` pattern already established in `src/actions/auth-actions.ts`.

**Rationale**: The pattern is already DRY-extracted (`mapZodErrors` helper, `ActionState<T>` type, `useFormState` hook). Reusing it keeps all mutations consistent, enables the same client-side `useFormState` hook, and means no new abstractions are needed.

**Key steps in every action**:
1. Resolve session via `getSession()` from `src/lib/auth/service.ts` — return `{ error: "Unauthorised" }` if no session.
2. Validate input with Zod schema via `.safeParse()`.
3. Perform DB read/write via `db` client from `src/db/index.ts`.
4. Return `ActionState<T>` shape.

---

## 3. Password Change — Reuse Strategy

**Decision**: Import and render `<PasswordChangeForm />` from `src/app/(dashboard)/settings/password/password-change-form.tsx` directly inside the unified settings page. Do not copy or re-implement the component.

**Rationale**: The component is already complete, tested, and wired to `passwordChangeAction`. The DRY principle (Constitution §I) prohibits duplication.

**Impact on routing**: `/dashboard/settings/password` remains accessible as a standalone page (no breaking change). The unified page at `/dashboard/settings` simply embeds the same form component in a new section.

---

## 4. Name Update — DB Write

**Decision**: Direct Drizzle `db.update()` on the `users` table, scoped to `id = currentUserId AND deleted_at IS NULL`. Always set `updatedAt: new Date()`.

**Rationale**: Single-field update with no side effects. No service layer indirection is warranted; auth-service wrapping is reserved for auth operations (Constitution §VI).

**Implementation**:
```typescript
await db
  .update(users)
  .set({ name: validatedName, updatedAt: new Date() })
  .where(and(eq(users.id, currentUserId), isNull(users.deletedAt)));
```

---

## 5. Settings Page Data Loading

**Decision**: `settings/page.tsx` is a **server component**. It calls `getSession()` to resolve the current user ID, then queries `users` by `id` (with `deleted_at IS NULL`). The profile data is passed as props to the client form components.

**Rationale**: Server components can fetch data without an extra round-trip. Pre-populating the form fields with current values is essential to the UX (AC: fields show current values on load). This matches Next.js App Router best practices for data-fetching pages.

**Fields loaded**: `name`, `vanitySlug`.

---

## 6. Form Component Architecture

**Decision**: Two new client components, co-located at `src/app/(dashboard)/settings/_components/`:
- `SlugSettingsForm.tsx` — controlled input for `vanitySlug`, `useFormState` → `updateSlugAction`
- `NameSettingsForm.tsx` — controlled input for `name`, `useFormState` → `updateNameAction`

Both follow the `PasswordChangeForm` pattern: shadcn/ui `Card`, `Label`, `Input`, `Button`, `Alert` for feedback.

**Rationale**: Co-location with the route keeps settings UI contained. The `_components` prefix convention (Next.js underscored private folders) prevents accidental routing.

---

## 7. Slug Validation Format

**Decision**: Regex `^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$` for slugs of 2–50 chars (covers the full `varchar(50)` column length). Validated client-side via Zod before the server is called.

**Rationale**: Consistent with the DB column constraint and the assumption documented in the spec. Ensures the slug is URL-safe and human-readable.

**Human-friendly error messages**:
- Too short: `"URL must be at least 2 characters"`
- Invalid chars: `"URL can only contain lowercase letters, numbers, and hyphens"`
- Starts/ends with hyphen: `"URL must start and end with a letter or number"`
- Already taken (server): `"This URL is already taken. Please choose a different one."`
