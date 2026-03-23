/**
 * Tag Service
 *
 * Centralised service for tag vocabulary and entity-tag attachments.
 * Delegates all DB access to the tag repository.
 * Used by tag server actions — never called from client code.
 *
 * Public API:
 *   - searchTags       — autocomplete system + user custom tags by slug prefix
 *   - getTagsForList   — read tags on a list
 *   - getTagsForPlace  — read tags on a place
 *   - setListTags      — replace the full tag set on a list
 *   - setPlaceTags     — replace the full tag set on a place
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
import { normaliseTagSlug, normaliseTagLabel } from "./slug";
import { config } from "@/lib/config";
import type { TagSummary, EntityTagSummary, SetTagsResult, TaggableKind } from "./types";

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
 * Fetch all active tags attached to a list.
 *
 * @param listId - List UUID
 * @returns Tag summaries ordered by label
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function getTagsForList(listId: string): Promise<TagSummary[]> {
  try {
    return await tagRepository.getTagsForList(listId);
  } catch (err) {
    log.error({ method: "getTagsForList", listId, err }, "DB error");
    throw tagServiceError("Failed to load tags.", err);
  }
}

/**
 * Fetch all active tags attached to a place.
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
 * Batch-fetch active tags for multiple lists.
 *
 * @param listIds - List UUIDs
 * @returns One EntityTagSummary per (list, tag) pair; includes entityId for grouping
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function getTagsForLists(
  listIds: string[]
): Promise<EntityTagSummary[]> {
  try {
    return await tagRepository.getTagsForLists(listIds);
  } catch (err) {
    log.error({ method: "getTagsForLists", err }, "DB error");
    throw tagServiceError("Failed to load tags.", err);
  }
}

/**
 * Batch-fetch active tags for multiple places.
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

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Replace the full tag set on a list.
 *
 * Unknown labels are inserted as custom tags on the fly; known labels are
 * reused. Previously-attached tags not in the new set are soft-deleted.
 * Previously-removed tags that reappear are restored in place.
 *
 * @param listId - List UUID
 * @param userId - Authenticated user's id (ownership check)
 * @param labels - Desired tag labels (raw; normalised internally)
 * @returns The resulting tag summaries on the list
 * @throws {TagServiceError} code NOT_FOUND if list missing/deleted/wrong owner
 * @throws {TagServiceError} code VALIDATION_ERROR if labels invalid or over limit
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function setListTags({
  listId,
  userId,
  labels,
}: {
  listId: string;
  userId: string;
  labels: string[];
}): Promise<SetTagsResult> {
  return setEntityTags({ kind: "list", entityId: listId, userId, labels });
}

/**
 * Replace the full tag set on a place.
 *
 * Unknown labels are inserted as custom tags on the fly; known labels are
 * reused. Previously-attached tags not in the new set are soft-deleted.
 * Previously-removed tags that reappear are restored in place.
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
  return setEntityTags({ kind: "place", entityId: placeId, userId, labels });
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
 */
async function resolveTagIds(
  normalised: NormalisedTag[],
  userId: string
): Promise<Map<string, string>> {
  const slugs = normalised.map((n) => n.slug);
  const existing = await tagRepository.getTagsBySlugs({ slugs, userId });
  const bySlug = new Map(existing.map((t) => [t.slug, t.id]));

  const toInsert = normalised.filter((n) => !bySlug.has(n.slug));
  if (toInsert.length > 0) {
    const inserted = await tagRepository.insertTags(
      toInsert.map((n) => ({ slug: n.slug, label: n.label, userId }))
    );
    for (const t of inserted) bySlug.set(t.slug, t.id);
  }

  return bySlug;
}

/**
 * Shared implementation for setListTags / setPlaceTags.
 */
async function setEntityTags({
  kind,
  entityId,
  userId,
  labels,
}: {
  kind: TaggableKind;
  entityId: string;
  userId: string;
  labels: string[];
}): Promise<SetTagsResult> {
  log.info(
    { method: "setEntityTags", userId, kind, entityId, count: labels.length },
    "Setting tags"
  );

  const normalised = normaliseLabels(labels);
  if (normalised.length > config.tags.maxPerEntity) {
    throw validationError(
      `A maximum of ${config.tags.maxPerEntity} tags is allowed.`
    );
  }

  // Ownership check — for lists, also captures the slug for cache invalidation
  let listSlug: string | undefined;
  if (kind === "list") {
    const listOwnership = await tagRepository.isListOwnedByUser({
      listId: entityId,
      userId,
    });
    if (!listOwnership) throw notFoundError();
    listSlug = listOwnership.slug;
  } else {
    const placeOwned = await tagRepository.isPlaceOwnedByUser({
      placeId: entityId,
      userId,
    });
    if (!placeOwned) throw notFoundError();
  }

  try {
    const tagIdsBySlug = await resolveTagIds(normalised, userId);
    const desiredIds = new Set(tagIdsBySlug.values());

    const junctions =
      kind === "list"
        ? await tagRepository.getListTagJunctions(entityId)
        : await tagRepository.getPlaceTagJunctions(entityId);

    const toRestore: string[] = [];
    const toSoftDelete: string[] = [];
    const existingTagIds = new Set<string>();

    for (const j of junctions) {
      existingTagIds.add(j.tagId);
      const wanted = desiredIds.has(j.tagId);
      if (wanted && j.deletedAt !== null) toRestore.push(j.id);
      if (!wanted && j.deletedAt === null) toSoftDelete.push(j.id);
    }

    const toInsert = Array.from(desiredIds).filter(
      (id) => !existingTagIds.has(id)
    );

    if (kind === "list") {
      await tagRepository.restoreListTags(toRestore);
      await tagRepository.softDeleteListTags(toSoftDelete);
      await tagRepository.insertListTags({
        listId: entityId,
        tagIds: toInsert,
      });
    } else {
      await tagRepository.restorePlaceTags(toRestore);
      await tagRepository.softDeletePlaceTags(toSoftDelete);
      await tagRepository.insertPlaceTags({
        placeId: entityId,
        tagIds: toInsert,
      });
    }

    const [result, listSlugs] = await Promise.all([
      kind === "list"
        ? tagRepository.getTagsForList(entityId)
        : tagRepository.getTagsForPlace(entityId),
      kind === "place"
        ? placeRepository.getPublishedListSlugsForPlace({
            placeId: entityId,
            userId,
          })
        : Promise.resolve(undefined),
    ]);

    log.info(
      {
        method: "setEntityTags",
        userId,
        kind,
        entityId,
        inserted: toInsert.length,
        restored: toRestore.length,
        removed: toSoftDelete.length,
      },
      "Tags set"
    );

    return { tags: result, listSlug, listSlugs };
  } catch (err) {
    if (err instanceof TagServiceError) throw err;
    log.error(
      { method: "setEntityTags", userId, kind, entityId, err },
      "DB error"
    );
    throw tagServiceError("Failed to update tags. Please try again.", err);
  }
}
