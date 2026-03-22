/**
 * Error handling for the Tag Service
 * @module lib/tag/errors
 */

/**
 * Known error codes for the Tag Service
 */
export type TagServiceErrorCode =
  | "NOT_FOUND"
  | "DUPLICATE_TAG"
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
 * Factory: tag not found.
 *
 * @param originalError - Optional underlying error
 * @returns TagServiceError with NOT_FOUND code
 */
export function notFoundError(originalError?: unknown): TagServiceError {
  return new TagServiceError("NOT_FOUND", "Tag not found.", originalError);
}

/**
 * Factory: tag name already exists.
 *
 * @param originalError - Optional underlying error
 * @returns TagServiceError with DUPLICATE_TAG code
 */
export function duplicateTagError(originalError?: unknown): TagServiceError {
  return new TagServiceError(
    "DUPLICATE_TAG",
    "A tag with this name already exists.",
    originalError
  );
}

/**
 * Factory: validation error.
 *
 * @param message - Descriptive validation message
 * @param originalError - Optional underlying error
 * @returns TagServiceError with VALIDATION_ERROR code
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
 * @param message - Optional message override
 * @param originalError - Optional underlying error
 * @returns TagServiceError with SERVICE_ERROR code
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
