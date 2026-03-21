import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks — available inside vi.mock factories
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

// Mock config
vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return {
    ...actual,
    config: {
      ...actual.config,
      cache: { redisUrl: "redis://localhost:6379", sessionTtlSeconds: 60 },
    },
  };
});

// Mock logging
vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import {
  getCachedSession,
  invalidateSessionCache,
  buildSessionCacheKey,
} from "@/lib/auth/session-cache";
import type { SessionResult } from "@/lib/auth/types";

const authenticatedSession: SessionResult = {
  authenticated: true,
  user: { id: "user-123", email: "test@example.com" },
  session: { expiresAt: "2026-04-01T00:00:00.000Z" },
};

const unauthenticatedSession: SessionResult = {
  authenticated: false,
  user: null,
  session: null,
};

describe("session-cache", () => {
  const mockFetchDirect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cacheGet.mockResolvedValue(null);
    mocks.cacheSet.mockResolvedValue(undefined);
    mocks.cacheDel.mockResolvedValue(undefined);
    mocks.cookieGet.mockReturnValue({ value: "session-token-abc" });
    mockFetchDirect.mockResolvedValue(authenticatedSession);
  });

  describe("buildSessionCacheKey", () => {
    it("returns a prefixed sha256-based key", () => {
      const key = buildSessionCacheKey("my-token");
      expect(key).toMatch(/^session:[a-f0-9]{16}$/);
    });

    it("produces different keys for different tokens", () => {
      const key1 = buildSessionCacheKey("token-a");
      const key2 = buildSessionCacheKey("token-b");
      expect(key1).not.toBe(key2);
    });

    it("produces the same key for the same token", () => {
      const key1 = buildSessionCacheKey("same-token");
      const key2 = buildSessionCacheKey("same-token");
      expect(key1).toBe(key2);
    });
  });

  describe("getCachedSession", () => {
    it("returns direct fetch result when no session cookie exists", async () => {
      mocks.cookieGet.mockReturnValue(undefined);

      const result = await getCachedSession(mockFetchDirect);

      expect(result).toEqual(authenticatedSession);
      expect(mocks.cacheGet).not.toHaveBeenCalled();
      expect(mockFetchDirect).toHaveBeenCalledOnce();
    });

    it("returns cached session on cache hit", async () => {
      mocks.cacheGet.mockResolvedValue(JSON.stringify(authenticatedSession));

      const result = await getCachedSession(mockFetchDirect);

      expect(result).toEqual(authenticatedSession);
      expect(mockFetchDirect).not.toHaveBeenCalled();
    });

    it("fetches directly and caches on cache miss", async () => {
      mocks.cacheGet.mockResolvedValue(null);

      const result = await getCachedSession(mockFetchDirect);

      expect(result).toEqual(authenticatedSession);
      expect(mockFetchDirect).toHaveBeenCalledOnce();
      expect(mocks.cacheSet).toHaveBeenCalledWith(
        expect.stringMatching(/^session:/),
        JSON.stringify(authenticatedSession),
        60
      );
    });

    it("does not cache unauthenticated sessions", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      mockFetchDirect.mockResolvedValue(unauthenticatedSession);

      const result = await getCachedSession(mockFetchDirect);

      expect(result).toEqual(unauthenticatedSession);
      expect(mocks.cacheSet).not.toHaveBeenCalled();
    });

    it("falls back to direct fetch on cache read error (fail-open)", async () => {
      mocks.cacheGet.mockRejectedValue(new Error("Redis down"));

      const result = await getCachedSession(mockFetchDirect);

      expect(result).toEqual(authenticatedSession);
      expect(mockFetchDirect).toHaveBeenCalledOnce();
    });

    it("succeeds even when cache write fails", async () => {
      mocks.cacheGet.mockResolvedValue(null);
      mocks.cacheSet.mockRejectedValue(new Error("Redis down"));

      const result = await getCachedSession(mockFetchDirect);

      expect(result).toEqual(authenticatedSession);
    });
  });

  describe("invalidateSessionCache", () => {
    it("deletes the cached session key", async () => {
      await invalidateSessionCache();

      expect(mocks.cacheDel).toHaveBeenCalledWith(
        expect.stringMatching(/^session:/)
      );
    });

    it("does nothing when no session cookie exists", async () => {
      mocks.cookieGet.mockReturnValue(undefined);

      await invalidateSessionCache();

      expect(mocks.cacheDel).not.toHaveBeenCalled();
    });

    it("does not throw on cache deletion error", async () => {
      mocks.cacheDel.mockRejectedValue(new Error("Redis down"));

      await expect(invalidateSessionCache()).resolves.toBeUndefined();
    });
  });
});
