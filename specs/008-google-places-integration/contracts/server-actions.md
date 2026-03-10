# Contract: Google Places Server Actions

**File**: `src/actions/place-actions.ts` (additions)

---

## `searchPlacesAction`

A Server Action that proxies the `GooglePlacesService.searchPlaces()` call for use from client components.

### Signature

```typescript
export async function searchPlacesAction(
  query: string
): Promise<ActionState<GooglePlaceResult[]>>
```

### Responsibilities (constitution-compliant)

1. **Authenticate** — call `requireAuth()`; return auth error state if unauthenticated.
2. **Validate** — reject if `query.trim().length < 3`; return field error state.
3. **Delegate** — call `GooglePlacesService.searchPlaces(query)`.
4. **Map errors** — catch `GooglePlacesServiceError` and map codes to user-safe messages:
   | Code | User message |
   |------|-------------|
   | `INVALID_QUERY` | "Please enter at least 3 characters to search." |
   | `CONFIGURATION_ERROR` | "Place search is unavailable. Please enter details manually." |
   | `API_ERROR` | "Unable to reach Google Places. Please enter details manually." |
   | `TIMEOUT` | "Google Places search timed out. Please try again or enter details manually." |
5. **Return** — `ActionState<GooglePlaceResult[]>` with `data` on success.

> No `revalidatePath` call — this action performs no mutations.

---

## `resolveGooglePlacePhotoAction`

A Server Action that resolves a photo resource name to a storable `photoUri`.

### Signature

```typescript
export async function resolveGooglePlacePhotoAction(
  photoResourceName: string
): Promise<ActionState<{ photoUri: string }>>
```

### Responsibilities

1. **Authenticate** — `requireAuth()`.
2. **Validate** — reject if `photoResourceName` is empty.
3. **Delegate** — call `GooglePlacesService.resolvePhotoUri(photoResourceName)`.
4. **Map errors** — map `GooglePlacesServiceError` codes to user-safe messages (same mapping as above).
5. **Return** — `ActionState<{ photoUri: string }>` with `data.photoUri` on success.

> No `revalidatePath` call — this action performs no mutations.

---

## `createPlaceAction` — modified

The existing `createPlaceAction` is extended to also accept Google-sourced place fields.

### New FormData fields

| Field | Type | Required |
|-------|------|----------|
| `googlePlaceId` | `string` | Yes |
| `latitude` | `string` | Yes |
| `longitude` | `string` | Yes |
| `description` | `string` | No |
| `heroImageUrl` | `string` | No |

All place creation goes through Google Places. The existing `createPlace` service function is extended in-place to accept these fields; no separate `createGooglePlace` function is introduced. Schema validation is handled via an extended Zod schema.

---

## `updatePlaceAction` — modified

The existing `updatePlaceAction` is unchanged in its FormData interface. The `updatePlace` service function unconditionally enforces that only `description` may be updated; all other fields are rejected with `IMMUTABLE_FIELD`. The action does not need to know about immutability rules — that is the service layer's responsibility.
