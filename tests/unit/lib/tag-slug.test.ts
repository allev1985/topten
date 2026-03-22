import { describe, it, expect } from "vitest";
import {
  normaliseTagSlug,
  normaliseTagLabel,
  MAX_TAGS_PER_ENTITY,
  MAX_TAG_LENGTH,
} from "@/lib/tag/slug";

describe("normaliseTagSlug", () => {
  it("lower-cases and hyphenates whitespace", () => {
    expect(normaliseTagSlug("Vegan Friendly")).toBe("vegan-friendly");
  });

  it("strips punctuation", () => {
    expect(normaliseTagSlug("Vegan Friendly!")).toBe("vegan-friendly");
  });

  it("collapses repeated whitespace to a single hyphen", () => {
    expect(normaliseTagSlug("coffee    shop")).toBe("coffee-shop");
  });

  it("collapses repeated hyphens", () => {
    expect(normaliseTagSlug("foo---bar")).toBe("foo-bar");
  });

  it("trims leading and trailing hyphens", () => {
    expect(normaliseTagSlug(" --Hello-- ")).toBe("hello");
  });

  it("returns empty string when input is entirely stripped", () => {
    expect(normaliseTagSlug("!!!")).toBe("");
  });

  it("preserves digits", () => {
    expect(normaliseTagSlug("Top 10")).toBe("top-10");
  });

  it("truncates to MAX_TAG_LENGTH", () => {
    const long = "a".repeat(MAX_TAG_LENGTH + 20);
    expect(normaliseTagSlug(long)).toHaveLength(MAX_TAG_LENGTH);
  });
});

describe("normaliseTagLabel", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normaliseTagLabel("  Vegan   Friendly  ")).toBe("Vegan Friendly");
  });

  it("preserves original casing", () => {
    expect(normaliseTagLabel("CamelCase Tag")).toBe("CamelCase Tag");
  });

  it("truncates to MAX_TAG_LENGTH", () => {
    const long = "a".repeat(MAX_TAG_LENGTH + 10);
    expect(normaliseTagLabel(long)).toHaveLength(MAX_TAG_LENGTH);
  });
});

describe("constants", () => {
  it("exports MAX_TAGS_PER_ENTITY as a positive integer", () => {
    expect(MAX_TAGS_PER_ENTITY).toBe(10);
  });

  it("exports MAX_TAG_LENGTH as a positive integer", () => {
    expect(MAX_TAG_LENGTH).toBe(64);
  });
});
