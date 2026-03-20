import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("config — environment validation", () => {
  const originalEnv = process.env;

  const validEnv = {
    AUTH_SECRET: "test-secret-32-chars-long-minimum",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    DATABASE_URL: "postgresql://test",
    GOOGLE_PLACES_API_KEY: "test-places-key",
  };

  const setValidEnv = () => {
    process.env.AUTH_SECRET = validEnv.AUTH_SECRET;
    process.env.NEXT_PUBLIC_APP_URL = validEnv.NEXT_PUBLIC_APP_URL;
    process.env.DATABASE_URL = validEnv.DATABASE_URL;
  };

  const clearRequiredEnv = () => {
    delete process.env.AUTH_SECRET;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.DATABASE_URL;
    delete process.env.GOOGLE_PLACES_API_KEY;
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("required variables", () => {
    it("builds config when all required variables are set", async () => {
      setValidEnv();
      process.env.GOOGLE_PLACES_API_KEY = validEnv.GOOGLE_PLACES_API_KEY;

      const { config } = await import("@/lib/config");

      expect(config.db.url).toBe(validEnv.DATABASE_URL);
      expect(config.googlePlaces.apiKey).toBe(validEnv.GOOGLE_PLACES_API_KEY);
    });

    it("throws when AUTH_SECRET is missing", async () => {
      setValidEnv();
      delete process.env.AUTH_SECRET;

      await expect(import("@/lib/config")).rejects.toThrow();
    });

    it("throws when DATABASE_URL is missing", async () => {
      setValidEnv();
      delete process.env.DATABASE_URL;

      await expect(import("@/lib/config")).rejects.toThrow();
    });

    it("throws when NEXT_PUBLIC_APP_URL is missing", async () => {
      setValidEnv();
      delete process.env.NEXT_PUBLIC_APP_URL;

      await expect(import("@/lib/config")).rejects.toThrow();
    });
  });

  describe("optional variables", () => {
    it("defaults GOOGLE_PLACES_API_KEY to empty string when not set", async () => {
      setValidEnv();
      clearRequiredEnv();
      setValidEnv();

      const { config } = await import("@/lib/config");
      expect(config.googlePlaces.apiKey).toBe("");
    });
  });
});
