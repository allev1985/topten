"use server";

import { revalidatePath } from "next/cache";
import { setTagsSchema } from "@/schemas/tag";
import type { ActionState } from "@/types/forms";
import { mapZodErrors } from "@/lib/utils/validation/zod";
import { requireAuth } from "@/lib/utils/actions";
import {
  searchTags,
  setListTags,
  setPlaceTags,
  TagServiceError,
} from "@/lib/tag";
import type { TagSummary } from "@/lib/tag";
import { invalidatePublicListCaches } from "@/lib/public";
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("tag-actions");

// ─── Success data types ───────────────────────────────────────────────────────

export interface SearchTagsSuccessData {
  results: TagSummary[];
}

export interface SetTagsSuccessData {
  tags: TagSummary[];
}

// ─── searchTagsAction ─────────────────────────────────────────────────────────

/**
 * Search the tag vocabulary for autocomplete.
 *
 * @param query - Raw search string typed by the user
 * @returns Up to 10 matching tags (system + user's own custom tags)
 */
export async function searchTagsAction(
  query: string
): Promise<ActionState<SearchTagsSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  try {
    const results = await searchTags({ query, userId: auth.userId });
    return { data: { results }, error: null, fieldErrors: {}, isSuccess: true };
  } catch (err) {
    log.error({ method: "searchTagsAction", err }, "Search failed");
    const message =
      err instanceof TagServiceError
        ? err.message
        : "Tag search failed. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── setListTagsAction ────────────────────────────────────────────────────────

/**
 * Replace the full tag set on a list.
 *
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state (required by useActionState)
 * @param formData   - FormData containing `entityId` (list id) and `tags` (JSON array)
 */
export async function setListTagsAction(
  _prevState: ActionState<SetTagsSuccessData>,
  formData: FormData
): Promise<ActionState<SetTagsSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const result = setTagsSchema.safeParse({
    entityId: formData.get("entityId") ?? "",
    tags: formData.get("tags") ?? "",
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
    const { tags, listSlug } = await setListTags({
      listId: result.data.entityId,
      userId: auth.userId,
      labels: result.data.tags,
    });
    revalidatePath(`/dashboard/lists/${result.data.entityId}`);
    try {
      await invalidatePublicListCaches(
        auth.userId,
        ...(listSlug ? [listSlug] : [])
      );
    } catch (err) {
      log.warn(
        { method: "setListTagsAction", err },
        "Cache invalidation failed"
      );
    }
    return { data: { tags }, error: null, fieldErrors: {}, isSuccess: true };
  } catch (err) {
    const message =
      err instanceof TagServiceError
        ? err.message
        : "Failed to update tags. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── setPlaceTagsAction ───────────────────────────────────────────────────────

/**
 * Replace the full tag set on a place.
 *
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state (required by useActionState)
 * @param formData   - FormData containing `entityId` (place id) and `tags` (JSON array)
 */
export async function setPlaceTagsAction(
  _prevState: ActionState<SetTagsSuccessData>,
  formData: FormData
): Promise<ActionState<SetTagsSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const result = setTagsSchema.safeParse({
    entityId: formData.get("entityId") ?? "",
    tags: formData.get("tags") ?? "",
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
    const { tags, listSlugs } = await setPlaceTags({
      placeId: result.data.entityId,
      userId: auth.userId,
      labels: result.data.tags,
    });
    revalidatePath("/dashboard/places");
    try {
      await invalidatePublicListCaches(auth.userId, ...(listSlugs ?? []));
    } catch (err) {
      log.warn(
        { method: "setPlaceTagsAction", err },
        "Cache invalidation failed"
      );
    }
    return { data: { tags }, error: null, fieldErrors: {}, isSuccess: true };
  } catch (err) {
    const message =
      err instanceof TagServiceError
        ? err.message
        : "Failed to update tags. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}
