/**
 * Tag Service
 *
 * Centralised service for tag vocabulary and place-tag attachments.
 * Delegates all DB access to the tag repository.
 * Used by tag server actions — never called from client code.
 *
 * Tags belong only to places. List tags are derived on the fly as the
 * union of all place tags for the places within that list.
 *
 * Public API:
 *   - searchTags               — autocomplete system + user custom tags by slug prefix
 *   - getTagsForPlace          — read tags on a place
 *   - getTagsForPlaces         — batch read tags on multiple places
 *   - getTagsForListsViaPlaces — derived list tags (union of place tags per list)
 *   - setPlaceTags             — replace the full tag set on a place
 *
 * Architecture: src/lib/tag/service.ts → src/actions/tag-actions.ts → client
 * @see docs/decisions/tags.md
 * @module lib/tag/service
 */

import * as tagRepository from "@/db/repositories/tag.repository";
import * as placeRepository from "@/db/repositories/place.repository";
import { createServiceLogger } from "@/lib/services/logging";
import {
  TagServiceError,
  notFoundError,
  validationError,
  tagServiceError,
} from "./errors";
import { normaliseTagSlug, normaliseTagLabel } from "./helpers/slug";
import { config } from "@/lib/config";
import type { TagSummary, EntityTagSummary, SetTagsResult } from "./types";

const log = createServiceLogger("tag-service");

const SEARCH_LIMIT = 10;

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Prefix-search the tag vocabulary for autocomplete.
 *
 * @param query  - Raw user input; normalised before matching
 * @param userId - Requesting user (scopes custom-tag visibility)
 * @returns Up to 10 matching TagSummary rows
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function searchTags({
  query,
  userId,
}: {
  query: string;
  userId: string;
}): Promise<TagSummary[]> {
  const slugPrefix = normaliseTagSlug(query);
  log.debug({ method: "searchTags", userId, slugPrefix }, "Searching tags");

  if (!slugPrefix) return [];

  try {
    const rows = await tagRepository.searchTagsBySlugPrefix({
      slugPrefix,
      userId,
      limit: SEARCH_LIMIT,
    });
    log.info(
      { method: "searchTags", userId, count: rows.length },
      "Tag search complete"
    );
    return rows;
  } catch (err) {
    log.error({ method: "searchTags", userId, err }, "DB error");
    throw tagServiceError("Failed to search tags. Please try again.", err);
  }
}

/**
 * Fetch all tags attached to a place.
 *
 * @param placeId - Place UUID
 * @returns Tag summaries ordered by label
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function getTagsForPlace(placeId: string): Promise<TagSummary[]> {
  try {
    return await tagRepository.getTagsForPlace(placeId);
  } catch (err) {
    log.error({ method: "getTagsForPlace", placeId, err }, "DB error");
    throw tagServiceError("Failed to load tags.", err);
  }
}

/**
 * Batch-fetch tags for multiple places.
 *
 * @param placeIds - Place UUIDs
 * @returns One EntityTagSummary per (place, tag) pair; includes entityId for grouping
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function getTagsForPlaces(
  placeIds: string[]
): Promise<EntityTagSummary[]> {
  try {
    return await tagRepository.getTagsForPlaces(placeIds);
  } catch (err) {
    log.error({ method: "getTagsForPlaces", err }, "DB error");
    throw tagServiceError("Failed to load tags.", err);
  }
}

/**
 * Derive tags for multiple lists from the tags of their active places.
 *
 * Returns the distinct union of place tags per list — no list_tags table
 * is queried.
 *
 * @param listIds - List UUIDs
 * @returns One EntityTagSummary per (list, tag) pair; includes entityId for grouping
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function getTagsForListsViaPlaces(
  listIds: string[]
): Promise<EntityTagSummary[]> {
  try {
    return await tagRepository.getTagsForListsViaPlaces(listIds);
  } catch (err) {
    log.error({ method: "getTagsForListsViaPlaces", err }, "DB error");
    throw tagServiceError("Failed to load tags.", err);
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Replace the full tag set on a place.
 *
 * Unknown labels are inserted as custom tags on the fly; known labels are
 * reused. Tags removed from a place are hard-deleted from the junction table.
 * Custom tags that become unreferenced after removal are garbage-collected
 * from the tags vocabulary.
 *
 * @param placeId - Place UUID
 * @param userId  - Authenticated user's id (ownership check)
 * @param labels  - Desired tag labels (raw; normalised internally)
 * @returns The resulting tag summaries on the place
 * @throws {TagServiceError} code NOT_FOUND if place missing/deleted/wrong owner
 * @throws {TagServiceError} code VALIDATION_ERROR if labels invalid or over limit
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function setPlaceTags({
  placeId,
  userId,
  labels,
}: {
  placeId: string;
  userId: string;
  labels: string[];
}): Promise<SetTagsResult> {
  log.info(
    { method: "setPlaceTags", userId, placeId, count: labels.length },
    "Setting tags"
  );

  const normalised = normaliseLabels(labels);
  if (normalised.length > config.tags.maxPerEntity) {
    throw validationError(
      `A maximum of ${config.tags.maxPerEntity} tags is allowed.`
    );
  }

  try {
    const placeOwned = await tagRepository.isPlaceOwnedByUser({
      placeId,
      userId,
    });
    if (!placeOwned) throw notFoundError();
    const tagIdsBySlug = await resolveTagIds(normalised, userId);
    const desiredIds = new Set(tagIdsBySlug.values());

    const currentRows = await tagRepository.getPlaceTagIds(placeId);
    const currentIds = new Set(currentRows.map((r) => r.tagId));

    const toAdd = Array.from(desiredIds).filter((id) => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter((id) => !desiredIds.has(id));

    await tagRepository.insertPlaceTags({ placeId, tagIds: toAdd });
    await tagRepository.deletePlaceTagsByTagIds({ placeId, tagIds: toRemove });

    // Garbage-collect custom tags that are no longer used by any place
    if (toRemove.length > 0) {
      await tagRepository.deleteOrphanedCustomTags(toRemove);
    }

    const [result, listSlugs] = await Promise.all([
      tagRepository.getTagsForPlace(placeId),
      placeRepository.getPublishedListSlugsForPlace({ placeId, userId }),
    ]);

    log.info(
      {
        method: "setPlaceTags",
        userId,
        placeId,
        added: toAdd.length,
        removed: toRemove.length,
      },
      "Tags set"
    );

    return { tags: result, listSlugs };
  } catch (err) {
    if (err instanceof TagServiceError) throw err;
    log.error({ method: "setPlaceTags", userId, placeId, err }, "DB error");
    throw tagServiceError("Failed to update tags. Please try again.", err);
  }
}

// ─── Internal ────────────────────────────────────────────────────────────────

interface NormalisedTag {
  slug: string;
  label: string;
}

/**
 * Normalise, de-duplicate and validate a raw label list.
 */
function normaliseLabels(labels: string[]): NormalisedTag[] {
  const seen = new Map<string, NormalisedTag>();
  for (const raw of labels) {
    const slug = normaliseTagSlug(raw);
    if (!slug) continue;
    if (!seen.has(slug)) {
      seen.set(slug, { slug, label: normaliseTagLabel(raw) });
    }
  }
  return Array.from(seen.values());
}

/**
 * Resolve a list of labels to tag ids, inserting new custom tags as needed.
 *
 * After inserting, slugs are re-fetched so that any rows absorbed by
 * ON CONFLICT DO NOTHING (concurrent inserts of the same slug by the same
 * user) are still included in the result map.
 */
async function resolveTagIds(
  normalised: NormalisedTag[],
  userId: string
): Promise<Map<string, string>> {
  const slugs = normalised.map((n) => n.slug);
  const existing = await tagRepository.getTagsBySlugs({ slugs, userId });
  const bySlug = new Map(existing.map((t) => [t.slug, t.id]));

  const toInsert = normalised.filter((n) => !bySlug.has(n.slug));
  if (toInsert.length === 0) return bySlug;

  await tagRepository.insertTags(
    toInsert.map((n) => ({ slug: n.slug, label: n.label, userId }))
  );

  // Re-fetch to capture any rows that conflicted (race condition) rather than
  // relying solely on the rows returned by INSERT ... ON CONFLICT DO NOTHING.
  const resolved = await tagRepository.getTagsBySlugs({ slugs, userId });
  return new Map(resolved.map((t) => [t.slug, t.id]));
}
