import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchTags,
  getTagsByList,
  getTagsByPlace,
  createTag,
  setListTags,
  setPlaceTags,
  seedSystemTags,
  normaliseTagName,
  isValidTagName,
  TagServiceError,
} from "@/lib/tag";

// ─── Repository mock setup ────────────────────────────────────────────────────

const {
  mockSearchTags,
  mockGetTagByName,
  mockGetTagsByIds,
  mockInsertTag,
  mockUpsertTag,
  mockGetTagsByList,
  mockSetListTags,
  mockGetTagsByPlace,
  mockSetPlaceTags,
} = vi.hoisted(() => ({
  mockSearchTags: vi.fn(),
  mockGetTagByName: vi.fn(),
  mockGetTagsByIds: vi.fn(),
  mockInsertTag: vi.fn(),
  mockUpsertTag: vi.fn(),
  mockGetTagsByList: vi.fn(),
  mockSetListTags: vi.fn(),
  mockGetTagsByPlace: vi.fn(),
  mockSetPlaceTags: vi.fn(),
}));

vi.mock("@/db/repositories/tag.repository", () => ({
  searchTags: mockSearchTags,
  getTagByName: mockGetTagByName,
  getTagsByIds: mockGetTagsByIds,
  insertTag: mockInsertTag,
  upsertTag: mockUpsertTag,
  getTagsByList: mockGetTagsByList,
  setListTags: mockSetListTags,
  getTagsByPlace: mockGetTagsByPlace,
  setPlaceTags: mockSetPlaceTags,
}));

// ─── Test data ────────────────────────────────────────────────────────────────

const TAG_ID = "tag-abc-123";
const LIST_ID = "list-xyz-456";
const PLACE_ID = "place-xyz-789";
const NOW = new Date("2024-01-01T00:00:00Z");

const cafeTag = {
  id: TAG_ID,
  name: "cafe",
  source: "system" as const,
  createdAt: NOW,
};

const customTag = {
  id: "tag-def-456",
  name: "vegan-friendly",
  source: "custom" as const,
  createdAt: NOW,
};

const tagSummary = { id: TAG_ID, name: "cafe", source: "system" as const };
const customTagSummary = {
  id: "tag-def-456",
  name: "vegan-friendly",
  source: "custom" as const,
};

// ─── beforeEach ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Tag Service", () => {
  // ─── normaliseTagName ─────────────────────────────────────────────────────
  describe("normaliseTagName", () => {
    it("converts to lowercase", () => {
      expect(normaliseTagName("CAFE")).toBe("cafe");
    });

    it("replaces underscores with hyphens", () => {
      expect(normaliseTagName("hair_care")).toBe("hair-care");
    });

    it("replaces spaces with hyphens", () => {
      expect(normaliseTagName("hair care")).toBe("hair-care");
    });

    it("removes invalid characters", () => {
      expect(normaliseTagName("café!")).toBe("caf");
    });

    it("collapses multiple hyphens", () => {
      expect(normaliseTagName("foo---bar")).toBe("foo-bar");
    });

    it("trims leading and trailing hyphens", () => {
      expect(normaliseTagName("-foo-bar-")).toBe("foo-bar");
    });

    it("trims whitespace", () => {
      expect(normaliseTagName("  cafe  ")).toBe("cafe");
    });

    it("handles empty string", () => {
      expect(normaliseTagName("")).toBe("");
    });
  });

  // ─── isValidTagName ───────────────────────────────────────────────────────
  describe("isValidTagName", () => {
    it("accepts valid tag name", () => {
      expect(isValidTagName("cafe")).toBe(true);
    });

    it("accepts hyphenated name", () => {
      expect(isValidTagName("hair-care")).toBe(true);
    });

    it("accepts names with numbers", () => {
      expect(isValidTagName("top10")).toBe(true);
    });

    it("rejects single character", () => {
      expect(isValidTagName("a")).toBe(false);
    });

    it("rejects names starting with hyphen", () => {
      expect(isValidTagName("-cafe")).toBe(false);
    });

    it("rejects names ending with hyphen", () => {
      expect(isValidTagName("cafe-")).toBe(false);
    });

    it("rejects uppercase", () => {
      expect(isValidTagName("Cafe")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidTagName("")).toBe(false);
    });

    it("accepts two-character name", () => {
      expect(isValidTagName("ab")).toBe(true);
    });

    it("accepts 50-character name", () => {
      const name = "a" + "b".repeat(48) + "c";
      expect(isValidTagName(name)).toBe(true);
    });

    it("rejects 51-character name", () => {
      const name = "a" + "b".repeat(49) + "c";
      expect(isValidTagName(name)).toBe(false);
    });
  });

  // ─── searchTags ───────────────────────────────────────────────────────────
  describe("searchTags", () => {
    it("returns matching tags", async () => {
      mockSearchTags.mockResolvedValue([tagSummary]);

      const result = await searchTags("caf");

      expect(result).toEqual([tagSummary]);
      expect(mockSearchTags).toHaveBeenCalledWith("caf", 20);
    });

    it("returns empty array for empty normalised query", async () => {
      const result = await searchTags("   ");
      expect(result).toEqual([]);
      expect(mockSearchTags).not.toHaveBeenCalled();
    });

    it("normalises query before searching", async () => {
      mockSearchTags.mockResolvedValue([]);

      await searchTags("HAIR CARE");

      expect(mockSearchTags).toHaveBeenCalledWith("hair-care", 20);
    });

    it("respects custom limit", async () => {
      mockSearchTags.mockResolvedValue([]);

      await searchTags("caf", 5);

      expect(mockSearchTags).toHaveBeenCalledWith("caf", 5);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockSearchTags.mockRejectedValue(new Error("connection reset"));

      await expect(searchTags("caf")).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ─── getTagsByList ────────────────────────────────────────────────────────
  describe("getTagsByList", () => {
    it("returns tags for a list", async () => {
      mockGetTagsByList.mockResolvedValue([tagSummary, customTagSummary]);

      const result = await getTagsByList(LIST_ID);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(tagSummary);
    });

    it("returns empty array when list has no tags", async () => {
      mockGetTagsByList.mockResolvedValue([]);

      const result = await getTagsByList(LIST_ID);

      expect(result).toEqual([]);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetTagsByList.mockRejectedValue(new Error("connection reset"));

      await expect(getTagsByList(LIST_ID)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ─── getTagsByPlace ───────────────────────────────────────────────────────
  describe("getTagsByPlace", () => {
    it("returns tags for a place", async () => {
      mockGetTagsByPlace.mockResolvedValue([tagSummary]);

      const result = await getTagsByPlace(PLACE_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(tagSummary);
    });

    it("returns empty array when place has no tags", async () => {
      mockGetTagsByPlace.mockResolvedValue([]);

      const result = await getTagsByPlace(PLACE_ID);

      expect(result).toEqual([]);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockGetTagsByPlace.mockRejectedValue(new Error("DB error"));

      await expect(getTagsByPlace(PLACE_ID)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ─── createTag ────────────────────────────────────────────────────────────
  describe("createTag", () => {
    it("creates a custom tag with normalised name", async () => {
      mockGetTagByName.mockResolvedValue(null);
      mockInsertTag.mockResolvedValue(customTag);

      const result = await createTag("Vegan Friendly");

      expect(mockInsertTag).toHaveBeenCalledWith({
        name: "vegan-friendly",
        source: "custom",
      });
      expect(result.tag.name).toBe("vegan-friendly");
    });

    it("throws VALIDATION_ERROR for invalid name", async () => {
      await expect(createTag("a")).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });

    it("throws VALIDATION_ERROR for empty name", async () => {
      await expect(createTag("")).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });

    it("throws DUPLICATE_TAG when tag already exists", async () => {
      mockGetTagByName.mockResolvedValue(cafeTag);

      await expect(createTag("cafe")).rejects.toMatchObject({
        code: "DUPLICATE_TAG",
      });
    });

    it("throws SERVICE_ERROR on unexpected DB failure", async () => {
      mockGetTagByName.mockRejectedValue(new Error("DB down"));

      await expect(createTag("new-tag")).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ─── setListTags ──────────────────────────────────────────────────────────
  describe("setListTags", () => {
    it("resolves tag names and sets list tags", async () => {
      mockUpsertTag.mockResolvedValueOnce(cafeTag);
      mockSetListTags.mockResolvedValue(undefined);
      mockGetTagsByList.mockResolvedValue([tagSummary]);

      const result = await setListTags(LIST_ID, ["cafe"]);

      expect(mockUpsertTag).toHaveBeenCalledWith({
        name: "cafe",
        source: "custom",
      });
      expect(mockSetListTags).toHaveBeenCalledWith(LIST_ID, [TAG_ID]);
      expect(result.listId).toBe(LIST_ID);
      expect(result.tags).toEqual([tagSummary]);
    });

    it("handles empty tag array", async () => {
      mockSetListTags.mockResolvedValue(undefined);
      mockGetTagsByList.mockResolvedValue([]);

      const result = await setListTags(LIST_ID, []);

      expect(mockSetListTags).toHaveBeenCalledWith(LIST_ID, []);
      expect(result.tags).toEqual([]);
    });

    it("skips invalid tag names after normalisation", async () => {
      mockUpsertTag.mockResolvedValueOnce(cafeTag);
      mockSetListTags.mockResolvedValue(undefined);
      mockGetTagsByList.mockResolvedValue([tagSummary]);

      const result = await setListTags(LIST_ID, ["cafe", "a", "!!"]);

      // Only "cafe" should be resolved, "a" and "!!" are invalid
      expect(mockUpsertTag).toHaveBeenCalledTimes(1);
      expect(result.tags).toEqual([tagSummary]);
    });

    it("deduplicates tag IDs", async () => {
      mockUpsertTag.mockResolvedValue(cafeTag);
      mockSetListTags.mockResolvedValue(undefined);
      mockGetTagsByList.mockResolvedValue([tagSummary]);

      await setListTags(LIST_ID, ["cafe", "cafe"]);

      expect(mockSetListTags).toHaveBeenCalledWith(LIST_ID, [TAG_ID]);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockUpsertTag.mockRejectedValue(new Error("DB down"));

      await expect(setListTags(LIST_ID, ["cafe"])).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ─── setPlaceTags ─────────────────────────────────────────────────────────
  describe("setPlaceTags", () => {
    it("resolves tag names and sets place tags", async () => {
      mockUpsertTag.mockResolvedValueOnce(cafeTag);
      mockSetPlaceTags.mockResolvedValue(undefined);
      mockGetTagsByPlace.mockResolvedValue([tagSummary]);

      const result = await setPlaceTags(PLACE_ID, ["cafe"]);

      expect(mockSetPlaceTags).toHaveBeenCalledWith(PLACE_ID, [TAG_ID]);
      expect(result.placeId).toBe(PLACE_ID);
      expect(result.tags).toEqual([tagSummary]);
    });

    it("handles empty tag array", async () => {
      mockSetPlaceTags.mockResolvedValue(undefined);
      mockGetTagsByPlace.mockResolvedValue([]);

      const result = await setPlaceTags(PLACE_ID, []);

      expect(result.tags).toEqual([]);
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockUpsertTag.mockRejectedValue(new Error("DB down"));

      await expect(setPlaceTags(PLACE_ID, ["cafe"])).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ─── seedSystemTags ───────────────────────────────────────────────────────
  describe("seedSystemTags", () => {
    it("upserts all Google Places types", async () => {
      mockUpsertTag.mockResolvedValue(cafeTag);

      const count = await seedSystemTags();

      expect(count).toBeGreaterThan(50);
      expect(mockUpsertTag).toHaveBeenCalledWith(
        expect.objectContaining({ source: "system" })
      );
    });

    it("throws SERVICE_ERROR on DB failure", async () => {
      mockUpsertTag.mockRejectedValue(new Error("DB down"));

      await expect(seedSystemTags()).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  // ─── TagServiceError ──────────────────────────────────────────────────────
  describe("TagServiceError", () => {
    it("DUPLICATE_TAG is instance of TagServiceError", async () => {
      mockGetTagByName.mockResolvedValue(cafeTag);
      try {
        await createTag("cafe");
      } catch (err) {
        expect(err).toBeInstanceOf(TagServiceError);
        expect((err as TagServiceError).code).toBe("DUPLICATE_TAG");
      }
    });

    it("SERVICE_ERROR wraps original error", async () => {
      const original = new Error("raw DB error");
      mockGetTagsByList.mockRejectedValue(original);
      try {
        await getTagsByList(LIST_ID);
      } catch (err) {
        expect(err).toBeInstanceOf(TagServiceError);
        expect((err as TagServiceError).originalError).toBe(original);
      }
    });
  });
});
