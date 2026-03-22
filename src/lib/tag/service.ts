/**
 * Tag Service
 *
 * Centralised service for all tag domain operations.
 * Delegates all DB access to the tag repository.
 * Used by tag server actions — never called from client code.
 *
 * Public API:
 *   - searchTags       — autocomplete search for tags by name prefix
 *   - getTagsByList    — fetch all active tags for a list
 *   - getTagsByPlace   — fetch all active tags for a place
 *   - createTag        — create a new custom tag
 *   - setListTags      — replace all tags on a list (idempotent)
 *   - setPlaceTags     — replace all tags on a place (idempotent)
 *   - seedSystemTags   — upsert Google Places taxonomy as system tags
 *
 * @module tag/service
 */

import * as tagRepository from "@/db/repositories/tag.repository";
import {
  TagServiceError,
  tagServiceError,
  duplicateTagError,
  validationError,
} from "./errors";
import { createServiceLogger } from "@/lib/services/logging";
import { GOOGLE_PLACES_TYPES } from "./seed";
import type {
  TagSummary,
  CreateTagResult,
  SetListTagsResult,
  SetPlaceTagsResult,
} from "./types";

const log = createServiceLogger("tag-service");

// ─── Tag name normalisation ──────────────────────────────────────────────────

const TAG_NAME_REGEX = /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/;

/**
 * Normalise a tag name to lowercase kebab-case.
 *
 * @param raw - Raw user input
 * @returns Normalised tag name
 */
export function normaliseTagName(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validate a normalised tag name against the accepted pattern.
 *
 * @param name - Normalised tag name
 * @returns True if valid
 */
export function isValidTagName(name: string): boolean {
  return TAG_NAME_REGEX.test(name);
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Search tags by name prefix for autocomplete.
 *
 * @param query - Search prefix (min 1 char after normalisation)
 * @param limit - Maximum results (default 20)
 * @returns Array of matching TagSummary objects
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function searchTags(
  query: string,
  limit = 20
): Promise<TagSummary[]> {
  log.debug({ method: "searchTags", query }, "Searching tags");

  const normalised = normaliseTagName(query);
  if (!normalised) return [];

  try {
    return await tagRepository.searchTags(normalised, limit);
  } catch (err) {
    log.error({ method: "searchTags", err }, "DB error");
    throw tagServiceError("Failed to search tags. Please try again.", err);
  }
}

/**
 * Fetch all active tags for a list.
 *
 * @param listId - The list UUID
 * @returns Array of TagSummary objects
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function getTagsByList(listId: string): Promise<TagSummary[]> {
  log.debug({ method: "getTagsByList", listId }, "Fetching list tags");

  try {
    return await tagRepository.getTagsByList(listId);
  } catch (err) {
    log.error({ method: "getTagsByList", listId, err }, "DB error");
    throw tagServiceError("Failed to load tags. Please try again.", err);
  }
}

/**
 * Fetch all active tags for a place.
 *
 * @param placeId - The place UUID
 * @returns Array of TagSummary objects
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function getTagsByPlace(placeId: string): Promise<TagSummary[]> {
  log.debug({ method: "getTagsByPlace", placeId }, "Fetching place tags");

  try {
    return await tagRepository.getTagsByPlace(placeId);
  } catch (err) {
    log.error({ method: "getTagsByPlace", placeId, err }, "DB error");
    throw tagServiceError("Failed to load tags. Please try again.", err);
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Create a new custom tag.
 *
 * @param name - Raw tag name (will be normalised)
 * @returns CreateTagResult with the new tag record
 * @throws {TagServiceError} code VALIDATION_ERROR if name is invalid
 * @throws {TagServiceError} code DUPLICATE_TAG if name already exists
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function createTag(name: string): Promise<CreateTagResult> {
  const normalised = normaliseTagName(name);

  log.info({ method: "createTag", name: normalised }, "Creating tag");

  if (!isValidTagName(normalised)) {
    throw validationError(
      "Tag name must be 2-50 lowercase characters (letters, numbers, hyphens)."
    );
  }

  try {
    const existing = await tagRepository.getTagByName(normalised);
    if (existing) {
      throw duplicateTagError();
    }

    const tag = await tagRepository.insertTag({
      name: normalised,
      source: "custom",
    });

    log.info(
      { method: "createTag", tagId: tag.id, name: tag.name },
      "Tag created"
    );

    return { tag };
  } catch (err) {
    if (err instanceof TagServiceError) throw err;
    log.error({ method: "createTag", err }, "DB error");
    throw tagServiceError("Failed to create tag. Please try again.", err);
  }
}

/**
 * Replace all tags on a list (idempotent).
 * Resolves tag names to IDs, creating custom tags as needed.
 *
 * @param listId - The list UUID
 * @param tagNames - Array of tag names (will be normalised)
 * @returns SetListTagsResult with the updated tag set
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function setListTags(
  listId: string,
  tagNames: string[]
): Promise<SetListTagsResult> {
  log.info(
    { method: "setListTags", listId, tagCount: tagNames.length },
    "Setting list tags"
  );

  try {
    const tagIds = await resolveTagNames(tagNames);
    await tagRepository.setListTags(listId, tagIds);
    const tags = await tagRepository.getTagsByList(listId);

    log.info(
      { method: "setListTags", listId, tagCount: tags.length },
      "List tags updated"
    );

    return { listId, tags };
  } catch (err) {
    if (err instanceof TagServiceError) throw err;
    log.error({ method: "setListTags", listId, err }, "DB error");
    throw tagServiceError("Failed to update list tags. Please try again.", err);
  }
}

/**
 * Replace all tags on a place (idempotent).
 * Resolves tag names to IDs, creating custom tags as needed.
 *
 * @param placeId - The place UUID
 * @param tagNames - Array of tag names (will be normalised)
 * @returns SetPlaceTagsResult with the updated tag set
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function setPlaceTags(
  placeId: string,
  tagNames: string[]
): Promise<SetPlaceTagsResult> {
  log.info(
    { method: "setPlaceTags", placeId, tagCount: tagNames.length },
    "Setting place tags"
  );

  try {
    const tagIds = await resolveTagNames(tagNames);
    await tagRepository.setPlaceTags(placeId, tagIds);
    const tags = await tagRepository.getTagsByPlace(placeId);

    log.info(
      { method: "setPlaceTags", placeId, tagCount: tags.length },
      "Place tags updated"
    );

    return { placeId, tags };
  } catch (err) {
    if (err instanceof TagServiceError) throw err;
    log.error({ method: "setPlaceTags", placeId, err }, "DB error");
    throw tagServiceError(
      "Failed to update place tags. Please try again.",
      err
    );
  }
}

/**
 * Seed system tags from the Google Places taxonomy.
 * Idempotent — existing tags are left unchanged.
 *
 * @returns Number of tags upserted
 * @throws {TagServiceError} code SERVICE_ERROR on DB failure
 */
export async function seedSystemTags(): Promise<number> {
  log.info({ method: "seedSystemTags" }, "Seeding system tags");

  try {
    let count = 0;
    for (const name of GOOGLE_PLACES_TYPES) {
      await tagRepository.upsertTag({ name, source: "system" });
      count++;
    }

    log.info({ method: "seedSystemTags", count }, "System tags seeded");
    return count;
  } catch (err) {
    log.error({ method: "seedSystemTags", err }, "Seed failed");
    throw tagServiceError("Failed to seed system tags.", err);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve an array of tag names to tag IDs.
 * Creates custom tags for any names that don't yet exist.
 *
 * @param names - Array of raw tag names
 * @returns Array of tag UUIDs
 */
async function resolveTagNames(names: string[]): Promise<string[]> {
  const ids: string[] = [];

  for (const raw of names) {
    const normalised = normaliseTagName(raw);
    if (!normalised || !isValidTagName(normalised)) continue;

    const tag = await tagRepository.upsertTag({
      name: normalised,
      source: "custom",
    });
    ids.push(tag.id);
  }

  return [...new Set(ids)];
}
