/**
 * Application configuration
 * Central configuration for application-wide settings
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  minWeakChecks: 2,
  minMediumChecks: 4,
} as const;

/**
 * Password validation constants
 */
export const PASSWORD_MIN_LENGTH = PASSWORD_REQUIREMENTS.minLength;

/**
 * Regex for special characters allowed in passwords
 * Includes common special characters used in password policies
 */
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Auth-related route constants
 */
export const AUTH_ROUTES = {
  ERROR_REDIRECT: "/auth/error",
  SUCCESS_REDIRECT: "/dashboard",
} as const;

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
