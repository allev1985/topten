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
} from "./errors";
import { createServiceLogger } from "@/lib/services/logging";
import type {
  PlaceSummary,
  PlaceRecord,
  CreatePlaceResult,
  AddExistingPlaceResult,
  UpdatePlaceResult,
  RemovePlaceFromListResult,
  PlaceWithListCount,
  DeletePlaceResult,
} from "./types";

const log = createServiceLogger("place-service");

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all active (non-deleted) places attached to a list, in position order.
 *
 * @param listId - The list's UUID
 * @returns Array of PlaceSummary objects ordered by ListPlace.position ASC
 * @throws {PlaceServiceError} code SERVICE_ERROR on DB failure
 */
export async function getPlacesByList(listId: string): Promise<PlaceSummary[]> {
  log.debug({ method: "getPlacesByList", listId }, "Fetching places for list");

  try {
    const rows = await placeRepository.getPlacesByList(listId);

    log.info(
      { method: "getPlacesByList", listId, count: rows.length },
      "Places fetched"
    );

    return rows;
  } catch (err) {
    log.error({ method: "getPlacesByList", listId, err }, "DB error");
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
  log.debug(
    { method: "getAvailablePlacesForList", listId, userId },
    "Fetching available places for list"
  );

  try {
    const rows = await placeRepository.getAvailablePlacesForList({
      listId,
      userId,
    });

    log.info(
      {
        method: "getAvailablePlacesForList",
        listId,
        userId,
        count: rows.length,
      },
      "Available places fetched"
    );

    return rows;
  } catch (err) {
    log.error(
      { method: "getAvailablePlacesForList", listId, userId, err },
      "DB error"
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
  log.debug(
    { method: "getAllPlacesByUser", userId },
    "Fetching all places for user"
  );

  try {
    const rows = await placeRepository.getAllPlacesByUser({ userId });

    log.info(
      { method: "getAllPlacesByUser", userId, count: rows.length },
      "All places fetched"
    );

    return rows;
  } catch (err) {
    log.error({ method: "getAllPlacesByUser", userId, err }, "DB error");
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
  log.info(
    { method: "createPlace", userId, listId },
    listId ? "Creating place with list attachment" : "Creating standalone place"
  );

  // ── Step 1: look up any existing (userId, googlePlaceId) row ────────────────
  let existingPlace: PlaceRecord | null;
  try {
    existingPlace = await placeRepository.getPlaceByGoogleId({
      userId,
      googlePlaceId,
    });
  } catch (err) {
    log.error({ method: "createPlace", userId, listId, err }, "Lookup failed");
    throw placeServiceError("Failed to create place. Please try again.", err);
  }

  // ── Step 2: resolve the Place record ────────────────────────────────────────
  let place: PlaceRecord;

  if (existingPlace) {
    if (existingPlace.deletedAt !== null) {
      // Restore soft-deleted place
      try {
        place = await placeRepository.restorePlace(existingPlace.id);
        log.info(
          { method: "createPlace", userId, listId, placeId: place.id },
          "Restored soft-deleted place"
        );
      } catch (err) {
        log.error(
          { method: "createPlace", userId, listId, err },
          "Restore failed"
        );
        throw placeServiceError(
          "Failed to create place. Please try again.",
          err
        );
      }
    } else {
      // Reuse active place as-is
      place = existingPlace;
      log.debug(
        { method: "createPlace", userId, listId, placeId: place.id },
        "Reusing existing place"
      );
    }

    if (listId) {
      const { listPlaceId, listSlug } = await addExistingPlaceToList({
        listId,
        placeId: place.id,
        userId,
      });
      return { place, listPlaceId, listSlug };
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
      log.info(
        { method: "createPlace", userId, placeId: place.id },
        "Created standalone place"
      );
      return { place };
    } catch (err) {
      if (err instanceof PlaceServiceError) throw err;
      log.error({ method: "createPlace", userId, err }, "DB error");
      throw placeServiceError("Failed to create place. Please try again.", err);
    }
  }

  // New place with list: verify ownership then atomically create + attach
  let owned: { slug: string } | null;
  try {
    owned = await placeRepository.getListOwnership({ listId, userId });
  } catch (err) {
    log.error(
      { method: "createPlace", userId, listId, err },
      "Ownership check failed"
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

    log.info(
      {
        method: "createPlace",
        userId,
        listId,
        placeId: result.place.id,
        listPlaceId: result.listPlaceId,
      },
      "Place created and attached to list"
    );

    return { ...result, listSlug: owned.slug };
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    log.error({ method: "createPlace", userId, listId, err }, "DB error");
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
  log.info(
    { method: "addExistingPlaceToList", userId, listId, placeId },
    "Attaching place to list"
  );

  const owned = await placeRepository.getListOwnership({ listId, userId });
  if (!owned) {
    throw notFoundError();
  }

  const existingRow = await placeRepository.getListPlaceRow({
    listId,
    placeId,
  });

  if (existingRow && existingRow.deletedAt === null) {
    throw alreadyInListError();
  }

  try {
    const maxPosition = await placeRepository.getMaxPosition(listId);
    const nextPosition = maxPosition + 1;

    if (existingRow) {
      await placeRepository.restoreListPlace({
        listPlaceId: existingRow.id,
        nextPosition,
      });

      log.info(
        {
          method: "addExistingPlaceToList",
          userId,
          listId,
          placeId,
          position: nextPosition,
        },
        "Place restored to list"
      );

      return { listPlaceId: existingRow.id, listSlug: owned.slug };
    }

    const { id: listPlaceId } = await placeRepository.insertListPlace({
      listId,
      placeId,
      position: nextPosition,
    });

    log.info(
      {
        method: "addExistingPlaceToList",
        userId,
        listId,
        placeId,
        listPlaceId,
        position: nextPosition,
      },
      "Place attached to list"
    );

    return { listPlaceId, listSlug: owned.slug };
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    log.error(
      { method: "addExistingPlaceToList", userId, listId, placeId, err },
      "DB error"
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

  log.info(
    { method: "updatePlace", userId, placeId, listId },
    "Updating place"
  );

  try {
    let listSlug: string | undefined;
    if (listId) {
      const accessible = await placeRepository.getPlaceInListByOwner({
        placeId,
        listId,
        userId,
      });
      if (!accessible) {
        throw notFoundError();
      }
      listSlug = accessible.slug;
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

    log.info(
      { method: "updatePlace", userId, placeId, listId },
      "Place updated"
    );

    return { place: row, listSlug };
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    log.error(
      { method: "updatePlace", userId, placeId, listId, err },
      "DB error"
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
  log.info(
    { method: "deletePlaceFromList", userId, listId, placeId },
    "Removing place from list"
  );

  try {
    const accessible = await placeRepository.getPlaceInListByOwner({
      placeId,
      listId,
      userId,
    });
    if (!accessible) {
      throw notFoundError();
    }

    const row = await placeRepository.softDeleteListPlace({ placeId, listId });

    if (!row) {
      throw notFoundError();
    }

    log.info(
      { method: "deletePlaceFromList", userId, listId, placeId },
      "Place removed from list"
    );

    return { success: true, listSlug: accessible.slug };
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    log.error(
      { method: "deletePlaceFromList", userId, listId, placeId, err },
      "DB error"
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
  log.info({ method: "deletePlace", userId, placeId }, "Deleting place");

  try {
    const result = await placeRepository.deletePlaceWithCascade({
      placeId,
      userId,
    });

    if (!result) {
      throw notFoundError();
    }

    log.info(
      {
        method: "deletePlace",
        userId,
        placeId,
        cascadedListPlaces: result.deletedListPlaceCount,
      },
      "Place deleted with cascade"
    );

    return result;
  } catch (err) {
    if (err instanceof PlaceServiceError) throw err;
    log.error({ method: "deletePlace", userId, placeId, err }, "DB error");
    throw placeServiceError("Failed to delete place. Please try again.", err);
  }
}
