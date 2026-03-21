/**
 * Public API for the cache service.
 *
 * Provides a singleton CacheStore instance created from REDIS_URL config.
 * All consumers import from here rather than constructing their own store.
 *
 * The singleton is stored on `globalThis` so that a single TCP connection is
 * reused across Next.js hot-module replacements in development — the same
 * pattern used for the database client.
 *
 * @module lib/services/cache
 */

import { config } from "@/lib/config";
import { RedisStore } from "./redis-store";
import type { CacheStore } from "./types";

export { CacheServiceError } from "./errors";
export type { CacheStore, CacheServiceErrorCode } from "./types";

declare global {
  var __cacheStore: CacheStore | undefined;
}

/**
 * Create a CacheStore backed by Redis, using `REDIS_URL` from config.
 * @returns A new RedisStore instance
 */
export function createCacheStore(): CacheStore {
  return new RedisStore(config.cache.redisUrl);
}

/**
 * Process-scoped singleton — stored on `globalThis` so it survives Next.js
 * hot-module reloads in development without spawning duplicate connections.
 */
export const cacheStore: CacheStore =
  globalThis.__cacheStore ?? (globalThis.__cacheStore = createCacheStore());
