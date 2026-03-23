/**
 * Tag Service public API
 * @module lib/tag
 */

export {
  searchTags,
  getTagsForPlace,
  getTagsForPlaces,
  getTagsForListsViaPlaces,
  setPlaceTags,
} from "./service";

export { TagServiceError } from "./errors";

export { normaliseTagSlug, normaliseTagLabel } from "./helpers/slug";

export { SYSTEM_TAG_TAXONOMY, findTaxonomyEntry } from "./system-tags";

export type {
  TagSummary,
  EntityTagSummary,
  TagRecord,
  SetTagsResult,
} from "./types";
export type { TaxonomyEntry } from "./system-tags";
