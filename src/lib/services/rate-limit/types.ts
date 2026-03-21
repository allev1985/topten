/**
 * Types for the rate limit service.
 * @module lib/services/rate-limit/types
 */

export interface RateLimitConfig {
  action: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  retryAfterSeconds: number;
}
