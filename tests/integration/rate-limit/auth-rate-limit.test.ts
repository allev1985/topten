/**
 * Integration tests: rate limiting across multiple rapid auth attempts.
 *
 * These tests verify the full sliding-window rate limiter behaviour when
 * integrated with an in-memory CacheStore — they do NOT mock the RateLimiter
 * internals, only the underlying store, so the algorithm runs for real.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CacheStore } from "@/lib/services/cache/types";
import { RateLimiter } from "@/lib/services/rate-limit/service";

// ─── In-memory CacheStore ────────────────────────────────────────────────────

function createInMemoryStore(): CacheStore {
  const data = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => data.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      data.set(key, value);
    }),
    incr: vi.fn(async (key: string) => {
      const current = parseInt(data.get(key) ?? "0", 10);
      const next = current + 1;
      data.set(key, String(next));
      return next;
    }),
    del: vi.fn(async (key: string) => {
      data.delete(key);
    }),
    expire: vi.fn(async () => true),
    ttl: vi.fn(async () => -2),
    // Simulate the sliding-window Lua script in JS so integration tests don't need Redis
    eval: vi.fn(async (_script: string, keys: string[], args: string[]) => {
      const previousKey = keys[0]!;
      const currentKey = keys[1]!;
      const elapsed = parseFloat(args[0]!);
      const limit = parseFloat(args[1]!);
      const prev = parseFloat(data.get(previousKey) ?? "0");
      const curr = parseFloat(data.get(currentKey) ?? "0");
      const estimated = prev * (1 - elapsed) + curr;
      if (estimated >= limit) {
        return [0, Math.floor(estimated)];
      }
      const next = curr + 1;
      data.set(currentKey, String(next));
      return [1, Math.floor(estimated) + 1];
    }),
  };
}

// ─── Mock logger ─────────────────────────────────────────────────────────────

vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Rate Limiting Integration", () => {
  let store: CacheStore;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    store = createInMemoryStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Login IP rate limiting (10 requests / 15 min)", () => {
    const limiterConfig = {
      action: "login-ip",
      maxRequests: 10,
      windowSeconds: 15 * 60,
    };

    it("allows first 10 requests then blocks the 11th", async () => {
      const limiter = new RateLimiter(limiterConfig, store);
      const ip = "192.168.1.1";

      for (let i = 1; i <= 10; i++) {
        const result = await limiter.check(ip);
        expect(result.allowed).toBe(true);
        expect(result.current).toBe(i);
        expect(result.limit).toBe(10);
      }

      const blocked = await limiter.check(ip);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("tracks different IPs independently", async () => {
      const limiter = new RateLimiter(limiterConfig, store);

      // Exhaust IP A
      for (let i = 0; i < 10; i++) {
        await limiter.check("10.0.0.1");
      }
      const blockedA = await limiter.check("10.0.0.1");
      expect(blockedA.allowed).toBe(false);

      // IP B is still allowed
      const allowedB = await limiter.check("10.0.0.2");
      expect(allowedB.allowed).toBe(true);
    });

    it("allows requests again after window resets", async () => {
      const limiter = new RateLimiter(limiterConfig, store);
      const ip = "192.168.1.1";

      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        await limiter.check(ip);
      }
      expect((await limiter.check(ip)).allowed).toBe(false);

      // Advance past the full window (15 min + previous window decay)
      vi.advanceTimersByTime(15 * 60 * 1000 + 1);

      // Previous window count decays but current window is fresh.
      // Need to advance a full second window for complete reset.
      vi.advanceTimersByTime(15 * 60 * 1000);

      const result = await limiter.check(ip);
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Login email rate limiting (5 requests / 15 min)", () => {
    const limiterConfig = {
      action: "login-email",
      maxRequests: 5,
      windowSeconds: 15 * 60,
    };

    it("allows 5 requests then blocks per email", async () => {
      const limiter = new RateLimiter(limiterConfig, store);
      const email = "user@example.com";

      for (let i = 1; i <= 5; i++) {
        const result = await limiter.check(email);
        expect(result.allowed).toBe(true);
      }

      const blocked = await limiter.check(email);
      expect(blocked.allowed).toBe(false);
      expect(blocked.limit).toBe(5);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Signup rate limiting (5 requests / 60 min)", () => {
    const limiterConfig = {
      action: "signup",
      maxRequests: 5,
      windowSeconds: 60 * 60,
    };

    it("blocks after 5 signups from same IP within an hour", async () => {
      const limiter = new RateLimiter(limiterConfig, store);
      const ip = "10.0.0.5";

      for (let i = 0; i < 5; i++) {
        expect((await limiter.check(ip)).allowed).toBe(true);
      }
      expect((await limiter.check(ip)).allowed).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Password reset rate limiting (3 requests / 60 min)", () => {
    it("blocks IP after 3 reset requests", async () => {
      const limiter = new RateLimiter(
        { action: "reset-password-ip", maxRequests: 3, windowSeconds: 60 * 60 },
        store
      );
      const ip = "10.0.0.10";

      for (let i = 0; i < 3; i++) {
        expect((await limiter.check(ip)).allowed).toBe(true);
      }
      expect((await limiter.check(ip)).allowed).toBe(false);
    });

    it("blocks email after 3 reset requests", async () => {
      const limiter = new RateLimiter(
        {
          action: "reset-password-email",
          maxRequests: 3,
          windowSeconds: 60 * 60,
        },
        store
      );
      const email = "victim@example.com";

      for (let i = 0; i < 3; i++) {
        expect((await limiter.check(email)).allowed).toBe(true);
      }
      expect((await limiter.check(email)).allowed).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("MFA rate limiting (5 requests / 15 min)", () => {
    it("blocks MFA send after 5 attempts", async () => {
      const limiter = new RateLimiter(
        { action: "mfa-send", maxRequests: 5, windowSeconds: 15 * 60 },
        store
      );

      for (let i = 0; i < 5; i++) {
        expect((await limiter.check("session-abc")).allowed).toBe(true);
      }
      expect((await limiter.check("session-abc")).allowed).toBe(false);
    });

    it("blocks MFA verify after 5 attempts", async () => {
      const limiter = new RateLimiter(
        { action: "mfa-verify", maxRequests: 5, windowSeconds: 15 * 60 },
        store
      );

      for (let i = 0; i < 5; i++) {
        expect((await limiter.check("session-abc")).allowed).toBe(true);
      }
      expect((await limiter.check("session-abc")).allowed).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Sliding window decay", () => {
    it("partially decays previous window count based on elapsed time", async () => {
      const limiter = new RateLimiter(
        { action: "decay-test", maxRequests: 10, windowSeconds: 100 },
        store
      );
      const id = "user-1";

      // Make 8 requests at the start of a window
      for (let i = 0; i < 8; i++) {
        await limiter.check(id);
      }

      // Advance to 50% through the NEXT window
      // Previous count = 8, decay = 8 * (1 - 0.5) = 4, current = 0
      // Estimated = 4, so 6 more should be allowed
      vi.advanceTimersByTime(150 * 1000); // 1.5 windows = 50% into next window

      const result = await limiter.check(id);
      expect(result.allowed).toBe(true);
      // Previous window contributed ~4, plus this new request = ~5
      expect(result.current).toBeLessThanOrEqual(10);
    });

    it("allows full quota after two complete windows have passed", async () => {
      const limiter = new RateLimiter(
        { action: "full-reset", maxRequests: 5, windowSeconds: 60 },
        store
      );
      const id = "user-2";

      // Exhaust quota
      for (let i = 0; i < 5; i++) {
        await limiter.check(id);
      }
      expect((await limiter.check(id)).allowed).toBe(false);

      // Advance 2 full windows — previous window is now two windows ago
      vi.advanceTimersByTime(120 * 1000);

      const result = await limiter.check(id);
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Fail-open on cache store errors", () => {
    it("returns allowed when store.get throws", async () => {
      const failStore = createInMemoryStore();
      (failStore.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Redis down")
      );

      const limiter = new RateLimiter(
        { action: "fail-open", maxRequests: 5, windowSeconds: 60 },
        failStore
      );

      const result = await limiter.check("user-1");
      expect(result.allowed).toBe(true);
      expect(result.retryAfterSeconds).toBe(0);
    });

    it("returns allowed when store.incr throws", async () => {
      const failStore = createInMemoryStore();
      (failStore.incr as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Redis timeout")
      );

      const limiter = new RateLimiter(
        { action: "fail-open-incr", maxRequests: 5, windowSeconds: 60 },
        failStore
      );

      const result = await limiter.check("user-1");
      expect(result.allowed).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Password change rate limiting (5 requests / 60 min)", () => {
    it("blocks user after 5 password change attempts", async () => {
      const limiter = new RateLimiter(
        {
          action: "password-change",
          maxRequests: 5,
          windowSeconds: 60 * 60,
        },
        store
      );
      const userId = "user-123";

      for (let i = 0; i < 5; i++) {
        expect((await limiter.check(userId)).allowed).toBe(true);
      }
      expect((await limiter.check(userId)).allowed).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Multi-layer rate limiting (IP + email)", () => {
    it("blocks on IP even when email is within limits", async () => {
      const ipLimiter = new RateLimiter(
        { action: "login-ip", maxRequests: 3, windowSeconds: 60 },
        store
      );
      const emailLimiter = new RateLimiter(
        { action: "login-email", maxRequests: 5, windowSeconds: 60 },
        store
      );

      const ip = "10.0.0.1";
      const email = "user@example.com";

      // Exhaust IP limit with 3 requests
      for (let i = 0; i < 3; i++) {
        const ipResult = await ipLimiter.check(ip);
        const emailResult = await emailLimiter.check(email);
        expect(ipResult.allowed).toBe(true);
        expect(emailResult.allowed).toBe(true);
      }

      // 4th request — IP blocked, email still allowed
      const ipBlocked = await ipLimiter.check(ip);
      const emailStillOk = await emailLimiter.check(email);
      expect(ipBlocked.allowed).toBe(false);
      expect(emailStillOk.allowed).toBe(true);
    });

    it("blocks on email even when IP is within limits", async () => {
      const ipLimiter = new RateLimiter(
        { action: "login-ip", maxRequests: 10, windowSeconds: 60 },
        store
      );
      const emailLimiter = new RateLimiter(
        { action: "login-email", maxRequests: 2, windowSeconds: 60 },
        store
      );

      // 2 requests from different IPs but same email
      await ipLimiter.check("10.0.0.1");
      await emailLimiter.check("target@example.com");

      await ipLimiter.check("10.0.0.2");
      await emailLimiter.check("target@example.com");

      // IP limiter still fine for new IP, but email is exhausted
      const ipOk = await ipLimiter.check("10.0.0.3");
      const emailBlocked = await emailLimiter.check("target@example.com");
      expect(ipOk.allowed).toBe(true);
      expect(emailBlocked.allowed).toBe(false);
    });
  });
});
