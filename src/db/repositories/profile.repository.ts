/**
 * Profile Repository
 *
 * Pure data-access functions for the users table in the profile domain.
 * No business logic — uniqueness defence and error translation live in the
 * service layer.
 *
 * @module db/repositories/profile.repository
 */

import { eq, ne, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/user";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SettingsProfileRow = {
  name: string;
  vanitySlug: string;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch the profile data required for the settings page.
 *
 * @param userId - The authenticated user's UUID
 * @returns Partial user row, or null if no active record found
 */
export async function getSettingsProfile(
  userId: string
): Promise<SettingsProfileRow | null> {
  const rows = await db
    .select({ name: users.name, vanitySlug: users.vanitySlug })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Check whether a vanity slug is already claimed by any active user.
 * Used during signup when no userId exists yet.
 *
 * @param vanitySlug - Slug to check
 * @returns true if the slug is taken
 */
export async function checkSlugTaken(vanitySlug: string): Promise<boolean> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.vanitySlug, vanitySlug), isNull(users.deletedAt)))
    .limit(1);

  return rows.length > 0;
}

/**
 * Check whether a vanity slug is already claimed by another active user.
 *
 * @param vanitySlug - Slug to check
 * @param userId     - Current user — excluded from the conflict check
 * @returns true if the slug is taken by another user
 */
export async function getSlugConflict({
  vanitySlug,
  userId,
}: {
  vanitySlug: string;
  userId: string;
}): Promise<boolean> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.vanitySlug, vanitySlug),
        ne(users.id, userId),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  return rows.length > 0;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Update a user's display name.
 *
 * @param userId - The authenticated user's UUID
 * @param name   - New display name
 */
export async function updateUserName({
  userId,
  name,
}: {
  userId: string;
  name: string;
}): Promise<void> {
  await db
    .update(users)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)));
}

/**
 * Update a user's vanity slug.
 *
 * Caller is responsible for performing pre-checks and catching unique
 * violations (race-condition defence in the service layer).
 *
 * @param userId     - The authenticated user's UUID
 * @param vanitySlug - New slug
 */
export async function updateUserSlug({
  userId,
  vanitySlug,
}: {
  userId: string;
  vanitySlug: string;
}): Promise<void> {
  await db
    .update(users)
    .set({ vanitySlug, updatedAt: new Date() })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)));
}
