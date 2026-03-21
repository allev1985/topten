import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "@/lib/services/rate-limit/service";
import type { CacheStore } from "@/lib/services/cache/types";

vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  obfuscate: vi.fn((v: string) => v.slice(0, 8)),
}));

function createMockStore(): CacheStore {
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
    // Simulate the sliding-window Lua script in JS so unit tests don't need Redis
    eval: vi.fn(async (_script: string, keys: string[], args: string[]) => {
      const previousKey = keys[0]!;
      const currentKey = keys[1]!;
      const elapsed = parseFloat(args[0]!);
      const limit = parseFloat(args[1]!);
      const ttl = parseFloat(args[2]!);
      const prev = parseFloat(data.get(previousKey) ?? "0");
      const curr = parseFloat(data.get(currentKey) ?? "0");
      const estimated = prev * (1 - elapsed) + curr;
      if (estimated >= limit) {
        return [0, Math.floor(estimated)];
      }
      const next = curr + 1;
      data.set(currentKey, String(next));
      void ttl; // TTL tracking not needed in the in-memory mock
      return [1, Math.floor(estimated) + 1];
    }),
  };
}

describe("RateLimiter", () => {
  let store: CacheStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = createMockStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", async () => {
    const limiter = new RateLimiter(
      { action: "test", maxRequests: 3, windowSeconds: 60 },
      store
    );

    const result = await limiter.check("user-1");

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(1);
    expect(result.limit).toBe(3);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("blocks requests at the limit", async () => {
    const limiter = new RateLimiter(
      { action: "test", maxRequests: 3, windowSeconds: 60 },
      store
    );

    // Set the current time to the start of a window
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    await limiter.check("user-1");
    await limiter.check("user-1");
    await limiter.check("user-1");

    const result = await limiter.check("user-1");

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks identifiers independently", async () => {
    const limiter = new RateLimiter(
      { action: "test", maxRequests: 2, windowSeconds: 60 },
      store
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    await limiter.check("user-1");
    await limiter.check("user-1");

    const blockedResult = await limiter.check("user-1");
    expect(blockedResult.allowed).toBe(false);

    const otherResult = await limiter.check("user-2");
    expect(otherResult.allowed).toBe(true);
  });

  it("allows requests again after the window passes", async () => {
    const limiter = new RateLimiter(
      { action: "test", maxRequests: 2, windowSeconds: 60 },
      store
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    await limiter.check("user-1");
    await limiter.check("user-1");

    const blocked = await limiter.check("user-1");
    expect(blocked.allowed).toBe(false);

    // Advance past the full window + previous window decay
    vi.advanceTimersByTime(120_000);

    const allowed = await limiter.check("user-1");
    expect(allowed.allowed).toBe(true);
  });

  it("uses sliding window — previous window contributes weighted count", async () => {
    const limiter = new RateLimiter(
      { action: "test", maxRequests: 5, windowSeconds: 60 },
      store
    );

    // Fill previous window with 4 requests
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await limiter.check("user-1"); // 1
    await limiter.check("user-1"); // 2
    await limiter.check("user-1"); // 3
    await limiter.check("user-1"); // 4

    // Move to 30s into the next window (50% elapsed)
    // Previous window weight = 0.5, so prev contributes 4 * 0.5 = 2
    vi.setSystemTime(new Date("2026-01-01T00:01:30Z"));

    const r1 = await limiter.check("user-1"); // estimated: 2 + 0 = 2 -> allowed, then 2+1=3
    expect(r1.allowed).toBe(true);

    const r2 = await limiter.check("user-1"); // estimated: 2 + 1 = 3 -> allowed, then 3+1=4
    expect(r2.allowed).toBe(true);

    const r3 = await limiter.check("user-1"); // estimated: 2 + 2 = 4 -> allowed, then 4+1=5
    expect(r3.allowed).toBe(true);

    const r4 = await limiter.check("user-1"); // estimated: 2 + 3 = 5 -> blocked
    expect(r4.allowed).toBe(false);
  });

  it("fails open when cache store throws", async () => {
    const failingStore: CacheStore = {
      get: vi.fn().mockRejectedValue(new Error("Redis down")),
      set: vi.fn().mockRejectedValue(new Error("Redis down")),
      incr: vi.fn().mockRejectedValue(new Error("Redis down")),
      del: vi.fn().mockRejectedValue(new Error("Redis down")),
      expire: vi.fn().mockRejectedValue(new Error("Redis down")),
      ttl: vi.fn().mockRejectedValue(new Error("Redis down")),
      eval: vi.fn().mockRejectedValue(new Error("Redis down")),
    };

    const limiter = new RateLimiter(
      { action: "test", maxRequests: 1, windowSeconds: 60 },
      failingStore
    );

    const result = await limiter.check("user-1");

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(0);
  });

  it("sets TTL to 2x window on increment", async () => {
    const limiter = new RateLimiter(
      { action: "test", maxRequests: 10, windowSeconds: 300 },
      store
    );

    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    await limiter.check("user-1");

    // TTL is passed as the third ARGV element to the atomic Lua script
    expect(store.eval).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([expect.stringContaining("rl:test:user-1:")]),
      expect.arrayContaining(["600"])
    );
  });
});
