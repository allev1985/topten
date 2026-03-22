import { describe, it, expect } from "vitest";
import {
  GOOGLE_PLACES_TAXONOMY,
  findTaxonomyEntry,
} from "@/lib/tag/google-places-taxonomy";
import { normaliseTagSlug } from "@/lib/tag/slug";

describe("GOOGLE_PLACES_TAXONOMY", () => {
  it("contains at least one entry", () => {
    expect(GOOGLE_PLACES_TAXONOMY.length).toBeGreaterThan(0);
  });

  it("every entry has a non-empty slug and label", () => {
    for (const entry of GOOGLE_PLACES_TAXONOMY) {
      expect(entry.slug).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });

  it("every slug is already in normalised form", () => {
    for (const entry of GOOGLE_PLACES_TAXONOMY) {
      expect(normaliseTagSlug(entry.slug)).toBe(entry.slug);
    }
  });

  it("contains no duplicate slugs", () => {
    const slugs = GOOGLE_PLACES_TAXONOMY.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("includes well-known Google place categories", () => {
    const slugs = new Set(GOOGLE_PLACES_TAXONOMY.map((e) => e.slug));
    expect(slugs.has("restaurant")).toBe(true);
    expect(slugs.has("cafe")).toBe(true);
    expect(slugs.has("bar")).toBe(true);
  });
});

describe("findTaxonomyEntry", () => {
  it("returns the entry for a known slug", () => {
    const entry = findTaxonomyEntry("restaurant");
    expect(entry).toBeDefined();
    expect(entry?.label).toBe("Restaurant");
  });

  it("returns undefined for an unknown slug", () => {
    expect(findTaxonomyEntry("nonexistent-slug")).toBeUndefined();
  });
});
