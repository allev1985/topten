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
 *   - getAllPlacesByUser        — all active places for a user with active-list counts
 *   - createPlace              — create a new place; if listId is provided, atomically attach it to that list
 *   - addExistingPlaceToList   — attach an existing place to a list
 *   - updatePlace              — update a place's name and/or address
 *   - deletePlaceFromList      — remove a place from a specific list (soft-deletes the ListPlace row)
 *   - deletePlace              — soft-delete a place and cascade to all list attachments
 *
 * Architecture: src/lib/place/service.ts → src/actions/place-actions.ts → client
 * Spec: specs/006-places-service/
 *
 * @module place/service
 */

import { eq, and, isNull, asc, max, not, inArray, sql } from "drizzle-orm";
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
  RemovePlaceFromListResult,
  PlaceWithListCount,
  DeletePlaceResult,
} from "./service/types";

export type {
  PlaceSummary,
  PlaceRecord,
  CreatePlaceResult,
  AddExistingPlaceResult,
  UpdatePlaceResult,
  RemovePlaceFromListResult,
  PlaceWithListCount,
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
 *   - The Place record is active (deletedAt IS NULL)
 *   - It is (or was) connected to at least one of the user's active lists via
 *     any ListPlace row, active or soft-deleted — this is the ownership proof
 *   - It does NOT have an *active* ListPlace row for the specified listId
 *
 * Soft-deleted ListPlace rows are intentionally included in the ownership join
 * so that a place removed from all its lists remains discoverable and can be
 * re-added (the re-add path restores the ListPlace row).
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
        and(eq(listPlaces.listId, listId), isNull(listPlaces.deletedAt))
      );

    // places.userId is the direct ownership proof — no list join required
    const rows = await db
      .select({
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

/**
 * Fetch all active places belonging to a user, annotated with the count of
 * active lists they currently appear in.
 *
 * @param params.userId - Authenticated user whose places are fetched
 * @returns Array of PlaceWithListCount ordered by name ASC
 * @throws {PlaceServiceError} code SERVICE_ERROR on DB failure
 */
export async function getAllPlacesByUser(params: {
  userId: string;
}): Promise<PlaceWithListCount[]> {
  const { userId } = params;

  console.info(
    "[PlaceService:getAllPlacesByUser]",
    `Fetching all places for user ${userId}`
  );

  try {
    const rows = await db
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
        and(
          eq(listPlaces.placeId, places.id),
          isNull(listPlaces.deletedAt)
        )
      )
      .where(and(eq(places.userId, userId), isNull(places.deletedAt)))
      .groupBy(places.id, places.name, places.address, places.description, places.heroImageUrl)
      .orderBy(asc(places.name));

    console.info(
      "[PlaceService:getAllPlacesByUser]",
      `Found ${rows.length} places for user ${userId}`
    );

    return rows;
  } catch (err) {
    console.error(
      "[PlaceService:getAllPlacesByUser]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError("Failed to load places. Please try again.", err);
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new place.
 *
 * When `listId` is provided, the place is atomically inserted and attached to
 * that list (ownership verified, position computed as MAX+1).
 * When `listId` is omitted, the place is created standalone with no list attachment.
 *
 * All fields — googlePlaceId, latitude, longitude, description, heroImageUrl —
 * come from the Google Places API response and are stored as-is.
 * After creation, only `description` may be updated via updatePlace.
 *
 * @param params.listId       - Optional list to attach the new place to
 * @param params.userId       - Authenticated user (ownership check when listId provided)
 * @param params.googlePlaceId - Real Google place ID from the API
 * @param params.name         - Place name (from API displayName.text)
 * @param params.address      - Formatted address (from API formattedAddress)
 * @param params.latitude     - Latitude decimal string (from API location.latitude)
 * @param params.longitude    - Longitude decimal string (from API location.longitude)
 * @param params.description  - Editorial summary, nullable (from API editorialSummary.text)
 * @param params.heroImageUrl - Resolved photo URI, nullable (from resolvePhotoUri)
 * @returns CreatePlaceResult — listPlaceId is present when the place was attached to a list
 * @throws {PlaceServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function createPlace(params: {
  listId?: string;
  userId: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  description?: string | null;
  heroImageUrl?: string | null;
}): Promise<CreatePlaceResult> {
  const { listId, userId, googlePlaceId, name, address, latitude, longitude, description, heroImageUrl } = params;

  console.info(
    "[PlaceService:createPlace]",
    listId
      ? `Creating place "${name}" in list ${listId} for user ${userId}`
      : `Creating standalone place "${name}" for user ${userId}`
  );

  if (!listId) {
    try {
      const rows = await db
        .insert(places)
        .values({ userId, googlePlaceId, name, address, latitude, longitude, description: description ?? null, heroImageUrl: heroImageUrl ?? null })
        .returning();
      const place = rows[0];
      if (!place) throw placeServiceError("Place insert returned no row.");
      console.info("[PlaceService:createPlace]", `Created standalone place ${place.id}`);
      return { place };
    } catch (err) {
      if (err instanceof PlaceServiceError) throw err;
      console.error(
        "[PlaceService:createPlace]",
        "DB error:",
        err instanceof Error ? err.message : "Unknown error"
      );
      throw placeServiceError("Failed to create place. Please try again.", err);
    }
  }

  // Verify list ownership outside the transaction (cheap read first)
  let ownerRows;
  try {
    ownerRows = await db
      .select({ id: lists.id })
      .from(lists)
      .where(
        and(
          eq(lists.id, listId),
          eq(lists.userId, userId),
          isNull(lists.deletedAt)
        )
      );
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    console.error(
      "[PlaceService:createPlace]",
      "Ownership check failed:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError("Failed to create place. Please try again.", err);
  }

  if (ownerRows.length === 0) {
    throw notFoundError();
  }

  try {
    const result = await db.transaction(async (tx) => {
      const placeRows = await tx
        .insert(places)
        .values({ userId, googlePlaceId, name, address, latitude, longitude, description: description ?? null, heroImageUrl: heroImageUrl ?? null })
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
    throw placeServiceError("Failed to create place. Please try again.", err);
  }
}

/**
 * Attach an existing place to a list.
 *
 * - Verifies list ownership before writing.
 * - Rejects if the place already has an active ListPlace row for this list.
 * - If a soft-deleted ListPlace row exists for this list, it is restored
 *   (deletedAt set back to null, position recomputed to MAX+1) rather than
 *   inserting a duplicate row — this is the idiomatic re-add path.
 * - If no prior row exists, a fresh ListPlace row is inserted at MAX+1.
 *
 * @param params.listId  - Target list
 * @param params.placeId - Existing place to attach
 * @param params.userId  - Authenticated user (ownership check)
 * @returns AddExistingPlaceResult containing the listPlace id (restored or new)
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

  // Check for any existing row — active or previously soft-deleted
  const existing = await db
    .select({ id: listPlaces.id, deletedAt: listPlaces.deletedAt })
    .from(listPlaces)
    .where(
      and(
        eq(listPlaces.listId, listId),
        eq(listPlaces.placeId, placeId)
      )
    );

  const existingRow = existing[0];

  if (existingRow && existingRow.deletedAt === null) {
    throw alreadyInListError();
  }

  try {
    // Compute next position (append to end regardless of restore or fresh insert)
    const posResult = await db
      .select({ maxPos: max(listPlaces.position) })
      .from(listPlaces)
      .where(
        and(eq(listPlaces.listId, listId), isNull(listPlaces.deletedAt))
      );

    const nextPosition = (posResult[0]?.maxPos ?? 0) + 1;

    if (existingRow) {
      // Restore the previously removed attachment instead of creating a duplicate
      await db
        .update(listPlaces)
        .set({ deletedAt: null, position: nextPosition })
        .where(eq(listPlaces.id, existingRow.id));

      console.info(
        "[PlaceService:addExistingPlaceToList]",
        `Place ${placeId} restored to list ${listId} at position ${nextPosition}`
      );

      return { listPlaceId: existingRow.id };
    }

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
 * Update a place's description.
 *
 * Only `description` may be updated — all other fields are immutable after creation.
 * Attempts to update name, address, coordinates, or heroImageUrl are rejected at
 * compile time (type signature) and would throw IMMUTABLE_FIELD if called directly.
 *
 * - Verifies ownership via list membership when `listId` is provided.
 * - Falls back to direct `places.userId` check when `listId` is omitted
 *   (used from the "My Places" context where no list context is available).
 * - updatedAt is always refreshed.
 *
 * @param params.placeId      - The place's UUID
 * @param params.listId       - Optional: a list owned by the user (for ownership check by list)
 * @param params.userId       - Authenticated user's id
 * @param params.description  - New description value (null to clear)
 * @returns UpdatePlaceResult with the updated description and timestamp
 * @throws {PlaceServiceError} code NOT_FOUND if place missing, deleted, or not owned by user
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function updatePlace(params: {
  placeId: string;
  listId?: string;
  userId: string;
  description?: string | null;
}): Promise<UpdatePlaceResult> {
  const { placeId, listId, userId, description } = params;

  console.info(
    "[PlaceService:updatePlace]",
    `Updating place ${placeId} for user ${userId}`
  );

  try {
    // Ownership check: use list membership when listId is provided,
    // otherwise verify directly via places.userId
    if (listId) {
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
    } else {
      const ownerRows = await db
        .select({ id: places.id })
        .from(places)
        .where(
          and(
            eq(places.id, placeId),
            eq(places.userId, userId),
            isNull(places.deletedAt)
          )
        );

      if (ownerRows.length === 0) {
        throw notFoundError();
      }
    }

    const updateValues: Partial<{
      description: string | null;
      updatedAt: Date;
    }> = { updatedAt: new Date() };

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
 * @returns RemovePlaceFromListResult { success: true }
 * @throws {PlaceServiceError} code NOT_FOUND if attachment missing, already removed, or wrong owner
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function deletePlaceFromList(params: {
  placeId: string;
  listId: string;
  userId: string;
}): Promise<RemovePlaceFromListResult> {
  const { placeId, listId, userId } = params;

  console.info(
    "[PlaceService:deletePlaceFromList]",
    `Removing place ${placeId} from list ${listId} for user ${userId}`
  );

  try {
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


/**
 * Permanently soft-delete a place and cascade to all its active list attachments.
 *
 * Both operations run in a single transaction to guarantee consistency.
 * After this call:
 *   - places.deletedAt and places.updatedAt are set to the same timestamp
 *   - All active ListPlace rows for this place have deletedAt set
 *
 * @param params.placeId - Place to delete
 * @param params.userId  - Authenticated user (ownership check)
 * @returns DeletePlaceResult with count of ListPlace rows cascaded
 * @throws {PlaceServiceError} code NOT_FOUND if place missing, deleted, or wrong owner
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function deletePlace(params: {
  placeId: string;
  userId: string;
}): Promise<DeletePlaceResult> {
  const { placeId, userId } = params;

  console.info(
    "[PlaceService:deletePlace]",
    `Deleting place ${placeId} for user ${userId}`
  );

  try {
    return await db.transaction(async (tx) => {
      // Verify ownership
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

      if (ownerRows.length === 0) {
        throw notFoundError();
      }

      // Soft-delete the place — share a single timestamp for both columns
      const now = new Date();
      await tx
        .update(places)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(places.id, placeId));

      // Cascade soft-delete to all active ListPlace rows
      const cascadedRows = await tx
        .update(listPlaces)
        .set({ deletedAt: now })
        .where(
          and(eq(listPlaces.placeId, placeId), isNull(listPlaces.deletedAt))
        )
        .returning({ id: listPlaces.id });

      const deletedListPlaceCount = cascadedRows.length;

      console.info(
        "[PlaceService:deletePlace]",
        `Place ${placeId} deleted, cascaded to ${deletedListPlaceCount} list attachment(s)`
      );

      return { deletedListPlaceCount };
    });
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    console.error(
      "[PlaceService:deletePlace]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError("Failed to delete place. Please try again.", err);
  }
}
