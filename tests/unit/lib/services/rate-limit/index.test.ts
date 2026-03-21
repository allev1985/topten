import { describe, it, expect, vi } from "vitest";

// Mock the cache store before importing the index module
vi.mock("@/lib/services/cache", () => ({
  cacheStore: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  },
}));

vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import {
  loginIPLimiter,
  loginEmailLimiter,
  signupLimiter,
  resetPasswordIPLimiter,
  resetPasswordEmailLimiter,
  mfaSendLimiter,
  mfaVerifyLimiter,
  passwordChangeLimiter,
  RateLimiter,
} from "@/lib/services/rate-limit";

describe("rate-limit index", () => {
  it("exports all pre-configured limiter instances as RateLimiter", () => {
    expect(loginIPLimiter).toBeInstanceOf(RateLimiter);
    expect(loginEmailLimiter).toBeInstanceOf(RateLimiter);
    expect(signupLimiter).toBeInstanceOf(RateLimiter);
    expect(resetPasswordIPLimiter).toBeInstanceOf(RateLimiter);
    expect(resetPasswordEmailLimiter).toBeInstanceOf(RateLimiter);
    expect(mfaSendLimiter).toBeInstanceOf(RateLimiter);
    expect(mfaVerifyLimiter).toBeInstanceOf(RateLimiter);
    expect(passwordChangeLimiter).toBeInstanceOf(RateLimiter);
  });
});
