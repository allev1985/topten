/**
 * Middleware helper functions for authentication
 * Provides utilities for URL construction and request handling
 */

import { NextRequest, NextResponse } from "next/server";
import { getValidatedRedirect } from "@/lib/utils/redirect-validation";

/**
 * Get the pathname from a request
 * @param request - The incoming Next.js request
 * @returns The URL pathname
 */
export function getRequestPathname(request: NextRequest): string {
  return request.nextUrl.pathname;
}

/**
 * Create a redirect response to the login page with redirectTo parameter
 * Uses validated redirect URL to prevent open redirect attacks
 *
 * @param request - The incoming Next.js request
 * @param originalPath - The path the user was trying to access
 * @returns NextResponse redirect to login with redirectTo parameter
 */
export function createLoginRedirect(
  request: NextRequest,
  originalPath: string
): NextResponse {
  const loginUrl = new URL("/login", request.url);
  const validatedRedirect = getValidatedRedirect(originalPath);
  loginUrl.searchParams.set("redirectTo", validatedRedirect);
  return NextResponse.redirect(loginUrl);
}

/**
 * Create a response that allows the request to proceed
 * with any necessary request modifications
 *
 * @param request - The incoming Next.js request
 * @returns NextResponse that allows the request through
 */
export function createAllowResponse(request: NextRequest): NextResponse {
  return NextResponse.next({ request });
}

/**
 * Check if a pathname starts with any of the given prefixes
 * Useful for checking if a path is in a specific section
 *
 * @param pathname - The URL pathname to check
 * @param prefixes - Array of prefix strings to check against
 * @returns true if pathname starts with any prefix
 */
export function pathStartsWithAny(
  pathname: string,
  prefixes: readonly string[]
): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Extract and validate the redirectTo parameter from a request
 *
 * @param request - The incoming Next.js request
 * @returns Validated redirect URL or default
 */
export function getRedirectToFromRequest(request: NextRequest): string {
  const redirectTo = request.nextUrl.searchParams.get("redirectTo");
  return getValidatedRedirect(redirectTo);
}
