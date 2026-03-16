/**
 * User Repository
 *
 * Pure data-access functions for the users table.
 * No business logic — all validation and error translation lives in the service layer.
 *
 * @module db/repositories/user.repository
 */

import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/user";

/**
 * Fetch the vanity slug for a user.
 *
 * @param userId - The user's UUID
 * @returns The vanity slug string, or null if user not found / soft-deleted
 */
export async function getVanitySlugByUserId(
  userId: string
): Promise<string | null> {
  const rows = await db
    .select({ vanitySlug: users.vanitySlug })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return rows[0]?.vanitySlug ?? null;
}
