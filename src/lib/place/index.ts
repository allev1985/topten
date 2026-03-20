/**
 * Place Service public API
 * @module lib/place
 */

export {
  getPlacesByList,
  getAvailablePlacesForList,
  getAllPlacesByUser,
  createPlace,
  addExistingPlaceToList,
  updatePlace,
  deletePlaceFromList,
  deletePlace,
} from "./service";

export { PlaceServiceError } from "./errors";

export type {
  PlaceSummary,
  PlaceRecord,
  CreatePlaceResult,
  AddExistingPlaceResult,
  UpdatePlaceResult,
  RemovePlaceFromListResult,
  PlaceWithListCount,
  DeletePlaceResult,
} from "./types";
