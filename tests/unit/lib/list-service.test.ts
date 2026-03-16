import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getListsByUser,
  createList,
  updateList,
  deleteList,
  publishList,
  unpublishList,
  ListServiceError,
} from "@/lib/list/service";

// ─── Repository mock setup ────────────────────────────────────────────────────

const {
  mockGetListsByUser,
  mockInsertList,
  mockUpdateList,
  mockSoftDeleteList,
  mockPublishList,
  mockUnpublishList,
  mockGetVanitySlugByUserId,
} = vi.hoisted(() => ({
  mockGetListsByUser: vi.fn(),
  mockInsertList: vi.fn(),
  mockUpdateList: vi.fn(),
  mockSoftDeleteList: vi.fn(),
  mockPublishList: vi.fn(),
  mockUnpublishList: vi.fn(),
  mockGetVanitySlugByUserId: vi.fn(),
}));

vi.mock("@/db/repositories/list.repository", () => ({
  getListsByUser: mockGetListsByUser,
  insertList: mockInsertList,
  updateList: mockUpdateList,
  softDeleteList: mockSoftDeleteList,
  publishList: mockPublishList,
  unpublishList: mockUnpublishList,
}));

vi.mock("@/db/repositories/user.repository", () => ({
  getVanitySlugByUserId: mockGetVanitySlugByUserId,
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const USER_ID = "user-abc-123";
const LIST_ID = "list-xyz-456";
const NOW = new Date("2024-01-01T00:00:00Z");
const VANITY_SLUG = "alice";

const listSummaryRow = {
  id: LIST_ID,
  title: "My Top 10",
  slug: "a1b2",
  isPublished: false,
  createdAt: NOW,
  placeCount: 0,
};

const fullListRow = {
  id: LIST_ID,
  userId: USER_ID,
  title: "My Top 10",
  slug: "a1b2",
  description: null,
  isPublished: false,
  publishedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // sensible defaults
  mockGetVanitySlugByUserId.mockResolvedValue(VANITY_SLUG);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("List Service", () => {
  // ───────────────────────────────────────────────────────────────────────────
  describe("getListsByUser", () => {
    it("returns list summaries for the user", async () => {
      mockGetListsByUser.mockResolvedValue([listSummaryRow]);

      const result = await getListsByUser(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(listSummaryRow);
    });

    it("returns empty array when user has no lists", async () => {
      mockGetListsByUser.mockResolvedValue([]);

      const result = await getListsByUser(USER_ID);

      expect(result).toEqual([]);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetListsByUser.mockRejectedValue(new Error("connection reset"));

      await expect(getListsByUser(USER_ID)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("createList", () => {
    it("creates a list with a 4-character hex slug", async () => {
      let capturedSlug: string | undefined;
      mockInsertList.mockImplementation((values: { slug: string }) => {
        capturedSlug = values.slug;
        return Promise.resolve({ ...fullListRow, slug: values.slug });
      });

      await createList({ userId: USER_ID, title: "My Top 10" });

      expect(capturedSlug).toBeDefined();
      expect(capturedSlug).toHaveLength(4);
      expect(capturedSlug).toMatch(/^[0-9a-f]{4}$/);
    });

    it("returns the created list", async () => {
      mockInsertList.mockResolvedValue(fullListRow);

      const result = await createList({ userId: USER_ID, title: "My Top 10" });

      expect(result.list.id).toBe(LIST_ID);
      expect(result.list.title).toBe("My Top 10");
    });

    it("generates a slug string of 4 characters", async () => {
      let capturedSlug: string | undefined;
      mockInsertList.mockImplementation((values: { slug: string }) => {
        capturedSlug = values.slug;
        return Promise.resolve({ ...fullListRow, slug: values.slug });
      });

      await createList({ userId: USER_ID, title: "My Top 10" });

      expect(capturedSlug).toBeDefined();
      expect(capturedSlug).toHaveLength(4);
      expect(capturedSlug).toMatch(/^[0-9a-f]{4}$/);
    });

    it("retries on first unique-violation and returns the list on success", async () => {
      const uniqueViolation = Object.assign(new Error("unique"), { code: "23505" });
      mockInsertList
        .mockRejectedValueOnce(uniqueViolation)
        .mockResolvedValueOnce(fullListRow);

      const result = await createList({ userId: USER_ID, title: "My Top 10" });

      expect(mockInsertList).toHaveBeenCalledTimes(2);
      expect(result.list.id).toBe(LIST_ID);
    });

    it("throws SLUG_COLLISION when both attempts hit a unique-violation", async () => {
      const uniqueViolation = Object.assign(new Error("unique"), { code: "23505" });
      mockInsertList.mockRejectedValue(uniqueViolation);

      await expect(
        createList({ userId: USER_ID, title: "My Top 10" })
      ).rejects.toMatchObject({ code: "SLUG_COLLISION" });

      expect(mockInsertList).toHaveBeenCalledTimes(2);
    });

    it("throws SERVICE_ERROR immediately on a non-unique DB error (no retry)", async () => {
      mockInsertList.mockRejectedValue(new Error("connection reset"));

      await expect(
        createList({ userId: USER_ID, title: "My Top 10" })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });

      expect(mockInsertList).toHaveBeenCalledTimes(1);
    });

    it("throws SERVICE_ERROR when retry fails with a non-unique DB error", async () => {
      const uniqueViolation = Object.assign(new Error("unique"), { code: "23505" });
      mockInsertList
        .mockRejectedValueOnce(uniqueViolation)
        .mockRejectedValueOnce(new Error("deadlock detected"));

      await expect(
        createList({ userId: USER_ID, title: "My Top 10" })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });

      expect(mockInsertList).toHaveBeenCalledTimes(2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("updateList", () => {
    it("updates title and returns updated list", async () => {
      const updatedRow = { id: LIST_ID, title: "New Title", description: null, updatedAt: NOW };
      mockUpdateList.mockResolvedValue(updatedRow);

      const result = await updateList({
        listId: LIST_ID,
        userId: USER_ID,
        title: "New Title",
      });

      expect(result.list.title).toBe("New Title");
    });

    it("updates description and returns updated list", async () => {
      const updatedRow = {
        id: LIST_ID,
        title: "My Top 10",
        description: "A great list",
        updatedAt: NOW,
      };
      mockUpdateList.mockResolvedValue(updatedRow);

      const result = await updateList({
        listId: LIST_ID,
        userId: USER_ID,
        description: "A great list",
      });

      expect(result.list.description).toBe("A great list");
    });

    it("throws NOT_FOUND when DB returns no rows (wrong owner / deleted)", async () => {
      mockUpdateList.mockResolvedValue(null);

      await expect(
        updateList({ listId: LIST_ID, userId: USER_ID, title: "X" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on unexpected DB failure", async () => {
      mockUpdateList.mockRejectedValue(new Error("connection reset"));

      await expect(
        updateList({ listId: LIST_ID, userId: USER_ID, title: "X" })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("deleteList", () => {
    it("soft-deletes the list and returns success", async () => {
      mockSoftDeleteList.mockResolvedValue({ id: LIST_ID });

      const result = await deleteList({ listId: LIST_ID, userId: USER_ID });

      expect(result.success).toBe(true);
    });

    it("throws NOT_FOUND when list is missing or already deleted", async () => {
      mockSoftDeleteList.mockResolvedValue(null);

      await expect(
        deleteList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on unexpected DB failure", async () => {
      mockSoftDeleteList.mockRejectedValue(new Error("DB down"));

      await expect(
        deleteList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("publishList", () => {
    it("publishes the list and returns updated status", async () => {
      const row = { id: LIST_ID, isPublished: true, publishedAt: NOW, slug: "a1b2" };
      mockPublishList.mockResolvedValue(row);

      const result = await publishList({ listId: LIST_ID, userId: USER_ID });

      expect(result.list.isPublished).toBe(true);
      expect(result.list.publishedAt).toEqual(NOW);
      expect(result.list.slug).toBe("a1b2");
    });

    it("throws NOT_FOUND when list is missing, deleted, or wrong owner", async () => {
      mockPublishList.mockResolvedValue(null);

      await expect(
        publishList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on unexpected DB failure", async () => {
      mockPublishList.mockRejectedValue(new Error("DB down"));

      await expect(
        publishList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("unpublishList", () => {
    it("unpublishes the list and clears publishedAt", async () => {
      const row = { id: LIST_ID, isPublished: false, publishedAt: null, slug: "a1b2" };
      mockUnpublishList.mockResolvedValue(row);

      const result = await unpublishList({ listId: LIST_ID, userId: USER_ID });

      expect(result.list.isPublished).toBe(false);
      expect(result.list.publishedAt).toBeNull();
      expect(result.list.slug).toBe("a1b2");
    });

    it("throws NOT_FOUND when list is missing, deleted, or wrong owner", async () => {
      mockUnpublishList.mockResolvedValue(null);

      await expect(
        unpublishList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on unexpected DB failure", async () => {
      mockUnpublishList.mockRejectedValue(new Error("DB down"));

      await expect(
        unpublishList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("ListServiceError", () => {
    it("notFoundError is instance of ListServiceError with NOT_FOUND code", async () => {
      mockSoftDeleteList.mockResolvedValue(null);
      try {
        await deleteList({ listId: LIST_ID, userId: USER_ID });
      } catch (err) {
        expect(err).toBeInstanceOf(ListServiceError);
        expect((err as ListServiceError).code).toBe("NOT_FOUND");
      }
    });

    it("SERVICE_ERROR wraps the original error as originalError", async () => {
      const original = new Error("raw DB error");
      mockSoftDeleteList.mockRejectedValue(original);
      try {
        await deleteList({ listId: LIST_ID, userId: USER_ID });
      } catch (err) {
        expect(err).toBeInstanceOf(ListServiceError);
        expect((err as ListServiceError).originalError).toBe(original);
      }
    });
  });
});
