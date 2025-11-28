import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to reset module cache between tests to test lazy loading behavior
describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("validateEnv", () => {
    it("should return config when all required variables are set", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.DATABASE_URL = "postgresql://test";
      process.env.GOOGLE_PLACES_API_KEY = "test-places-key";

      const { validateEnv } = await import("@/lib/env");
      const config = validateEnv();

      expect(config.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
      expect(config.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("test-anon-key");
      expect(config.SUPABASE_SERVICE_ROLE_KEY).toBe("test-service-role-key");
      expect(config.DATABASE_URL).toBe("postgresql://test");
      expect(config.GOOGLE_PLACES_API_KEY).toBe("test-places-key");
    });

    it("should throw error when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.DATABASE_URL = "postgresql://test";
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
      );
    });

    it("should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.DATABASE_URL = "postgresql://test";
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    });

    it("should throw error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.DATABASE_URL = "postgresql://test";
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"
      );
    });

    it("should throw error when DATABASE_URL is missing", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      delete process.env.DATABASE_URL;

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: DATABASE_URL"
      );
    });

    it("should treat empty string as missing variable", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.DATABASE_URL = "postgresql://test";

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
      );
    });

    it("should treat whitespace-only string as missing variable", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "   ";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.DATABASE_URL = "postgresql://test";

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    });

    it("should allow optional GOOGLE_PLACES_API_KEY to be undefined", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.DATABASE_URL = "postgresql://test";
      delete process.env.GOOGLE_PLACES_API_KEY;

      const { validateEnv } = await import("@/lib/env");
      const config = validateEnv();

      expect(config.GOOGLE_PLACES_API_KEY).toBeUndefined();
    });

    it("should include actionable message in error", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.DATABASE_URL;

      const { validateEnv } = await import("@/lib/env");

      expect(() => validateEnv()).toThrow(
        "Please check your .env.local file or environment configuration"
      );
    });
  });

  describe("getEnv", () => {
    it("should return config when all required variables are set", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.DATABASE_URL = "postgresql://test";

      const { getEnv } = await import("@/lib/env");
      const config = getEnv();

      expect(config.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    });

    it("should use lazy-loaded singleton pattern", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.DATABASE_URL = "postgresql://test";

      const { getEnv } = await import("@/lib/env");

      const config1 = getEnv();
      const config2 = getEnv();

      // Both calls should return the same cached instance
      expect(config1).toBe(config2);
    });

    it("should throw on first call if env is invalid", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.DATABASE_URL;

      const { getEnv } = await import("@/lib/env");

      expect(() => getEnv()).toThrow("Missing required environment variable");
    });
  });
});
