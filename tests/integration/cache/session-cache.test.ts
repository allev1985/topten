/**
 * Integration tests: session caching with the auth service.
 *
 * These tests verify the full session cache flow — cache hit, cache miss
 * with write-through, invalidation, and fail-open behaviour — using the
 * real `getCachedSession` and `invalidateSessionCache` functions with a
 * mocked CacheStore and cookie jar.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionResult } from "@/lib/auth/types";

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDel: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: mocks.cookieGet }),
}));

vi.mock("@/lib/services/cache", () => ({
  cacheStore: {
    get: (...args: unknown[]) => mocks.cacheGet(...args),
    set: (...args: unknown[]) => mocks.cacheSet(...args),
    del: (...args: unknown[]) => mocks.cacheDel(...args),
  },
}));

vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return {
    ...actual,
    config: {
      ...actual.config,
      cache: {
        redisUrl: "redis://localhost:6379",
        sessionTtlSeconds: 60,
        publicListTtlSeconds: 86_400,
      },
    },
  };
});

vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ─── Import under test (after mocks) ────────────────────────────────────────

import {
  getCachedSession,
  invalidateSessionCache,
  buildSessionCacheKey,
} from "@/lib/auth/session-cache";

// ─── Test data ───────────────────────────────────────────────────────────────

const SESSION_TOKEN = "test-session-token-abc123";

const authenticatedSession: SessionResult = {
  authenticated: true,
  user: { id: "user-123", email: "test@example.com" },
  session: { expiresAt: "2026-06-01T00:00:00Z" },
};

const unauthenticatedSession: SessionResult = {
  authenticated: false,
  user: null,
  session: null,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Session Cache Integration", () => {
  // ─────────────────────────────────────────────────────────────────────────
  describe("getCachedSession", () => {
    it("returns cached session on cache hit without calling fetchDirect", async () => {
      mocks.cookieGet.mockReturnValue({ value: SESSION_TOKEN });
      mocks.cacheGet.mockResolvedValue(JSON.stringify(authenticatedSession));
      const fetchDirect = vi.fn();

      const result = await getCachedSession(fetchDirect);

      expect(result).toEqual(authenticatedSession);
      expect(fetchDirect).not.toHaveBeenCalled();
      expect(mocks.cacheGet).toHaveBeenCalledWith(
        buildSessionCacheKey(SESSION_TOKEN)
      );
    });

    it("calls fetchDirect and caches result on cache miss", async () => {
      mocks.cookieGet.mockReturnValue({ value: SESSION_TOKEN });
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockResolvedValue(undefined);
      const fetchDirect = vi.fn().mockResolvedValue(authenticatedSession);

      const result = await getCachedSession(fetchDirect);

      expect(result).toEqual(authenticatedSession);
      expect(fetchDirect).toHaveBeenCalledOnce();
      expect(mocks.cacheSet).toHaveBeenCalledWith(
        buildSessionCacheKey(SESSION_TOKEN),
        JSON.stringify(authenticatedSession),
        60
      );
    });

    it("does not cache unauthenticated sessions", async () => {
      mocks.cookieGet.mockReturnValue({ value: SESSION_TOKEN });
      mocks.cacheGet.mockResolvedValue(null);
      const fetchDirect = vi.fn().mockResolvedValue(unauthenticatedSession);

      const result = await getCachedSession(fetchDirect);

      expect(result).toEqual(unauthenticatedSession);
      expect(mocks.cacheSet).not.toHaveBeenCalled();
    });

    it("calls fetchDirect directly when no session cookie exists", async () => {
      mocks.cookieGet.mockReturnValue(undefined);
      const fetchDirect = vi.fn().mockResolvedValue(unauthenticatedSession);

      const result = await getCachedSession(fetchDirect);

      expect(result).toEqual(unauthenticatedSession);
      expect(mocks.cacheGet).not.toHaveBeenCalled();
      expect(fetchDirect).toHaveBeenCalledOnce();
    });

    it("falls back to fetchDirect when cache read throws (fail-open)", async () => {
      mocks.cookieGet.mockReturnValue({ value: SESSION_TOKEN });
      mocks.cacheGet.mockRejectedValue(new Error("Redis down"));
      mocks.cacheSet.mockResolvedValue(undefined);
      const fetchDirect = vi.fn().mockResolvedValue(authenticatedSession);

      const result = await getCachedSession(fetchDirect);

      expect(result).toEqual(authenticatedSession);
      expect(fetchDirect).toHaveBeenCalledOnce();
    });

    it("returns session even when cache write fails (fail-open)", async () => {
      mocks.cookieGet.mockReturnValue({ value: SESSION_TOKEN });
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockRejectedValue(new Error("Redis timeout"));
      const fetchDirect = vi.fn().mockResolvedValue(authenticatedSession);

      const result = await getCachedSession(fetchDirect);

      expect(result).toEqual(authenticatedSession);
    });

    it("handles empty cookie value as no cookie", async () => {
      mocks.cookieGet.mockReturnValue({ value: "" });
      const fetchDirect = vi.fn().mockResolvedValue(unauthenticatedSession);

      const result = await getCachedSession(fetchDirect);

      expect(result).toEqual(unauthenticatedSession);
      expect(mocks.cacheGet).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("invalidateSessionCache", () => {
    it("deletes the cached session key", async () => {
      mocks.cookieGet.mockReturnValue({ value: SESSION_TOKEN });
      mocks.cacheDel.mockResolvedValue(undefined);

      await invalidateSessionCache();

      expect(mocks.cacheDel).toHaveBeenCalledWith(
        buildSessionCacheKey(SESSION_TOKEN)
      );
    });

    it("does nothing when no session cookie exists", async () => {
      mocks.cookieGet.mockReturnValue(undefined);

      await invalidateSessionCache();

      expect(mocks.cacheDel).not.toHaveBeenCalled();
    });

    it("does not throw when cache delete fails (fail-open)", async () => {
      mocks.cookieGet.mockReturnValue({ value: SESSION_TOKEN });
      mocks.cacheDel.mockRejectedValue(new Error("Redis error"));

      await expect(invalidateSessionCache()).resolves.toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("buildSessionCacheKey", () => {
    it("produces deterministic keys for the same token", () => {
      const key1 = buildSessionCacheKey("my-token");
      const key2 = buildSessionCacheKey("my-token");
      expect(key1).toBe(key2);
    });

    it("produces different keys for different tokens", () => {
      const key1 = buildSessionCacheKey("token-a");
      const key2 = buildSessionCacheKey("token-b");
      expect(key1).not.toBe(key2);
    });

    it("starts with 'session:' prefix", () => {
      expect(buildSessionCacheKey("any-token")).toMatch(
        /^session:[a-f0-9]{16}$/
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Full cache lifecycle", () => {
    it("miss → cache → hit → invalidate → miss", async () => {
      const fetchDirect = vi.fn().mockResolvedValue(authenticatedSession);

      // Step 1: Cache miss — fetchDirect is called, result is cached
      mocks.cookieGet.mockReturnValue({ value: SESSION_TOKEN });
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockResolvedValue(undefined);

      const result1 = await getCachedSession(fetchDirect);
      expect(result1).toEqual(authenticatedSession);
      expect(fetchDirect).toHaveBeenCalledTimes(1);

      // Step 2: Cache hit — fetchDirect is NOT called
      mocks.cacheGet.mockResolvedValue(JSON.stringify(authenticatedSession));

      const result2 = await getCachedSession(fetchDirect);
      expect(result2).toEqual(authenticatedSession);
      expect(fetchDirect).toHaveBeenCalledTimes(1); // still 1

      // Step 3: Invalidate
      mocks.cacheDel.mockResolvedValue(undefined);
      await invalidateSessionCache();
      expect(mocks.cacheDel).toHaveBeenCalledOnce();

      // Step 4: Cache miss again — fetchDirect is called
      mocks.cacheGet.mockResolvedValue(null);
      const result3 = await getCachedSession(fetchDirect);
      expect(result3).toEqual(authenticatedSession);
      expect(fetchDirect).toHaveBeenCalledTimes(2);
    });
  });
});
