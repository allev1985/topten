/**
 * Profile Service
 *
 * Centralised service for user profile mutations.
 * Delegates all DB access to the profile repository.
 * Used by profile server actions — never called from client code.
 *
 * @module profile/service
 */

import * as profileRepository from "@/db/repositories/profile.repository";
import {
  ProfileServiceError,
  slugTakenError,
  profileServiceError,
  isUniqueViolation,
} from "./service/errors";
import { createServiceLogger } from "@/lib/services/logging";
import type {
  UpdateNameResult,
  UpdateSlugResult,
  SettingsProfile,
} from "./service/types";

export { ProfileServiceError };
export type { UpdateNameResult, UpdateSlugResult, SettingsProfile };

const log = createServiceLogger("profile-service");

/**
 * Retrieve the profile data required for the settings page.
 *
 * @param userId - The authenticated user's id (FK to auth.users)
 * @returns SettingsProfile if found, or null if no matching active record exists
 * @throws {ProfileServiceError} code SERVICE_ERROR on DB failure
 */
export async function getProfileForSettings(
  userId: string
): Promise<SettingsProfile | null> {
  log.debug(
    { method: "getProfileForSettings", userId },
    "Fetching settings profile"
  );

  try {
    return await profileRepository.getSettingsProfile(userId);
  } catch (err) {
    log.error({ method: "getProfileForSettings", userId, err }, "DB error");
    throw profileServiceError(
      "Failed to load profile settings. Please try again.",
      err
    );
  }
}

/**
 * Update the display name of a user profile.
 *
 * @param userId - The authenticated user's id (FK to auth.users)
 * @param name   - The new display name (already validated by the caller)
 * @returns UpdateNameResult with the saved name
 * @throws {ProfileServiceError} code SERVICE_ERROR on DB failure
 */
export async function updateName(
  userId: string,
  name: string
): Promise<UpdateNameResult> {
  log.info({ method: "updateName", userId }, "Updating display name");

  try {
    await profileRepository.updateUserName({ userId, name });

    log.info({ method: "updateName", userId }, "Display name updated");

    return { name };
  } catch (err) {
    log.error({ method: "updateName", userId, err }, "DB error");
    throw profileServiceError("Failed to update name. Please try again.", err);
  }
}

/**
 * Update the vanity slug (profile URL) of a user profile.
 *
 * Applies a two-layer uniqueness defence:
 *   Layer 1 — Application pre-check: queries for any non-deleted user other
 *              than the current user who holds the requested slug.
 *   Layer 2 — Race-condition catch: if the DB unique index fires (code 23505)
 *              between the pre-check and the write, it is caught and mapped to
 *              the same human-friendly SLUG_TAKEN error.
 *
 * @param userId      - The authenticated user's id (FK to auth.users)
 * @param vanitySlug  - The new slug (already validated by the caller)
 * @returns UpdateSlugResult with the saved slug
 * @throws {ProfileServiceError} code SLUG_TAKEN  — slug already claimed
 * @throws {ProfileServiceError} code SERVICE_ERROR — unexpected DB failure
 */
export async function updateSlug(
  userId: string,
  vanitySlug: string
): Promise<UpdateSlugResult> {
  log.info({ method: "updateSlug", userId }, "Updating vanity slug");

  // Layer 1: Application pre-check
  const isTaken = await profileRepository.getSlugConflict({
    vanitySlug,
    userId,
  });

  if (isTaken) {
    log.info(
      { method: "updateSlug", userId },
      "Slug already taken (pre-check)"
    );
    throw slugTakenError();
  }

  try {
    // Layer 2: Write with race-condition catch
    await profileRepository.updateUserSlug({ userId, vanitySlug });

    log.info({ method: "updateSlug", userId }, "Vanity slug updated");

    return { vanitySlug };
  } catch (err) {
    if (isUniqueViolation(err)) {
      log.info(
        { method: "updateSlug", userId },
        "Slug taken via race-condition (23505)"
      );
      throw slugTakenError(err);
    }

    log.error({ method: "updateSlug", userId, err }, "DB error");
    throw profileServiceError(
      "Failed to update profile URL. Please try again.",
      err
    );
  }
}
