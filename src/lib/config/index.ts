/**
 * Application configuration
 * Central configuration for application-wide settings
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  minWeakChecks: 2,
  minMediumChecks: 4,
  /**
   * Regex for special characters allowed in passwords
   * Includes common special characters used in password policies
   */
  specialCharRegex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
} as const;

/**
 * Redirect URL configuration
 * Centralized redirect paths for auth flows
 */
export const REDIRECT = {
  /** Default redirect after successful login */
  DEFAULT: "/dashboard",
  /** Redirect after successful auth operations (signup verification, etc.) */
  SUCCESS: "/dashboard",
  /** Redirect for auth errors */
  ERROR: "/auth/error",
} as const;

/**
 * @deprecated Use REDIRECT instead
 * Auth-related route constants (kept for backwards compatibility)
 */
export const AUTH_ROUTES = {
  ERROR_REDIRECT: REDIRECT.ERROR,
  SUCCESS_REDIRECT: REDIRECT.SUCCESS,
} as const;

/**
 * @deprecated Use REDIRECT.DEFAULT instead
 */
export const DEFAULT_REDIRECT = REDIRECT.DEFAULT;

/**
 * Verification type constant for OTP verification
 */
export const VERIFICATION_TYPE_EMAIL = "email" as const;

/**
 * Get the application URL from environment or request origin
 * @param requestOrigin - Optional origin from request headers
 */
export function getAppUrl(requestOrigin?: string | null): string {
  return requestOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
}
