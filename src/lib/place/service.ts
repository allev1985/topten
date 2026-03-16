/**
 * Place Service
 *
 * Centralised service for all place domain operations.
 * Delegates all DB access to the place repository.
 * Used by place server actions — never called from client code.
 *
 * Public API:
 *   - getPlacesByList          — fetch all active places for a list, in position order
 *   - getAvailablePlacesForList — places the user owns that are NOT yet in the target list
 *   - getAllPlacesByUser        — all active places for a user with active-list counts
 *   - createPlace              — create a new place; if listId is provided, atomically attach it to that list
 *   - addExistingPlaceToList   — attach an existing place to a list
 *   - updatePlace              — update a place's description
 *   - deletePlaceFromList      — remove a place from a specific list (soft-deletes the ListPlace row)
 *   - deletePlace              — soft-delete a place and cascade to all list attachments
 *
 * Architecture: src/lib/place/service.ts → src/actions/place-actions.ts → client
 * Spec: specs/006-places-service/
 *
 * @module place/service
 */

import * as placeRepository from "@/db/repositories/place.repository";
import {
  PlaceServiceError,
  notFoundError,
  alreadyInListError,
  placeServiceError,
  immutableFieldError,
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
    const rows = await placeRepository.getPlacesByList(listId);

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
 * @param listId  - Target list to exclude already-attached places from
 * @param userId  - Authenticated user whose places are searched
 * @returns Array of PlaceSummary objects ordered by name ASC
 * @throws {PlaceServiceError} code SERVICE_ERROR on DB failure
 */
export async function getAvailablePlacesForList({
  listId,
  userId,
}: {
  listId: string;
  userId: string;
}): Promise<PlaceSummary[]> {
  console.info(
    "[PlaceService:getAvailablePlacesForList]",
    `Fetching available places for list ${listId}, user ${userId}`
  );

  try {
    const rows = await placeRepository.getAvailablePlacesForList({
      listId,
      userId,
    });

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
 * @param userId - Authenticated user whose places are fetched
 * @returns Array of PlaceWithListCount ordered by name ASC
 * @throws {PlaceServiceError} code SERVICE_ERROR on DB failure
 */
export async function getAllPlacesByUser({
  userId,
}: {
  userId: string;
}): Promise<PlaceWithListCount[]> {
  console.info(
    "[PlaceService:getAllPlacesByUser]",
    `Fetching all places for user ${userId}`
  );

  try {
    const rows = await placeRepository.getAllPlacesByUser({ userId });

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
 * Create a new place, or reuse / restore an existing one.
 *
 * Lookup-first strategy — queries (userId, googlePlaceId) before inserting:
 *   - Active record found   → reuse it as-is (no insert)
 *   - Soft-deleted record   → restore it (clear deletedAt) then continue
 *   - Not found             → insert a fresh row
 *
 * In all three cases, when `listId` is provided the place is attached via
 * addExistingPlaceToList, which handles ownership verification, ALREADY_IN_LIST,
 * and ListPlace restore/insert.
 *
 * @returns CreatePlaceResult — listPlaceId is present when the place was attached to a list
 * @throws {PlaceServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {PlaceServiceError} code ALREADY_IN_LIST if place is already attached to the list
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function createPlace({
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
  console.info(
    "[PlaceService:createPlace]",
    listId
      ? `Creating place "${name}" in list ${listId} for user ${userId}`
      : `Creating standalone place "${name}" for user ${userId}`
  );

  // ── Step 1: look up any existing (userId, googlePlaceId) row ────────────────
  let existingPlace: PlaceRecord | null;
  try {
    existingPlace = await placeRepository.getPlaceByGoogleId({
      userId,
      googlePlaceId,
    });
  } catch (err) {
    console.error(
      "[PlaceService:createPlace]",
      "Lookup failed:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError("Failed to create place. Please try again.", err);
  }

  // ── Step 2: resolve the Place record ────────────────────────────────────────
  let place: PlaceRecord;

  if (existingPlace) {
    if (existingPlace.deletedAt !== null) {
      // Restore soft-deleted place
      try {
        place = await placeRepository.restorePlace(existingPlace.id);
        console.info(
          "[PlaceService:createPlace]",
          `Restored soft-deleted place ${place.id}`
        );
      } catch (err) {
        console.error(
          "[PlaceService:createPlace]",
          "Restore failed:",
          err instanceof Error ? err.message : "Unknown error"
        );
        throw placeServiceError(
          "Failed to create place. Please try again.",
          err
        );
      }
    } else {
      // Reuse active place as-is
      place = existingPlace;
      console.info(
        "[PlaceService:createPlace]",
        `Reusing existing place ${place.id}`
      );
    }

    if (listId) {
      const { listPlaceId } = await addExistingPlaceToList({
        listId,
        placeId: place.id,
        userId,
      });
      return { place, listPlaceId };
    }

    return { place };
  }

  // ── Step 3: no existing place — insert new ──────────────────────────────────

  if (!listId) {
    // Standalone: simple insert
    try {
      place = await placeRepository.insertPlace({
        userId,
        googlePlaceId,
        name,
        address,
        latitude,
        longitude,
        description,
        heroImageUrl,
      });
      console.info(
        "[PlaceService:createPlace]",
        `Created standalone place ${place.id}`
      );
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

  // New place with list: verify ownership then atomically create + attach
  let owned: boolean;
  try {
    owned = await placeRepository.getListOwnership({ listId, userId });
  } catch (err) {
    console.error(
      "[PlaceService:createPlace]",
      "Ownership check failed:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError("Failed to create place. Please try again.", err);
  }

  if (!owned) {
    throw notFoundError();
  }

  try {
    const result = await placeRepository.createPlaceWithListAttachment({
      listId,
      userId,
      googlePlaceId,
      name,
      address,
      latitude,
      longitude,
      description,
      heroImageUrl,
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
 *   inserting a duplicate row.
 * - If no prior row exists, a fresh ListPlace row is inserted at MAX+1.
 *
 * @returns AddExistingPlaceResult containing the listPlace id (restored or new)
 * @throws {PlaceServiceError} code NOT_FOUND if list missing, deleted, or wrong owner
 * @throws {PlaceServiceError} code ALREADY_IN_LIST if place is already attached
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function addExistingPlaceToList({
  listId,
  placeId,
  userId,
}: {
  listId: string;
  placeId: string;
  userId: string;
}): Promise<AddExistingPlaceResult> {
  console.info(
    "[PlaceService:addExistingPlaceToList]",
    `Attaching place ${placeId} to list ${listId} for user ${userId}`
  );

  // Verify list ownership
  const owned = await placeRepository.getListOwnership({ listId, userId });
  if (!owned) {
    throw notFoundError();
  }

  // Check for any existing row — active or previously soft-deleted
  const existingRow = await placeRepository.getListPlaceRow({
    listId,
    placeId,
  });

  if (existingRow && existingRow.deletedAt === null) {
    throw alreadyInListError();
  }

  try {
    // Compute next position (append to end regardless of restore or fresh insert)
    const maxPosition = await placeRepository.getMaxPosition(listId);
    const nextPosition = maxPosition + 1;

    if (existingRow) {
      // Restore the previously removed attachment
      await placeRepository.restoreListPlace({
        listPlaceId: existingRow.id,
        nextPosition,
      });

      console.info(
        "[PlaceService:addExistingPlaceToList]",
        `Place ${placeId} restored to list ${listId} at position ${nextPosition}`
      );

      return { listPlaceId: existingRow.id };
    }

    const { id: listPlaceId } = await placeRepository.insertListPlace({
      listId,
      placeId,
      position: nextPosition,
    });

    console.info(
      "[PlaceService:addExistingPlaceToList]",
      `Place ${placeId} attached to list ${listId} at position ${nextPosition}`
    );

    return { listPlaceId };
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
 *
 * @returns UpdatePlaceResult with the updated description and timestamp
 * @throws {PlaceServiceError} code NOT_FOUND if place missing, deleted, or not owned by user
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function updatePlace({
  placeId,
  listId,
  userId,
  description,
  ...rest
}: {
  placeId: string;
  listId?: string;
  userId: string;
  description?: string | null;
}): Promise<UpdatePlaceResult> {
  const extraKeys = Object.keys(rest);
  if (extraKeys.length > 0) {
    throw immutableFieldError(extraKeys[0]);
  }

  console.info(
    "[PlaceService:updatePlace]",
    `Updating place ${placeId} for user ${userId}`
  );

  try {
    // Ownership check: use list membership when listId is provided,
    // otherwise verify directly via places.userId
    if (listId) {
      const accessible = await placeRepository.getPlaceInListByOwner({
        placeId,
        listId,
        userId,
      });
      if (!accessible) {
        throw notFoundError();
      }
    } else {
      const accessible = await placeRepository.getPlaceByOwner({
        placeId,
        userId,
      });
      if (!accessible) {
        throw notFoundError();
      }
    }

    const row = await placeRepository.updatePlaceDescription({
      placeId,
      description,
    });

    if (!row) {
      throw notFoundError();
    }

    console.info("[PlaceService:updatePlace]", `Place ${placeId} updated`);

    return { place: row };
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    console.error(
      "[PlaceService:updatePlace]",
      "DB error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    throw placeServiceError("Failed to update place. Please try again.", err);
  }
}

/**
 * Remove a place from a specific list by soft-deleting its ListPlace junction row.
 *
 * @returns RemovePlaceFromListResult { success: true }
 * @throws {PlaceServiceError} code NOT_FOUND if attachment missing, already removed, or wrong owner
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function deletePlaceFromList({
  placeId,
  listId,
  userId,
}: {
  placeId: string;
  listId: string;
  userId: string;
}): Promise<RemovePlaceFromListResult> {
  console.info(
    "[PlaceService:deletePlaceFromList]",
    `Removing place ${placeId} from list ${listId} for user ${userId}`
  );

  try {
    // Verify list ownership and that the attachment is currently active
    const accessible = await placeRepository.getPlaceInListByOwner({
      placeId,
      listId,
      userId,
    });
    if (!accessible) {
      throw notFoundError();
    }

    // Soft-delete the ListPlace row — the Place record is left untouched
    const row = await placeRepository.softDeleteListPlace({ placeId, listId });

    if (!row) {
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
 * Both operations run in a single transaction (inside the repository) to guarantee
 * consistency.
 *
 * @returns DeletePlaceResult with count of ListPlace rows cascaded
 * @throws {PlaceServiceError} code NOT_FOUND if place missing, deleted, or wrong owner
 * @throws {PlaceServiceError} code SERVICE_ERROR on unexpected DB failure
 */
export async function deletePlace({
  placeId,
  userId,
}: {
  placeId: string;
  userId: string;
}): Promise<DeletePlaceResult> {
  console.info(
    "[PlaceService:deletePlace]",
    `Deleting place ${placeId} for user ${userId}`
  );

  try {
    const result = await placeRepository.deletePlaceWithCascade({
      placeId,
      userId,
    });

    if (!result) {
      throw notFoundError();
    }

    console.info(
      "[PlaceService:deletePlace]",
      `Place ${placeId} deleted, cascaded to ${result.deletedListPlaceCount} list attachment(s)`
    );

    return result;
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
