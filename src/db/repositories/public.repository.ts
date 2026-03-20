/**
 * Public Repository
 *
 * Pure data-access functions for public profile and list reads.
 * No business logic, no React.cache — caching is applied in the service layer.
 *
 * @module db/repositories/public.repository
 */

import { eq, and, isNull, desc, count, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/user";
import { lists } from "@/db/schema/list";
import { listPlaces } from "@/db/schema/listPlace";
import { places } from "@/db/schema/place";
import type {
  PublicProfile,
  PublicListSummary,
  PublicListDetail,
  PublicPlaceEntry,
} from "@/lib/public/types";

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch the public profile for a vanity slug.
 *
 * @param vanitySlug - The user's vanity slug (e.g. "alex")
 * @returns PublicProfile if found and not soft-deleted, null otherwise
 */
export async function getPublicProfileBySlug(
  vanitySlug: string
): Promise<PublicProfile | null> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      bio: users.bio,
      avatarUrl: users.image,
      vanitySlug: users.vanitySlug,
    })
    .from(users)
    .where(and(eq(users.vanitySlug, vanitySlug), isNull(users.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Fetch all published lists for a user, newest first, with place counts.
 *
 * @param userId - The user's UUID
 * @returns Array of PublicListSummary ordered by publishedAt DESC
 */
export async function getPublicListsForProfile(
  userId: string
): Promise<PublicListSummary[]> {
  return db
    .select({
      id: lists.id,
      title: lists.title,
      slug: lists.slug,
      description: lists.description,
      updatedAt: lists.updatedAt,
      placeCount: count(listPlaces.id),
    })
    .from(lists)
    .leftJoin(
      listPlaces,
      and(eq(listPlaces.listId, lists.id), isNull(listPlaces.deletedAt))
    )
    .where(
      and(
        eq(lists.userId, userId),
        eq(lists.isPublished, true),
        isNull(lists.deletedAt)
      )
    )
    .groupBy(lists.id)
    .orderBy(desc(lists.publishedAt));
}

/**
 * Fetch the full detail of a single published list, including ordered places.
 *
 * Executes two sequential queries:
 *   1. Fetch the list header (returns null if not found / not published)
 *   2. Fetch ordered places with COALESCE hero image
 *
 * @param userId   - The list owner's UUID (ownership scoping)
 * @param listSlug - The list slug
 * @returns PublicListDetail if found and published, null otherwise
 */
export async function getPublicListDetail({
  userId,
  listSlug,
}: {
  userId: string;
  listSlug: string;
}): Promise<PublicListDetail | null> {
  // Step 1: Fetch the list header
  const listRows = await db
    .select({
      id: lists.id,
      title: lists.title,
      slug: lists.slug,
      description: lists.description,
      updatedAt: lists.updatedAt,
    })
    .from(lists)
    .where(
      and(
        eq(lists.userId, userId),
        eq(lists.slug, listSlug),
        eq(lists.isPublished, true),
        isNull(lists.deletedAt)
      )
    )
    .limit(1);

  const listRow = listRows[0];
  if (!listRow) return null;

  // Step 2: Fetch places ordered by position
  const placeRows = await db
    .select({
      id: places.id,
      name: places.name,
      address: places.address,
      description: places.description,
      heroImageUrl: sql<
        string | null
      >`COALESCE(${listPlaces.heroImageUrl}, ${places.heroImageUrl})`,
      position: listPlaces.position,
    })
    .from(listPlaces)
    .innerJoin(places, eq(places.id, listPlaces.placeId))
    .where(
      and(
        eq(listPlaces.listId, listRow.id),
        isNull(listPlaces.deletedAt),
        isNull(places.deletedAt)
      )
    )
    .orderBy(asc(listPlaces.position));

  const placeEntries: PublicPlaceEntry[] = placeRows.map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    description: row.description ?? null,
    heroImageUrl: row.heroImageUrl,
    position: row.position,
  }));

  return {
    id: listRow.id,
    title: listRow.title,
    slug: listRow.slug,
    description: listRow.description ?? null,
    updatedAt: listRow.updatedAt,
    places: placeEntries,
  };
}
