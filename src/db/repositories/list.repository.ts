/**
 * List Repository
 *
 * Pure data-access functions for the lists table.
 * No business logic — all validation, error translation, and slug-generation
 * live in the service layer.
 *
 * @module db/repositories/list.repository
 */

import { eq, and, isNull, desc, count } from "drizzle-orm";
import { db } from "@/db";
import { lists } from "@/db/schema/list";
import { listPlaces } from "@/db/schema/listPlace";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListSummaryRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  createdAt: Date;
  placeCount: number;
};

export type ListRow = typeof lists.$inferSelect;

export type UpdatedListRow = {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
};

export type PublishRow = {
  id: string;
  isPublished: boolean;
  publishedAt: Date | null;
  slug: string;
};

export type DeletedListRow = { id: string };

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch all active (non-deleted) lists for a user, newest first,
 * with an active place count per list.
 *
 * @param userId - The authenticated user's UUID
 * @returns Array of list summary rows ordered by createdAt DESC
 */
export async function getListsByUser(
  userId: string
): Promise<ListSummaryRow[]> {
  return db
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
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Insert a new draft list row.
 *
 * @param values.userId      - Owning user's UUID
 * @param values.title       - List title
 * @param values.slug        - Pre-generated slug
 * @param values.isPublished - Always false for a new list
 * @returns The full inserted list row
 */
export async function insertList(values: {
  userId: string;
  title: string;
  slug: string;
  isPublished: false;
}): Promise<ListRow> {
  const rows = await db.insert(lists).values(values).returning();
  const row = rows[0];
  if (!row) throw new Error("List insert returned no row.");
  return row;
}

/**
 * Update a list's title and/or description (ownership-scoped).
 *
 * @returns Updated partial row, or null if no matching active list was found
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
}): Promise<UpdatedListRow | null> {
  const updateValues: Partial<{
    title: string;
    description: string;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (title !== undefined) updateValues.title = title;
  if (description !== undefined) updateValues.description = description;

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

  return rows[0] ?? null;
}

/**
 * Soft-delete a list by setting deletedAt (ownership-scoped).
 *
 * @returns Partial row, or null if no matching active list was found
 */
export async function softDeleteList({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<DeletedListRow | null> {
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

  return rows[0] ?? null;
}

/**
 * Publish a list (ownership-scoped).
 *
 * @returns Updated publish fields, or null if no matching active list was found
 */
export async function publishList({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<PublishRow | null> {
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

  return rows[0] ?? null;
}

/**
 * Unpublish a list (ownership-scoped).
 *
 * @returns Updated publish fields, or null if no matching active list was found
 */
export async function unpublishList({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<PublishRow | null> {
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

  return rows[0] ?? null;
}
