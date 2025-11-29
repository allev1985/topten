import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to reset module cache between tests to test lazy loading behavior
describe("Environment Validation", () => {
  const originalEnv = process.env;

  // Shared mock values for valid environment
  const validEnv = {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    DATABASE_URL: "postgresql://test",
    GOOGLE_PLACES_API_KEY: "test-places-key",
  };

  // Helper to set all valid env vars
  const setValidEnv = () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = validEnv.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      validEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = validEnv.SUPABASE_SERVICE_ROLE_KEY;
    process.env.DATABASE_URL = validEnv.DATABASE_URL;
  };

  // Helper to clear all env vars
  const clearAllEnv = () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
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

  describe("validateEnv", () => {
    it("should return config when all required variables are set", async () => {
      setValidEnv();
      process.env.GOOGLE_PLACES_API_KEY = validEnv.GOOGLE_PLACES_API_KEY;

      const { validateEnv } = await import("@/lib/env");
      const config = validateEnv();

      expect(config.NEXT_PUBLIC_SUPABASE_URL).toBe(
        validEnv.NEXT_PUBLIC_SUPABASE_URL
      );
      expect(config.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
        validEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      expect(config.SUPABASE_SERVICE_ROLE_KEY).toBe(
        validEnv.SUPABASE_SERVICE_ROLE_KEY
      );
      expect(config.DATABASE_URL).toBe(validEnv.DATABASE_URL);
      expect(config.GOOGLE_PLACES_API_KEY).toBe(validEnv.GOOGLE_PLACES_API_KEY);
    });

    it("should throw error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
      setValidEnv();
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
      );
    });

    it("should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
      setValidEnv();
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    });

    it("should throw error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
      setValidEnv();
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"
      );
    });

    it("should throw error when DATABASE_URL is missing", async () => {
      setValidEnv();
      delete process.env.DATABASE_URL;

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: DATABASE_URL"
      );
    });

    it("should treat empty string as missing variable", async () => {
      setValidEnv();
      process.env.NEXT_PUBLIC_SUPABASE_URL = "";

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
      );
    });

    it("should treat whitespace-only string as missing variable", async () => {
      setValidEnv();
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "   ";

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    });

    it("should allow optional GOOGLE_PLACES_API_KEY to be undefined", async () => {
      setValidEnv();
      delete process.env.GOOGLE_PLACES_API_KEY;

      const { validateEnv } = await import("@/lib/env");
      const config = validateEnv();

      expect(config.GOOGLE_PLACES_API_KEY).toBeUndefined();
    });

    it("should include actionable message in error", async () => {
      clearAllEnv();

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Please check your .env.local file or environment configuration"
      );
    });
  });

  describe("getEnv", () => {
    it("should return config when all required variables are set", async () => {
      setValidEnv();

      const { getEnv } = await import("@/lib/env");
      const config = getEnv();

      expect(config.NEXT_PUBLIC_SUPABASE_URL).toBe(
        validEnv.NEXT_PUBLIC_SUPABASE_URL
      );
    });

    it("should use lazy-loaded singleton pattern", async () => {
      setValidEnv();

      const { getEnv } = await import("@/lib/env");

      const config1 = getEnv();
      const config2 = getEnv();

      // Both calls should return the same cached instance
      expect(config1).toBe(config2);
    });

    it("should throw on first call if env is invalid", async () => {
      clearAllEnv();

      const { getEnv } = await import("@/lib/env");

      expect(() => getEnv()).toThrow("Missing required environment variable");
    });
  });
});
