/**
 * Google Places integration service.
 *
 * Pure HTTP boundary — no database or UI imports.
 * Uses the Google Places API (New):
 *   - Text Search (New): POST https://places.googleapis.com/v1/places:searchText
 *   - Place Photos (New): GET  https://places.googleapis.com/v1/{photoName}/media
 *
 * API key is read from {@link config.googlePlaces} in lib/config.
 *
 * Security: the API key is NEVER logged.
 *
 * @module lib/services/google-places/service
 */

import { config } from "@/lib/config";
import { createServiceLogger } from "@/lib/services/logging";
import type { GooglePlaceResult } from "./types";
import {
  invalidQueryError,
  configurationError,
  apiError,
  timeoutError,
} from "./errors";

const log = createServiceLogger("google-places");

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = "https://places.googleapis.com/v1";
const TEXT_SEARCH_URL = `${BASE_URL}/places:searchText`;
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.photos";
const PAGE_SIZE = 5;
const TIMEOUT_MS = 5_000;

// ─── Raw API response shapes ──────────────────────────────────────────────────

interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  photos?: Array<{ name?: string }>;
}

interface TextSearchResponse {
  places?: RawPlace[];
  error?: { message?: string; code?: number };
}

interface PhotoMediaResponse {
  photoUri?: string;
  error?: { message?: string; code?: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = config.googlePlaces.apiKey;
  if (!key || !key.trim()) {
    throw configurationError();
  }
  return key.trim();
}

function mapPlace(raw: RawPlace): GooglePlaceResult {
  return {
    googlePlaceId: raw.id ?? "",
    name: raw.displayName?.text ?? "",
    formattedAddress: raw.formattedAddress ?? "",
    latitude: raw.location?.latitude ?? 0,
    longitude: raw.location?.longitude ?? 0,
    photoResourceName: raw.photos?.[0]?.name ?? null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search Google Places (New) Text Search for places matching the query.
 *
 * @param query - Free-text search string; must be ≥ 3 characters (trimmed).
 * @returns Up to 5 GooglePlaceResult objects ordered by Google relevance.
 * @throws {GooglePlacesServiceError} INVALID_QUERY  — query too short
 * @throws {GooglePlacesServiceError} CONFIGURATION_ERROR — API key missing
 * @throws {GooglePlacesServiceError} API_ERROR      — non-200 or Google error body
 * @throws {GooglePlacesServiceError} TIMEOUT        — request exceeded 5 000 ms
 */
export async function searchPlaces(
  query: string
): Promise<GooglePlaceResult[]> {
  if (query.trim().length < 3) {
    throw invalidQueryError(query);
  }

  const apiKey = getApiKey();
  const t0 = Date.now();
  log.debug(
    { method: "searchPlaces", queryLen: query.trim().length },
    "Starting text search request"
  );

  let response: Response;
  try {
    response = await fetch(TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query.trim(),
        pageSize: PAGE_SIZE,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const durationMs = Date.now() - t0;
    if (
      err instanceof DOMException &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      log.error(
        { method: "searchPlaces", durationMs, err },
        "Request timed out"
      );
      throw timeoutError(err);
    }
    // Fallback for environments where DOMException is not an instance of itself
    if (err instanceof Error && err.name === "AbortError") {
      log.error(
        { method: "searchPlaces", durationMs, err },
        "Request timed out"
      );
      throw timeoutError(err);
    }
    log.error(
      { method: "searchPlaces", durationMs, err },
      "Network request failed"
    );
    throw apiError(0, "Network request failed", err);
  }

  let body: TextSearchResponse;
  try {
    body = (await response.json()) as TextSearchResponse;
  } catch (err) {
    const durationMs = Date.now() - t0;
    log.error(
      { method: "searchPlaces", durationMs, httpStatus: response.status, err },
      "Failed to parse response JSON"
    );
    throw apiError(response.status, "Failed to parse response JSON", err);
  }

  if (!response.ok || body.error) {
    const message = body.error?.message ?? response.statusText;
    const status = body.error?.code ?? response.status;
    const durationMs = Date.now() - t0;
    log.error(
      {
        method: "searchPlaces",
        durationMs,
        httpStatus: response.status,
        apiStatus: status,
      },
      `API error: ${message}`
    );
    throw apiError(status, message);
  }

  const resultCount = (body.places ?? []).length;
  log.info(
    {
      method: "searchPlaces",
      durationMs: Date.now() - t0,
      httpStatus: response.status,
      resultCount,
    },
    "Text search completed"
  );
  return (body.places ?? []).map(mapPlace);
}

/**
 * Resolve a Google Places photo resource name to a storable image URL.
 *
 * @param photoResourceName - Resource name string e.g. "places/{id}/photos/{photoId}".
 * @returns The resolved photoUri (e.g. https://lh3.googleusercontent.com/...).
 * @throws {GooglePlacesServiceError} INVALID_QUERY  — empty resource name
 * @throws {GooglePlacesServiceError} CONFIGURATION_ERROR — API key missing
 * @throws {GooglePlacesServiceError} API_ERROR      — non-200 or expired photo name
 * @throws {GooglePlacesServiceError} TIMEOUT        — request exceeded 5 000 ms
 */
export async function resolvePhotoUri(
  photoResourceName: string
): Promise<string> {
  if (!photoResourceName.trim()) {
    throw invalidQueryError(photoResourceName);
  }

  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}/${photoResourceName}/media`);
  url.searchParams.set("maxWidthPx", "800");
  url.searchParams.set("skipHttpRedirect", "true");
  // key as query param for GET (header auth not supported for photo media endpoint)
  url.searchParams.set("key", apiKey);

  const t0 = Date.now();
  log.debug({ method: "resolvePhotoUri" }, "Starting photo media request");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const durationMs = Date.now() - t0;
    if (
      err instanceof DOMException &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      log.error(
        { method: "resolvePhotoUri", durationMs, err },
        "Request timed out"
      );
      throw timeoutError(err);
    }
    if (err instanceof Error && err.name === "AbortError") {
      log.error(
        { method: "resolvePhotoUri", durationMs, err },
        "Request timed out"
      );
      throw timeoutError(err);
    }
    log.error(
      { method: "resolvePhotoUri", durationMs, err },
      "Network request failed"
    );
    throw apiError(0, "Network request failed", err);
  }

  let body: PhotoMediaResponse;
  try {
    body = (await response.json()) as PhotoMediaResponse;
  } catch (err) {
    const durationMs = Date.now() - t0;
    log.error(
      {
        method: "resolvePhotoUri",
        durationMs,
        httpStatus: response.status,
        err,
      },
      "Failed to parse response JSON"
    );
    throw apiError(response.status, "Failed to parse response JSON", err);
  }

  if (!response.ok || body.error) {
    const message = body.error?.message ?? response.statusText;
    const status = body.error?.code ?? response.status;
    const durationMs = Date.now() - t0;
    log.error(
      {
        method: "resolvePhotoUri",
        durationMs,
        httpStatus: response.status,
        apiStatus: status,
      },
      `API error: ${message}`
    );
    throw apiError(status, message);
  }

  if (!body.photoUri) {
    const durationMs = Date.now() - t0;
    log.error(
      { method: "resolvePhotoUri", durationMs, httpStatus: response.status },
      "Response missing photoUri"
    );
    throw apiError(response.status, "Response did not include photoUri");
  }

  log.info(
    {
      method: "resolvePhotoUri",
      durationMs: Date.now() - t0,
      httpStatus: response.status,
    },
    "Photo URI resolved"
  );
  return body.photoUri;
}
