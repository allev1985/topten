/**
 * Error handling for the Authentication Service
 * @module auth/service/errors
 */

/**
 * Supabase authentication error shape
 * Represents the structure of error objects returned by Supabase Auth API
 */
interface SupabaseAuthError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Service-specific error codes
 * These are internal codes used within the service layer
 */
export type ServiceErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_CONFIRMED"
  | "USER_EXISTS"
  | "WEAK_PASSWORD"
  | "SERVICE_ERROR";

/**
 * Authentication service error class
 * Used internally within the service layer
 */
export class AuthServiceError extends Error {
  public readonly code: ServiceErrorCode;
  public readonly originalError?: unknown;

  constructor(
    code: ServiceErrorCode,
    message: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Factory function for invalid credentials error
 */
export function invalidCredentialsError(
  originalError?: unknown
): AuthServiceError {
  return new AuthServiceError(
    "INVALID_CREDENTIALS",
    "Invalid email or password",
    originalError
  );
}

/**
 * Factory function for email not confirmed error
 */
export function emailNotConfirmedError(
  originalError?: unknown
): AuthServiceError {
  return new AuthServiceError(
    "EMAIL_NOT_CONFIRMED",
    "Please verify your email before logging in",
    originalError
  );
}

/**
 * Factory function for service error
 */
export function serviceError(
  message?: string,
  originalError?: unknown
): AuthServiceError {
  return new AuthServiceError(
    "SERVICE_ERROR",
    message || "An unexpected error occurred",
    originalError
  );
}

/**
 * Check if a Supabase error indicates an unverified email
 *
 * Supabase returns status 400 with code 'email_not_confirmed' for unverified emails.
 * This helper provides a consistent way to detect this error condition.
 *
 * @param error - The error object from Supabase auth
 * @returns true if the error indicates an unverified email
 */
export function isEmailNotVerifiedError(
  error: SupabaseAuthError | null | undefined
): boolean {
  if (!error) return false;

  return (
    error.code === "email_not_confirmed" ||
    (error.status === 400 &&
      error.message.toLowerCase().includes("not confirmed"))
  );
}
