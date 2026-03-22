import { describe, it, expect } from "vitest";
import {
  createTagSchema,
  setListTagsSchema,
  setPlaceTagsSchema,
  searchTagsSchema,
} from "@/schemas/tag";

describe("Tag Schemas", () => {
  // ─── createTagSchema ──────────────────────────────────────────────────────
  describe("createTagSchema", () => {
    it("accepts a valid tag name", () => {
      const result = createTagSchema.safeParse({ name: "cafe" });
      expect(result.success).toBe(true);
    });

    it("accepts a hyphenated tag name", () => {
      const result = createTagSchema.safeParse({ name: "vegan-friendly" });
      expect(result.success).toBe(true);
    });

    it("rejects a name shorter than 2 characters", () => {
      const result = createTagSchema.safeParse({ name: "a" });
      expect(result.success).toBe(false);
    });

    it("rejects a name longer than 50 characters", () => {
      const result = createTagSchema.safeParse({ name: "a".repeat(51) });
      expect(result.success).toBe(false);
    });

    it("rejects a name with uppercase letters", () => {
      const result = createTagSchema.safeParse({ name: "Cafe" });
      expect(result.success).toBe(false);
    });

    it("rejects a name starting with hyphen", () => {
      const result = createTagSchema.safeParse({ name: "-cafe" });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = createTagSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("trims whitespace", () => {
      const result = createTagSchema.safeParse({ name: "  ab  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("ab");
      }
    });
  });

  // ─── setListTagsSchema ────────────────────────────────────────────────────
  describe("setListTagsSchema", () => {
    const validUUID = "550e8400-e29b-41d4-a716-446655440000";

    it("accepts valid list ID and tag names", () => {
      const result = setListTagsSchema.safeParse({
        listId: validUUID,
        tagNames: ["cafe", "restaurant"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty tag names array", () => {
      const result = setListTagsSchema.safeParse({
        listId: validUUID,
        tagNames: [],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID for listId", () => {
      const result = setListTagsSchema.safeParse({
        listId: "not-a-uuid",
        tagNames: ["cafe"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 20 tags", () => {
      const result = setListTagsSchema.safeParse({
        listId: validUUID,
        tagNames: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
      });
      expect(result.success).toBe(false);
    });

    it("accepts exactly 20 tags", () => {
      const result = setListTagsSchema.safeParse({
        listId: validUUID,
        tagNames: Array.from({ length: 20 }, (_, i) => `tag-${i}`),
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── setPlaceTagsSchema ───────────────────────────────────────────────────
  describe("setPlaceTagsSchema", () => {
    const validUUID = "550e8400-e29b-41d4-a716-446655440000";

    it("accepts valid place ID and tag names", () => {
      const result = setPlaceTagsSchema.safeParse({
        placeId: validUUID,
        tagNames: ["cafe"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID for placeId", () => {
      const result = setPlaceTagsSchema.safeParse({
        placeId: "not-a-uuid",
        tagNames: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 20 tags", () => {
      const result = setPlaceTagsSchema.safeParse({
        placeId: validUUID,
        tagNames: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── searchTagsSchema ─────────────────────────────────────────────────────
  describe("searchTagsSchema", () => {
    it("accepts a valid query", () => {
      const result = searchTagsSchema.safeParse({ query: "caf" });
      expect(result.success).toBe(true);
    });

    it("rejects empty query", () => {
      const result = searchTagsSchema.safeParse({ query: "" });
      expect(result.success).toBe(false);
    });

    it("trims whitespace", () => {
      const result = searchTagsSchema.safeParse({ query: "  caf  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe("caf");
      }
    });
  });
});
