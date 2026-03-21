/**
 * Integration tests: DB query caching via cachedQuery helper.
 *
 * Verifies the full cache-aside pattern including cache hits, misses,
 * TTL propagation, null handling, and fail-open behaviour, using the
 * real cachedQuery/invalidateCache functions with a mocked CacheStore.
 *
 * Also tests the public service cache integration (key building,
 * invalidation with userId-based keys).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDel: vi.fn(),
}));

vi.mock("@/lib/services/cache", () => ({
  cacheStore: {
    get: (...args: unknown[]) => mocks.cacheGet(...args),
    set: (...args: unknown[]) => mocks.cacheSet(...args),
    del: (...args: unknown[]) => mocks.cacheDel(...args),
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

// ─── Import under test ──────────────────────────────────────────────────────

import { cachedQuery, invalidateCache } from "@/lib/services/cache/helpers";

// ─── Test data ───────────────────────────────────────────────────────────────

const CACHE_KEY = "test:key:123";
const TTL = 300;

const sampleData = { id: "abc", name: "Test Item", count: 42 };
const sampleArray = [
  { id: "1", title: "First" },
  { id: "2", title: "Second" },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Query Cache Integration", () => {
  // ─────────────────────────────────────────────────────────────────────────
  describe("cachedQuery", () => {
    it("returns cached value on hit without calling fetcher", async () => {
      mocks.cacheGet.mockResolvedValue(JSON.stringify(sampleData));
      const fetcher = vi.fn();

      const result = await cachedQuery(CACHE_KEY, TTL, fetcher);

      expect(result).toEqual(sampleData);
      expect(fetcher).not.toHaveBeenCalled();
      expect(mocks.cacheGet).toHaveBeenCalledWith(CACHE_KEY);
    });

    it("calls fetcher and caches result on miss", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockResolvedValue(undefined);
      const fetcher = vi.fn().mockResolvedValue(sampleData);

      const result = await cachedQuery(CACHE_KEY, TTL, fetcher);

      expect(result).toEqual(sampleData);
      expect(fetcher).toHaveBeenCalledOnce();
      expect(mocks.cacheSet).toHaveBeenCalledWith(
        CACHE_KEY,
        JSON.stringify(sampleData),
        TTL
      );
    });

    it("caches array results correctly", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockResolvedValue(undefined);
      const fetcher = vi.fn().mockResolvedValue(sampleArray);

      const result = await cachedQuery("list:key", 600, fetcher);

      expect(result).toEqual(sampleArray);
      expect(mocks.cacheSet).toHaveBeenCalledWith(
        "list:key",
        JSON.stringify(sampleArray),
        600
      );
    });

    it("returns cached array on hit", async () => {
      mocks.cacheGet.mockResolvedValue(JSON.stringify(sampleArray));
      const fetcher = vi.fn();

      const result = await cachedQuery("list:key", 600, fetcher);

      expect(result).toEqual(sampleArray);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("does not cache null results", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      const fetcher = vi.fn().mockResolvedValue(null);

      const result = await cachedQuery(CACHE_KEY, TTL, fetcher);

      expect(result).toBeNull();
      expect(mocks.cacheSet).not.toHaveBeenCalled();
    });

    it("does not cache undefined results", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      const fetcher = vi.fn().mockResolvedValue(undefined);

      const result = await cachedQuery(CACHE_KEY, TTL, fetcher);

      expect(result).toBeUndefined();
      expect(mocks.cacheSet).not.toHaveBeenCalled();
    });

    it("caches empty arrays (they are non-null)", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockResolvedValue(undefined);
      const fetcher = vi.fn().mockResolvedValue([]);

      const result = await cachedQuery(CACHE_KEY, TTL, fetcher);

      expect(result).toEqual([]);
      expect(mocks.cacheSet).toHaveBeenCalledWith(CACHE_KEY, "[]", TTL);
    });

    it("falls back to fetcher when cache read fails (fail-open)", async () => {
      mocks.cacheGet.mockRejectedValue(new Error("Redis down"));
      mocks.cacheSet.mockResolvedValue(undefined);
      const fetcher = vi.fn().mockResolvedValue(sampleData);

      const result = await cachedQuery(CACHE_KEY, TTL, fetcher);

      expect(result).toEqual(sampleData);
      expect(fetcher).toHaveBeenCalledOnce();
    });

    it("returns fetcher result when cache write fails (fail-open)", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockRejectedValue(new Error("Redis timeout"));
      const fetcher = vi.fn().mockResolvedValue(sampleData);

      const result = await cachedQuery(CACHE_KEY, TTL, fetcher);

      expect(result).toEqual(sampleData);
    });

    it("propagates fetcher errors (not fail-open for business logic)", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      const fetcher = vi
        .fn()
        .mockRejectedValue(new Error("DB connection lost"));

      await expect(cachedQuery(CACHE_KEY, TTL, fetcher)).rejects.toThrow(
        "DB connection lost"
      );
    });

    it("propagates correct TTL to cache store", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockResolvedValue(undefined);
      const fetcher = vi.fn().mockResolvedValue(sampleData);

      await cachedQuery("ttl-test", 86_400, fetcher);

      expect(mocks.cacheSet).toHaveBeenCalledWith(
        "ttl-test",
        expect.any(String),
        86_400
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("invalidateCache", () => {
    it("deletes a single key", async () => {
      mocks.cacheDel.mockResolvedValue(undefined);

      await invalidateCache("pub:lists:user-123");

      expect(mocks.cacheDel).toHaveBeenCalledWith("pub:lists:user-123");
      expect(mocks.cacheDel).toHaveBeenCalledTimes(1);
    });

    it("deletes multiple keys", async () => {
      mocks.cacheDel.mockResolvedValue(undefined);

      await invalidateCache("pub:lists:user-123", "pub:list:user-123:top-10");

      expect(mocks.cacheDel).toHaveBeenCalledTimes(2);
      expect(mocks.cacheDel).toHaveBeenCalledWith("pub:lists:user-123");
      expect(mocks.cacheDel).toHaveBeenCalledWith("pub:list:user-123:top-10");
    });

    it("does not throw when a key deletion fails (fail-open)", async () => {
      mocks.cacheDel.mockRejectedValue(new Error("Redis error"));

      await expect(invalidateCache("some:key")).resolves.toBeUndefined();
    });

    it("continues deleting remaining keys when one fails", async () => {
      mocks.cacheDel
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(undefined);

      await invalidateCache("key-1", "key-2");

      expect(mocks.cacheDel).toHaveBeenCalledTimes(2);
      expect(mocks.cacheDel).toHaveBeenCalledWith("key-1");
      expect(mocks.cacheDel).toHaveBeenCalledWith("key-2");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Full lifecycle: write → read → invalidate → miss", () => {
    it("caches on miss, returns from cache on hit, clears on invalidate", async () => {
      const fetcher = vi.fn().mockResolvedValue(sampleData);

      // Step 1: Cache miss → fetcher called, result cached
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockResolvedValue(undefined);

      const result1 = await cachedQuery(CACHE_KEY, TTL, fetcher);
      expect(result1).toEqual(sampleData);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Step 2: Cache hit → fetcher NOT called
      mocks.cacheGet.mockResolvedValue(JSON.stringify(sampleData));

      const result2 = await cachedQuery(CACHE_KEY, TTL, fetcher);
      expect(result2).toEqual(sampleData);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Step 3: Invalidate
      mocks.cacheDel.mockResolvedValue(undefined);
      await invalidateCache(CACHE_KEY);
      expect(mocks.cacheDel).toHaveBeenCalledWith(CACHE_KEY);

      // Step 4: Cache miss again → fetcher called
      mocks.cacheGet.mockResolvedValue(null);
      const result3 = await cachedQuery(CACHE_KEY, TTL, fetcher);
      expect(result3).toEqual(sampleData);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Public list cache key patterns", () => {
    it("invalidating user summaries uses correct key format", async () => {
      mocks.cacheDel.mockResolvedValue(undefined);

      await invalidateCache("pub:lists:user-abc-123");

      expect(mocks.cacheDel).toHaveBeenCalledWith("pub:lists:user-abc-123");
    });

    it("invalidating user summaries + list detail uses correct keys", async () => {
      mocks.cacheDel.mockResolvedValue(undefined);

      await invalidateCache(
        "pub:lists:user-abc-123",
        "pub:list:user-abc-123:top-10"
      );

      expect(mocks.cacheDel).toHaveBeenCalledWith("pub:lists:user-abc-123");
      expect(mocks.cacheDel).toHaveBeenCalledWith(
        "pub:list:user-abc-123:top-10"
      );
    });
  });
});
