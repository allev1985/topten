/**
 * Next.js Authentication Proxy (Middleware)
 *
 * Note: This file uses Next.js 16's "proxy.ts" convention (formerly "middleware.ts").
 *
 * Middleware always runs on the Edge Runtime, which cannot make database calls.
 * We therefore check for the presence of BetterAuth's session cookie as a
 * fast routing gate. Individual pages and server actions perform full DB-backed
 * session verification via auth.api.getSession().
 *
 * Security model: the middleware prevents unauthenticated users from seeing
 * protected page HTML. Any attempt to reach protected data through server
 * actions or API routes will fail the proper session check regardless of
 * what cookies are present.
 *
 * @see docs/decisions/authentication.md
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  isProtectedRoute,
  isPublicRoute,
  createLoginRedirect,
  getRequestPathname,
} from "@/lib/auth/helpers/middleware";
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("proxy");

// BetterAuth's session cookie name (set by the nextCookies() plugin)
const SESSION_COOKIE = "better-auth.session_token";

export async function proxy(request: NextRequest) {
  const pathname = getRequestPathname(request);

  if (isPublicRoute(pathname)) {
    return NextResponse.next({ request });
  }

  if (isProtectedRoute(pathname)) {
    const sessionToken = request.cookies.get(SESSION_COOKIE);

    if (!sessionToken?.value) {
      log.debug(
        { method: "proxy", pathname },
        "No session cookie — redirecting to login"
      );
      return createLoginRedirect(request, pathname);
    }

    // Cookie present — allow through. Pages do full verification via auth.api.getSession().
    return NextResponse.next({ request });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
