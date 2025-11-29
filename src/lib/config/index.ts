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
 * Default redirect URL after successful login
 */
export const DEFAULT_REDIRECT = "/dashboard";

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
