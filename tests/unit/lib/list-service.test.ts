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

// ─── DB mock setup ────────────────────────────────────────────────────────────

// Fluent chain stubs — values controlled per test via these vars
let mockSelectRows: unknown[] = [];
let mockInsertRows: unknown[] = [];
let mockUpdateRows: unknown[] = [];
let mockInsertError: unknown = null;
let mockUpdateError: unknown = null;
let mockSelectError: unknown = null;

// Hoist mocks so they are available when vi.mock factory runs
const { mockSelect, mockInsert, mockUpdate } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
}));

const mockOrderBy = vi.fn();
const mockSelectWhere = vi.fn();
const mockFrom = vi.fn();

const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn();

const mockUpdateReturning = vi.fn();
const mockUpdateWhere = vi.fn();
const mockSet = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  },
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const USER_ID = "user-abc-123";
const LIST_ID = "list-xyz-456";
const NOW = new Date("2024-01-01T00:00:00Z");

const listSummaryRow = {
  id: LIST_ID,
  title: "My Top 10",
  slug: "a1b2",
  isPublished: false,
  createdAt: NOW,
};

const fullListRow = {
  ...listSummaryRow,
  userId: USER_ID,
  description: null,
  publishedAt: null,
  updatedAt: NOW,
  deletedAt: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setSelectResult(rows: unknown[]) {
  mockSelectRows = rows;
}

function setInsertResult(rows: unknown[]) {
  mockInsertRows = rows;
}

function setUpdateResult(rows: unknown[]) {
  mockUpdateRows = rows;
}

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectRows = [];
  mockInsertRows = [];
  mockUpdateRows = [];
  mockInsertError = null;
  mockUpdateError = null;
  mockSelectError = null;

  // select chain
  mockOrderBy.mockImplementation(() => {
    if (mockSelectError) return Promise.reject(mockSelectError);
    return Promise.resolve(mockSelectRows);
  });
  mockSelectWhere.mockReturnValue({ orderBy: mockOrderBy });
  mockFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelect.mockReturnValue({ from: mockFrom });

  // insert chain
  mockInsertReturning.mockImplementation(() => {
    if (mockInsertError) return Promise.reject(mockInsertError);
    return Promise.resolve(mockInsertRows);
  });
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockInsert.mockReturnValue({ values: mockInsertValues });

  // update chain
  mockUpdateReturning.mockImplementation(() => {
    if (mockUpdateError) return Promise.reject(mockUpdateError);
    return Promise.resolve(mockUpdateRows);
  });
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("List Service", () => {
  // ───────────────────────────────────────────────────────────────────────────
  describe("getListsByUser", () => {
    it("returns list summaries for the user", async () => {
      setSelectResult([listSummaryRow]);
      const result = await getListsByUser(USER_ID);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(listSummaryRow);
    });

    it("returns empty array when user has no lists", async () => {
      setSelectResult([]);
      const result = await getListsByUser(USER_ID);
      expect(result).toEqual([]);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockSelectError = new Error("connection reset");
      await expect(getListsByUser(USER_ID)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("createList", () => {
    it("creates a list and returns it", async () => {
      setInsertResult([fullListRow]);
      const result = await createList({ userId: USER_ID, title: "My Top 10" });
      expect(result.list.id).toBe(LIST_ID);
      expect(result.list.userId).toBe(USER_ID);
      expect(result.list.title).toBe("My Top 10");
    });

    it("retries on unique-constraint violation (slug collision) and succeeds", async () => {
      let callCount = 0;
      mockInsertReturning.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          const err = Object.assign(new Error("duplicate key"), { code: "23505" });
          return Promise.reject(err);
        }
        return Promise.resolve([fullListRow]);
      });

      const result = await createList({ userId: USER_ID, title: "My Top 10" });
      expect(result.list.id).toBe(LIST_ID);
      expect(callCount).toBe(2);
    });

    it("throws SLUG_COLLISION after two consecutive unique violations", async () => {
      const uniqueErr = Object.assign(new Error("duplicate key"), {
        code: "23505",
      });
      mockInsertReturning.mockRejectedValue(uniqueErr);

      await expect(
        createList({ userId: USER_ID, title: "My Top 10" })
      ).rejects.toMatchObject({ code: "SLUG_COLLISION" });
    });

    it("throws SERVICE_ERROR on non-unique DB failure", async () => {
      mockInsertError = new Error("connection reset");
      await expect(
        createList({ userId: USER_ID, title: "My Top 10" })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });

    it("generates a slug string of 4 characters", async () => {
      let capturedSlug: string | undefined;
      mockInsertValues.mockImplementation(
        (values: { slug: string }) => {
          capturedSlug = values.slug;
          return { returning: mockInsertReturning };
        }
      );
      setInsertResult([fullListRow]);

      await createList({ userId: USER_ID, title: "My Top 10" });

      expect(capturedSlug).toBeDefined();
      expect(capturedSlug).toHaveLength(4);
      expect(capturedSlug).toMatch(/^[0-9a-f]{4}$/);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("updateList", () => {
    it("updates title and returns updated list", async () => {
      const updatedRow = { id: LIST_ID, title: "New Title", description: null, updatedAt: NOW };
      setUpdateResult([updatedRow]);

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
      setUpdateResult([updatedRow]);

      const result = await updateList({
        listId: LIST_ID,
        userId: USER_ID,
        description: "A great list",
      });

      expect(result.list.description).toBe("A great list");
    });

    it("throws NOT_FOUND when DB returns no rows (wrong owner / deleted)", async () => {
      setUpdateResult([]);
      await expect(
        updateList({ listId: LIST_ID, userId: USER_ID, title: "X" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on unexpected DB failure", async () => {
      mockUpdateError = new Error("connection reset");
      await expect(
        updateList({ listId: LIST_ID, userId: USER_ID, title: "X" })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("deleteList", () => {
    it("soft-deletes the list and returns success", async () => {
      setUpdateResult([{ id: LIST_ID }]);
      const result = await deleteList({ listId: LIST_ID, userId: USER_ID });
      expect(result.success).toBe(true);
    });

    it("throws NOT_FOUND when list is missing or already deleted", async () => {
      setUpdateResult([]);
      await expect(
        deleteList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on unexpected DB failure", async () => {
      mockUpdateError = new Error("DB down");
      await expect(
        deleteList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("publishList", () => {
    it("publishes the list and returns updated status", async () => {
      const row = { id: LIST_ID, isPublished: true, publishedAt: NOW };
      setUpdateResult([row]);

      const result = await publishList({ listId: LIST_ID, userId: USER_ID });
      expect(result.list.isPublished).toBe(true);
      expect(result.list.publishedAt).toEqual(NOW);
    });

    it("throws NOT_FOUND when list is missing, deleted, or wrong owner", async () => {
      setUpdateResult([]);
      await expect(
        publishList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on unexpected DB failure", async () => {
      mockUpdateError = new Error("DB down");
      await expect(
        publishList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("unpublishList", () => {
    it("unpublishes the list and clears publishedAt", async () => {
      const row = { id: LIST_ID, isPublished: false, publishedAt: null };
      setUpdateResult([row]);

      const result = await unpublishList({ listId: LIST_ID, userId: USER_ID });
      expect(result.list.isPublished).toBe(false);
      expect(result.list.publishedAt).toBeNull();
    });

    it("throws NOT_FOUND when list is missing, deleted, or wrong owner", async () => {
      setUpdateResult([]);
      await expect(
        unpublishList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws SERVICE_ERROR on unexpected DB failure", async () => {
      mockUpdateError = new Error("DB down");
      await expect(
        unpublishList({ listId: LIST_ID, userId: USER_ID })
      ).rejects.toMatchObject({ code: "SERVICE_ERROR" });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe("ListServiceError", () => {
    it("notFoundError is instance of ListServiceError with NOT_FOUND code", async () => {
      setUpdateResult([]);
      try {
        await deleteList({ listId: LIST_ID, userId: USER_ID });
      } catch (err) {
        expect(err).toBeInstanceOf(ListServiceError);
        expect((err as ListServiceError).code).toBe("NOT_FOUND");
      }
    });

    it("SERVICE_ERROR wraps the original error as originalError", async () => {
      const original = new Error("raw DB error");
      mockUpdateError = original;
      try {
        await deleteList({ listId: LIST_ID, userId: USER_ID });
      } catch (err) {
        expect(err).toBeInstanceOf(ListServiceError);
        expect((err as ListServiceError).originalError).toBe(original);
      }
    });
  });
});
