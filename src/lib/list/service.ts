/**
 * List Service
 *
 * Centralised service for all list domain operations.
 * Owns all direct DB access for the list domain.
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

import { eq, and, isNull, desc, count } from "drizzle-orm";
import { db } from "@/db";
import { lists } from "@/db/schema/list";
import { listPlaces } from "@/db/schema/listPlace";
import { users } from "@/db/schema/user";
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
    const rows = await db
      .select({
        id: lists.id,
        title: lists.title,
        slug: lists.slug,
        description: lists.description,
        isPublished: lists.isPublished,
        createdAt: lists.createdAt,
        placeCount: count(listPlaces.id),
      })
      .from(lists)
      .leftJoin(
        listPlaces,
        and(eq(listPlaces.listId, lists.id), isNull(listPlaces.deletedAt))
      )
      .where(and(eq(lists.userId, userId), isNull(lists.deletedAt)))
      .groupBy(lists.id)
      .orderBy(desc(lists.createdAt));

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
 * @param params.userId - The authenticated user's id
 * @param params.title  - The list title (already validated by the caller)
 * @returns CreateListResult containing the full new list record
 * @throws {ListServiceError} code SLUG_COLLISION if both slug attempts collide
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function createList(params: {
  userId: string;
  title: string;
}): Promise<CreateListResult> {
  const { userId, title } = params;

  console.info(
    "[ListService:createList]",
    `Creating list for user ${userId}, title: "${title}"`
  );

  const attemptInsert = async (slug: string) => {
    const rows = await db
      .insert(lists)
      .values({
        userId,
        title,
        slug,
        isPublished: false,
      })
      .returning();
    const row = rows[0];
    if (!row) throw listServiceError("Insert returned no row.", null);
    return row;
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
 * Verifies ownership + non-deleted status before writing.
 * Only the fields provided in params are updated; slug is never modified.
 * updatedAt is always refreshed.
 *
 * @param params.listId      - The list's UUID
 * @param params.userId      - The authenticated user's id (ownership check)
 * @param params.title       - Optional new title
 * @param params.description - Optional new description
 * @returns UpdateListResult with the updated fields
 * @throws {ListServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function updateList(params: {
  listId: string;
  userId: string;
  title?: string;
  description?: string;
}): Promise<UpdateListResult> {
  const { listId, userId, title, description } = params;

  console.info(
    "[ListService:updateList]",
    `Updating list ${listId} for user ${userId}`
  );

  const updateValues: Partial<{
    title: string;
    description: string;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (title !== undefined) updateValues.title = title;
  if (description !== undefined) updateValues.description = description;

  try {
    const rows = await db
      .update(lists)
      .set(updateValues)
      .where(
        and(
          eq(lists.id, listId),
          eq(lists.userId, userId),
          isNull(lists.deletedAt)
        )
      )
      .returning({
        id: lists.id,
        title: lists.title,
        description: lists.description,
        updatedAt: lists.updatedAt,
      });

    if (rows.length === 0) {
      throw notFoundError();
    }

    console.info("[ListService:updateList]", `List ${listId} updated`);

    return { list: rows[0]! };
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
 * Verifies ownership + non-deleted status before writing.
 * This operation is idempotent: re-deleting an already-deleted list
 * returns NOT_FOUND (filtered by deletedAt IS NULL).
 *
 * @param params.listId - The list's UUID
 * @param params.userId - The authenticated user's id (ownership check)
 * @returns DeleteListResult { success: true }
 * @throws {ListServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function deleteList(params: {
  listId: string;
  userId: string;
}): Promise<DeleteListResult> {
  const { listId, userId } = params;

  console.info(
    "[ListService:deleteList]",
    `Soft-deleting list ${listId} for user ${userId}`
  );

  try {
    const now = new Date();
    const rows = await db
      .update(lists)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          eq(lists.id, listId),
          eq(lists.userId, userId),
          isNull(lists.deletedAt)
        )
      )
      .returning({ id: lists.id });

    if (rows.length === 0) {
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
 * Verifies ownership + non-deleted status. Attempting to publish
 * an already-deleted list throws NOT_FOUND.
 *
 * @param params.listId - The list's UUID
 * @param params.userId - The authenticated user's id
 * @returns PublishListResult with updated isPublished and publishedAt
 * @throws {ListServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function publishList(params: {
  listId: string;
  userId: string;
}): Promise<PublishListResult> {
  const { listId, userId } = params;

  console.info(
    "[ListService:publishList]",
    `Publishing list ${listId} for user ${userId}`
  );

  try {
    const now = new Date();
    const rows = await db
      .update(lists)
      .set({ isPublished: true, publishedAt: now, updatedAt: now })
      .where(
        and(
          eq(lists.id, listId),
          eq(lists.userId, userId),
          isNull(lists.deletedAt)
        )
      )
      .returning({
        id: lists.id,
        isPublished: lists.isPublished,
        publishedAt: lists.publishedAt,
        slug: lists.slug,
      });

    if (rows.length === 0) {
      throw notFoundError();
    }

    const userRows = await db
      .select({ vanitySlug: users.vanitySlug })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    console.info("[ListService:publishList]", `List ${listId} published`);

    return { list: { ...rows[0]!, vanitySlug: userRows[0]?.vanitySlug ?? null } };
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
 * Verifies ownership + non-deleted status. Attempting to unpublish
 * an already-deleted list throws NOT_FOUND.
 *
 * @param params.listId - The list's UUID
 * @param params.userId - The authenticated user's id
 * @returns UnpublishListResult with updated isPublished and publishedAt
 * @throws {ListServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {ListServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function unpublishList(params: {
  listId: string;
  userId: string;
}): Promise<UnpublishListResult> {
  const { listId, userId } = params;

  console.info(
    "[ListService:unpublishList]",
    `Unpublishing list ${listId} for user ${userId}`
  );

  try {
    const now = new Date();
    const rows = await db
      .update(lists)
      .set({ isPublished: false, publishedAt: null, updatedAt: now })
      .where(
        and(
          eq(lists.id, listId),
          eq(lists.userId, userId),
          isNull(lists.deletedAt)
        )
      )
      .returning({
        id: lists.id,
        isPublished: lists.isPublished,
        publishedAt: lists.publishedAt,
        slug: lists.slug,
      });

    if (rows.length === 0) {
      throw notFoundError();
    }

    const userRows = await db
      .select({ vanitySlug: users.vanitySlug })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    console.info("[ListService:unpublishList]", `List ${listId} unpublished`);

    return { list: { ...rows[0]!, vanitySlug: userRows[0]?.vanitySlug ?? null } };
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
