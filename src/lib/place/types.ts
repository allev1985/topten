/**
 * Type definitions for the Place Service
 * @module lib/place/types
 */

/** Minimal place data sufficient to render a place card. */
export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
  description: string | null;
  heroImageUrl: string | null;
}

/**
 * Full place record returned after a mutation.
 */
export interface PlaceRecord {
  id: string;
  userId: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  description: string | null;
  heroImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Result of a successful createPlace operation */
export interface CreatePlaceResult {
  place: PlaceRecord;
  /** Present when the place was attached to a list at creation time */
  listPlaceId?: string;
}

/** Result of a successful addExistingPlaceToList operation */
export interface AddExistingPlaceResult {
  listPlaceId: string;
}

/** Result of a successful updatePlace operation */
export interface UpdatePlaceResult {
  place: Pick<PlaceRecord, "id" | "description" | "updatedAt">;
}

/** Result of a successful deletePlaceFromList operation */
export interface RemovePlaceFromListResult {
  success: true;
}

/**
 * A place record annotated with the count of active lists it currently belongs to.
 * Returned by getAllPlacesByUser.
 */
export interface PlaceWithListCount {
  id: string;
  name: string;
  address: string;
  description: string | null;
  heroImageUrl: string | null;
  /** Number of active (non-deleted) ListPlace rows for this place */
  activeListCount: number;
}

/** Result of a successful deletePlace operation */
export interface DeletePlaceResult {
  /** Number of ListPlace rows that were cascade-soft-deleted */
  deletedListPlaceCount: number;
}
