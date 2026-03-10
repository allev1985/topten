"use server";

import { revalidatePath } from "next/cache";
import { createPlaceSchema, updatePlaceSchema } from "@/schemas/place";
import type { ActionState } from "@/types/forms";
import { mapZodErrors } from "@/lib/utils/validation/zod";
import { requireAuth } from "@/lib/utils/actions";
import {
  createPlace,
  addExistingPlaceToList,
  updatePlace,
  deletePlaceFromList,
  deletePlace,
} from "@/lib/place/service";
import { PlaceServiceError } from "@/lib/place/service/errors";
import { DASHBOARD_ROUTES } from "@/lib/config";
import {
  searchPlaces,
  resolvePhotoUri,
  GooglePlacesServiceError,
} from "@/lib/services/google-places";
import type { GooglePlaceResult } from "@/lib/services/google-places";

// ─── Success data types ───────────────────────────────────────────────────────

export interface CreatePlaceSuccessData {
  placeId: string;
  listPlaceId?: string;
}

export interface AddExistingPlaceSuccessData {
  listPlaceId: string;
}

export interface UpdatePlaceSuccessData {
  placeId: string;
}

export interface DeletePlaceSuccessData {
  success: true;
}

// ─── createPlaceAction ────────────────────────────────────────────────────────

/**
 * Create a new place from a Google Places selection and optionally attach it to a list.
 *
 * All required Google fields (googlePlaceId, name, address, latitude, longitude)
 * must come from a prior searchPlacesAction selection — there is no manual entry path.
 * Optional metadata: description, heroImageUrl.
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state (required by useActionState)
 * @param formData   - FormData containing `listId?`, `googlePlaceId`, `name`, `address`,
 *                     `latitude`, `longitude`, `description?`, `heroImageUrl?`
 */
export async function createPlaceAction(
  _prevState: ActionState<CreatePlaceSuccessData>,
  formData: FormData
): Promise<ActionState<CreatePlaceSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const rawListId = formData.get("listId");
  const listId =
    typeof rawListId === "string" && rawListId.trim() ? rawListId : undefined;

  const rawLat = formData.get("latitude");
  const rawLng = formData.get("longitude");

  const result = createPlaceSchema.safeParse({
    googlePlaceId: formData.get("googlePlaceId") ?? "",
    name: formData.get("name") ?? "",
    address: formData.get("address") ?? "",
    latitude: typeof rawLat === "string" ? rawLat : undefined,
    longitude: typeof rawLng === "string" ? rawLng : undefined,
    description: formData.get("description") || undefined,
    heroImageUrl: formData.get("heroImageUrl") || undefined,
  });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    const created = await createPlace({
      listId: listId ?? undefined,
      userId: auth.userId,
      googlePlaceId: result.data.googlePlaceId,
      name: result.data.name,
      address: result.data.address,
      latitude: result.data.latitude,
      longitude: result.data.longitude,
      description: result.data.description,
      heroImageUrl: result.data.heroImageUrl,
    });

    if (listId) {
      revalidatePath(DASHBOARD_ROUTES.listDetail(listId));
    }
    revalidatePath(DASHBOARD_ROUTES.places, "page");
    revalidatePath("/dashboard/lists", "layout");
    return { data: { placeId: created.place.id, listPlaceId: created.listPlaceId }, error: null, fieldErrors: {}, isSuccess: true };
  } catch (err) {
    const message =
      err instanceof PlaceServiceError
        ? err.message
        : "Failed to create place. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── addExistingPlaceToListAction ─────────────────────────────────────────────

/**
 * Attach an existing place to a list.
 *
 * Validates: listId and placeId (both required, non-empty).
 * Ownership and duplicate checks are in the service layer.
 *
 * @param _prevState - Previous action state
 * @param formData   - FormData containing `listId`, `placeId`
 */
export async function addExistingPlaceToListAction(
  _prevState: ActionState<AddExistingPlaceSuccessData>,
  formData: FormData
): Promise<ActionState<AddExistingPlaceSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const listId = formData.get("listId");
  const placeId = formData.get("placeId");

  if (typeof listId !== "string" || !listId.trim()) {
    return {
      data: null,
      error: "List ID is required.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
  if (typeof placeId !== "string" || !placeId.trim()) {
    return {
      data: null,
      error: "Place ID is required.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    const { listPlaceId } = await addExistingPlaceToList({
      listId,
      placeId,
      userId: auth.userId,
    });

    revalidatePath(DASHBOARD_ROUTES.listDetail(listId));
    return {
      data: { listPlaceId },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof PlaceServiceError
        ? err.message
        : "Failed to add place to list. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── updatePlaceAction ────────────────────────────────────────────────────────

/**
 * Update a place's description (the only editable field after creation).
 *
 * All other fields (name, address, googlePlaceId, latitude, longitude, heroImageUrl)
 * are immutable and must not be submitted — they are ignored even if present.
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state
 * @param formData   - FormData containing `placeId`, `listId?`, `description?`
 */
export async function updatePlaceAction(
  _prevState: ActionState<UpdatePlaceSuccessData>,
  formData: FormData
): Promise<ActionState<UpdatePlaceSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const placeId = formData.get("placeId");
  const listId = formData.get("listId");

  if (typeof placeId !== "string" || !placeId.trim()) {
    return {
      data: null,
      error: "Place ID is required.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
  // listId is optional — if absent, ownership is verified via places.userId
  const resolvedListId =
    typeof listId === "string" && listId.trim() ? listId : undefined;

  const rawDescription = formData.get("description");

  const result = updatePlaceSchema.safeParse({
    description:
      typeof rawDescription === "string" && rawDescription.trim()
        ? rawDescription
        : undefined,
  });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    const { place } = await updatePlace({
      placeId,
      listId: resolvedListId,
      userId: auth.userId,
      description: result.data.description,
    });

    if (resolvedListId) {
      revalidatePath(DASHBOARD_ROUTES.listDetail(resolvedListId));
    }
    revalidatePath(DASHBOARD_ROUTES.places, "page");
    revalidatePath("/dashboard/lists", "layout");
    return {
      data: { placeId: place.id },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof PlaceServiceError
        ? err.message
        : "Failed to update place. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── searchPlacesAction ──────────────────────────────────────────────────────

export interface SearchPlacesSuccessData {
  results: GooglePlaceResult[];
}

/**
 * Search Google Places and return up to 5 suggestions.
 * Requires at least 3 characters in the query.
 * Results are ephemeral — photoResourceName is transient and must not be stored directly.
 *
 * @param query - The search string typed by the user.
 */
export async function searchPlacesAction(
  query: string
): Promise<ActionState<SearchPlacesSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  if (query.trim().length < 3) {
    return {
      data: null,
      error: "Enter at least 3 characters to search.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    const results = await searchPlaces(query);
    return { data: { results }, error: null, fieldErrors: {}, isSuccess: true };
  } catch (err) {
    if (err instanceof GooglePlacesServiceError) {
      console.error(
        `[searchPlacesAction] GooglePlacesServiceError code=${err.code} message="${err.message}"`,
        err.cause ?? ""
      );
      return {
        data: null,
        error: mapGooglePlacesError(err.code),
        fieldErrors: {},
        isSuccess: false,
      };
    }
    console.error("[searchPlacesAction] unexpected error:", err);
    return {
      data: null,
      error: "Place search unavailable — please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
}

// ─── resolveGooglePlacePhotoAction ───────────────────────────────────────────

export interface ResolvePhotoSuccessData {
  photoUri: string;
}

/**
 * Resolve a transient Google Place photo resource name to a storable photo URI.
 * The returned URI is suitable for persisting in heroImageUrl.
 *
 * @param photoResourceName - Transient resource name from a searchPlacesAction result.
 */
export async function resolveGooglePlacePhotoAction(
  photoResourceName: string
): Promise<ActionState<ResolvePhotoSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  if (!photoResourceName.trim()) {
    return {
      data: null,
      error: "Photo resource name is required.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    const photoUri = await resolvePhotoUri(photoResourceName);
    return { data: { photoUri }, error: null, fieldErrors: {}, isSuccess: true };
  } catch (err) {
    if (err instanceof GooglePlacesServiceError) {
      console.error(
        `[resolveGooglePlacePhotoAction] GooglePlacesServiceError code=${err.code} message="${err.message}"`,
        err.cause ?? ""
      );
      return {
        data: null,
        error: mapGooglePlacesError(err.code),
        fieldErrors: {},
        isSuccess: false,
      };
    }
    console.error("[resolveGooglePlacePhotoAction] unexpected error:", err);
    return {
      data: null,
      error: "Could not resolve photo — please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function mapGooglePlacesError(code: string): string {
  switch (code) {
    case "INVALID_QUERY":
      return "Query is too short or invalid.";
    case "CONFIGURATION_ERROR":
      return "Place search is not configured — contact support.";
    case "TIMEOUT":
      return "Place search timed out — please try again.";
    case "API_ERROR":
    default:
      return "Place search unavailable — please try again.";
  }
}

// ─── deletePlaceAction ────────────────────────────────────────────────────────

/**
 * Remove a place from a list (soft-deletes the ListPlace attachment).
 *
 * The Place record itself is preserved so it remains available on other lists.
 * Validates: placeId and listId (both non-empty).
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state
 * @param formData   - FormData containing `placeId`, `listId`
 */
export async function deletePlaceAction(
  _prevState: ActionState<DeletePlaceSuccessData>,
  formData: FormData
): Promise<ActionState<DeletePlaceSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const placeId = formData.get("placeId");
  const listId = formData.get("listId");

  if (typeof placeId !== "string" || !placeId.trim()) {
    return {
      data: null,
      error: "Place ID is required.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
  if (typeof listId !== "string" || !listId.trim()) {
    return {
      data: null,
      error: "List ID is required.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    await deletePlaceFromList({ placeId, listId, userId: auth.userId });

    revalidatePath(DASHBOARD_ROUTES.listDetail(listId));
    return {
      data: { success: true },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof PlaceServiceError
        ? err.message
        : "Failed to delete place. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}


// ─── deletePlaceGlobalAction ──────────────────────────────────────────────────

export interface DeletePlaceGlobalSuccessData {
  deletedListPlaceCount: number;
}

/**
 * Permanently soft-delete a place and cascade to all list attachments.
 *
 * @param _prevState - Previous action state
 * @param formData   - FormData containing `placeId`
 */
export async function deletePlaceGlobalAction(
  _prevState: ActionState<DeletePlaceGlobalSuccessData>,
  formData: FormData
): Promise<ActionState<DeletePlaceGlobalSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const placeId = formData.get("placeId");
  if (typeof placeId !== "string" || !placeId.trim()) {
    return {
      data: null,
      error: "Place ID is required.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    const { deletedListPlaceCount } = await deletePlace({
      placeId,
      userId: auth.userId,
    });

    revalidatePath(DASHBOARD_ROUTES.places, "page");
    revalidatePath("/dashboard/lists", "layout");
    return {
      data: { deletedListPlaceCount },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof PlaceServiceError
        ? err.message
        : "Failed to delete place. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}
