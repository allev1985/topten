"use server";

import { revalidatePath } from "next/cache";
import {
  setListTagsSchema,
  setPlaceTagsSchema,
  searchTagsSchema,
  createTagSchema,
} from "@/schemas/tag";
import type { ActionState } from "@/types/forms";
import { mapZodErrors } from "@/lib/utils/validation/zod";
import { requireAuth } from "@/lib/utils/actions";
import {
  searchTags,
  createTag,
  setListTags,
  setPlaceTags,
  TagServiceError,
} from "@/lib/tag";
import type { TagSummary } from "@/lib/tag";
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("tag-actions");

// ─── Success data types ───────────────────────────────────────────────────────

/** Data returned on successful tag search */
export interface SearchTagsSuccessData {
  tags: TagSummary[];
}

/** Data returned on successful tag creation */
export interface CreateTagSuccessData {
  tagId: string;
  name: string;
}

/** Data returned on successful list tag update */
export interface SetListTagsSuccessData {
  listId: string;
  tags: TagSummary[];
}

/** Data returned on successful place tag update */
export interface SetPlaceTagsSuccessData {
  placeId: string;
  tags: TagSummary[];
}

// ─── searchTagsAction ─────────────────────────────────────────────────────────

/**
 * Search for tags by name prefix (autocomplete).
 *
 * @param query - The search string typed by the user
 * @returns ActionState with matching tags
 */
export async function searchTagsAction(
  query: string
): Promise<ActionState<SearchTagsSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const result = searchTagsSchema.safeParse({ query });
  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    const tags = await searchTags(result.data.query);
    return { data: { tags }, error: null, fieldErrors: {}, isSuccess: true };
  } catch (err) {
    const message =
      err instanceof TagServiceError
        ? err.message
        : "Failed to search tags. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── createTagAction ──────────────────────────────────────────────────────────

/**
 * Create a new custom tag.
 *
 * @param _prevState - Previous action state (required by useActionState)
 * @param formData - FormData containing `name`
 * @returns ActionState with the created tag
 */
export async function createTagAction(
  _prevState: ActionState<CreateTagSuccessData>,
  formData: FormData
): Promise<ActionState<CreateTagSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const rawName = formData.get("name");
  const result = createTagSchema.safeParse({
    name: typeof rawName === "string" ? rawName : "",
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
    const { tag } = await createTag(result.data.name);
    return {
      data: { tagId: tag.id, name: tag.name },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof TagServiceError
        ? err.message
        : "Failed to create tag. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── setListTagsAction ────────────────────────────────────────────────────────

/**
 * Replace all tags on a list (idempotent).
 *
 * @param _prevState - Previous action state
 * @param formData - FormData containing `listId` and `tagNames` (JSON array)
 * @returns ActionState with updated tags
 */
export async function setListTagsAction(
  _prevState: ActionState<SetListTagsSuccessData>,
  formData: FormData
): Promise<ActionState<SetListTagsSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const listId = formData.get("listId");
  const rawTagNames = formData.get("tagNames");

  let tagNames: string[] = [];
  try {
    tagNames = JSON.parse(typeof rawTagNames === "string" ? rawTagNames : "[]");
  } catch {
    return {
      data: null,
      error: "Invalid tag names format.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const result = setListTagsSchema.safeParse({
    listId: typeof listId === "string" ? listId : "",
    tagNames,
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
    const { tags } = await setListTags(
      result.data.listId,
      result.data.tagNames
    );
    revalidatePath("/dashboard");
    return {
      data: { listId: result.data.listId, tags },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    log.error({ method: "setListTagsAction", err }, "Failed to set list tags");
    const message =
      err instanceof TagServiceError
        ? err.message
        : "Failed to update tags. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── setPlaceTagsAction ──────────────────────────────────────────────────────

/**
 * Replace all tags on a place (idempotent).
 *
 * @param _prevState - Previous action state
 * @param formData - FormData containing `placeId` and `tagNames` (JSON array)
 * @returns ActionState with updated tags
 */
export async function setPlaceTagsAction(
  _prevState: ActionState<SetPlaceTagsSuccessData>,
  formData: FormData
): Promise<ActionState<SetPlaceTagsSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const placeId = formData.get("placeId");
  const rawTagNames = formData.get("tagNames");

  let tagNames: string[] = [];
  try {
    tagNames = JSON.parse(typeof rawTagNames === "string" ? rawTagNames : "[]");
  } catch {
    return {
      data: null,
      error: "Invalid tag names format.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const result = setPlaceTagsSchema.safeParse({
    placeId: typeof placeId === "string" ? placeId : "",
    tagNames,
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
    const { tags } = await setPlaceTags(
      result.data.placeId,
      result.data.tagNames
    );
    revalidatePath("/dashboard");
    return {
      data: { placeId: result.data.placeId, tags },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    log.error(
      { method: "setPlaceTagsAction", err },
      "Failed to set place tags"
    );
    const message =
      err instanceof TagServiceError
        ? err.message
        : "Failed to update tags. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}
