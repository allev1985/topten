# Feature Specification: Google Places Integration

**Feature Branch**: `008-google-places-integration`  
**Created**: 2026-03-10  
**Status**: Draft  
**Input**: User description: "I want to implement the use of the Google Places API when adding a place to search the google places api when a user attempts to search for the name, and prepopulate the necessary metadata. The google places api should be its own integration service."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Search Google Places When Adding a Place to a List (Priority: P1)

A signed-in user navigates to a list detail page and opens "Add a place". They type a name (e.g., "Nobu") in the search field. As they type, a live search is triggered against the Google Places API (in addition to the existing user-owned-places search). The results panel shows matching Google place suggestions — each showing a name and formatted address. The user selects a suggestion; the form auto-fills the name, address, latitude, longitude, `google_place_id`, a description, and a hero image URL from the API result. The user confirms and the place is saved with all real metadata pre-populated.

**Why this priority**: This is the core user-facing capability described in the request. It replaces the current friction of manually typing a full address and eliminates placeholder `google_place_id` / zero lat-long values. Delivering this story alone fulfils the primary ask.

**Independent Test**: Starting from a list detail page, a user types "Nobu" in the "Add a place" search field. At least one Google Places suggestion appears. The user selects the first result; the name, address, latitude, longitude, `google_place_id`, description, and hero image URL fields are populated from the API response. The user confirms; the saved `Place` record in the database contains those real API values and the place appears in the list.

**Acceptance Scenarios**:

1. **Given** the user opens "Add a place" and types at least 3 characters, **When** a debounce period elapses (~300 ms), **Then** a call is made to the Google Places integration service and matching place suggestions are displayed beneath the search field.
2. **Given** Google Places results are returned, **Then** each suggestion shows the place `name` and `formattedAddress` from the API; no internal IDs are exposed to the user.
3. **Given** the user selects a suggestion, **Then** the form fields for `name`, `address`, `latitude`, `longitude`, `googlePlaceId`, `description`, and `heroImageUrl` are pre-populated from the API result; `name`, `address`, `latitude`, `longitude`, `googlePlaceId`, and `heroImageUrl` are immediately rendered read-only — only `description` remains editable before confirming.
4. **Given** the user confirms a Google Places selection, **Then** the system checks whether a `Place` record with the same `googlePlaceId` already exists for this user.
   - If it does **not** exist: a new `Place` record is created with the real API metadata and a `ListPlace` row is created linking it to the list.
   - If it **does** exist: no new `Place` record is created; a `ListPlace` row is created linking the existing place to the list (same behaviour as "add existing place").
5. **Given** the user confirms a Google Place that already exists in the current list (same `googlePlaceId`), **Then** the operation is rejected with a user-friendly duplicate error; no records are created.
6. **Given** the Google Places API returns zero results for the search term, **Then** a "No results found — try a different search term" message is displayed; the form blocks submission until a valid result is selected.
7. **Given** the Google Places API returns an error or times out, **Then** a non-blocking error indicator is shown ("Place search unavailable — please try again"); the form blocks submission until a valid Google Places result has been selected.
9. **Given** a Google-sourced place is saved and the user later opens it in the edit-place form, **Then** `name`, `address`, `latitude`, `longitude`, `googlePlaceId`, and `heroImageUrl` are displayed as read-only; only `description` is editable.

---

### User Story 2 — Search Google Places When Adding a Standalone Place (Priority: P1)

A signed-in user navigates to "My Places" and opens the standalone "Add a place" form (introduced in spec 007). They type a name in the search field. The same Google Places live-search behaviour applies. On selecting a suggestion, all metadata is pre-filled. On save, a `Place` record is created with real API metadata and no `ListPlace` row.

**Why this priority**: The standalone-place creation path (spec 007, User Story 3) shares the same form and UX as the list-attach path. Extending it with Google Places search is essential for consistency — a user who creates a standalone place should get the same quality of metadata as one who adds directly to a list.

**Independent Test**: From "My Places", a user opens "Add a place", types "Sketch London", selects a Google Places suggestion, and saves. The resulting `Place` record in the database has a real `google_place_id` (not a UUID), a real address, non-zero latitude/longitude, a description, and a `hero_image_url` sourced from the API. The place appears in "My Places" with list count 0.

**Acceptance Scenarios**:

1. **Given** the standalone "Add a place" form is open and the user types at least 3 characters, **Then** Google Places suggestions are fetched and displayed in the same way as in the list-attach form.
2. **Given** the user selects a suggestion, **Then** `name`, `address`, `latitude`, `longitude`, `googlePlaceId`, and `heroImageUrl` are rendered read-only; only `description` is editable before saving.
3. **Given** the user selects a suggestion and saves, **Then** a `Place` record is created with `googlePlaceId` set to the real Google place ID, a real address, and non-zero lat/long; no `ListPlace` row is created.
4. **Given** the selected Google Place has the same `googlePlaceId` as a `Place` record that already belongs to this user, **Then** the submission is rejected with a user-friendly error ("You already have this place — find it in My Places"); no duplicate record is created.

---

### User Story 3 — Google Places Integration Service (Priority: P1)

The Google Places API calls are encapsulated in a standalone integration service (`src/lib/services/google-places/`). No component or server action calls the Google Places HTTP API directly. The service exposes a typed public API and handles API key retrieval, request formation, response parsing, and error normalisation internally.

**Why this priority**: The request explicitly calls out that Google Places must be "its own integration service." Centralising API access enforces a single place for key management, response mapping, and error handling — making it easy to swap API versions or add caching later without touching UI code.

**Independent Test**: Unit tests for the integration service can be written and run in isolation against a mocked HTTP layer, without any component or database involvement. The service can be imported in server actions without any reference to UI or database modules.

**Acceptance Scenarios**:

1. **Given** the integration service is called with a non-empty search query, **Then** it issues a request to the Google Places API using the configured API key and returns an array of `GooglePlaceResult` objects.
2. **Given** the API key environment variable is missing or empty at startup, **Then** the application logs a loud configuration error at module load time rather than silently returning empty results at query time.
3. **Given** the Google Places API returns a non-200 HTTP status or a structured API error, **Then** the service throws a typed `GooglePlacesServiceError` (not a raw fetch error) with a `code` field that server actions can inspect.
4. **Given** the service is called with fewer than 2 characters, **Then** it rejects the call immediately with a validation error — no HTTP request is made.
5. **Given** a valid response, **Then** each `GooglePlaceResult` in the returned array includes AT MINIMUM: `googlePlaceId` (string), `name` (string), `formattedAddress` (string), `latitude` (number), `longitude` (number), `description` (string | null), `heroImageUrl` (string | null). Description and hero image URL are nullable because the Google Places API does not guarantee their presence for all place types.
6. **Given** the integration service module, **Then** it imports no database modules (`@/db`) and no React/UI modules — it is purely an HTTP integration boundary.

---

### Edge Cases

- What if the user tries to edit the `name`, `address`, `latitude`, `longitude`, or `heroImageUrl` fields after selecting a Google Place suggestion? → These fields are rendered as read-only (disabled inputs or static text) immediately on selection; there is no editable state to clear or submit. The user's only recourse is to clear the selection and restart the search.
- What if the Google Places API returns no description for a place? → `description` is stored as `null`; the field is not shown in the UI display until a user manually adds text via the edit form.
- What if the Google Places API returns no hero image for a place? → `heroImageUrl` is stored as `null`; the UI renders a placeholder image or no image in that case.
- Can a user later update `name`, `address`, `latitude`, `longitude`, or `heroImageUrl`? → No. These fields are immutable after creation for all places. Only `description` is editable via the edit-place form.
- What if two users both add the same Google place (same `googlePlaceId`) to their own accounts? → Each user gets their own independent `Place` record. `googlePlaceId` uniqueness is **per user** — scoped to `(user_id, google_place_id)`. The `places` table already carries a composite UNIQUE index on `(user_id, google_place_id)` (`places_user_google_place_id_idx`); no migration is needed for this constraint.
- What if the Google Places API search returns the same place with two slightly different `googlePlaceId` values (e.g., regional aliasing)? → The integration service treats `googlePlaceId` as opaque and performs no deduplication; results are returned as-is from the API.
- What if the network request to Google Places exceeds the configured timeout? → The service throws a `GooglePlacesServiceError` with `code: 'TIMEOUT'`; the UI displays an error and blocks form submission.
- What if the `GOOGLE_PLACES_API_KEY` environment variable is present but the key has been revoked or rate-limited? → The API returns a structured error; the service normalises this to a `GooglePlacesServiceError` with `code: 'API_ERROR'`; the UI displays an error and blocks form submission.
- What if a user selects a Google Places suggestion, navigates away mid-form, then returns? → Form state persistence is out of scope; the user restarts the search on return.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a `GooglePlacesService` (or equivalent named export) in `src/lib/services/google-places/` that provides a `searchPlaces(query: string): Promise<GooglePlaceResult[]>` function callable from server actions.
- **FR-002**: The `GooglePlacesService` MUST read the Google Places API key exclusively from a server-side environment variable (e.g., `GOOGLE_PLACES_API_KEY`); the key MUST never be exposed to client-side code or browser network requests.
- **FR-003**: The "Add a place" search field in both the list-attach flow and the standalone "My Places" flow MUST trigger Google Places suggestions after the user has typed at least 2 characters, with a debounce of approximately 300 ms.
- **FR-004**: Each Google Places suggestion displayed to the user MUST show the place name and formatted address.
- **FR-005**: When the user selects a Google Places suggestion, the `name`, `address`, `latitude`, `longitude`, `googlePlaceId`, `description`, and `heroImageUrl` fields MUST be pre-populated from the API result before the user confirms.
- **FR-006**: When saving a place sourced from Google Places, the system MUST check for an existing `Place` record with the same `(userId, googlePlaceId)` composite key and reuse it rather than creating a duplicate. `googlePlaceId` uniqueness is scoped per user; two different users may each have a `Place` record with the same `googlePlaceId`.
- **FR-007**: If the Google Places API is unavailable or returns an error, the UI MUST display a user-facing error message and MUST block form submission; place creation requires a valid Google Places selection.
- **FR-008**: The `GooglePlacesService` MUST NOT import any database (`@/db`) or React/UI modules; it is a pure HTTP integration boundary.
- **FR-009**: The `GooglePlacesService` MUST enforce a request timeout (≤ 5 seconds) and surface timeout failures as a typed `GooglePlacesServiceError` with `code: 'TIMEOUT'`.
- **FR-010**: The `google_place_id` stored on a `Place` record created from Google Places MUST be the real identifier returned by the API (not a system-generated UUID).
- **FR-011**: The `latitude` and `longitude` fields on a `Place` record created from Google Places MUST be populated with the real coordinates returned by the API (not the placeholder `"0"` values used in earlier specs).
- **FR-012**: The fields `name`, `address`, `latitude`, `longitude`, `googlePlaceId`, and `heroImageUrl` MUST be rendered read-only in both the creation form (after a suggestion is selected) and the edit-place form. Only `description` MUST be editable.
- **FR-013**: A `description` field MUST be added to the `places` table (nullable text); it is populated from the Google Places API response at creation and MAY be updated by the user at any time via the edit-place form.
- **FR-014**: A `heroImageUrl` field MUST be added to the `places` table (nullable `varchar(2048)`); it is populated from the Google Places API response at creation and MUST NOT be modifiable by the user thereafter.
- **FR-015**: The `updatePlace` service function MUST enforce that only `description` may be updated on any `Place` record. Attempts to update `name`, `address`, `latitude`, `longitude`, `heroImageUrl`, or `googlePlaceId` MUST be rejected with a `IMMUTABLE_FIELD` validation error.

### Key Entities

- **GooglePlaceResult**: The result object returned by the integration service. Key attributes: `googlePlaceId` (string — the Google-assigned place identifier), `name` (string), `formattedAddress` (string), `latitude` (number), `longitude` (number), `description` (string | null — editorial summary from Google Places), `heroImageUrl` (string | null — URL of the primary photo from Google Places). May optionally include `types` (string[]) for future categorisation.
- **GooglePlacesServiceError**: A typed error thrown by the integration service. Key attributes: `code` (`'INVALID_QUERY' | 'API_ERROR' | 'TIMEOUT' | 'CONFIGURATION_ERROR'`), `message` (string), `cause?` (unknown).
- **Place** (existing entity, extended): The `Place` record in the `places` table gains real values for `googlePlaceId` (Google API ID), `latitude`, and `longitude` when created from a Google Places search. The `address` field is populated from `formattedAddress` returned by the API. Two new columns are added:
  - `description` (`text`, nullable) — editorial summary sourced from Google Places; user-editable after creation.
  - `heroImageUrl` (`varchar(2048)`, nullable) — primary photo URL sourced from Google Places; immutable after creation.
  
  **Note on schema index**: the `places` table already carries a composite UNIQUE index on `(user_id, google_place_id)` (`places_user_google_place_id_idx`), which correctly enforces per-user uniqueness. No index migration is required for this feature.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can find and select a real-world place using only a partial name search (3–5 characters) within 1 second of the debounce timer firing, under normal network conditions.
- **SC-002**: 100% of `Place` records created via Google Places search have a non-UUID `googlePlaceId`, non-zero `latitude`, and non-zero `longitude` in the database; `heroImageUrl` and `description` are populated where the API provides them.
- **SC-003**: Zero duplicate `Place` records are created for the same `googlePlaceId` + user via the "add place" flows (validated by service-level deduplication guard tests).
- **SC-004**: The Google Places API key is not present in any client-side bundle (verified by grepping the production build output for the env-var name).
- **SC-005**: When the Google Places API is mocked to return a 500 error in tests, the "Add a place" form displays a user-facing degradation message and blocks submission; no JavaScript exception is thrown to the user.
- **SC-006**: The `GooglePlacesService` unit tests achieve ≥ 90% branch coverage without any real network calls (HTTP layer is fully mocked).
