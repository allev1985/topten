/**
 * Error handling for the List Service
 * @module list/service/errors
 */

/**
 * Known error codes for the List Service
 */
export type ListServiceErrorCode =
  | "NOT_FOUND"
  | "SLUG_COLLISION"
  | "SERVICE_ERROR";

/**
 * List service error class.
 * Thrown by service functions and caught by Server Actions to produce
 * user-safe ActionState error messages.
 */
export class ListServiceError extends Error {
  public readonly code: ListServiceErrorCode;
  public readonly originalError?: unknown;

  constructor(
    code: ListServiceErrorCode,
    message: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = "ListServiceError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Factory: list not found or does not belong to the requesting user.
 * Intentionally does not distinguish between "missing" and "wrong owner"
 * to avoid leaking ownership information.
 */
export function notFoundError(originalError?: unknown): ListServiceError {
  return new ListServiceError(
    "NOT_FOUND",
    "List not found or you do not have permission to perform this action.",
    originalError
  );
}

/**
 * Factory: slug generation exhausted retries (extremely unlikely in practice).
 */
export function slugCollisionError(originalError?: unknown): ListServiceError {
  return new ListServiceError(
    "SLUG_COLLISION",
    "Could not generate a unique list identifier. Please try again.",
    originalError
  );
}

/**
 * Factory: generic unexpected / DB error.
 */
export function listServiceError(
  message?: string,
  originalError?: unknown
): ListServiceError {
  return new ListServiceError(
    "SERVICE_ERROR",
    message ?? "An unexpected error occurred",
    originalError
  );
}

/**
 * Returns true when the postgres.js driver error represents a unique-constraint
 * violation (code 23505). Used to detect race-condition slug conflicts.
 */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}
