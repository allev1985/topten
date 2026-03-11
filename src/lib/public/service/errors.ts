/**
 * Error handling for the Public Service
 * @module public/service/errors
 */

/**
 * Known error codes for the Public Service
 */
export type PublicServiceErrorCode = "NOT_FOUND" | "SERVICE_ERROR";

/**
 * Public service error class.
 * Thrown by service functions and caught by Server Components to produce
 * appropriate responses (notFound() for NOT_FOUND, error boundary for SERVICE_ERROR).
 */
export class PublicServiceError extends Error {
  public readonly code: PublicServiceErrorCode;
  public readonly originalError?: unknown;

  constructor(
    code: PublicServiceErrorCode,
    message: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = "PublicServiceError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Factory: generic unexpected / DB error.
 */
export function publicServiceError(
  message?: string,
  originalError?: unknown
): PublicServiceError {
  return new PublicServiceError(
    "SERVICE_ERROR",
    message ?? "An unexpected error occurred. Please try again.",
    originalError
  );
}
