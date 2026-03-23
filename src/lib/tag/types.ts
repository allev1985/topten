/**
 * Type definitions for the Tag Service
 * @module lib/tag/types
 */

/**
 * Minimal tag representation for display and autocomplete.
 */
export interface TagSummary {
  id: string;
  slug: string;
  label: string;
  isSystem: boolean;
}

/**
 * Full tag record returned after a mutation.
 */
export interface TagRecord {
  id: string;
  slug: string;
  label: string;
  isSystem: boolean;
  userId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

/** Result of a setListTags / setPlaceTags operation. */
export interface SetTagsResult {
  tags: TagSummary[];
  /** Slug of the updated list. Present only for setListTags results. */
  listSlug?: string;
  /** Slugs of published lists that contain the updated place. Present only for setPlaceTags results. */
  listSlugs?: string[];
}

/**
 * Tag summary with the entity it is attached to.
 * Returned by batch tag-fetch operations (getTagsForLists, getTagsForPlaces).
 */
export interface EntityTagSummary extends TagSummary {
  entityId: string;
}

/** Entity kinds that can be tagged. */
export type TaggableKind = "list" | "place";
