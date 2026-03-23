/**
 * Tag Service public API
 * @module lib/tag
 */

export {
  searchTags,
  getTagsForList,
  getTagsForPlace,
  getTagsForLists,
  getTagsForPlaces,
  setListTags,
  setPlaceTags,
} from "./service";

export { TagServiceError } from "./errors";

export { normaliseTagSlug, normaliseTagLabel } from "./slug";

export {
  GOOGLE_PLACES_TAXONOMY,
  findTaxonomyEntry,
} from "./google-places-taxonomy";

export type {
  TagSummary,
  EntityTagSummary,
  TagRecord,
  SetTagsResult,
  TaggableKind,
} from "./types";
export type { TaxonomyEntry } from "./google-places-taxonomy";
