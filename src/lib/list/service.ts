/**
 * List Service
 *
 * Centralised service for all list domain operations.
 * Delegates all DB access to the list and user repositories.
 * Used by list server actions — never called from client code.
 *
 * Public API:
 *   - getListsByUser   — fetch all active lists for a user (dashboard read)
 *   - createList       — create a new draft list with a system-assigned slug
 *   - updateList       — update a list's title and/or description
 *   - deleteList       — soft-delete a list (sets deletedAt)
 *   - publishList      — publish a list (isPublished = true, publishedAt = now)
 *   - unpublishList    — unpublish a list (isPublished = false, publishedAt = null)
 *
 * Architecture: src/lib/list/service.ts → src/actions/list-actions.ts → client
 * Spec: specs/005-lists-service/
 *
 * @module list/service
 */

import * as listRepository from "@/db/repositories/list.repository";
import * as userRepository from "@/db/repositories/user.repository";
import {
  ListServiceError,
  notFoundError,
  slugCollisionError,
  listServiceError,
  isUniqueViolation,
} from "./service/errors";
import type {
  ListSummary,
  CreateListResult,
  UpdateListResult,
  DeleteListResult,
  PublishListResult,
  UnpublishListResult,
} from "./service/types";

export { ListServiceError };

export type {
  ListSummary,
  CreateListResult,
  UpdateListResult,
  DeleteListResult,
  PublishListResult,
  UnpublishListResult,
};

// ─── Slug generation ─────────────────────────────────────────────────────────

/**
 * Generate a 4-character hex slug from a random UUID.
 * Produces values in the range [0-9a-f]{4} (~65,536 possible values per user).
 */
function generateSlug(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 4);
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch all active (non-deleted) lists for a user, newest first.
 *
 * @param userId - The authenticated user's id
 * @returns Array of ListSummary objects ordered by createdAt DESC
 * @throws {ListServiceError} code SERVICE_ERROR on DB failure
 */
export async function getListsByUser(userId: string): Promise<ListSummary[]> {
  console.info(
    "[ListService:getListsByUser]",
    `Fetching lists for user ${userId}`
  );

  try {
    const rows = await listRepository.getListsByUser(userId);

    console.info(
      "[ListService:getListsByUser]",
      `Found ${rows.length} lists for user ${userId}`
    );

    return rows;
  } catch (err) {
    console.error(
      "[ListService:getListsByUser]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw listServiceError("Failed to load lists. Please try again.", err);
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Create a new draft list with a system-assigned slug.
 *
 * Slug is generated as the first 4 hex characters of a random UUID.
 * On the extremely unlikely event of a per-user collision, one retry
 * is attempted before throwing a SLUG_COLLISION error.
 *
 * @param userId - The authenticated user's id
 * @param title  - The list title (already validated by the caller)
 * @returns CreateListResult containing the full new list record
 * @throws {ListServiceError} code SLUG_COLLISION if both slug attempts collide
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function createList({
  userId,
  title,
}: {
  userId: string;
  title: string;
}): Promise<CreateListResult> {

  console.info(
    "[ListService:createList]",
    `Creating list for user ${userId}, title: "${title}"`
  );

  const attemptInsert = async (slug: string) => {
    return listRepository.insertList({ userId, title, slug, isPublished: false });
  };

  try {
    const slug = generateSlug();
    const row = await attemptInsert(slug);

    console.info(
      "[ListService:createList]",
      `List created with id ${row.id}, slug ${row.slug}`
    );

    return { list: row };
  } catch (firstErr) {
    if (!isUniqueViolation(firstErr)) {
      console.error(
        "[ListService:createList]",
        "DB error:",
        firstErr instanceof Error ? firstErr.message : "Unknown error"
      );
      throw listServiceError(
        "Failed to create list. Please try again.",
        firstErr
      );
    }

    // Retry once on slug collision
    console.warn(
      "[ListService:createList]",
      "Slug collision on first attempt, retrying with new slug"
    );

    try {
      const retrySlug = generateSlug();
      const row = await attemptInsert(retrySlug);

      console.info(
        "[ListService:createList]",
        `List created on retry with id ${row.id}, slug ${row.slug}`
      );

      return { list: row };
    } catch (retryErr) {
      if (isUniqueViolation(retryErr)) {
        throw slugCollisionError(retryErr);
      }
      console.error(
        "[ListService:createList]",
        "DB error on retry:",
        retryErr instanceof Error ? retryErr.message : "Unknown error"
      );
      throw listServiceError(
        "Failed to create list. Please try again.",
        retryErr
      );
    }
  }
}

/**
 * Update a list's title and/or description.
 *
 * @param listId      - The list's UUID
 * @param userId      - The authenticated user's id (ownership check)
 * @param title       - Optional new title
 * @param description - Optional new description
 * @returns UpdateListResult with the updated fields
 * @throws {ListServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function updateList({
  listId,
  userId,
  title,
  description,
}: {
  listId: string;
  userId: string;
  title?: string;
  description?: string;
}): Promise<UpdateListResult> {
  console.info(
    "[ListService:updateList]",
    `Updating list ${listId} for user ${userId}`
  );

  try {
    const row = await listRepository.updateList({ listId, userId, title, description });

    if (!row) {
      throw notFoundError();
    }

    console.info("[ListService:updateList]", `List ${listId} updated`);

    return { list: row };
  } catch (err) {
    if (err instanceof ListServiceError) throw err;
    console.error(
      "[ListService:updateList]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw listServiceError("Failed to update list. Please try again.", err);
  }
}

/**
 * Soft-delete a list by setting deletedAt to the current timestamp.
 *
 * @param listId - The list's UUID
 * @param userId - The authenticated user's id (ownership check)
 * @returns DeleteListResult { success: true }
 * @throws {ListServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function deleteList({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<DeleteListResult> {
  console.info(
    "[ListService:deleteList]",
    `Soft-deleting list ${listId} for user ${userId}`
  );

  try {
    const row = await listRepository.softDeleteList({ listId, userId });

    if (!row) {
      throw notFoundError();
    }

    console.info("[ListService:deleteList]", `List ${listId} soft-deleted`);

    return { success: true };
  } catch (err) {
    if (err instanceof ListServiceError) throw err;
    console.error(
      "[ListService:deleteList]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw listServiceError("Failed to delete list. Please try again.", err);
  }
}

/**
 * Publish a list (isPublished = true, publishedAt = now).
 *
 * @param listId - The list's UUID
 * @param userId - The authenticated user's id
 * @returns PublishListResult with updated isPublished, publishedAt, and vanitySlug
 * @throws {ListServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function publishList({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<PublishListResult> {
  console.info(
    "[ListService:publishList]",
    `Publishing list ${listId} for user ${userId}`
  );

  try {
    const row = await listRepository.publishList({ listId, userId });

    if (!row) {
      throw notFoundError();
    }

    const vanitySlug = await userRepository.getVanitySlugByUserId(userId);

    console.info("[ListService:publishList]", `List ${listId} published`);

    return { list: { ...row, vanitySlug: vanitySlug ?? null } };
  } catch (err) {
    if (err instanceof ListServiceError) throw err;
    console.error(
      "[ListService:publishList]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw listServiceError("Failed to publish list. Please try again.", err);
  }
}

/**
 * Unpublish a list (isPublished = false, publishedAt = null).
 *
 * @param listId - The list's UUID
 * @param userId - The authenticated user's id
 * @returns UnpublishListResult with updated isPublished and publishedAt
 * @throws {ListServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function unpublishList({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<UnpublishListResult> {
  console.info(
    "[ListService:unpublishList]",
    `Unpublishing list ${listId} for user ${userId}`
  );

  try {
    const row = await listRepository.unpublishList({ listId, userId });

    if (!row) {
      throw notFoundError();
    }

    const vanitySlug = await userRepository.getVanitySlugByUserId(userId);

    console.info("[ListService:unpublishList]", `List ${listId} unpublished`);

    return { list: { ...row, vanitySlug: vanitySlug ?? null } };
  } catch (err) {
    if (err instanceof ListServiceError) throw err;
    console.error(
      "[ListService:unpublishList]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw listServiceError("Failed to unpublish list. Please try again.", err);
  }
}
