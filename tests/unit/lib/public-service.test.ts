import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPublicProfile,
  getPublicListsForProfile,
  getPublicListDetail,
  invalidatePublicListCaches,
  publicListsCacheKey,
  publicListDetailCacheKey,
  PublicServiceError,
} from "@/lib/public";

// ─── Repository mock setup ────────────────────────────────────────────────────

const {
  mockGetPublicProfileBySlug,
  mockGetPublicListsForProfile,
  mockGetPublicListDetail,
  mockCachedQuery,
  mockInvalidateCache,
} = vi.hoisted(() => ({
  mockGetPublicProfileBySlug: vi.fn(),
  mockGetPublicListsForProfile: vi.fn(),
  mockGetPublicListDetail: vi.fn(),
  mockCachedQuery: vi.fn(),
  mockInvalidateCache: vi.fn(),
}));

vi.mock("@/db/repositories/public.repository", () => ({
  getPublicProfileBySlug: mockGetPublicProfileBySlug,
  getPublicListsForProfile: mockGetPublicListsForProfile,
  getPublicListDetail: mockGetPublicListDetail,
}));

vi.mock("@/lib/services/cache/helpers", () => ({
  cachedQuery: (...args: unknown[]) => mockCachedQuery(...args),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Keep React.cache as a pass-through so the service functions are directly awaitable
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: (fn: (...args: unknown[]) => unknown) => fn,
  };
});

// ─── Test data ────────────────────────────────────────────────────────────────

const USER_ID = "user-abc-123";
const LIST_ID = "list-xyz-456";
const PLACE_ID = "place-def-789";
const NOW = new Date("2024-06-01T00:00:00Z");
const VANITY_SLUG = "alice";
const LIST_SLUG = "top-10";

const profileRow = {
  id: USER_ID,
  name: "Alice Smith",
  bio: "Coffee lover",
  avatarUrl: null,
  vanitySlug: VANITY_SLUG,
};

const listSummaryRow = {
  id: LIST_ID,
  title: "Top 10 Coffee",
  slug: LIST_SLUG,
  description: "The best coffee",
  updatedAt: NOW,
  placeCount: 3,
};

const placeRow = {
  id: PLACE_ID,
  name: "The Coffee House",
  address: "1 Main St",
  description: null,
  heroImageUrl: null,
  position: 1,
};

const listDetailRow = {
  id: LIST_ID,
  title: "Top 10 Coffee",
  slug: LIST_SLUG,
  description: "The best coffee",
  updatedAt: NOW,
  places: [placeRow],
};

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Public Service", () => {
  // ───────────────────────────────────────────────────────────────────────────
  describe("getPublicProfile", () => {
    it("returns a profile when found", async () => {
      mockGetPublicProfileBySlug.mockResolvedValue(profileRow);

      const result = await getPublicProfile(VANITY_SLUG);

      expect(result).toEqual(profileRow);
    });

    it("returns null when no matching profile exists", async () => {
      mockGetPublicProfileBySlug.mockResolvedValue(null);

      const result = await getPublicProfile(VANITY_SLUG);

      expect(result).toBeNull();
    });

    it("returns null for a soft-deleted user (DB returns null — filtered by query)", async () => {
      // The repository filters deleted_at IS NULL at the query level;
      // the mock simulates the DB returning nothing for a deleted user.
      mockGetPublicProfileBySlug.mockResolvedValue(null);

      const result = await getPublicProfile(VANITY_SLUG);

      expect(result).toBeNull();
    });

    it("wraps DB errors in PublicServiceError", async () => {
      const cause = new Error("connection reset");
      mockGetPublicProfileBySlug.mockRejectedValue(cause);

      const err = await getPublicProfile(VANITY_SLUG).catch((e) => e);

      expect(err).toBeInstanceOf(PublicServiceError);
      expect(err.code).toBe("SERVICE_ERROR");
      expect(err.originalError).toBe(cause);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getPublicListsForProfile", () => {
    beforeEach(() => {
      // cachedQuery calls the fetcher, so we simulate that
      mockCachedQuery.mockImplementation(
        async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) =>
          fetcher()
      );
    });

    it("returns published list summaries for a user", async () => {
      mockGetPublicListsForProfile.mockResolvedValue([listSummaryRow]);

      const result = await getPublicListsForProfile(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe("Top 10 Coffee");
      expect(result[0]?.placeCount).toBe(3);
      expect(result[0]?.updatedAt).toEqual(NOW);
    });

    it("passes correct cache key and TTL to cachedQuery", async () => {
      mockGetPublicListsForProfile.mockResolvedValue([]);

      await getPublicListsForProfile(USER_ID);

      expect(mockCachedQuery).toHaveBeenCalledWith(
        `pub:lists:${USER_ID}`,
        86_400,
        expect.any(Function)
      );
    });

    it("returns empty array when user has no published lists", async () => {
      mockGetPublicListsForProfile.mockResolvedValue([]);

      const result = await getPublicListsForProfile(USER_ID);

      expect(result).toEqual([]);
    });

    it("wraps DB errors in PublicServiceError", async () => {
      const cause = new Error("query timeout");
      mockCachedQuery.mockRejectedValue(cause);

      const err = await getPublicListsForProfile(USER_ID).catch((e) => e);

      expect(err).toBeInstanceOf(PublicServiceError);
      expect(err.code).toBe("SERVICE_ERROR");
      expect(err.originalError).toBe(cause);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getPublicListDetail", () => {
    beforeEach(() => {
      mockCachedQuery.mockImplementation(
        async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) =>
          fetcher()
      );
    });

    it("returns list detail with places when found", async () => {
      mockGetPublicListDetail.mockResolvedValue(listDetailRow);

      const result = await getPublicListDetail({
        userId: USER_ID,
        listSlug: LIST_SLUG,
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(LIST_ID);
      expect(result?.title).toBe("Top 10 Coffee");
      expect(result?.places).toHaveLength(1);
      expect(result?.places[0]?.name).toBe("The Coffee House");
    });

    it("passes correct cache key and TTL to cachedQuery", async () => {
      mockGetPublicListDetail.mockResolvedValue(listDetailRow);

      await getPublicListDetail({
        userId: USER_ID,
        listSlug: LIST_SLUG,
      });

      expect(mockCachedQuery).toHaveBeenCalledWith(
        `pub:list:${USER_ID}:${LIST_SLUG}`,
        86_400,
        expect.any(Function)
      );
    });

    it("returns list detail with empty places array when list has no places", async () => {
      mockGetPublicListDetail.mockResolvedValue({
        ...listDetailRow,
        places: [],
      });

      const result = await getPublicListDetail({
        userId: USER_ID,
        listSlug: LIST_SLUG,
      });

      expect(result).not.toBeNull();
      expect(result?.places).toEqual([]);
    });

    it("returns null when list is not found", async () => {
      mockGetPublicListDetail.mockResolvedValue(null);

      const result = await getPublicListDetail({
        userId: USER_ID,
        listSlug: LIST_SLUG,
      });

      expect(result).toBeNull();
    });

    it("wraps DB errors in PublicServiceError", async () => {
      const cause = new Error("DB connection lost");
      mockCachedQuery.mockRejectedValue(cause);

      const err = await getPublicListDetail({
        userId: USER_ID,
        listSlug: LIST_SLUG,
      }).catch((e) => e);

      expect(err).toBeInstanceOf(PublicServiceError);
      expect(err.code).toBe("SERVICE_ERROR");
      expect(err.originalError).toBe(cause);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("cache key builders", () => {
    it("publicListsCacheKey builds correct key", () => {
      expect(publicListsCacheKey(USER_ID)).toBe(`pub:lists:${USER_ID}`);
    });

    it("publicListDetailCacheKey builds correct key", () => {
      expect(publicListDetailCacheKey(USER_ID, LIST_SLUG)).toBe(
        `pub:list:${USER_ID}:${LIST_SLUG}`
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("invalidatePublicListCaches", () => {
    it("invalidates summaries cache", async () => {
      mockInvalidateCache.mockResolvedValue(undefined);

      await invalidatePublicListCaches(USER_ID);

      expect(mockInvalidateCache).toHaveBeenCalledWith(`pub:lists:${USER_ID}`);
    });

    it("invalidates both summaries and detail cache when listSlug provided", async () => {
      mockInvalidateCache.mockResolvedValue(undefined);

      await invalidatePublicListCaches(USER_ID, LIST_SLUG);

      expect(mockInvalidateCache).toHaveBeenCalledWith(
        `pub:lists:${USER_ID}`,
        `pub:list:${USER_ID}:${LIST_SLUG}`
      );
    });
  });
});
