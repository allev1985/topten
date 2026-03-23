/**
 * Tag Repository
 *
 * Pure data-access functions for the tags and place_tags tables.
 * No business logic — slug normalisation, ownership checks and diffing live
 * in the service layer.
 *
 * List tags are not stored directly; they are derived on the fly as the
 * union of place tags for all non-deleted places in a list.
 *
 * @module db/repositories/tag.repository
 */

import {
  eq,
  and,
  or,
  isNull,
  isNotNull,
  inArray,
  like,
  asc,
  desc,
} from "drizzle-orm";
import { db } from "@/db";
import { tags, placeTags } from "@/db/schema/tag";
import { listPlaces } from "@/db/schema/listPlace";
import { places } from "@/db/schema/place";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TagRow = typeof tags.$inferSelect;

export type TagSummaryRow = {
  id: string;
  slug: string;
  label: string;
  isSystem: boolean;
};

export type EntityTagRow = TagSummaryRow & { entityId: string };

// ─── Tag vocabulary ──────────────────────────────────────────────────────────

/**
 * Prefix-search the tag vocabulary by slug.
 *
 * Returns system tags plus custom tags created by the requesting user.
 *
 * @param slugPrefix - Normalised slug prefix to match
 * @param userId - Requesting user's id (scopes custom-tag visibility)
 * @param limit - Maximum rows to return
 * @returns Matching tag summaries ordered by is_system DESC, slug ASC
 */
export async function searchTagsBySlugPrefix({
  slugPrefix,
  userId,
  limit,
}: {
  slugPrefix: string;
  userId: string;
  limit: number;
}): Promise<TagSummaryRow[]> {
  return db
    .select({
      id: tags.id,
      slug: tags.slug,
      label: tags.label,
      isSystem: tags.isSystem,
    })
    .from(tags)
    .where(
      and(
        like(tags.slug, `${slugPrefix}%`),
        or(eq(tags.isSystem, true), eq(tags.userId, userId))
      )
    )
    .orderBy(desc(tags.isSystem), asc(tags.slug))
    .limit(limit);
}

/**
 * Look up tag rows for a set of normalised slugs.
 *
 * Returns system tags plus custom tags created by the requesting user.
 *
 * @param slugs - Normalised slugs to resolve
 * @param userId - Requesting user's id (scopes custom-tag visibility)
 * @returns Matching tag rows (may be fewer than input if some slugs are new)
 */
export async function getTagsBySlugs({
  slugs,
  userId,
}: {
  slugs: string[];
  userId: string;
}): Promise<TagRow[]> {
  if (slugs.length === 0) return [];
  return db
    .select()
    .from(tags)
    .where(
      and(
        inArray(tags.slug, slugs),
        or(eq(tags.isSystem, true), eq(tags.userId, userId))
      )
    );
}

/**
 * Insert new custom tag rows, ignoring conflicts on the per-user unique index.
 *
 * Uses ON CONFLICT DO NOTHING so concurrent inserts of the same (slug, userId)
 * pair are silently absorbed. Only the rows that were actually inserted are
 * returned; callers that need a complete set should re-fetch via getTagsBySlugs.
 *
 * @param values - Rows to insert (slug, label, userId)
 * @returns Tag rows that were newly inserted (excludes any that conflicted)
 */
export async function insertTags(
  values: Array<{ slug: string; label: string; userId: string }>
): Promise<TagRow[]> {
  if (values.length === 0) return [];
  return db
    .insert(tags)
    .values(values.map((v) => ({ ...v, isSystem: false })))
    .onConflictDoNothing({
      target: [tags.slug, tags.userId],
      where: eq(tags.isSystem, false),
    })
    .returning();
}

/**
 * Hard-delete custom tags that are no longer referenced by any place.
 *
 * Only removes custom (user-created) tags; system tags are never deleted here.
 * Called after removing tags from a place to keep the vocabulary clean.
 *
 * @param tagIds - Candidate tag IDs (recently removed from a place)
 */
export async function deleteOrphanedCustomTags(
  tagIds: string[]
): Promise<void> {
  if (tagIds.length === 0) return;

  // Find which of the candidate tags are still referenced in place_tags
  const stillUsed = await db
    .selectDistinct({ tagId: placeTags.tagId })
    .from(placeTags)
    .where(inArray(placeTags.tagId, tagIds));

  const stillUsedIds = new Set(stillUsed.map((r) => r.tagId));
  const orphanIds = tagIds.filter((id) => !stillUsedIds.has(id));

  if (orphanIds.length === 0) return;

  await db.delete(tags).where(
    and(
      inArray(tags.id, orphanIds),
      isNotNull(tags.userId) // custom tags only; system tags are never hard-deleted here
    )
  );
}

// ─── Ownership checks ────────────────────────────────────────────────────────

/**
 * Verify a place exists, is active, and is owned by the user.
 *
 * @param placeId - Place UUID
 * @param userId - Requesting user's id
 * @returns true when the place is owned by the user
 */
export async function isPlaceOwnedByUser({
  placeId,
  userId,
}: {
  placeId: string;
  userId: string;
}): Promise<boolean> {
  const rows = await db
    .select({ id: places.id })
    .from(places)
    .where(
      and(
        eq(places.id, placeId),
        eq(places.userId, userId),
        isNull(places.deletedAt)
      )
    )
    .limit(1);
  return rows.length > 0;
}

// ─── Place tags ──────────────────────────────────────────────────────────────

/**
 * Fetch all tags attached to a place.
 *
 * @param placeId - Place UUID
 * @returns Tag summaries ordered by label ASC
 */
export async function getTagsForPlace(
  placeId: string
): Promise<TagSummaryRow[]> {
  return db
    .select({
      id: tags.id,
      slug: tags.slug,
      label: tags.label,
      isSystem: tags.isSystem,
    })
    .from(placeTags)
    .innerJoin(tags, eq(tags.id, placeTags.tagId))
    .where(eq(placeTags.placeId, placeId))
    .orderBy(asc(tags.label));
}

/**
 * Batch-fetch tags for many places in a single query.
 *
 * @param placeIds - Place UUIDs
 * @returns Flat rows with an `entityId` column for client-side grouping
 */
export async function getTagsForPlaces(
  placeIds: string[]
): Promise<EntityTagRow[]> {
  if (placeIds.length === 0) return [];
  return db
    .select({
      entityId: placeTags.placeId,
      id: tags.id,
      slug: tags.slug,
      label: tags.label,
      isSystem: tags.isSystem,
    })
    .from(placeTags)
    .innerJoin(tags, eq(tags.id, placeTags.tagId))
    .where(inArray(placeTags.placeId, placeIds))
    .orderBy(asc(tags.label));
}

/**
 * Fetch the current tag IDs attached to a place.
 *
 * Used by the service layer to diff desired vs. current tags.
 *
 * @param placeId - Place UUID
 * @returns Rows containing junction id and tagId
 */
export async function getPlaceTagIds(
  placeId: string
): Promise<{ id: string; tagId: string }[]> {
  return db
    .select({ id: placeTags.id, tagId: placeTags.tagId })
    .from(placeTags)
    .where(eq(placeTags.placeId, placeId));
}

/**
 * Insert new place_tags junction rows.
 *
 * @param placeId - Place UUID
 * @param tagIds - Tag UUIDs to attach
 */
export async function insertPlaceTags({
  placeId,
  tagIds,
}: {
  placeId: string;
  tagIds: string[];
}): Promise<void> {
  if (tagIds.length === 0) return;
  await db
    .insert(placeTags)
    .values(tagIds.map((tagId) => ({ placeId, tagId })));
}

/**
 * Hard-delete place_tags junction rows by tag ID.
 *
 * @param placeId - Place UUID
 * @param tagIds - Tag UUIDs to detach from the place
 */
export async function deletePlaceTagsByTagIds({
  placeId,
  tagIds,
}: {
  placeId: string;
  tagIds: string[];
}): Promise<void> {
  if (tagIds.length === 0) return;
  await db
    .delete(placeTags)
    .where(
      and(eq(placeTags.placeId, placeId), inArray(placeTags.tagId, tagIds))
    );
}

// ─── Derived list tags ────────────────────────────────────────────────────────

/**
 * Derive tags for a single list from the tags of its active places.
 *
 * Returns the distinct union of all place tags for non-deleted places in
 * the list. No list_tags table is used; tags belong only to places.
 *
 * @param listId - List UUID
 * @returns Distinct tag summaries ordered by label ASC
 */
export async function getTagsForListViaPlaces(
  listId: string
): Promise<TagSummaryRow[]> {
  return db
    .selectDistinct({
      id: tags.id,
      slug: tags.slug,
      label: tags.label,
      isSystem: tags.isSystem,
    })
    .from(listPlaces)
    .innerJoin(placeTags, eq(placeTags.placeId, listPlaces.placeId))
    .innerJoin(tags, eq(tags.id, placeTags.tagId))
    .where(and(eq(listPlaces.listId, listId), isNull(listPlaces.deletedAt)))
    .orderBy(asc(tags.label));
}

/**
 * Batch-derive tags for many lists from the tags of their active places.
 *
 * @param listIds - List UUIDs
 * @returns Flat rows with an `entityId` (list id) column for client-side grouping
 */
export async function getTagsForListsViaPlaces(
  listIds: string[]
): Promise<EntityTagRow[]> {
  if (listIds.length === 0) return [];
  return db
    .selectDistinct({
      entityId: listPlaces.listId,
      id: tags.id,
      slug: tags.slug,
      label: tags.label,
      isSystem: tags.isSystem,
    })
    .from(listPlaces)
    .innerJoin(placeTags, eq(placeTags.placeId, listPlaces.placeId))
    .innerJoin(tags, eq(tags.id, placeTags.tagId))
    .where(
      and(inArray(listPlaces.listId, listIds), isNull(listPlaces.deletedAt))
    )
    .orderBy(asc(tags.label));
}
