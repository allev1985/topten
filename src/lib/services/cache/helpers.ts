/**
 * Generic cache helpers built on the CacheStore interface.
 * @module lib/services/cache/helpers
 */

import { cacheStore } from "@/lib/services/cache";
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("cache-helpers");

/** ISO 8601 date string pattern */
const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * JSON reviver that converts ISO 8601 date strings back to Date objects.
 * Ensures cached values with Date fields round-trip correctly through JSON.
 */
function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && ISO_DATE_RE.test(value)) {
    return new Date(value);
  }
  return value;
}

/**
 * Fetch a value from cache or execute the fetcher on miss.
 * Fail-open: cache errors are logged and the fetcher is called directly.
 * @param key - The cache key
 * @param ttlSeconds - TTL for the cached value
 * @param fetcher - Function that produces the value on cache miss
 * @returns The cached or freshly-fetched value
 */
export async function cachedQuery<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const cached = await cacheStore.get(key);
    if (cached) {
      log.debug({ method: "cachedQuery", key }, "Cache hit");
      return JSON.parse(cached, dateReviver) as T;
    }
  } catch (err) {
    log.warn(
      { method: "cachedQuery", key, err },
      "Cache read failed — falling back to fetcher"
    );
  }

  const result = await fetcher();

  if (result != null) {
    try {
      await cacheStore.set(key, JSON.stringify(result), ttlSeconds);
    } catch (err) {
      log.warn({ method: "cachedQuery", key, err }, "Cache write failed");
    }
  }

  return result;
}

/**
 * Delete one or more cache keys. Fail-open: errors are logged, never thrown.
 * @param keys - Cache keys to delete
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  for (const key of keys) {
    try {
      await cacheStore.del(key);
    } catch (err) {
      log.warn(
        { method: "invalidateCache", key, err },
        "Cache invalidation failed"
      );
    }
  }
}
