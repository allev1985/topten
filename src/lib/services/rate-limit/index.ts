/**
 * Pre-configured rate limiter instances for auth endpoints.
 * @module lib/services/rate-limit
 */

import { cacheStore } from "@/lib/services/cache";
import { config } from "@/lib/config";
import { RateLimiter } from "./service";

export { RateLimiter } from "./service";
export { RateLimitError } from "./errors";
export type { RateLimitConfig, RateLimitResult } from "./types";

export const loginIPLimiter = new RateLimiter(
  { action: "login-ip", ...config.rateLimit.login },
  cacheStore
);

export const loginEmailLimiter = new RateLimiter(
  { action: "login-email", ...config.rateLimit.loginEmail },
  cacheStore
);

export const signupLimiter = new RateLimiter(
  { action: "signup", ...config.rateLimit.signup },
  cacheStore
);

export const resetPasswordIPLimiter = new RateLimiter(
  { action: "reset-password-ip", ...config.rateLimit.resetPasswordIP },
  cacheStore
);

export const resetPasswordEmailLimiter = new RateLimiter(
  { action: "reset-password-email", ...config.rateLimit.resetPasswordEmail },
  cacheStore
);

export const mfaSendLimiter = new RateLimiter(
  { action: "mfa-send", ...config.rateLimit.mfaSend },
  cacheStore
);

export const mfaVerifyLimiter = new RateLimiter(
  { action: "mfa-verify", ...config.rateLimit.mfaVerify },
  cacheStore
);

export const passwordChangeLimiter = new RateLimiter(
  { action: "password-change", ...config.rateLimit.passwordChange },
  cacheStore
);
