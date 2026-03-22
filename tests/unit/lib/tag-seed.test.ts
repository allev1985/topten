import { describe, it, expect } from "vitest";
import { GOOGLE_PLACES_TYPES } from "@/lib/tag/seed";

describe("Google Places taxonomy seed data", () => {
  it("contains at least 50 types", () => {
    expect(GOOGLE_PLACES_TYPES.length).toBeGreaterThanOrEqual(50);
  });

  it("all entries are lowercase kebab-case", () => {
    for (const type of GOOGLE_PLACES_TYPES) {
      expect(type).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    }
  });

  it("has no duplicates", () => {
    const unique = new Set(GOOGLE_PLACES_TYPES);
    expect(unique.size).toBe(GOOGLE_PLACES_TYPES.length);
  });

  it("includes common place types", () => {
    expect(GOOGLE_PLACES_TYPES).toContain("cafe");
    expect(GOOGLE_PLACES_TYPES).toContain("restaurant");
    expect(GOOGLE_PLACES_TYPES).toContain("bar");
    expect(GOOGLE_PLACES_TYPES).toContain("gym");
    expect(GOOGLE_PLACES_TYPES).toContain("park");
    expect(GOOGLE_PLACES_TYPES).toContain("museum");
    expect(GOOGLE_PLACES_TYPES).toContain("hospital");
    expect(GOOGLE_PLACES_TYPES).toContain("hair-care");
  });

  it("all entries are at least 2 characters", () => {
    for (const type of GOOGLE_PLACES_TYPES) {
      expect(type.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("all entries are at most 50 characters", () => {
    for (const type of GOOGLE_PLACES_TYPES) {
      expect(type.length).toBeLessThanOrEqual(50);
    }
  });
});
