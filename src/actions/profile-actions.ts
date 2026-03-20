"use server";

import { revalidatePath } from "next/cache";
import {
  updateNameSchema,
  updateSlugSchema,
  type UpdateNameSuccessData,
  type UpdateSlugSuccessData,
} from "@/schemas/profile";
import type { ActionState } from "@/types/forms";
import { mapZodErrors } from "@/lib/utils/validation/zod";
import { requireAuth } from "@/lib/utils/actions";
import { updateName, updateSlug, ProfileServiceError } from "@/lib/profile";

// Re-export success data types so consumers can import from one place
export type { UpdateNameSuccessData, UpdateSlugSuccessData };

/**
 * Update Name server action
 * Updates the authenticated user's display name.
 *
 * @param _prevState - Previous action state (unused by logic, required by useActionState)
 * @param formData - Form data containing the `name` field
 */
export async function updateNameAction(
  _prevState: ActionState<UpdateNameSuccessData>,
  formData: FormData
): Promise<ActionState<UpdateNameSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return {
      data: null,
      error: "You must be logged in to update your profile",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const currentUserId = auth.userId;
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName : "";

  const result = updateNameSchema.safeParse({ name });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    const { name: savedName } = await updateName(
      currentUserId,
      result.data.name
    );
    revalidatePath("/dashboard/settings");
    return {
      data: { name: savedName },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof ProfileServiceError
        ? err.message
        : "Failed to update name. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

/**
 * Update Slug server action
 * Updates the authenticated user's vanity slug (profile URL).
 * Performs a two-layer uniqueness check:
 *   Layer 1 — application pre-check (before write)
 *   Layer 2 — DB unique constraint catch on race condition (23505)
 *
 * The current user's own unchanged slug is never treated as a conflict.
 *
 * @param _prevState - Previous action state (unused by logic, required by useActionState)
 * @param formData - Form data containing the `vanitySlug` field
 */
export async function updateSlugAction(
  _prevState: ActionState<UpdateSlugSuccessData>,
  formData: FormData
): Promise<ActionState<UpdateSlugSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return {
      data: null,
      error: "You must be logged in to update your profile",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const currentUserId = auth.userId;
  const vanitySlug = formData.get("vanitySlug");

  const result = updateSlugSchema.safeParse({ vanitySlug });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    const { vanitySlug: savedSlug } = await updateSlug(
      currentUserId,
      result.data.vanitySlug
    );
    revalidatePath("/dashboard/settings");
    return {
      data: { vanitySlug: savedSlug },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    if (err instanceof ProfileServiceError && err.code === "SLUG_TAKEN") {
      return {
        data: null,
        error: null,
        fieldErrors: { vanitySlug: [err.message] },
        isSuccess: false,
      };
    }
    const message =
      err instanceof ProfileServiceError
        ? err.message
        : "Failed to update profile URL. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}
