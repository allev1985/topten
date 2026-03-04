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
} from "@/lib/place/service";
import { PlaceServiceError } from "@/lib/place/service/errors";
import { DASHBOARD_ROUTES } from "@/lib/config";

// ─── Success data types ───────────────────────────────────────────────────────

export interface CreatePlaceSuccessData {
  placeId: string;
  listPlaceId: string;
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
 * Create a new place and attach it to a list.
 *
 * Validates: name (required, max 255), address (required, max 500).
 * googlePlaceId, latitude, and longitude are system-assigned.
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state (required by useActionState)
 * @param formData   - FormData containing `listId`, `name`, `address`
 */
export async function createPlaceAction(
  _prevState: ActionState<CreatePlaceSuccessData>,
  formData: FormData
): Promise<ActionState<CreatePlaceSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const listId = formData.get("listId");
  if (typeof listId !== "string" || !listId.trim()) {
    return {
      data: null,
      error: "List ID is required.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const result = createPlaceSchema.safeParse({
    name: formData.get("name") ?? "",
    address: formData.get("address") ?? "",
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
    const { place, listPlaceId } = await createPlace({
      listId,
      userId: auth.userId,
      name: result.data.name,
      address: result.data.address,
    });

    revalidatePath(DASHBOARD_ROUTES.listDetail(listId));
    return {
      data: { placeId: place.id, listPlaceId },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
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
 * Update a place's name and/or address.
 *
 * Validates: at least one of name or address must be provided.
 * Ownership is verified in the service layer.
 * googlePlaceId is immutable and never accepted.
 *
 * @param _prevState - Previous action state
 * @param formData   - FormData containing `placeId`, `listId`, optionally `name` and `address`
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
  if (typeof listId !== "string" || !listId.trim()) {
    return {
      data: null,
      error: "List ID is required.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const rawName = formData.get("name");
  const rawAddress = formData.get("address");

  const result = updatePlaceSchema.safeParse({
    name: typeof rawName === "string" && rawName.trim() ? rawName : undefined,
    address:
      typeof rawAddress === "string" && rawAddress.trim()
        ? rawAddress
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
      listId,
      userId: auth.userId,
      name: result.data.name,
      address: result.data.address,
    });

    revalidatePath(DASHBOARD_ROUTES.listDetail(listId));
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
