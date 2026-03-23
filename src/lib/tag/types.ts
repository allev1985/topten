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
}

/** Result of a setPlaceTags operation. */
export interface SetTagsResult {
  tags: TagSummary[];
  /** Slugs of published lists that contain the updated place. */
  listSlugs?: string[];
}

/**
 * Tag summary with the entity it is attached to.
 * Returned by batch tag-fetch operations (getTagsForPlaces, getTagsForListsViaPlaces).
 */
export interface EntityTagSummary extends TagSummary {
  entityId: string;
}
