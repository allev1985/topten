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
 * Session expiry threshold (5 minutes in milliseconds)
 * Used to determine when to proactively refresh sessions
 */
export const SESSION_EXPIRY_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Redirect URL configuration
 * Centralized redirect paths for auth flows
 */
export const REDIRECT_ROUTES = {
  /** Default redirect after successful login */
  default: "/dashboard",
  /** Auth-specific redirects */
  auth: {
    /** Redirect after successful auth operations (signup verification, etc.) */
    success: "/dashboard",
    /** Redirect for auth errors */
    error: "/auth/error",
    /** Redirect for password reset flow */
    passwordReset: "/reset-password",
  },
} as const;

/**
 * Verification type constant for OTP verification
 */
export const VERIFICATION_TYPE_EMAIL = "email" as const;

/**
 * Route protection configuration for authentication middleware
 */

/** Routes that require authentication */
export const PROTECTED_ROUTES = ["/dashboard"] as const;

/** Routes that are always publicly accessible */
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/auth",
] as const;

/** Type for protected route paths */
export type ProtectedRoute = (typeof PROTECTED_ROUTES)[number];

/** Type for public route paths */
export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

/**
 * Get the application URL from environment or request origin
 * @param requestOrigin - Optional origin from request headers
 */
export function getAppUrl(requestOrigin?: string | null): string {
  return requestOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
}
