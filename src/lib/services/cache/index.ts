/**
 * Public API for the cache service.
 *
 * Provides a singleton CacheStore instance created from REDIS_URL config.
 * All consumers import from here rather than constructing their own store.
 *
 * @module lib/services/cache
 */

import { config } from "@/lib/config";
import { RedisStore } from "./redis-store";
import type { CacheStore } from "./types";

export { CacheServiceError } from "./errors";
export type { CacheStore, CacheServiceErrorCode } from "./types";

/**
 * Create a CacheStore backed by Redis, using `REDIS_URL` from config.
 * @returns A new RedisStore instance
 */
export function createCacheStore(): CacheStore {
  return new RedisStore(config.cache.redisUrl);
}

/** Module-level singleton — shared across all imports. */
export const cacheStore: CacheStore = createCacheStore();
