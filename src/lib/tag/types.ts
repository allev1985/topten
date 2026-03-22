/**
 * Type definitions for the Tag Service
 * @module lib/tag/types
 */

/**
 * Minimal tag representation used for display and selection.
 */
export interface TagSummary {
  id: string;
  name: string;
  source: "system" | "custom";
}

/**
 * Full tag record returned after creation.
 */
export interface TagRecord {
  id: string;
  name: string;
  source: "system" | "custom";
  createdAt: Date;
}

/** Result of a successful createTag operation */
export interface CreateTagResult {
  tag: TagRecord;
}

/** Result of a successful setListTags operation */
export interface SetListTagsResult {
  listId: string;
  tags: TagSummary[];
}

/** Result of a successful setPlaceTags operation */
export interface SetPlaceTagsResult {
  placeId: string;
  tags: TagSummary[];
}
