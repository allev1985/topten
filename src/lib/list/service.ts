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
import { getTagsForLists } from "@/lib/tag";
import {
  ListServiceError,
  notFoundError,
  slugCollisionError,
  listServiceError,
  isUniqueViolation,
} from "./errors";
import { createServiceLogger } from "@/lib/services/logging";
import type {
  ListSummary,
  CreateListResult,
  UpdateListResult,
  DeleteListResult,
  PublishListResult,
  UnpublishListResult,
} from "./types";

const log = createServiceLogger("list-service");

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
  log.debug({ method: "getListsByUser", userId }, "Fetching lists for user");

  try {
    const rows = await listRepository.getListsByUser(userId);

    // Batch-fetch tags for all lists in a single query
    const listIds = rows.map((r) => r.id);
    const tagRows = await getTagsForLists(listIds);
    const tagsByListId = new Map<string, string[]>();
    for (const t of tagRows) {
      const labels = tagsByListId.get(t.entityId) ?? [];
      labels.push(t.label);
      tagsByListId.set(t.entityId, labels);
    }

    const lists = rows.map((r) => ({
      ...r,
      tags: tagsByListId.get(r.id) ?? [],
    }));

    log.info(
      { method: "getListsByUser", userId, count: lists.length },
      "Lists fetched"
    );

    return lists;
  } catch (err) {
    log.error({ method: "getListsByUser", userId, err }, "DB error");
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
  log.info({ method: "createList", userId }, "Creating list");

  const attemptInsert = async (slug: string) => {
    return listRepository.insertList({
      userId,
      title,
      slug,
      isPublished: false,
    });
  };

  try {
    const slug = generateSlug();
    const row = await attemptInsert(slug);

    log.info(
      { method: "createList", userId, listId: row.id, slug: row.slug },
      "List created"
    );

    return { list: row };
  } catch (firstErr) {
    if (!isUniqueViolation(firstErr)) {
      log.error({ method: "createList", userId, err: firstErr }, "DB error");
      throw listServiceError(
        "Failed to create list. Please try again.",
        firstErr
      );
    }

    log.warn(
      { method: "createList", userId },
      "Slug collision on first attempt, retrying"
    );

    try {
      const retrySlug = generateSlug();
      const row = await attemptInsert(retrySlug);

      log.info(
        { method: "createList", userId, listId: row.id, slug: row.slug },
        "List created on retry"
      );

      return { list: row };
    } catch (retryErr) {
      if (isUniqueViolation(retryErr)) {
        throw slugCollisionError(retryErr);
      }
      log.error(
        { method: "createList", userId, err: retryErr },
        "DB error on retry"
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
  log.info({ method: "updateList", userId, listId }, "Updating list");

  try {
    const row = await listRepository.updateList({
      listId,
      userId,
      title,
      description,
    });

    if (!row) {
      throw notFoundError();
    }

    log.info({ method: "updateList", userId, listId }, "List updated");

    return { list: row };
  } catch (err) {
    if (err instanceof ListServiceError) throw err;
    log.error({ method: "updateList", userId, listId, err }, "DB error");
    throw listServiceError("Failed to update list. Please try again.", err);
  }
}

/**
 * Soft-delete a list by setting deletedAt to the current timestamp.
 *
 * @param listId - The list's UUID
 * @param userId - The authenticated user's id (ownership check)
 * @returns DeleteListResult { success: true, slug }
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
  log.info({ method: "deleteList", userId, listId }, "Soft-deleting list");

  try {
    const row = await listRepository.softDeleteList({ listId, userId });

    if (!row) {
      throw notFoundError();
    }

    log.info({ method: "deleteList", userId, listId }, "List soft-deleted");

    return { success: true, slug: row.slug };
  } catch (err) {
    if (err instanceof ListServiceError) throw err;
    log.error({ method: "deleteList", userId, listId, err }, "DB error");
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
  log.info({ method: "publishList", userId, listId }, "Publishing list");

  try {
    const row = await listRepository.publishList({ listId, userId });

    if (!row) {
      throw notFoundError();
    }

    const vanitySlug = await userRepository.getVanitySlugByUserId(userId);

    log.info({ method: "publishList", userId, listId }, "List published");

    return { list: { ...row, vanitySlug: vanitySlug ?? null } };
  } catch (err) {
    if (err instanceof ListServiceError) throw err;
    log.error({ method: "publishList", userId, listId, err }, "DB error");
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
  log.info({ method: "unpublishList", userId, listId }, "Unpublishing list");

  try {
    const row = await listRepository.unpublishList({ listId, userId });

    if (!row) {
      throw notFoundError();
    }

    const vanitySlug = await userRepository.getVanitySlugByUserId(userId);

    log.info({ method: "unpublishList", userId, listId }, "List unpublished");

    return { list: { ...row, vanitySlug: vanitySlug ?? null } };
  } catch (err) {
    if (err instanceof ListServiceError) throw err;
    log.error({ method: "unpublishList", userId, listId, err }, "DB error");
    throw listServiceError("Failed to unpublish list. Please try again.", err);
  }
}
