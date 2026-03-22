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
}

/** Entity kinds that can be tagged. */
export type TaggableKind = "list" | "place";
