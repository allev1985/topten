/**
 * Route protection configuration for authentication middleware
 * Centralized configuration for determining route protection status
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
 * Check if a pathname matches a protected route
 * @param pathname - The URL pathname to check
 * @returns true if the pathname requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a pathname matches a public route
 * @param pathname - The URL pathname to check
 * @returns true if the pathname is publicly accessible
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
