# Quickstart: User Settings Page

**Feature**: `004-user-settings`  
**Branch**: `004-user-settings`

---

## Prerequisites

- Branch `004-user-settings` checked out
- `pnpm install` run
- `.env` configured with `DATABASE_URL` and Supabase keys
- `pnpm dev` running

---

## Implementation Order

Follow this order to keep the test suite green at every step.

---

### Step 1 — Zod Schemas (`src/schemas/profile.ts`)

Create `src/schemas/profile.ts`:

```typescript
import { z } from "zod";

export const updateNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long").trim(),
});

export const updateSlugSchema = z.object({
  vanitySlug: z
    .string()
    .min(1, "Profile URL is required")
    .min(2, "URL must be at least 2 characters")
    .max(50, "URL must be 50 characters or fewer")
    .regex(
      /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/,
      "URL can only contain lowercase letters, numbers, and hyphens, and must start and end with a letter or number"
    ),
});

export interface UpdateNameSuccessData {
  name: string;
}

export interface UpdateSlugSuccessData {
  vanitySlug: string;
}
```

---

### Step 2 — Server Actions (`src/actions/profile-actions.ts`)

Create `src/actions/profile-actions.ts` following the `auth-actions.ts` pattern:

```typescript
"use server";

import { and, eq, ne, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/user";
import { updateNameSchema, updateSlugSchema } from "@/schemas/profile";
import type { ActionState } from "@/types/forms";
import type { UpdateNameSuccessData, UpdateSlugSuccessData } from "@/schemas/profile";
import { getSession } from "@/lib/auth/service";

function mapZodErrors(issues: { path: PropertyKey[]; message: string }[]) {
  // reuse same helper pattern as auth-actions.ts
}

export async function updateNameAction(
  _prevState: ActionState<UpdateNameSuccessData>,
  formData: FormData
): Promise<ActionState<UpdateNameSuccessData>> {
  // 1. Verify session
  // 2. Validate with updateNameSchema
  // 3. db.update(users).set({ name, updatedAt }).where(id + deletedAt)
  // 4. Return success or error
}

export async function updateSlugAction(
  _prevState: ActionState<UpdateSlugSuccessData>,
  formData: FormData
): Promise<ActionState<UpdateSlugSuccessData>> {
  // 1. Verify session
  // 2. Validate with updateSlugSchema
  // 3. Layer 1 — application pre-check:
  //    SELECT id FROM users WHERE vanitySlug = slug AND id != userId AND deletedAt IS NULL LIMIT 1
  //    If found → return slugTakenError()
  // 4. Layer 2 — DB write wrapped in try/catch:
  //    db.update(users).set({ vanitySlug, updatedAt }).where(id + deletedAt)
  //    catch (err) → if isUniqueViolation(err) return slugTakenError()
  //                 → else log + return generic error
  // 5. Return success
}
```

---

### Step 3 — Unit Tests (`tests/unit/actions/profile-actions.test.ts`)

Write unit tests for both actions before filling in the implementation. Cover:

- `updateNameAction`: missing name, name too long, unauthenticated, success
- `updateSlugAction`: invalid format, slug taken, own slug unchanged (success), unauthenticated, success

---

### Step 4 — Client Form Components

**`src/app/(dashboard)/settings/_components/NameSettingsForm.tsx`**

```tsx
"use client";
// Pattern: identical to PasswordChangeForm
// - useFormState(updateNameAction)
// - Single `name` Input + submit Button
// - Card / CardHeader / CardContent / CardFooter layout
// - Alert for error, success state inline
// - Accept `currentName: string` prop to pre-populate
```

**`src/app/(dashboard)/settings/_components/SlugSettingsForm.tsx`**

```tsx
"use client";
// - useFormState(updateSlugAction)
// - Single `vanitySlug` Input + submit Button
// - Show URL preview: `yourfavs.com/<value>` updated as user types
// - Accept `currentSlug: string` prop to pre-populate
```

---

### Step 5 — Component Tests

Write React Testing Library tests for `NameSettingsForm` and `SlugSettingsForm`:

- Renders with pre-populated values
- Shows field error on invalid input
- Shows success state after action returns `isSuccess: true`
- Shows human-friendly error from server (slug taken)

---

### Step 6 — Settings Page (`src/app/(dashboard)/settings/page.tsx`)

Replace/create the unified settings page as a **server component**:

```tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/service";
import { db } from "@/db";
import { users } from "@/db/schema/user";
import { NameSettingsForm } from "./_components/NameSettingsForm";
import { SlugSettingsForm } from "./_components/SlugSettingsForm";
import { PasswordChangeForm } from "./password/password-change-form";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session.authenticated) redirect("/login");

  const profile = await db
    .select({ name: users.name, vanitySlug: users.vanitySlug })
    .from(users)
    .where(and(eq(users.id, session.user.id), isNull(users.deletedAt)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!profile) redirect("/login");

  return (
    <main>
      <h1>Settings</h1>
      <section aria-label="Profile URL">
        <SlugSettingsForm currentSlug={profile.vanitySlug} />
      </section>
      <section aria-label="Profile">
        <NameSettingsForm currentName={profile.name} />
      </section>
      <section aria-label="Security">
        <PasswordChangeForm />
      </section>
    </main>
  );
}
```

---

### Step 7 — Integration Test

**`tests/integration/profile-actions.integration.test.ts`**

Test `updateSlugAction` slug uniqueness against a real (or seeded test) DB:

- Slug taken by another user → field error returned, no write performed (Layer 1)
- Race-condition simulation: mock `db.update()` to throw a `{ code: "23505" }` error → same human-friendly field error returned (Layer 2)
- Own unchanged slug → success (excluded by `id != currentUserId`)
- New unique slug → success, `updatedAt` changed

---

### Step 8 — E2E Test

**`tests/e2e/settings.spec.ts`** (Playwright)

```typescript
test("user can update their profile URL, name, and sees human-friendly errors")
// - Log in, navigate to /dashboard/settings
// - Update slug to a taken value → error shown
// - Update slug to a unique value → success, new slug shown
// - Update name → success, updated name shown on return visit
// - Change password with wrong current password → error shown
```

---

## Key Files Summary

| File | Status | Notes |
|------|--------|-------|
| `src/schemas/profile.ts` | NEW | Zod schemas for name + slug |
| `src/actions/profile-actions.ts` | NEW | `updateNameAction`, `updateSlugAction` |
| `src/app/(dashboard)/settings/page.tsx` | NEW/REPLACE | Unified server component page |
| `src/app/(dashboard)/settings/_components/NameSettingsForm.tsx` | NEW | Client form |
| `src/app/(dashboard)/settings/_components/SlugSettingsForm.tsx` | NEW | Client form |
| `src/app/(dashboard)/settings/password/password-change-form.tsx` | EXISTING | Reused unchanged |
| `src/actions/auth-actions.ts` | EXISTING | `passwordChangeAction` reused unchanged |
| `tests/unit/actions/profile-actions.test.ts` | NEW | |
| `tests/component/settings/NameSettingsForm.test.tsx` | NEW | |
| `tests/component/settings/SlugSettingsForm.test.tsx` | NEW | |
| `tests/integration/profile-actions.integration.test.ts` | NEW | Slug uniqueness |
| `tests/e2e/settings.spec.ts` | NEW | Full journey |
