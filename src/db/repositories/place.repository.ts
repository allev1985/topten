/**
 * Place Repository
 *
 * Pure data-access functions for the places and list_places tables.
 * No business logic — ownership checks that abort early, ALREADY_IN_LIST guards,
 * and error translation all live in the service layer.
 *
 * Two functions own db.transaction() internally:
 *   - createPlaceWithListAttachment — atomic insert + position + attach
 *   - deletePlaceWithCascade        — atomic ownership check + soft-delete + cascade
 *
 * @module db/repositories/place.repository
 */

import { eq, and, isNull, asc, max, not, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { places } from "@/db/schema/place";
import { listPlaces } from "@/db/schema/listPlace";
import { lists } from "@/db/schema/list";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlaceRecord = typeof places.$inferSelect;

export type PlaceSummaryRow = {
  id: string;
  name: string;
  address: string;
  description: string | null;
  heroImageUrl: string | null;
};

export type PlaceWithListCountRow = {
  id: string;
  name: string;
  address: string;
  description: string | null;
  heroImageUrl: string | null;
  activeListCount: number;
};

export type ListPlaceRow = { id: string; deletedAt: Date | null };

export type UpdatedPlaceRow = {
  id: string;
  description: string | null;
  updatedAt: Date;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch all active places attached to a list, in position order.
 */
export async function getPlacesByList(
  listId: string
): Promise<PlaceSummaryRow[]> {
  return db
    .select({
      id: places.id,
      name: places.name,
      address: places.address,
      description: places.description,
      heroImageUrl: places.heroImageUrl,
    })
    .from(listPlaces)
    .innerJoin(places, eq(listPlaces.placeId, places.id))
    .where(
      and(
        eq(listPlaces.listId, listId),
        isNull(listPlaces.deletedAt),
        isNull(places.deletedAt)
      )
    )
    .orderBy(asc(listPlaces.position));
}

/**
 * Fetch places that belong to the user but are NOT currently attached to
 * the target list.
 */
export async function getAvailablePlacesForList({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<PlaceSummaryRow[]> {
  const attachedInTarget = db
    .select({ placeId: listPlaces.placeId })
    .from(listPlaces)
    .where(and(eq(listPlaces.listId, listId), isNull(listPlaces.deletedAt)));

  return db
    .selectDistinct({
      id: places.id,
      name: places.name,
      address: places.address,
      description: places.description,
      heroImageUrl: places.heroImageUrl,
    })
    .from(places)
    .where(
      and(
        eq(places.userId, userId),
        isNull(places.deletedAt),
        not(inArray(places.id, attachedInTarget))
      )
    )
    .orderBy(asc(places.name));
}

/**
 * Fetch all active places for a user, annotated with active-list count.
 */
export async function getAllPlacesByUser({
  userId,
}: {
  userId: string;
}): Promise<PlaceWithListCountRow[]> {
  return db
    .select({
      id: places.id,
      name: places.name,
      address: places.address,
      description: places.description,
      heroImageUrl: places.heroImageUrl,
      activeListCount: sql<number>`cast(count(${listPlaces.id}) as int)`,
    })
    .from(places)
    .leftJoin(
      listPlaces,
      and(eq(listPlaces.placeId, places.id), isNull(listPlaces.deletedAt))
    )
    .where(and(eq(places.userId, userId), isNull(places.deletedAt)))
    .groupBy(
      places.id,
      places.name,
      places.address,
      places.description,
      places.heroImageUrl
    )
    .orderBy(asc(places.name));
}

/**
 * Look up an existing (userId, googlePlaceId) place record.
 * Includes soft-deleted rows so the service can restore rather than re-insert.
 *
 * @returns PlaceRecord (active or deleted) or null if not found
 */
export async function getPlaceByGoogleId({
  userId,
  googlePlaceId,
}: {
  userId: string;
  googlePlaceId: string;
}): Promise<PlaceRecord | null> {
  const rows = await db
    .select()
    .from(places)
    .where(
      and(eq(places.userId, userId), eq(places.googlePlaceId, googlePlaceId))
    );

  return (rows[0] as PlaceRecord) ?? null;
}

/**
 * Check whether a list is owned by (and not deleted for) the given user.
 *
 * @returns { slug: string } if list is accessible by userId, or null otherwise
 */
export async function getListOwnership({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<{ slug: string } | null> {
  const rows = await db
    .select({ id: lists.id, slug: lists.slug })
    .from(lists)
    .where(
      and(
        eq(lists.id, listId),
        eq(lists.userId, userId),
        isNull(lists.deletedAt)
      )
    );

  return rows[0] ? { slug: rows[0].slug } : null;
}

/**
 * Fetch any existing ListPlace row (active or soft-deleted) for a given
 * (listId, placeId) pair.
 */
export async function getListPlaceRow({
  listId,
  placeId,
}: {
  listId: string;
  placeId: string;
}): Promise<ListPlaceRow | null> {
  const rows = await db
    .select({ id: listPlaces.id, deletedAt: listPlaces.deletedAt })
    .from(listPlaces)
    .where(and(eq(listPlaces.listId, listId), eq(listPlaces.placeId, placeId)));

  return rows[0] ?? null;
}

/**
 * Return the current MAX position for active rows in a list (0 if empty).
 */
export async function getMaxPosition(listId: string): Promise<number> {
  const result = await db
    .select({ maxPos: max(listPlaces.position) })
    .from(listPlaces)
    .where(and(eq(listPlaces.listId, listId), isNull(listPlaces.deletedAt)));

  return result[0]?.maxPos ?? 0;
}

/**
 * Check whether a place is accessible by a user via a specific list
 * (for updatePlace / deletePlaceFromList with a list context).
 *
 * @returns { slug: string } if the place has an active attachment to an active list owned by userId, or null otherwise
 */
export async function getPlaceInListByOwner({
  placeId,
  listId,
  userId,
}: {
  placeId: string;
  listId: string;
  userId: string;
}): Promise<{ slug: string } | null> {
  const rows = await db
    .select({ placeId: listPlaces.placeId, slug: lists.slug })
    .from(listPlaces)
    .innerJoin(lists, eq(listPlaces.listId, lists.id))
    .innerJoin(places, eq(listPlaces.placeId, places.id))
    .where(
      and(
        eq(listPlaces.placeId, placeId),
        eq(listPlaces.listId, listId),
        eq(lists.userId, userId),
        isNull(lists.deletedAt),
        isNull(listPlaces.deletedAt),
        isNull(places.deletedAt)
      )
    );

  return rows[0] ? { slug: rows[0].slug } : null;
}

/**
 * Check whether a user directly owns an active place
 * (for updatePlace / deletePlace without a list context).
 *
 * @returns true if the place is active and owned by userId
 */
export async function getPlaceByOwner({
  placeId,
  userId,
}: {
  placeId: string;
  userId: string;
}): Promise<boolean> {
  const rows = await db
    .select({ id: places.id })
    .from(places)
    .where(
      and(
        eq(places.id, placeId),
        eq(places.userId, userId),
        isNull(places.deletedAt)
      )
    );

  return rows.length > 0;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Restore a soft-deleted place by clearing deletedAt.
 *
 * @param placeId - The place's UUID
 * @returns The restored full place row
 */
export async function restorePlace(placeId: string): Promise<PlaceRecord> {
  const rows = await db
    .update(places)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(places.id, placeId))
    .returning();

  const row = rows[0] as PlaceRecord;
  if (!row)
    throw new Error(`restorePlace: no row returned for place ${placeId}`);
  return row;
}

/**
 * Insert a new standalone place.
 *
 * @returns The full inserted place row
 */
export async function insertPlace(values: {
  userId: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  description?: string | null;
  heroImageUrl?: string | null;
}): Promise<PlaceRecord> {
  const rows = await db
    .insert(places)
    .values({
      ...values,
      description: values.description ?? null,
      heroImageUrl: values.heroImageUrl ?? null,
    })
    .returning();

  const row = rows[0] as PlaceRecord;
  if (!row) throw new Error("insertPlace: insert returned no row.");
  return row;
}

/**
 * Atomically insert a new place AND attach it to a list.
 *
 * Ownership of the list must be verified by the caller before invoking this.
 *
 * @returns The created place and the new ListPlace id
 */
export async function createPlaceWithListAttachment({
  listId,
  userId,
  googlePlaceId,
  name,
  address,
  latitude,
  longitude,
  description,
  heroImageUrl,
}: {
  listId: string;
  userId: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  description?: string | null;
  heroImageUrl?: string | null;
}): Promise<{ place: PlaceRecord; listPlaceId: string }> {
  return db.transaction(async (tx) => {
    const placeRows = await tx
      .insert(places)
      .values({
        userId,
        googlePlaceId,
        name,
        address,
        latitude,
        longitude,
        description: description ?? null,
        heroImageUrl: heroImageUrl ?? null,
      })
      .returning();

    const newPlace = placeRows[0] as PlaceRecord;
    if (!newPlace)
      throw new Error(
        "createPlaceWithListAttachment: place insert returned no row."
      );

    // Compute next position (MAX + 1, or 1 if list is empty)
    const posResult = await tx
      .select({ maxPos: max(listPlaces.position) })
      .from(listPlaces)
      .where(and(eq(listPlaces.listId, listId), isNull(listPlaces.deletedAt)));

    const nextPosition = (posResult[0]?.maxPos ?? 0) + 1;

    const lpRows = await tx
      .insert(listPlaces)
      .values({ listId, placeId: newPlace.id, position: nextPosition })
      .returning({ id: listPlaces.id });

    const lp = lpRows[0];
    if (!lp)
      throw new Error(
        "createPlaceWithListAttachment: listPlace insert returned no row."
      );

    return { place: newPlace, listPlaceId: lp.id };
  });
}

/**
 * Restore a previously soft-deleted ListPlace attachment at a new position.
 */
export async function restoreListPlace({
  listPlaceId,
  nextPosition,
}: {
  listPlaceId: string;
  nextPosition: number;
}): Promise<void> {
  await db
    .update(listPlaces)
    .set({ deletedAt: null, position: nextPosition })
    .where(eq(listPlaces.id, listPlaceId));
}

/**
 * Insert a new ListPlace attachment.
 *
 * @returns The new ListPlace id
 */
export async function insertListPlace(values: {
  listId: string;
  placeId: string;
  position: number;
}): Promise<{ id: string }> {
  const rows = await db
    .insert(listPlaces)
    .values(values)
    .returning({ id: listPlaces.id });

  const row = rows[0];
  if (!row) throw new Error("insertListPlace: insert returned no row.");
  return row;
}

/**
 * Update a place's description.
 *
 * @returns Updated partial row, or null if the place was not found / deleted
 */
export async function updatePlaceDescription({
  placeId,
  description,
}: {
  placeId: string;
  description?: string | null;
}): Promise<UpdatedPlaceRow | null> {
  const updateValues: Partial<{ description: string | null; updatedAt: Date }> =
    {
      updatedAt: new Date(),
    };
  if (description !== undefined) updateValues.description = description;

  const rows = await db
    .update(places)
    .set(updateValues)
    .where(and(eq(places.id, placeId), isNull(places.deletedAt)))
    .returning({
      id: places.id,
      description: places.description,
      updatedAt: places.updatedAt,
    });

  return rows[0] ?? null;
}

/**
 * Soft-delete the active ListPlace junction row for a (placeId, listId) pair.
 *
 * @returns The soft-deleted row id, or null if the row was not found / already deleted
 */
export async function softDeleteListPlace({
  placeId,
  listId,
}: {
  placeId: string;
  listId: string;
}): Promise<{ id: string } | null> {
  const rows = await db
    .update(listPlaces)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(listPlaces.placeId, placeId),
        eq(listPlaces.listId, listId),
        isNull(listPlaces.deletedAt)
      )
    )
    .returning({ id: listPlaces.id });

  return rows[0] ?? null;
}

/**
 * Atomically soft-delete a place and cascade to all its active list attachments.
 *
 * Both operations run in a single transaction — either both succeed or neither does.
 *
 * @returns { deletedListPlaceCount } or null if the place was not found / not owned
 */
export async function deletePlaceWithCascade({
  placeId,
  userId,
}: {
  placeId: string;
  userId: string;
}): Promise<{ deletedListPlaceCount: number; listSlugs: string[] } | null> {
  return db.transaction(async (tx) => {
    // Verify ownership inside the transaction
    const ownerRows = await tx
      .select({ id: places.id })
      .from(places)
      .where(
        and(
          eq(places.id, placeId),
          eq(places.userId, userId),
          isNull(places.deletedAt)
        )
      );

    if (ownerRows.length === 0) return null;

    // Soft-delete the place — share a single timestamp for both columns
    const now = new Date();
    await tx
      .update(places)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(places.id, placeId));

    // Collect slugs of affected lists before cascading
    const affectedLists = await tx
      .select({ slug: lists.slug })
      .from(listPlaces)
      .innerJoin(lists, eq(listPlaces.listId, lists.id))
      .where(
        and(eq(listPlaces.placeId, placeId), isNull(listPlaces.deletedAt))
      );
    const listSlugs = affectedLists.map((r) => r.slug);

    // Cascade soft-delete to all active ListPlace rows
    const cascadedRows = await tx
      .update(listPlaces)
      .set({ deletedAt: now })
      .where(and(eq(listPlaces.placeId, placeId), isNull(listPlaces.deletedAt)))
      .returning({ id: listPlaces.id });

    return { deletedListPlaceCount: cascadedRows.length, listSlugs };
  });
}
