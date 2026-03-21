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
import { createServiceLogger } from "@/lib/services/logging";
import { hashIdentifier } from "@/lib/utils/formatting/identifier";

const log = createServiceLogger("rate-limiter");

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

    const prevCountStr = await this.store.get(previousKey);
    const parsedPrevCount =
      prevCountStr != null ? Number.parseInt(prevCountStr, 10) : 0;
    const prevCount = Number.isFinite(parsedPrevCount) ? parsedPrevCount : 0;

    const currentCountStr = await this.store.get(currentKey);
    const parsedCurrentCount =
      currentCountStr != null ? Number.parseInt(currentCountStr, 10) : 0;
    const currentCount = Number.isFinite(parsedCurrentCount)
      ? parsedCurrentCount
      : 0;

    const estimatedCount = prevCount * (1 - elapsedRatio) + currentCount;

    if (estimatedCount >= maxRequests) {
      const retryAfterSeconds = Math.ceil(windowSeconds * (1 - elapsedRatio));

      log.info(
        {
          method: "check",
          action,
          identifierHash: hashIdentifier(identifier),
          estimatedCount: Math.floor(estimatedCount),
          limit: maxRequests,
        },
        "Rate limit exceeded"
      );

      return {
        allowed: false,
        current: Math.floor(estimatedCount),
        limit: maxRequests,
        retryAfterSeconds,
      };
    }

    // Increment and set TTL
    const ttl = windowSeconds * 2;
    await this.store.incr(currentKey);
    await this.store.expire(currentKey, ttl);

    return {
      allowed: true,
      current: Math.floor(estimatedCount) + 1,
      limit: maxRequests,
      retryAfterSeconds: 0,
    };
  }
}
