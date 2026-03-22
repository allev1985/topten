/**
 * Tag Service public API
 * @module lib/tag
 */

export {
  searchTags,
  getTagsByList,
  getTagsByPlace,
  createTag,
  setListTags,
  setPlaceTags,
  seedSystemTags,
  normaliseTagName,
  isValidTagName,
} from "./service";

export { TagServiceError } from "./errors";

export type {
  TagSummary,
  TagRecord,
  CreateTagResult,
  SetListTagsResult,
  SetPlaceTagsResult,
} from "./types";
