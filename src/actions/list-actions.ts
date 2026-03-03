"use server";

import { revalidatePath } from "next/cache";
import { createListSchema, updateListSchema } from "@/schemas/list";
import type { ActionState } from "@/types/forms";
import { mapZodErrors } from "@/lib/utils/validation/zod";
import { requireAuth } from "@/lib/utils/actions";
import {
  createList,
  updateList,
  deleteList,
  publishList,
  unpublishList,
} from "@/lib/list/service";
import { ListServiceError } from "@/lib/list/service/errors";

// ─── Success data types ───────────────────────────────────────────────────────

export interface CreateListSuccessData {
  listId: string;
  slug: string;
}

export interface UpdateListSuccessData {
  listId: string;
}

export interface DeleteListSuccessData {
  success: true;
}

export interface PublishListSuccessData {
  listId: string;
  isPublished: boolean;
}

export interface UnpublishListSuccessData {
  listId: string;
  isPublished: boolean;
}

// ─── createListAction ─────────────────────────────────────────────────────────

/**
 * Create a new draft list.
 *
 * Validates: title (required, max 255 chars).
 * Slug is system-assigned (4-char hex UUID prefix) — not accepted from input.
 *
 * @param _prevState - Previous action state (required by useActionState)
 * @param formData   - FormData containing `title`
 */
export async function createListAction(
  _prevState: ActionState<CreateListSuccessData>,
  formData: FormData
): Promise<ActionState<CreateListSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const rawTitle = formData.get("title");
  const result = createListSchema.safeParse({
    title: typeof rawTitle === "string" ? rawTitle : "",
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
    const { list } = await createList({
      userId: auth.userId,
      title: result.data.title,
    });
    revalidatePath("/dashboard");
    return {
      data: { listId: list.id, slug: list.slug },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof ListServiceError
        ? err.message
        : "Failed to create list. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── updateListAction ─────────────────────────────────────────────────────────

/**
 * Update an existing list's title and/or description.
 *
 * Validates: title and description (at least one required).
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state
 * @param formData   - FormData containing `listId`, optionally `title` and `description`
 */
export async function updateListAction(
  _prevState: ActionState<UpdateListSuccessData>,
  formData: FormData
): Promise<ActionState<UpdateListSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const listId = formData.get("listId");
  if (typeof listId !== "string" || !listId) {
    return {
      data: null,
      error: "List ID is required",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");

  const result = updateListSchema.safeParse({
    title:
      typeof rawTitle === "string" && rawTitle !== "" ? rawTitle : undefined,
    description:
      typeof rawDescription === "string" && rawDescription !== ""
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
    await updateList({
      listId,
      userId: auth.userId,
      title: result.data.title,
      description: result.data.description,
    });
    revalidatePath("/dashboard");
    return { data: { listId }, error: null, fieldErrors: {}, isSuccess: true };
  } catch (err) {
    const message =
      err instanceof ListServiceError
        ? err.message
        : "Failed to update list. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── deleteListAction ─────────────────────────────────────────────────────────

/**
 * Soft-delete a list (sets deletedAt).
 *
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state
 * @param formData   - FormData containing `listId`
 */
export async function deleteListAction(
  _prevState: ActionState<DeleteListSuccessData>,
  formData: FormData
): Promise<ActionState<DeleteListSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const listId = formData.get("listId");
  if (typeof listId !== "string" || !listId) {
    return {
      data: null,
      error: "List ID is required",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    await deleteList({ listId, userId: auth.userId });
    revalidatePath("/dashboard");
    return {
      data: { success: true },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof ListServiceError
        ? err.message
        : "Failed to delete list. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── publishListAction ────────────────────────────────────────────────────────

/**
 * Publish a list (isPublished = true).
 *
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state
 * @param formData   - FormData containing `listId`
 */
export async function publishListAction(
  _prevState: ActionState<PublishListSuccessData>,
  formData: FormData
): Promise<ActionState<PublishListSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const listId = formData.get("listId");
  if (typeof listId !== "string" || !listId) {
    return {
      data: null,
      error: "List ID is required",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    const { list } = await publishList({ listId, userId: auth.userId });
    revalidatePath("/dashboard");
    return {
      data: { listId: list.id, isPublished: list.isPublished },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof ListServiceError
        ? err.message
        : "Failed to publish list. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}

// ─── unpublishListAction ──────────────────────────────────────────────────────

/**
 * Unpublish a list (isPublished = false).
 *
 * Ownership is verified in the service layer.
 *
 * @param _prevState - Previous action state
 * @param formData   - FormData containing `listId`
 */
export async function unpublishListAction(
  _prevState: ActionState<UnpublishListSuccessData>,
  formData: FormData
): Promise<ActionState<UnpublishListSuccessData>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  const listId = formData.get("listId");
  if (typeof listId !== "string" || !listId) {
    return {
      data: null,
      error: "List ID is required",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    const { list } = await unpublishList({ listId, userId: auth.userId });
    revalidatePath("/dashboard");
    return {
      data: { listId: list.id, isPublished: list.isPublished },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    const message =
      err instanceof ListServiceError
        ? err.message
        : "Failed to unpublish list. Please try again.";
    return { data: null, error: message, fieldErrors: {}, isSuccess: false };
  }
}
