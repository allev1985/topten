/**
 * Types for the Google Places integration service.
 * @module lib/services/google-places/types
 */

/**
 * A single place result returned by the Google Places integration service.
 * Mapped from the New Places API (Text Search) response.
 */
export interface GooglePlaceResult {
  /** Google-assigned place identifier (e.g. "ChIJ...") */
  googlePlaceId: string;
  /** Display name of the place */
  name: string;
  /** Full formatted address */
  formattedAddress: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /**
   * Resource name of the first photo for this place.
   * Format: "places/{placeId}/photos/{photoId}"
   * Used to resolve heroImageUrl via resolvePhotoUri() — NOT stored in the database.
   * Null when no photos are returned for this place.
   */
  photoResourceName: string | null;
}

/**
 * Known error codes for the Google Places integration service.
 */
export type GooglePlacesErrorCode =
  /** query is too short (< 3 chars trimmed) — no HTTP request made */
  | "INVALID_QUERY"
  /** non-200 status or structured API error returned by Google */
  | "API_ERROR"
  /** request exceeded the 5 000 ms AbortSignal timeout */
  | "TIMEOUT"
  /** GOOGLE_PLACES_API_KEY env var is missing or empty */
  | "CONFIGURATION_ERROR";

/**
 * Typed error thrown by GooglePlacesService.
 * Server Actions catch this and map codes to user-safe ActionState messages.
 */
export class GooglePlacesServiceError extends Error {
  public readonly code: GooglePlacesErrorCode;
  public readonly cause: unknown;

  constructor(code: GooglePlacesErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "GooglePlacesServiceError";
    this.code = code;
    this.cause = cause;
  }
}
