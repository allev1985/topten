/**
 * Error handling for the Authentication Service
 * @module lib/auth/errors
 */

/**
 * Service-specific error codes
 */
export type AuthServiceErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_CONFIRMED"
  | "USER_EXISTS"
  | "WEAK_PASSWORD"
  | "SERVICE_ERROR"
  | "INVALID_MFA_CODE"
  | "MFA_CODE_EXPIRED"
  | "TOO_MANY_MFA_ATTEMPTS"
  | "INVALID_MFA_SESSION";

/**
 * Authentication service error class
 */
export class AuthServiceError extends Error {
  public readonly code: AuthServiceErrorCode;
  public readonly originalError?: unknown;

  constructor(
    code: AuthServiceErrorCode,
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

export function authServiceError(
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

/**
 * Detect invalid MFA code errors from BetterAuth twoFactor plugin.
 */
export function isInvalidMFACodeError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toUpperCase();
    return msg.includes("INVALID_CODE");
  }
  return false;
}

/**
 * Detect expired MFA code errors from BetterAuth twoFactor plugin.
 */
export function isMFACodeExpiredError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toUpperCase();
    return msg.includes("OTP_HAS_EXPIRED");
  }
  return false;
}

/**
 * Detect too-many-attempts errors from BetterAuth twoFactor plugin.
 */
export function isTooManyMFAAttemptsError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toUpperCase();
    return msg.includes("TOO_MANY_ATTEMPTS");
  }
  return false;
}

/**
 * Detect invalid/missing two-factor session cookie errors.
 * BetterAuth uses "INVALID_TWO_FACTOR_COOKIE" as the machine code but
 * "Invalid two factor cookie" as the human-readable message — check both.
 */
export function isInvalidMFASessionError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toUpperCase();
    const bodyCode = (err as unknown as Record<string, unknown>)?.body as
      | Record<string, unknown>
      | undefined;
    return (
      msg.includes("INVALID_TWO_FACTOR_COOKIE") ||
      msg.includes("INVALID TWO FACTOR COOKIE") ||
      bodyCode?.code === "INVALID_TWO_FACTOR_COOKIE"
    );
  }
  return false;
}
