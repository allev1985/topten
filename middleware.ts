/**
 * Next.js Authentication Middleware
 *
 * Protects routes based on authentication status:
 * - Protected routes (/dashboard/*): Require authentication
 * - Public routes (/, /login, /signup, etc.): Accessible to all
 *
 * Features:
 * - Automatic session refresh for expiring sessions
 * - Redirect URL preservation via redirectTo parameter
 * - Fail-closed security (redirect to login on auth errors)
 *
 * @see /specs/001-auth-middleware/spec.md for full requirements
 */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isProtectedRoute,
  isPublicRoute,
  createLoginRedirect,
  getRequestPathname,
} from "@/lib/auth/helpers/middleware";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Main middleware function
 * Handles authentication checks and session refresh
 */
export async function middleware(request: NextRequest) {
  const pathname = getRequestPathname(request);

  // For public routes, still update session (for session refresh) but always allow access
  if (isPublicRoute(pathname)) {
    return updateSession(request);
  }

  // For protected routes, validate authentication
  if (isProtectedRoute(pathname)) {
    try {
      // Create a response that will be modified with session cookies
      let response = NextResponse.next({ request });

      // Create Supabase client with cookie handling
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              response = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      // Validate user - this also refreshes the session if needed
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        // No valid user - redirect to login
        return createLoginRedirect(request, pathname);
      }

      // User is authenticated - allow access with updated cookies
      return response;
    } catch (error) {
      // Fail-closed: redirect to login on any error
      console.error("Auth middleware error:", error);
      return createLoginRedirect(request, pathname);
    }
  }

  // Default: allow through (for routes not explicitly protected or public)
  return NextResponse.next();
}

/**
 * Middleware configuration
 * Defines which paths the middleware runs on
 *
 * Excludes:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico
 * - Static assets (svg, png, jpg, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets with file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
