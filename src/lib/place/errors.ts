/**
 * Error handling for the Place Service
 * @module lib/place/errors
 */

/**
 * Known error codes for the Place Service
 */
export type PlaceServiceErrorCode =
  | "NOT_FOUND"
  | "ALREADY_IN_LIST"
  | "VALIDATION_ERROR"
  | "SERVICE_ERROR"
  | "IMMUTABLE_FIELD";

/**
 * Place service error class.
 * Thrown by service functions and caught by Server Actions to produce
 * user-safe ActionState error messages.
 */
export class PlaceServiceError extends Error {
  public readonly code: PlaceServiceErrorCode;
  public readonly originalError?: unknown;

  constructor(
    code: PlaceServiceErrorCode,
    message: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = "PlaceServiceError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Factory: place not found or does not belong to the requesting user.
 * Intentionally does not distinguish between "missing" and "wrong owner"
 * to avoid leaking ownership information.
 */
export function notFoundError(originalError?: unknown): PlaceServiceError {
  return new PlaceServiceError(
    "NOT_FOUND",
    "Place not found or you do not have permission to perform this action.",
    originalError
  );
}

/**
 * Factory: place is already attached to the target list.
 */
export function alreadyInListError(originalError?: unknown): PlaceServiceError {
  return new PlaceServiceError(
    "ALREADY_IN_LIST",
    "This place is already in the list.",
    originalError
  );
}

/**
 * Factory: input failed validation.
 */
export function validationError(
  message: string,
  originalError?: unknown
): PlaceServiceError {
  return new PlaceServiceError("VALIDATION_ERROR", message, originalError);
}

/**
 * Factory: generic unexpected / DB error.
 */
export function placeServiceError(
  message?: string,
  originalError?: unknown
): PlaceServiceError {
  return new PlaceServiceError(
    "SERVICE_ERROR",
    message ?? "An unexpected error occurred",
    originalError
  );
}

/**
 * Factory: attempt to update a field that is immutable after creation.
 */
export function immutableFieldError(
  field?: string,
  originalError?: unknown
): PlaceServiceError {
  return new PlaceServiceError(
    "IMMUTABLE_FIELD",
    field
      ? `"${field}" cannot be changed after a place is created.`
      : "One or more fields cannot be changed after a place is created.",
    originalError
  );
}
