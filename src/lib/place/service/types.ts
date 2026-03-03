/**
 * Type definitions for the Place Service
 * @module place/service/types
 */

import type { PlaceSummary } from "@/types/place";

export type { PlaceSummary };

/**
 * Full place record returned after a mutation.
 */
export interface PlaceRecord {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Result of a successful createPlace operation */
export interface CreatePlaceResult {
  place: PlaceRecord;
  listPlaceId: string;
}

/** Result of a successful addExistingPlaceToList operation */
export interface AddExistingPlaceResult {
  listPlaceId: string;
}

/** Result of a successful updatePlace operation */
export interface UpdatePlaceResult {
  place: Pick<PlaceRecord, "id" | "name" | "address" | "updatedAt">;
}

/** Result of a successful deletePlaceFromList operation */
export interface RemovePlaceFromListResult {
  success: true;
}
