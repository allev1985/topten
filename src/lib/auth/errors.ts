/**
 * Custom authentication error types and factory functions
 * @see specs/001-signup-email-verification/data-model.md for error codes
 */

/**
 * Machine-readable error codes for authentication operations
 */
export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_TOKEN"
  | "EXPIRED_TOKEN"
  | "AUTH_ERROR"
  | "SERVER_ERROR";

/**
 * Field-level error detail for validation errors
 */
export interface AuthErrorDetail {
  field: string;
  message: string;
}

/**
 * Standard error response format for all auth endpoints
 */
export interface AuthErrorResponse {
  success: false;
  error: {
    code: AuthErrorCode;
    message: string;
    details?: AuthErrorDetail[];
  };
}

/**
 * Custom error class for authentication operations
 * Provides consistent error handling and response formatting
 */
export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly httpStatus: number;
  public readonly details?: AuthErrorDetail[];

  constructor(
    code: AuthErrorCode,
    message: string,
    httpStatus: number = 400,
    details?: AuthErrorDetail[]
  ) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  /**
   * Converts the error to a standard API response format
   */
  toResponse(): AuthErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Factory function for validation errors
 * Used when input validation fails
 */
export function validationError(details: AuthErrorDetail[]): AuthError {
  return new AuthError("VALIDATION_ERROR", "Validation failed", 400, details);
}

/**
 * Factory function for invalid token errors
 * Used when verification token is malformed or doesn't exist
 */
export function invalidTokenError(): AuthError {
  return new AuthError("INVALID_TOKEN", "Invalid verification token", 400);
}

/**
 * Factory function for expired token errors
 * Used when verification token has passed expiration time
 */
export function expiredTokenError(): AuthError {
  return new AuthError("EXPIRED_TOKEN", "Verification token has expired", 400);
}

/**
 * Factory function for internal server errors
 * Used for unexpected errors (details hidden from user)
 */
export function serverError(): AuthError {
  return new AuthError("SERVER_ERROR", "An unexpected error occurred", 500);
}

/**
 * Factory function for authentication errors
 * Used when login credentials are invalid
 */
export function authError(
  message: string = "Invalid email or password"
): AuthError {
  return new AuthError("AUTH_ERROR", message, 401);
}
