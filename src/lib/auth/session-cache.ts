/**
 * Session caching layer.
 *
 * Wraps the direct BetterAuth `getSession` call with a Redis-backed cache
 * to reduce database round-trips. The session token (from the cookie) is
 * hashed to form the cache key so raw tokens are never stored in Redis.
 *
 * @see docs/decisions/caching-and-rate-limiting.md
 * @module lib/auth/session-cache
 */

import { cookies } from "next/headers";
import { createHash } from "crypto";
import { cacheStore } from "@/lib/services/cache";
import { config } from "@/lib/config";
import { createServiceLogger } from "@/lib/services/logging";
import type { SessionResult } from "./types";

const log = createServiceLogger("session-cache");

const SESSION_COOKIE = "better-auth.session_token";

/**
 * Build the cache key for a session token.
 * Uses SHA-256 truncated to 16 hex chars — enough to avoid collisions while
 * keeping keys short. The raw token is never stored.
 * @param token - The raw session token from the cookie
 * @returns A prefixed cache key
 */
export function buildSessionCacheKey(token: string): string {
  const hash = createHash("sha256").update(token).digest("hex").slice(0, 16);
  return `session:${hash}`;
}

/**
 * Retrieve the cached session, falling back to `fetchDirect` on a cache miss.
 * Fail-open: cache errors are logged and the direct fetch is used.
 * @param fetchDirect - Function that fetches the session from BetterAuth/DB
 * @returns The session result (from cache or direct fetch)
 */
export async function getCachedSession(
  fetchDirect: () => Promise<SessionResult>
): Promise<SessionResult> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(SESSION_COOKIE);

  if (!tokenCookie?.value) {
    return fetchDirect();
  }

  const cacheKey = buildSessionCacheKey(tokenCookie.value);
  const ttl = config.cache.sessionTtlSeconds;

  try {
    const cached = await cacheStore.get(cacheKey);
    if (cached) {
      log.debug({ method: "getCachedSession" }, "Session cache hit");
      return JSON.parse(cached) as SessionResult;
    }
  } catch (err) {
    log.warn(
      { method: "getCachedSession", err },
      "Session cache read failed — falling back to direct fetch"
    );
  }

  const session = await fetchDirect();

  if (session.authenticated) {
    try {
      await cacheStore.set(cacheKey, JSON.stringify(session), ttl);
      log.debug({ method: "getCachedSession" }, "Session cached");
    } catch (err) {
      log.warn(
        { method: "getCachedSession", err },
        "Session cache write failed"
      );
    }
  }

  return session;
}

/**
 * Invalidate the cached session for the current request.
 * Called on logout and password change to ensure stale sessions are not served.
 * @returns Resolves when invalidation is complete (never throws)
 */
export async function invalidateSessionCache(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(SESSION_COOKIE);
    if (!tokenCookie?.value) return;

    const cacheKey = buildSessionCacheKey(tokenCookie.value);
    await cacheStore.del(cacheKey);
    log.debug(
      { method: "invalidateSessionCache" },
      "Session cache invalidated"
    );
  } catch (err) {
    log.warn(
      { method: "invalidateSessionCache", err },
      "Session cache invalidation failed"
    );
  }
}
