/**
 * Tag Repository
 *
 * Pure data-access functions for the tags, list_tags and place_tags tables.
 * No business logic — slug normalisation, ownership checks and diffing live
 * in the service layer.
 *
 * @module db/repositories/tag.repository
 */

import { eq, and, or, isNull, inArray, like, asc } from "drizzle-orm";
import { db } from "@/db";
import { tags, listTags, placeTags } from "@/db/schema/tag";
import { lists } from "@/db/schema/list";
import { places } from "@/db/schema/place";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TagRow = typeof tags.$inferSelect;

export type TagSummaryRow = {
  id: string;
  slug: string;
  label: string;
  isSystem: boolean;
};

export type JunctionRow = {
  id: string;
  tagId: string;
  deletedAt: Date | null;
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
        isNull(tags.deletedAt),
        or(eq(tags.isSystem, true), eq(tags.userId, userId))
      )
    )
    .orderBy(asc(tags.isSystem), asc(tags.slug))
    .limit(limit);
}

/**
 * Look up tag rows for a set of normalised slugs.
 *
 * @param slugs - Normalised slugs to resolve
 * @returns Matching tag rows (may be fewer than input if some slugs are new)
 */
export async function getTagsBySlugs(slugs: string[]): Promise<TagRow[]> {
  if (slugs.length === 0) return [];
  return db
    .select()
    .from(tags)
    .where(and(inArray(tags.slug, slugs), isNull(tags.deletedAt)));
}

/**
 * Insert new custom tag rows.
 *
 * @param values - Rows to insert (slug, label, userId)
 * @returns The inserted tag rows
 */
export async function insertTags(
  values: Array<{ slug: string; label: string; userId: string }>
): Promise<TagRow[]> {
  if (values.length === 0) return [];
  return db
    .insert(tags)
    .values(values.map((v) => ({ ...v, isSystem: false })))
    .returning();
}

// ─── Ownership checks ────────────────────────────────────────────────────────

/**
 * Verify a list exists, is active, and is owned by the user.
 *
 * @param listId - List UUID
 * @param userId - Requesting user's id
 * @returns The list's slug when it is owned by the user, or null otherwise
 */
export async function isListOwnedByUser({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<{ slug: string } | null> {
  const rows = await db
    .select({ id: lists.id, slug: lists.slug })
    .from(lists)
    .where(
      and(
        eq(lists.id, listId),
        eq(lists.userId, userId),
        isNull(lists.deletedAt)
      )
    )
    .limit(1);
  return rows[0] ? { slug: rows[0].slug } : null;
}

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

// ─── List tags ───────────────────────────────────────────────────────────────

/**
 * Fetch active tags attached to a list.
 *
 * @param listId - List UUID
 * @returns Tag summaries ordered by label ASC
 */
export async function getTagsForList(listId: string): Promise<TagSummaryRow[]> {
  return db
    .select({
      id: tags.id,
      slug: tags.slug,
      label: tags.label,
      isSystem: tags.isSystem,
    })
    .from(listTags)
    .innerJoin(tags, eq(tags.id, listTags.tagId))
    .where(
      and(
        eq(listTags.listId, listId),
        isNull(listTags.deletedAt),
        isNull(tags.deletedAt)
      )
    )
    .orderBy(asc(tags.label));
}

/**
 * Batch-fetch active tags for many lists in a single query.
 *
 * @param listIds - List UUIDs
 * @returns Flat rows with an `entityId` column for client-side grouping
 */
export async function getTagsForLists(
  listIds: string[]
): Promise<EntityTagRow[]> {
  if (listIds.length === 0) return [];
  return db
    .select({
      entityId: listTags.listId,
      id: tags.id,
      slug: tags.slug,
      label: tags.label,
      isSystem: tags.isSystem,
    })
    .from(listTags)
    .innerJoin(tags, eq(tags.id, listTags.tagId))
    .where(
      and(
        inArray(listTags.listId, listIds),
        isNull(listTags.deletedAt),
        isNull(tags.deletedAt)
      )
    )
    .orderBy(asc(tags.label));
}

/**
 * Fetch all junction rows (including soft-deleted) for a list.
 *
 * @param listId - List UUID
 * @returns Junction rows with their soft-delete state
 */
export async function getListTagJunctions(
  listId: string
): Promise<JunctionRow[]> {
  return db
    .select({
      id: listTags.id,
      tagId: listTags.tagId,
      deletedAt: listTags.deletedAt,
    })
    .from(listTags)
    .where(eq(listTags.listId, listId));
}

/**
 * Insert new list_tags junction rows.
 *
 * @param listId - List UUID
 * @param tagIds - Tag UUIDs to attach
 */
export async function insertListTags({
  listId,
  tagIds,
}: {
  listId: string;
  tagIds: string[];
}): Promise<void> {
  if (tagIds.length === 0) return;
  await db.insert(listTags).values(tagIds.map((tagId) => ({ listId, tagId })));
}

/**
 * Restore soft-deleted list_tags junction rows (clear deletedAt).
 *
 * @param ids - Junction row UUIDs to restore
 */
export async function restoreListTags(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(listTags)
    .set({ deletedAt: null })
    .where(inArray(listTags.id, ids));
}

/**
 * Soft-delete list_tags junction rows.
 *
 * @param ids - Junction row UUIDs to soft-delete
 */
export async function softDeleteListTags(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(listTags)
    .set({ deletedAt: new Date() })
    .where(inArray(listTags.id, ids));
}

// ─── Place tags ──────────────────────────────────────────────────────────────

/**
 * Fetch active tags attached to a place.
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
    .where(
      and(
        eq(placeTags.placeId, placeId),
        isNull(placeTags.deletedAt),
        isNull(tags.deletedAt)
      )
    )
    .orderBy(asc(tags.label));
}

/**
 * Batch-fetch active tags for many places in a single query.
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
    .where(
      and(
        inArray(placeTags.placeId, placeIds),
        isNull(placeTags.deletedAt),
        isNull(tags.deletedAt)
      )
    )
    .orderBy(asc(tags.label));
}

/**
 * Fetch all junction rows (including soft-deleted) for a place.
 *
 * @param placeId - Place UUID
 * @returns Junction rows with their soft-delete state
 */
export async function getPlaceTagJunctions(
  placeId: string
): Promise<JunctionRow[]> {
  return db
    .select({
      id: placeTags.id,
      tagId: placeTags.tagId,
      deletedAt: placeTags.deletedAt,
    })
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
 * Restore soft-deleted place_tags junction rows (clear deletedAt).
 *
 * @param ids - Junction row UUIDs to restore
 */
export async function restorePlaceTags(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(placeTags)
    .set({ deletedAt: null })
    .where(inArray(placeTags.id, ids));
}

/**
 * Soft-delete place_tags junction rows.
 *
 * @param ids - Junction row UUIDs to soft-delete
 */
export async function softDeletePlaceTags(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(placeTags)
    .set({ deletedAt: new Date() })
    .where(inArray(placeTags.id, ids));
}
