# Research: Google Places Integration

**Branch**: `008-google-places-integration` | **Date**: 2026-03-10

---

## 1. API Endpoint Selection

**Decision**: Use the **Google Places API (New)** — specifically **Text Search (New)**.

**Rationale**: The user explicitly requested the New API. Text Search (New) is the correct endpoint for name-based place lookup; it accepts a free-text query and returns ranked matches.

**Endpoint**:
```
POST https://places.googleapis.com/v1/places:searchText
```

**Authentication**: `X-Goog-Api-Key: {API_KEY}` HTTP header (not a query param — keeps the key out of URL logs).

**Alternatives considered**:
- Autocomplete (New) — designed for interactive type-ahead but returns only place IDs and display names; a second Place Details call would be needed for coordinates and photos. Two round-trips per suggestion vs one. Rejected in favour of Text Search (New) which returns all needed fields in one call.
- Legacy Places API (`maps.googleapis.com/maps/api/place/textsearch/json`) — deprecated, will be sunset. Rejected per user instruction.

---

## 2. Field Mask Selection

**Decision**:
```
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location,places.editorialSummary,places.photos
```

| Field | Maps to | SKU tier |
|-------|---------|----------|
| `places.id` | `googlePlaceId` | Essentials (ID Only) |
| `places.displayName.text` | `name` | Pro |
| `places.formattedAddress` | `address` | Pro |
| `places.location` (`latitude`, `longitude`) | `latitude`, `longitude` | Pro |
| `places.editorialSummary.text` | `description` | **Enterprise + Atmosphere** |
| `places.photos[0].name` | used to resolve `heroImageUrl` | Pro |

**Billing implication**: Including `places.editorialSummary` escalates the entire request to the **Text Search Enterprise + Atmosphere SKU** (most expensive tier). Since `description` is a specified feature requirement, this is accepted. The `pageSize` is capped at 5 to minimise cost per search.

**Alternatives considered**: Omitting `editorialSummary` and sourcing descriptions from another field. No acceptable alternative field exists in the New API for editorial summaries. Accepted.

---

## 3. Photo Resolution Strategy

**Decision**: **Lazy two-step resolution** — fetch the photo URI only when the user selects a result, not for every search result.

**How the New API works**:
1. Text Search (New) with `places.photos` in the field mask returns `photos[].name` — a **resource name string** (e.g., `places/ChIJ.../photos/Aaw_...`), not a URL.
2. A separate **Place Photos (New)** GET resolves it to a usable `photoUri`:
   ```
   GET https://places.googleapis.com/v1/{photoName}/media
       ?key={API_KEY}
       &maxWidthPx=800
       &skipHttpRedirect=true
   ```
   Response: `{ "photoUri": "https://lh3.googleusercontent.com/..." }`

**Why lazy**: Resolving photos for every result in a search response (up to 5 results) would require up to 5 additional HTTP calls per keystroke. With lazy resolution, only 1 photo call is made — when the user selects a specific result.

**What is stored**: The resolved `photoUri` (the `lh3.googleusercontent.com` URL) is stored as `hero_image_url` on the `Place` record. Photo resource names are **not stored** — they can expire per Google Maps Platform Terms of Service (Section 3.2.3(b)).

**Alternatives considered**: Eager resolution upfront for all results — rejected due to cost and latency. Storing the photo resource name and re-resolving on display — rejected because resource names can expire, causing broken images for saved places.

---

## 4. Source Tracking

**Decision**: No source-tracking column or conditional is needed. All places are created via Google Places; there is no manual creation path.

**Rationale**: Since every `Place` record always has a real `google_place_id`, there is nothing to distinguish. All non-description fields are unconditionally immutable after creation — `updatePlace` enforces this without branching on any source flag.

**Alternatives considered**: 
- `google_sourced boolean` or `google_place_id IS NOT NULL` conditional — both rejected as unnecessary given the single creation path.

---

## 5. Server Action Design for Search

**Decision**: Add a new `searchPlacesAction` Server Action in `src/actions/place-actions.ts`.

**Rationale**: The constitution mandates no new API routes unless there is a callback requirement (none here). The search is triggered from a client component; the action is the correct server-side bridge per the architecture.

**Flow**:
1. Client component debounces input (300 ms) → calls `searchPlacesAction(query)`.
2. Action authenticates (requires signed-in user), validates query (≥ 3 chars), calls `GooglePlacesService.searchPlaces(query)`.
3. Returns `GooglePlaceResult[]` (no DB writes at this stage).
4. When user selects a result: client calls `searchGooglePlacesAction` with `resolvePhoto: true` and the `photoResourceName`, OR a dedicated `resolveGooglePlacePhotoAction` resolves the URI server-side before the form is finalised. **Preferred**: a single `resolveGooglePlacePhotoAction(photoResourceName)` for clean separation.

---

## 6. `updatePlace` Enforcement Strategy

**Decision**: The `updatePlace` service function unconditionally enforces that only `description` may be updated. Any attempt to update `name`, `address`, `latitude`, `longitude`, `hero_image_url`, or `google_place_id` is rejected. No source-type check is needed — there is only one place type.

**Error code**: New `PlaceServiceErrorCode` value `'IMMUTABLE_FIELD'` for rejected field updates on Google-sourced places.

---

## 7. pageSize

**Decision**: Request `pageSize: 5` from Text Search (New).

**Rationale**: A typeahead autocomplete UX is best served by a short, scannable list. 5 results balances discovery with cost (fewer billed items per query). Users can refine their search if the right place isn't in the top 5.

---

## 8. Environment Variable Naming

**Decision**: `GOOGLE_PLACES_API_KEY` (already referenced in the constitution under Security Boundaries § VIII).

**Rule**: Must NOT be prefixed `NEXT_PUBLIC_`. Must only be read inside `GooglePlacesService` which runs server-side only.
