/**
 * Sliding window counter rate limiter.
 *
 * Uses two adjacent fixed windows weighted by elapsed time to approximate
 * a true sliding window:
 *
 *   estimatedCount = prevCount * (1 - elapsedRatio) + currentCount
 *
 * Cache keys: `rl:{action}:{identifier}:{windowStart}`
 * TTL per key: 2 * windowSeconds (keeps previous window available)
 *
 * @module lib/services/rate-limit/service
 */

import type { CacheStore } from "@/lib/services/cache/types";
import type { RateLimitConfig, RateLimitResult } from "./types";
import { createServiceLogger, obfuscate } from "@/lib/services/logging";

const log = createServiceLogger("rate-limiter");

/**
 * Atomically reads both window counters, checks against the limit, and
 * increments the current window counter if the request is allowed.
 *
 * KEYS[1] = previousKey, KEYS[2] = currentKey
 * ARGV[1] = elapsedRatio, ARGV[2] = maxRequests, ARGV[3] = ttlSeconds
 *
 * Returns a two-element array: { allowed (0|1), current count }
 */
const SLIDING_WINDOW_SCRIPT = `
local prev    = tonumber(redis.call('GET', KEYS[1])) or 0
local curr    = tonumber(redis.call('GET', KEYS[2])) or 0
local elapsed = tonumber(ARGV[1])
local limit   = tonumber(ARGV[2])
local ttl     = tonumber(ARGV[3])
local estimated = prev * (1 - elapsed) + curr
if estimated >= limit then
  return {0, math.floor(estimated)}
end
redis.call('INCR', KEYS[2])
redis.call('EXPIRE', KEYS[2], ttl)
return {1, math.floor(estimated) + 1}
`;

export class RateLimiter {
  constructor(
    private readonly config: RateLimitConfig,
    private readonly store: CacheStore
  ) {}

  /**
   * Check whether the identifier is within the rate limit, and increment the counter.
   * Returns `{ allowed: true }` on cache errors (fail-open).
   * @param identifier - The key to rate limit on (e.g. IP address, email, user ID)
   * @returns The rate limit result including whether the request is allowed
   */
  async check(identifier: string): Promise<RateLimitResult> {
    try {
      return await this.checkInternal(identifier);
    } catch (err) {
      log.warn(
        { method: "check", action: this.config.action, err },
        "Rate limit check failed — allowing request (fail-open)"
      );
      return {
        allowed: true,
        current: 0,
        limit: this.config.maxRequests,
        retryAfterSeconds: 0,
      };
    }
  }

  private async checkInternal(identifier: string): Promise<RateLimitResult> {
    const { action, maxRequests, windowSeconds } = this.config;
    const nowMs = Date.now();
    const windowMs = windowSeconds * 1000;

    const currentWindowStart = Math.floor(nowMs / windowMs) * windowMs;
    const previousWindowStart = currentWindowStart - windowMs;
    const elapsedRatio = (nowMs - currentWindowStart) / windowMs;

    const currentKey = `rl:${action}:${identifier}:${currentWindowStart}`;
    const previousKey = `rl:${action}:${identifier}:${previousWindowStart}`;

    const ttl = windowSeconds * 2;
    const result = (await this.store.eval(
      SLIDING_WINDOW_SCRIPT,
      [previousKey, currentKey],
      [String(elapsedRatio), String(maxRequests), String(ttl)]
    )) as [number, number];

    const [allowed, current] = result;

    if (!allowed) {
      const retryAfterSeconds = Math.ceil(windowSeconds * (1 - elapsedRatio));

      log.info(
        {
          method: "check",
          action,
          identifierHash: obfuscate(identifier),
          estimatedCount: current,
          limit: maxRequests,
        },
        "Rate limit exceeded"
      );

      return {
        allowed: false,
        current,
        limit: maxRequests,
        retryAfterSeconds,
      };
    }

    return {
      allowed: true,
      current,
      limit: maxRequests,
      retryAfterSeconds: 0,
    };
  }
}
