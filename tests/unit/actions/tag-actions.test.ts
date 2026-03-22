import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const {
  mockRequireAuth,
  mockSearchTags,
  mockCreateTag,
  mockSetListTags,
  mockSetPlaceTags,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockSearchTags: vi.fn(),
  mockCreateTag: vi.fn(),
  mockSetListTags: vi.fn(),
  mockSetPlaceTags: vi.fn(),
}));

vi.mock("@/lib/utils/actions", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("@/lib/tag", () => ({
  searchTags: mockSearchTags,
  createTag: mockCreateTag,
  setListTags: mockSetListTags,
  setPlaceTags: mockSetPlaceTags,
  TagServiceError: class TagServiceError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = "TagServiceError";
    }
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Dynamic import to apply mocks
const {
  searchTagsAction,
  createTagAction,
  setListTagsAction,
  setPlaceTagsAction,
} = await import("@/actions/tag-actions");
const { TagServiceError } = await import("@/lib/tag");

// ─── Test data ────────────────────────────────────────────────────────────────

const USER_ID = "user-abc-123";
const TAG_ID = "tag-abc-123";
const LIST_ID = "550e8400-e29b-41d4-a716-446655440000";
const PLACE_ID = "660e8400-e29b-41d4-a716-446655440001";
const NOW = new Date("2024-01-01T00:00:00Z");

const initialState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
};

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({
    userId: USER_ID,
    email: "test@test.com",
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Tag Actions", () => {
  // ─── searchTagsAction ─────────────────────────────────────────────────────
  describe("searchTagsAction", () => {
    it("returns matching tags on success", async () => {
      const tags = [{ id: TAG_ID, name: "cafe", source: "system" as const }];
      mockSearchTags.mockResolvedValue(tags);

      const result = await searchTagsAction("caf");

      expect(result.isSuccess).toBe(true);
      expect(result.data?.tags).toEqual(tags);
    });

    it("returns error when not authenticated", async () => {
      mockRequireAuth.mockResolvedValue({ error: "Not authenticated" });

      const result = await searchTagsAction("caf");

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Not authenticated");
    });

    it("returns field errors for empty query", async () => {
      const result = await searchTagsAction("");

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors).toHaveProperty("query");
    });

    it("handles service errors gracefully", async () => {
      mockSearchTags.mockRejectedValue(new Error("DB error"));

      const result = await searchTagsAction("caf");

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("Failed to search tags");
    });

    it("returns TagServiceError message when thrown", async () => {
      mockSearchTags.mockRejectedValue(
        new TagServiceError("SERVICE_ERROR", "Custom error")
      );

      const result = await searchTagsAction("caf");

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Custom error");
    });
  });

  // ─── createTagAction ──────────────────────────────────────────────────────
  describe("createTagAction", () => {
    it("creates a tag on success", async () => {
      mockCreateTag.mockResolvedValue({
        tag: { id: TAG_ID, name: "cafe", source: "custom", createdAt: NOW },
      });

      const fd = new FormData();
      fd.set("name", "cafe");

      const result = await createTagAction(initialState, fd);

      expect(result.isSuccess).toBe(true);
      expect(result.data?.tagId).toBe(TAG_ID);
      expect(result.data?.name).toBe("cafe");
    });

    it("returns error when not authenticated", async () => {
      mockRequireAuth.mockResolvedValue({ error: "Not authenticated" });

      const fd = new FormData();
      fd.set("name", "cafe");

      const result = await createTagAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Not authenticated");
    });

    it("returns field errors for invalid name", async () => {
      const fd = new FormData();
      fd.set("name", "a");

      const result = await createTagAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors).toHaveProperty("name");
    });

    it("handles duplicate tag error", async () => {
      mockCreateTag.mockRejectedValue(
        new TagServiceError("DUPLICATE_TAG", "Tag already exists")
      );

      const fd = new FormData();
      fd.set("name", "cafe");

      const result = await createTagAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Tag already exists");
    });
  });

  // ─── setListTagsAction ────────────────────────────────────────────────────
  describe("setListTagsAction", () => {
    it("sets list tags on success", async () => {
      const tags = [{ id: TAG_ID, name: "cafe", source: "system" as const }];
      mockSetListTags.mockResolvedValue({ listId: LIST_ID, tags });

      const fd = new FormData();
      fd.set("listId", LIST_ID);
      fd.set("tagNames", JSON.stringify(["cafe"]));

      const result = await setListTagsAction(initialState, fd);

      expect(result.isSuccess).toBe(true);
      expect(result.data?.listId).toBe(LIST_ID);
      expect(result.data?.tags).toEqual(tags);
    });

    it("returns error when not authenticated", async () => {
      mockRequireAuth.mockResolvedValue({ error: "Not authenticated" });

      const fd = new FormData();
      fd.set("listId", LIST_ID);
      fd.set("tagNames", "[]");

      const result = await setListTagsAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Not authenticated");
    });

    it("returns error for invalid JSON tagNames", async () => {
      const fd = new FormData();
      fd.set("listId", LIST_ID);
      fd.set("tagNames", "not-json");

      const result = await setListTagsAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Invalid tag names format.");
    });

    it("returns field errors for invalid listId", async () => {
      const fd = new FormData();
      fd.set("listId", "not-a-uuid");
      fd.set("tagNames", "[]");

      const result = await setListTagsAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
      expect(Object.keys(result.fieldErrors).length).toBeGreaterThan(0);
    });

    it("handles service error", async () => {
      mockSetListTags.mockRejectedValue(new Error("DB error"));

      const fd = new FormData();
      fd.set("listId", LIST_ID);
      fd.set("tagNames", JSON.stringify(["cafe"]));

      const result = await setListTagsAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toContain("Failed to update tags");
    });
  });

  // ─── setPlaceTagsAction ───────────────────────────────────────────────────
  describe("setPlaceTagsAction", () => {
    it("sets place tags on success", async () => {
      const tags = [{ id: TAG_ID, name: "cafe", source: "system" as const }];
      mockSetPlaceTags.mockResolvedValue({ placeId: PLACE_ID, tags });

      const fd = new FormData();
      fd.set("placeId", PLACE_ID);
      fd.set("tagNames", JSON.stringify(["cafe"]));

      const result = await setPlaceTagsAction(initialState, fd);

      expect(result.isSuccess).toBe(true);
      expect(result.data?.placeId).toBe(PLACE_ID);
      expect(result.data?.tags).toEqual(tags);
    });

    it("returns error when not authenticated", async () => {
      mockRequireAuth.mockResolvedValue({ error: "Not authenticated" });

      const fd = new FormData();
      fd.set("placeId", PLACE_ID);
      fd.set("tagNames", "[]");

      const result = await setPlaceTagsAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
    });

    it("returns error for invalid JSON tagNames", async () => {
      const fd = new FormData();
      fd.set("placeId", PLACE_ID);
      fd.set("tagNames", "bad");

      const result = await setPlaceTagsAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Invalid tag names format.");
    });

    it("handles service error", async () => {
      mockSetPlaceTags.mockRejectedValue(
        new TagServiceError("SERVICE_ERROR", "DB failure")
      );

      const fd = new FormData();
      fd.set("placeId", PLACE_ID);
      fd.set("tagNames", JSON.stringify(["cafe"]));

      const result = await setPlaceTagsAction(initialState, fd);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("DB failure");
    });
  });
});
