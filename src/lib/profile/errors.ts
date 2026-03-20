/**
 * Error handling for the Profile Service
 * @module lib/profile/errors
 */

import { isUniqueViolation } from "@/lib/utils/db";

export { isUniqueViolation };

/**
 * Known error codes for the Profile Service
 */
export type ProfileServiceErrorCode =
  | "SLUG_TAKEN"
  | "USER_NOT_FOUND"
  | "SERVICE_ERROR";

/**
 * Profile service error class
 * Used internally within the profile service layer
 */
export class ProfileServiceError extends Error {
  public readonly code: ProfileServiceErrorCode;
  public readonly originalError?: unknown;

  constructor(
    code: ProfileServiceErrorCode,
    message: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = "ProfileServiceError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Factory: slug already taken by another user
 */
export function slugTakenError(originalError?: unknown): ProfileServiceError {
  return new ProfileServiceError(
    "SLUG_TAKEN",
    "This URL is already taken. Please choose a different one.",
    originalError
  );
}

/**
 * Factory: generic unexpected / DB error
 */
export function profileServiceError(
  message?: string,
  originalError?: unknown
): ProfileServiceError {
  return new ProfileServiceError(
    "SERVICE_ERROR",
    message ?? "An unexpected error occurred",
    originalError
  );
}
