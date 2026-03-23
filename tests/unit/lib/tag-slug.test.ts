import { describe, it, expect } from "vitest";
import {
  normaliseTagSlug,
  normaliseTagLabel,
} from "@/lib/tag/slug";
import { config } from "@/lib/config/client";

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

  it("truncates to config.tags.maxLabelLength", () => {
    const long = "a".repeat(config.tags.maxLabelLength + 20);
    expect(normaliseTagSlug(long)).toHaveLength(config.tags.maxLabelLength);
  });
});

describe("normaliseTagLabel", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normaliseTagLabel("  Vegan   Friendly  ")).toBe("Vegan Friendly");
  });

  it("preserves original casing", () => {
    expect(normaliseTagLabel("CamelCase Tag")).toBe("CamelCase Tag");
  });

  it("truncates to config.tags.maxLabelLength", () => {
    const long = "a".repeat(config.tags.maxLabelLength + 10);
    expect(normaliseTagLabel(long)).toHaveLength(config.tags.maxLabelLength);
  });
});

describe("constants", () => {
  it("config.tags.maxPerEntity is a positive integer", () => {
    expect(config.tags.maxPerEntity).toBe(10);
  });

  it("config.tags.maxLabelLength is a positive integer", () => {
    expect(config.tags.maxLabelLength).toBe(64);
  });
});
