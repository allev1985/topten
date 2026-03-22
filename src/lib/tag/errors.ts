/**
 * Error handling for the Tag Service
 * @module lib/tag/errors
 */

/** Known error codes for the Tag Service. */
export type TagServiceErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SERVICE_ERROR";

/**
 * Tag service error class.
 * Thrown by service functions and caught by Server Actions to produce
 * user-safe ActionState error messages.
 */
export class TagServiceError extends Error {
  public readonly code: TagServiceErrorCode;
  public readonly originalError?: unknown;

  constructor(
    code: TagServiceErrorCode,
    message: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = "TagServiceError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Factory: target entity not found or does not belong to the user.
 *
 * @param originalError - Optional underlying error
 * @returns A NOT_FOUND TagServiceError
 */
export function notFoundError(originalError?: unknown): TagServiceError {
  return new TagServiceError(
    "NOT_FOUND",
    "Item not found or you do not have permission to tag it.",
    originalError
  );
}

/**
 * Factory: input failed validation.
 *
 * @param message - User-facing validation message
 * @param originalError - Optional underlying error
 * @returns A VALIDATION_ERROR TagServiceError
 */
export function validationError(
  message: string,
  originalError?: unknown
): TagServiceError {
  return new TagServiceError("VALIDATION_ERROR", message, originalError);
}

/**
 * Factory: generic unexpected / DB error.
 *
 * @param message - Optional user-facing message
 * @param originalError - Optional underlying error
 * @returns A SERVICE_ERROR TagServiceError
 */
export function tagServiceError(
  message?: string,
  originalError?: unknown
): TagServiceError {
  return new TagServiceError(
    "SERVICE_ERROR",
    message ?? "An unexpected error occurred",
    originalError
  );
}
