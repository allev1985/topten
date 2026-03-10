# Contract: GooglePlacesService

**Module**: `src/lib/services/google-places/service.ts`  
**Exported from**: `src/lib/services/google-places/index.ts`

---

## Public API

### `searchPlaces(query: string): Promise<GooglePlaceResult[]>`

Searches Google Places API (New) Text Search for places matching the query string.

**Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| `query` | `string` | Must be ≥ 3 characters (trimmed). Throws `INVALID_QUERY` otherwise. |

**Returns**: `Promise<GooglePlaceResult[]>` — up to 5 results, ordered by Google relevance.

**Throws `GooglePlacesServiceError`**:
| Code | Condition |
|------|-----------|
| `INVALID_QUERY` | `query.trim().length < 3` — no HTTP request is made |
| `CONFIGURATION_ERROR` | `GOOGLE_PLACES_API_KEY` env var is missing or empty |
| `API_ERROR` | Google returned a non-200 status or a structured API error |
| `TIMEOUT` | Request exceeded 5000 ms |

**HTTP call made**:
```http
POST https://places.googleapis.com/v1/places:searchText
Content-Type: application/json
X-Goog-Api-Key: {GOOGLE_PLACES_API_KEY}
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location,places.photos

{
  "textQuery": "{query}",
  "pageSize": 5
}
```

**Response mapping**:
| API field | `GooglePlaceResult` field |
|-----------|--------------------------|
| `places[n].id` | `googlePlaceId` |
| `places[n].displayName.text` | `name` |
| `places[n].formattedAddress` | `formattedAddress` |
| `places[n].location.latitude` | `latitude` |
| `places[n].location.longitude` | `longitude` |
| `places[n].photos[0].name` | `photoResourceName` (null if absent) |

---

### `resolvePhotoUri(photoResourceName: string): Promise<string>`

Resolves a Google Places photo resource name to a usable image URL.

**Parameters**:
| Param | Type | Constraints |
|-------|------|-------------|
| `photoResourceName` | `string` | Must be non-empty. Format: `places/{placeId}/photos/{photoId}` |

**Returns**: `Promise<string>` — the resolved `photoUri` (e.g., `https://lh3.googleusercontent.com/...`).

**Throws `GooglePlacesServiceError`**:
| Code | Condition |
|------|-----------|
| `INVALID_QUERY` | `photoResourceName` is empty |
| `CONFIGURATION_ERROR` | API key missing |
| `API_ERROR` | Non-200 response or expired photo name (404) |
| `TIMEOUT` | Request exceeded 5000 ms |

**HTTP call made**:
```http
GET https://places.googleapis.com/v1/{photoResourceName}/media
    ?key={GOOGLE_PLACES_API_KEY}
    &maxWidthPx=800
    &skipHttpRedirect=true
```

---

## Constraints

- This module MUST NOT import `@/db`, `@/lib/place`, or any React/UI modules.
- The API key MUST be read from `process.env.GOOGLE_PLACES_API_KEY` at call time (not module load time, to support test environments).
- All requests MUST use `AbortSignal.timeout(5000)`.
- Both functions MUST log request start/end with `console.info("[GooglePlacesService:{functionName}]"` and errors with `console.error`.
