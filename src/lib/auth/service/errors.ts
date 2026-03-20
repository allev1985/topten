/**
 * Error handling for the Authentication Service
 * @module auth/service/errors
 */

/**
 * Service-specific error codes
 */
export type ServiceErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_CONFIRMED"
  | "USER_EXISTS"
  | "WEAK_PASSWORD"
  | "SERVICE_ERROR";

/**
 * Authentication service error class
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

export function invalidCredentialsError(
  originalError?: unknown
): AuthServiceError {
  return new AuthServiceError(
    "INVALID_CREDENTIALS",
    "Invalid email or password",
    originalError
  );
}

export function emailNotConfirmedError(
  originalError?: unknown
): AuthServiceError {
  return new AuthServiceError(
    "EMAIL_NOT_CONFIRMED",
    "Please verify your email before logging in",
    originalError
  );
}

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
 * Detect invalid credential errors from BetterAuth responses.
 * BetterAuth returns status 401 with "Invalid email or password" message.
 */
export function isInvalidCredentialsError(err: unknown): boolean {
  if (err instanceof Error) {
    return (
      err.message.toLowerCase().includes("invalid email or password") ||
      err.message.toLowerCase().includes("invalid credentials")
    );
  }
  return false;
}

/**
 * Detect unverified email errors from BetterAuth responses.
 */
export function isEmailNotVerifiedError(err: unknown): boolean {
  if (err instanceof Error) {
    return (
      err.message.toLowerCase().includes("email not verified") ||
      err.message.toLowerCase().includes("verify your email")
    );
  }
  return false;
}

/**
 * Detect expired token errors.
 */
export function isExpiredTokenError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.toLowerCase().includes("expired");
  }
  return false;
}
