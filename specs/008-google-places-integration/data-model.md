# Data Model: Google Places Integration

**Branch**: `008-google-places-integration` | **Date**: 2026-03-10

---

## Schema Changes

### `places` table — 2 new columns

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `description` | `text` | YES | `NULL` | Editorial summary from Google Places (`editorialSummary.text`); user-editable after creation |
| `hero_image_url` | `varchar(2048)` | YES | `NULL` | Resolved Google Places photo URI; immutable after creation |

**No indexes required** for the new columns — they are not used in WHERE clauses.

**No changes to existing columns.** The `places_user_google_place_id_idx` composite UNIQUE index on `(user_id, google_place_id)` already correctly enforces per-user uniqueness.

### Migration

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_place_google_fields.sql

ALTER TABLE places
  ADD COLUMN description text,
  ADD COLUMN hero_image_url varchar(2048);
```

### Drizzle schema update (`src/db/schema/place.ts`)

```typescript
import { text } from "drizzle-orm/pg-core";

// Inside pgTable definition, add to the columns object:
description: text("description"),
heroImageUrl: varchar("hero_image_url", { length: 2048 }),
```

---

## New TypeScript Types

### `src/lib/services/google-places/types.ts` — NEW FILE

```typescript
/**
 * A single place result returned by the Google Places integration service.
 * Mapped from the New Places API Text Search response.
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
   * Editorial summary / description from Google Places.
   * Nullable — not all place types include an editorial summary.
   */
  description: string | null;
  /**
   * Resource name of the first photo for this place.
   * Used to resolve heroImageUrl via resolvePhotoUri().
   * Format: "places/{placeId}/photos/{photoId}"
   * NOT stored in the database — only used transiently during place creation.
   */
  photoResourceName: string | null;
}

/**
 * Resolved photo URI suitable for storing as heroImageUrl.
 */
export interface ResolvedPhotoUri {
  photoUri: string;
}

/** Error codes for the Google Places integration service */
export type GooglePlacesErrorCode =
  | "INVALID_QUERY"     // query is too short or empty
  | "API_ERROR"         // non-200 or structured API error from Google
  | "TIMEOUT"           // request exceeded the 5s timeout
  | "CONFIGURATION_ERROR"; // API key missing or empty

/**
 * Typed error thrown by GooglePlacesService.
 * Server Actions catch this and map it to ActionState errors.
 */
export class GooglePlacesServiceError extends Error {
  public readonly code: GooglePlacesErrorCode;
  public readonly cause?: unknown;

  constructor(code: GooglePlacesErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "GooglePlacesServiceError";
    this.code = code;
    this.cause = cause;
  }
}
```

### `src/lib/place/service/types.ts` — additions

No new input type is needed. The existing `CreatePlaceInput` is extended in-place with two optional fields:

```typescript
// Additions to the existing CreatePlaceInput interface:
description?: string | null;
heroImageUrl?: string | null;
// googlePlaceId, name, address, latitude, longitude already exist in CreatePlaceInput
```

`PlaceRecord` gains two new nullable fields:

```typescript
/** Extended Place record including new fields */
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
```

### `PlaceServiceErrorCode` — addition (`src/lib/place/service/errors.ts`)

```typescript
export type PlaceServiceErrorCode =
  | "NOT_FOUND"
  | "ALREADY_IN_LIST"
  | "VALIDATION_ERROR"
  | "SERVICE_ERROR"
  | "IMMUTABLE_FIELD";   // NEW — attempt to update a read-only field on a Google-sourced place
```

---

## Entity Relationships (unchanged)

```
User (1) ──── (M) Place
Place (M) ──── (M) List  [via ListPlace]
```

No new relationships introduced by this feature.

---

## Invariants

1. All places are created via Google Places selection; `google_place_id` is always a real Google place ID (e.g. `ChIJ...`).
2. `name`, `address`, `latitude`, `longitude`, `hero_image_url`, and `google_place_id` are immutable after creation — enforced in `updatePlace`.
3. `description` is freely editable via `updatePlace`.
4. The `(user_id, google_place_id)` composite unique constraint prevents a user from duplicating the same Google place.
