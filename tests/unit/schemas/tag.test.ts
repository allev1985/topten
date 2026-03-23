import { describe, it, expect } from "vitest";
import { tagLabelSchema, tagsFieldSchema, setTagsSchema } from "@/schemas/tag";
import { config } from "@/lib/config/client";

describe("tagLabelSchema", () => {
  it("accepts a valid label", () => {
    expect(tagLabelSchema.safeParse("Cafe").success).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    const result = tagLabelSchema.safeParse("  Cafe  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("Cafe");
  });

  it("rejects empty strings", () => {
    expect(tagLabelSchema.safeParse("").success).toBe(false);
  });

  it("rejects labels longer than config.tags.maxLabelLength", () => {
    const long = "a".repeat(config.tags.maxLabelLength + 1);
    expect(tagLabelSchema.safeParse(long).success).toBe(false);
  });
});

describe("tagsFieldSchema", () => {
  it("parses a JSON-encoded array of labels", () => {
    const result = tagsFieldSchema.safeParse(JSON.stringify(["Cafe", "Bar"]));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(["Cafe", "Bar"]);
  });

  it("treats an empty string as an empty array", () => {
    const result = tagsFieldSchema.safeParse("");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("treats a whitespace-only string as an empty array", () => {
    const result = tagsFieldSchema.safeParse("   ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("rejects arrays exceeding config.tags.maxPerEntity", () => {
    const tooMany = Array.from(
      { length: config.tags.maxPerEntity + 1 },
      (_, i) => `tag${i}`
    );
    const result = tagsFieldSchema.safeParse(JSON.stringify(tooMany));
    expect(result.success).toBe(false);
  });

  it("rejects invalid JSON that is not an array", () => {
    expect(tagsFieldSchema.safeParse("not json").success).toBe(false);
  });

  it("rejects arrays containing empty strings", () => {
    const result = tagsFieldSchema.safeParse(JSON.stringify(["Cafe", ""]));
    expect(result.success).toBe(false);
  });
});

describe("setTagsSchema", () => {
  it("accepts a valid payload", () => {
    const result = setTagsSchema.safeParse({
      entityId: "abc-123",
      tags: JSON.stringify(["Cafe"]),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entityId).toBe("abc-123");
      expect(result.data.tags).toEqual(["Cafe"]);
    }
  });

  it("rejects an empty entityId", () => {
    const result = setTagsSchema.safeParse({ entityId: "", tags: "[]" });
    expect(result.success).toBe(false);
  });

  it("permits clearing all tags", () => {
    const result = setTagsSchema.safeParse({
      entityId: "abc-123",
      tags: "[]",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual([]);
  });
});
