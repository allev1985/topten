import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPublicProfile,
  getPublicListsForProfile,
  getPublicListDetail,
  PublicServiceError,
} from "@/lib/public/service";

// ─── DB mock setup ────────────────────────────────────────────────────────────

let mockSelectRows: unknown[] = [];
let mockSelectRowsSequence: unknown[][] = [];
let mockSelectCallCount = 0;
let mockSelectError: unknown = null;

const { mockSelect } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
  },
}));

// React.cache is a pass-through in test environments (no Next.js request context)
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

// ─── Fluent chain builder ─────────────────────────────────────────────────────

/**
 * Builds a thenable Drizzle-like chain node that resolves through all
 * chained methods (.from, .where, .limit, .leftJoin, .innerJoin,
 * .groupBy, .orderBy) before producing the final result.
 */
function makeThenableChain(resolveWith: () => unknown): Record<string, unknown> {
  const asPromise = () => Promise.resolve(resolveWith());
  const node: Record<string, unknown> = {
    then: (
      onFulfilled?: (v: unknown) => unknown,
      onRejected?: (e: unknown) => unknown
    ) => asPromise().then(onFulfilled, onRejected),
    catch: (onRejected?: (e: unknown) => unknown) =>
      asPromise().catch(onRejected),
    finally: (onFinally?: () => void) => asPromise().finally(onFinally),
    where: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    limit: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    orderBy: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    groupBy: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    leftJoin: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
    innerJoin: vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith)),
  };
  return node;
}

function makeSelectChain(resolveWith: () => unknown) {
  const from = vi.fn((..._args: unknown[]) => makeThenableChain(resolveWith));
  return { from };
}

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

const listHeaderRow = {
  id: LIST_ID,
  title: "Top 10 Coffee",
  slug: LIST_SLUG,
  description: "The best coffee",
  updatedAt: NOW,
};

const placeRow = {
  id: PLACE_ID,
  name: "The Coffee House",
  address: "1 Main St",
  description: null,
  heroImageUrl: null,
  position: 1,
};

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectRows = [];
  mockSelectRowsSequence = [];
  mockSelectCallCount = 0;
  mockSelectError = null;

  mockSelect.mockImplementation(() => {
    const callIndex = mockSelectCallCount++;
    const chain = makeSelectChain(() => {
      if (mockSelectError) return Promise.reject(mockSelectError);
      if (mockSelectRowsSequence.length > callIndex) {
        return Promise.resolve(mockSelectRowsSequence[callIndex]);
      }
      return Promise.resolve(mockSelectRows);
    });
    return { from: chain.from };
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Public Service", () => {
  // ───────────────────────────────────────────────────────────────────────────
  describe("getPublicProfile", () => {
    it("returns a profile when found", async () => {
      mockSelectRows = [profileRow];
      const result = await getPublicProfile(VANITY_SLUG);
      expect(result).toEqual(profileRow);
    });

    it("returns null when no matching profile exists", async () => {
      mockSelectRows = [];
      const result = await getPublicProfile(VANITY_SLUG);
      expect(result).toBeNull();
    });

    it("returns null for a soft-deleted user (DB returns empty — filtered by query)", async () => {
      // The service filters deleted_at IS NULL at the query level;
      // the mock simulates the DB returning nothing for a deleted user.
      mockSelectRows = [];
      const result = await getPublicProfile(VANITY_SLUG);
      expect(result).toBeNull();
    });

    it("wraps DB errors in PublicServiceError", async () => {
      const cause = new Error("connection reset");
      mockSelectError = cause;
      const err = await getPublicProfile(VANITY_SLUG).catch((e) => e);
      expect(err).toBeInstanceOf(PublicServiceError);
      expect(err.code).toBe("SERVICE_ERROR");
      expect(err.originalError).toBe(cause);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getPublicListsForProfile", () => {
    it("returns published list summaries for a user", async () => {
      mockSelectRows = [listSummaryRow];
      const result = await getPublicListsForProfile(USER_ID);
      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe("Top 10 Coffee");
      expect(result[0]?.placeCount).toBe(3);
      expect(result[0]?.updatedAt).toEqual(NOW);
    });

    it("returns empty array when user has no published lists", async () => {
      mockSelectRows = [];
      const result = await getPublicListsForProfile(USER_ID);
      expect(result).toEqual([]);
    });

    it("returns empty array when user has no published lists (DB filters is_published = true)", async () => {
      // Unpublished lists are excluded by the is_published = true filter at DB level.
      // The mock simulates the DB returning nothing for unpublished lists.
      mockSelectRows = [];
      const result = await getPublicListsForProfile(USER_ID);
      expect(result).toEqual([]);
    });

    it("wraps DB errors in PublicServiceError", async () => {
      const cause = new Error("query timeout");
      mockSelectError = cause;
      const err = await getPublicListsForProfile(USER_ID).catch((e) => e);
      expect(err).toBeInstanceOf(PublicServiceError);
      expect(err.code).toBe("SERVICE_ERROR");
      expect(err.originalError).toBe(cause);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("getPublicListDetail", () => {
    it("returns list detail with places when found", async () => {
      // First select: list header; second select: place rows
      mockSelectRowsSequence = [[listHeaderRow], [placeRow]];
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

    it("returns list detail with empty places array when list has no places", async () => {
      mockSelectRowsSequence = [[listHeaderRow], []];
      const result = await getPublicListDetail({
        userId: USER_ID,
        listSlug: LIST_SLUG,
      });
      expect(result).not.toBeNull();
      expect(result?.places).toEqual([]);
    });

    it("returns null when list is not found", async () => {
      // First select returns empty (list not found or not published)
      mockSelectRowsSequence = [[]];
      const result = await getPublicListDetail({
        userId: USER_ID,
        listSlug: LIST_SLUG,
      });
      expect(result).toBeNull();
    });

    it("returns null when list exists but is not published (DB returns empty — filtered by query)", async () => {
      // The service filters is_published = true at the query level
      mockSelectRowsSequence = [[]];
      const result = await getPublicListDetail({
        userId: USER_ID,
        listSlug: LIST_SLUG,
      });
      expect(result).toBeNull();
    });

    it("returns null when list is soft-deleted (DB returns empty — filtered by query)", async () => {
      // The service filters deleted_at IS NULL at the query level
      mockSelectRowsSequence = [[]];
      const result = await getPublicListDetail({
        userId: USER_ID,
        listSlug: LIST_SLUG,
      });
      expect(result).toBeNull();
    });

    it("wraps DB errors in PublicServiceError", async () => {
      const cause = new Error("DB connection lost");
      mockSelectError = cause;
      const err = await getPublicListDetail({ userId: USER_ID, listSlug: LIST_SLUG }).catch((e) => e);
      expect(err).toBeInstanceOf(PublicServiceError);
      expect(err.code).toBe("SERVICE_ERROR");
      expect(err.originalError).toBe(cause);
    });
  });
});
