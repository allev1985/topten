/**
 * Pre-configured rate limiter instances for auth endpoints.
 * @module lib/services/rate-limit
 */

import { cacheStore } from "@/lib/services/cache";
import { RateLimiter } from "./service";

export { RateLimiter } from "./service";
export { RateLimitError } from "./errors";
export type { RateLimitConfig, RateLimitResult } from "./types";

export const loginIPLimiter = new RateLimiter(
  { action: "login-ip", maxRequests: 10, windowSeconds: 15 * 60 },
  cacheStore
);

export const loginEmailLimiter = new RateLimiter(
  { action: "login-email", maxRequests: 5, windowSeconds: 15 * 60 },
  cacheStore
);

export const signupLimiter = new RateLimiter(
  { action: "signup", maxRequests: 5, windowSeconds: 60 * 60 },
  cacheStore
);

export const resetPasswordIPLimiter = new RateLimiter(
  { action: "reset-password-ip", maxRequests: 3, windowSeconds: 60 * 60 },
  cacheStore
);

export const resetPasswordEmailLimiter = new RateLimiter(
  { action: "reset-password-email", maxRequests: 3, windowSeconds: 60 * 60 },
  cacheStore
);

export const mfaSendLimiter = new RateLimiter(
  { action: "mfa-send", maxRequests: 5, windowSeconds: 15 * 60 },
  cacheStore
);

export const mfaVerifyLimiter = new RateLimiter(
  { action: "mfa-verify", maxRequests: 5, windowSeconds: 15 * 60 },
  cacheStore
);

export const passwordChangeLimiter = new RateLimiter(
  { action: "password-change", maxRequests: 5, windowSeconds: 60 * 60 },
  cacheStore
);
