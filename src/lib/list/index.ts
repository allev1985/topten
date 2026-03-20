/**
 * List Service public API
 * @module lib/list
 */

export {
  getListsByUser,
  createList,
  updateList,
  deleteList,
  publishList,
  unpublishList,
} from "./service";

export { ListServiceError } from "./errors";

export type {
  ListSummary,
  ListRecord,
  CreateListResult,
  UpdateListResult,
  DeleteListResult,
  PublishListResult,
  UnpublishListResult,
} from "./types";
