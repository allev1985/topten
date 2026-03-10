/**
 * Error factory functions for the Google Places integration service.
 * @module lib/services/google-places/errors
 */

import { GooglePlacesServiceError } from "./types";
import type { GooglePlacesErrorCode } from "./types";

export { GooglePlacesServiceError };
export type { GooglePlacesErrorCode };

/** Factory: query too short — no HTTP request made. */
export function invalidQueryError(query: string): GooglePlacesServiceError {
  return new GooglePlacesServiceError(
    "INVALID_QUERY",
    `Search query must be at least 3 characters (got: "${query.trim()}")`
  );
}

/** Factory: GOOGLE_PLACES_API_KEY is missing or empty. */
export function configurationError(): GooglePlacesServiceError {
  return new GooglePlacesServiceError(
    "CONFIGURATION_ERROR",
    "GOOGLE_PLACES_API_KEY is not configured"
  );
}

/**
 * Factory: Google returned a non-200 status or structured API error.
 * @param status - HTTP status code (or 0 for structured API error)
 * @param message - Error message from the API response body
 */
export function apiError(
  status: number,
  message: string,
  cause?: unknown
): GooglePlacesServiceError {
  return new GooglePlacesServiceError(
    "API_ERROR",
    `Google Places API error (HTTP ${status}): ${message}`,
    cause
  );
}

/** Factory: request exceeded the AbortSignal timeout. */
export function timeoutError(cause?: unknown): GooglePlacesServiceError {
  return new GooglePlacesServiceError(
    "TIMEOUT",
    "Google Places request timed out after 5 000 ms",
    cause
  );
}
