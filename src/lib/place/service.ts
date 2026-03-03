/**
 * Place Service
 *
 * Centralised service for all place domain operations.
 * Owns all direct DB access for the place domain.
 * Used by place server actions — never called from client code.
 *
 * Public API:
 *   - getPlacesByList          — fetch all active places for a list, in position order
 *   - getAvailablePlacesForList — places the user owns that are NOT yet in the target list
 *   - createPlace              — create a new place and attach it to a list (atomic transaction)
 *   - addExistingPlaceToList   — attach an existing place to a list
 *   - updatePlace              — update a place's name and/or address
 *   - deletePlaceFromList      — remove a place from a specific list (soft-deletes the ListPlace row)
 *
 * Architecture: src/lib/place/service.ts → src/actions/place-actions.ts → client
 * Spec: specs/006-places-service/
 *
 * @module place/service
 */

import { eq, and, isNull, asc, max, not, inArray } from "drizzle-orm";
import { db } from "@/db";
import { places } from "@/db/schema/place";
import { listPlaces } from "@/db/schema/listPlace";
import { lists } from "@/db/schema/list";
import {
  PlaceServiceError,
  notFoundError,
  alreadyInListError,
  placeServiceError,
} from "./service/errors";
import type {
  PlaceSummary,
  PlaceRecord,
  CreatePlaceResult,
  AddExistingPlaceResult,
  UpdatePlaceResult,
  DeletePlaceResult,
} from "./service/types";

export type {
  PlaceSummary,
  PlaceRecord,
  CreatePlaceResult,
  AddExistingPlaceResult,
  UpdatePlaceResult,
  DeletePlaceResult,
};

export { PlaceServiceError };

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all active (non-deleted) places attached to a list, in position order.
 *
 * Filters out both soft-deleted ListPlace rows and soft-deleted Place rows.
 *
 * @param listId - The list's UUID
 * @returns Array of PlaceSummary objects ordered by ListPlace.position ASC
 * @throws {PlaceServiceError} code SERVICE_ERROR on DB failure
 */
export async function getPlacesByList(listId: string): Promise<PlaceSummary[]> {
  console.info(
    "[PlaceService:getPlacesByList]",
    `Fetching places for list ${listId}`
  );

  try {
    const rows = await db
      .select({
        id: places.id,
        name: places.name,
        address: places.address,
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

    console.info(
      "[PlaceService:getPlacesByList]",
      `Found ${rows.length} places for list ${listId}`
    );

    return rows;
  } catch (err) {
    console.error(
      "[PlaceService:getPlacesByList]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError("Failed to load places. Please try again.", err);
  }
}

/**
 * Fetch places that belong to the user but are NOT currently attached to the
 * target list — suitable for the "add existing place" search path.
 *
 * A place is "available" when:
 *   - It is active (deletedAt IS NULL on the Place row)
 *   - It belongs to at least one of the user's active lists (via an active ListPlace row)
 *   - It does NOT have an active ListPlace row for the specified listId
 *
 * @param params.listId  - Target list to exclude already-attached places from
 * @param params.userId  - Authenticated user whose lists are searched
 * @returns Array of PlaceSummary objects ordered by name ASC
 * @throws {PlaceServiceError} code SERVICE_ERROR on DB failure
 */
export async function getAvailablePlacesForList(params: {
  listId: string;
  userId: string;
}): Promise<PlaceSummary[]> {
  const { listId, userId } = params;

  console.info(
    "[PlaceService:getAvailablePlacesForList]",
    `Fetching available places for list ${listId}, user ${userId}`
  );

  try {
    // Subquery: placeIds already attached to this list (active rows only)
    const attachedInTarget = db
      .select({ placeId: listPlaces.placeId })
      .from(listPlaces)
      .where(
        and(
          eq(listPlaces.listId, listId),
          isNull(listPlaces.deletedAt)
        )
      );

    // Subquery: placeIds belonging to the user (via any active list)
    const userListIds = db
      .select({ id: lists.id })
      .from(lists)
      .where(and(eq(lists.userId, userId), isNull(lists.deletedAt)));

    const rows = await db
      .selectDistinct({
        id: places.id,
        name: places.name,
        address: places.address,
      })
      .from(places)
      .innerJoin(
        listPlaces,
        and(
          eq(listPlaces.placeId, places.id),
          isNull(listPlaces.deletedAt)
        )
      )
      .where(
        and(
          isNull(places.deletedAt),
          inArray(listPlaces.listId, userListIds),
          not(inArray(places.id, attachedInTarget))
        )
      )
      .orderBy(asc(places.name));

    console.info(
      "[PlaceService:getAvailablePlacesForList]",
      `Found ${rows.length} available places for list ${listId}`
    );

    return rows;
  } catch (err) {
    console.error(
      "[PlaceService:getAvailablePlacesForList]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError(
      "Failed to load available places. Please try again.",
      err
    );
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new place and atomically attach it to the given list.
 *
 * - Verifies list ownership before writing.
 * - googlePlaceId is assigned as crypto.randomUUID() (forward-compatible with
 *   Google Places integration; stored for deduplication when that lands).
 * - latitude and longitude are stored as "0" (schema is NOT NULL; no migration
 *   needed when real values are added later).
 * - position is MAX(current positions) + 1, computed inside the transaction.
 *
 * @param params.listId  - The list to attach the new place to
 * @param params.userId  - Authenticated user (ownership check)
 * @param params.name    - Place name (already validated)
 * @param params.address - Place address (already validated)
 * @returns CreatePlaceResult containing the new place record and listPlaceId
 * @throws {PlaceServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function createPlace(params: {
  listId: string;
  userId: string;
  name: string;
  address: string;
}): Promise<CreatePlaceResult> {
  const { listId, userId, name, address } = params;

  console.info(
    "[PlaceService:createPlace]",
    `Creating place "${name}" in list ${listId} for user ${userId}`
  );

  // Verify list ownership outside the transaction (cheap read first)
  const ownerRows = await db
    .select({ id: lists.id })
    .from(lists)
    .where(
      and(
        eq(lists.id, listId),
        eq(lists.userId, userId),
        isNull(lists.deletedAt)
      )
    );

  if (ownerRows.length === 0) {
    throw notFoundError();
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Insert the new Place
      const placeRows = await tx
        .insert(places)
        .values({
          googlePlaceId: crypto.randomUUID(),
          name,
          address,
          latitude: "0",
          longitude: "0",
        })
        .returning();

      const place = placeRows[0];
      if (!place) throw placeServiceError("Place insert returned no row.");

      // Compute next position (MAX + 1, or 1 if list is empty)
      const posResult = await tx
        .select({ maxPos: max(listPlaces.position) })
        .from(listPlaces)
        .where(
          and(eq(listPlaces.listId, listId), isNull(listPlaces.deletedAt))
        );

      const nextPosition = (posResult[0]?.maxPos ?? 0) + 1;

      // Attach Place to the List
      const lpRows = await tx
        .insert(listPlaces)
        .values({
          listId,
          placeId: place.id,
          position: nextPosition,
        })
        .returning({ id: listPlaces.id });

      const lp = lpRows[0];
      if (!lp) throw placeServiceError("ListPlace insert returned no row.");

      return { place, listPlaceId: lp.id };
    });

    console.info(
      "[PlaceService:createPlace]",
      `Place created with id ${result.place.id}, attached as listPlace ${result.listPlaceId}`
    );

    return result;
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    console.error(
      "[PlaceService:createPlace]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError(
      "Failed to create place. Please try again.",
      err
    );
  }
}

/**
 * Attach an existing place to a list.
 *
 * - Verifies list ownership before writing.
 * - Rejects if the place already has an active ListPlace row for this list.
 * - position is MAX(current positions) + 1.
 *
 * @param params.listId  - Target list
 * @param params.placeId - Existing place to attach
 * @param params.userId  - Authenticated user (ownership check)
 * @returns AddExistingPlaceResult containing the new listPlace id
 * @throws {PlaceServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {PlaceServiceError} code ALREADY_IN_LIST if place is already attached
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function addExistingPlaceToList(params: {
  listId: string;
  placeId: string;
  userId: string;
}): Promise<AddExistingPlaceResult> {
  const { listId, placeId, userId } = params;

  console.info(
    "[PlaceService:addExistingPlaceToList]",
    `Attaching place ${placeId} to list ${listId} for user ${userId}`
  );

  // Verify list ownership
  const ownerRows = await db
    .select({ id: lists.id })
    .from(lists)
    .where(
      and(
        eq(lists.id, listId),
        eq(lists.userId, userId),
        isNull(lists.deletedAt)
      )
    );

  if (ownerRows.length === 0) {
    throw notFoundError();
  }

  // Check for existing active attachment
  const existing = await db
    .select({ id: listPlaces.id })
    .from(listPlaces)
    .where(
      and(
        eq(listPlaces.listId, listId),
        eq(listPlaces.placeId, placeId),
        isNull(listPlaces.deletedAt)
      )
    );

  if (existing.length > 0) {
    throw alreadyInListError();
  }

  try {
    // Compute next position
    const posResult = await db
      .select({ maxPos: max(listPlaces.position) })
      .from(listPlaces)
      .where(
        and(eq(listPlaces.listId, listId), isNull(listPlaces.deletedAt))
      );

    const nextPosition = (posResult[0]?.maxPos ?? 0) + 1;

    const lpRows = await db
      .insert(listPlaces)
      .values({
        listId,
        placeId,
        position: nextPosition,
      })
      .returning({ id: listPlaces.id });

    const lp = lpRows[0];
    if (!lp) throw placeServiceError("ListPlace insert returned no row.");

    console.info(
      "[PlaceService:addExistingPlaceToList]",
      `Place ${placeId} attached to list ${listId} at position ${nextPosition}`
    );

    return { listPlaceId: lp.id };
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    console.error(
      "[PlaceService:addExistingPlaceToList]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError(
      "Failed to add place to list. Please try again.",
      err
    );
  }
}

/**
 * Update a place's name and/or address.
 *
 * - Verifies list ownership and that the place is active.
 * - Only updates the fields provided; updatedAt is always refreshed.
 * - googlePlaceId is immutable and never accepted as input.
 *
 * @param params.placeId - The place's UUID
 * @param params.listId  - A list that is owned by the user (used for ownership check)
 * @param params.userId  - Authenticated user's id
 * @param params.name    - Optional new name
 * @param params.address - Optional new address
 * @returns UpdatePlaceResult with the updated fields
 * @throws {PlaceServiceError} code NOT_FOUND if place missing, deleted, or not in user's list
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function updatePlace(params: {
  placeId: string;
  listId: string;
  userId: string;
  name?: string;
  address?: string;
}): Promise<UpdatePlaceResult> {
  const { placeId, listId, userId, name, address } = params;

  console.info(
    "[PlaceService:updatePlace]",
    `Updating place ${placeId} for user ${userId}`
  );

  // Verify list ownership and that the place is attached to this list
  const ownerRows = await db
    .select({ placeId: listPlaces.placeId })
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

  if (ownerRows.length === 0) {
    throw notFoundError();
  }

  const updateValues: Partial<{
    name: string;
    address: string;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (name !== undefined) updateValues.name = name;
  if (address !== undefined) updateValues.address = address;

  try {
    const rows = await db
      .update(places)
      .set(updateValues)
      .where(and(eq(places.id, placeId), isNull(places.deletedAt)))
      .returning({
        id: places.id,
        name: places.name,
        address: places.address,
        updatedAt: places.updatedAt,
      });

    if (rows.length === 0) {
      throw notFoundError();
    }

    console.info("[PlaceService:updatePlace]", `Place ${placeId} updated`);

    return { place: rows[0]! };
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    console.error(
      "[PlaceService:updatePlace]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError(
      "Failed to update place. Please try again.",
      err
    );
  }
}

/**
 * Remove a place from a specific list by soft-deleting its ListPlace junction row.
 *
 * The Place record itself is left intact so the place remains available on any
 * other lists it belongs to. Only the attachment to this particular list is
 * removed.
 *
 * - Verifies that the place is attached to a list owned by the user.
 * - This operation is idempotent: the deletedAt IS NULL check means calling
 *   again on an already-removed place returns NOT_FOUND.
 *
 * @param params.placeId - The place's UUID
 * @param params.listId  - The list to remove the place from
 * @param params.userId  - Authenticated user's id (ownership check)
 * @returns DeletePlaceResult { success: true }
 * @throws {PlaceServiceError} code NOT_FOUND if attachment missing, already removed, or wrong owner
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function deletePlaceFromList(params: {
  placeId: string;
  listId: string;
  userId: string;
}): Promise<DeletePlaceResult> {
  const { placeId, listId, userId } = params;

  console.info(
    "[PlaceService:deletePlaceFromList]",
    `Removing place ${placeId} from list ${listId} for user ${userId}`
  );

  // Verify list ownership and that the attachment is currently active
  const ownerRows = await db
    .select({ placeId: listPlaces.placeId })
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

  if (ownerRows.length === 0) {
    throw notFoundError();
  }

  try {
    // Soft-delete the ListPlace row — the Place record is left untouched
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

    if (rows.length === 0) {
      throw notFoundError();
    }

    console.info(
      "[PlaceService:deletePlaceFromList]",
      `Place ${placeId} removed from list ${listId}`
    );

    return { success: true };
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    console.error(
      "[PlaceService:deletePlaceFromList]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError(
      "Failed to remove place from list. Please try again.",
      err
    );
  }
}
