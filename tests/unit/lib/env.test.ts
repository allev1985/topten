import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("config — environment validation", () => {
  const originalEnv = process.env;

  const validEnv = {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    DATABASE_URL: "postgresql://test",
    GOOGLE_PLACES_API_KEY: "test-places-key",
  };

  const setValidEnv = () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = validEnv.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      validEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = validEnv.SUPABASE_SERVICE_ROLE_KEY;
    process.env.DATABASE_URL = validEnv.DATABASE_URL;
  };

  const clearRequiredEnv = () => {
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

  describe("required variables", () => {
    it("builds config when all required variables are set", async () => {
      setValidEnv();
      process.env.GOOGLE_PLACES_API_KEY = validEnv.GOOGLE_PLACES_API_KEY;

      const { config } = await import("@/lib/config");

      expect(config.supabase.url).toBe(validEnv.NEXT_PUBLIC_SUPABASE_URL);
      expect(config.supabase.anonKey).toBe(
        validEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      expect(config.supabase.serviceRoleKey).toBe(
        validEnv.SUPABASE_SERVICE_ROLE_KEY
      );
      expect(config.db.url).toBe(validEnv.DATABASE_URL);
      expect(config.googlePlaces.apiKey).toBe(validEnv.GOOGLE_PLACES_API_KEY);
    });

    it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
      setValidEnv();
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      await expect(import("@/lib/config")).rejects.toThrow(
        "NEXT_PUBLIC_SUPABASE_URL"
      );
    });

    it("throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
      setValidEnv();
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      await expect(import("@/lib/config")).rejects.toThrow(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    });

    it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
      setValidEnv();
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      await expect(import("@/lib/config")).rejects.toThrow(
        "SUPABASE_SERVICE_ROLE_KEY"
      );
    });

    it("throws when DATABASE_URL is missing", async () => {
      setValidEnv();
      delete process.env.DATABASE_URL;

      await expect(import("@/lib/config")).rejects.toThrow("DATABASE_URL");
    });

    it("treats empty string as invalid", async () => {
      setValidEnv();
      process.env.NEXT_PUBLIC_SUPABASE_URL = "";

      await expect(import("@/lib/config")).rejects.toThrow(
        "NEXT_PUBLIC_SUPABASE_URL"
      );
    });

    it("treats whitespace-only string as invalid", async () => {
      setValidEnv();
      process.env.NEXT_PUBLIC_SUPABASE_URL = "   ";

      await expect(import("@/lib/config")).rejects.toThrow(
        "NEXT_PUBLIC_SUPABASE_URL"
      );
    });

    it("includes actionable message in error", async () => {
      clearRequiredEnv();

      await expect(import("@/lib/config")).rejects.toThrow(
        "Please check your .env.local file or environment configuration"
      );
    });
  });

  describe("optional variables", () => {
    it("googlePlaces.apiKey defaults to empty string when not set", async () => {
      setValidEnv();
      delete process.env.GOOGLE_PLACES_API_KEY;

      const { config } = await import("@/lib/config");

      expect(config.googlePlaces.apiKey).toBe("");
    });

    it("otel.serviceName defaults to 'topten' when not set", async () => {
      setValidEnv();
      delete process.env.OTEL_SERVICE_NAME;

      const { config } = await import("@/lib/config");

      expect(config.otel.serviceName).toBe("topten");
    });

    it("otel.endpoint is undefined when not set", async () => {
      setValidEnv();
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

      const { config } = await import("@/lib/config");

      expect(config.otel.endpoint).toBeUndefined();
    });
  });

  describe("log level", () => {
    it("defaults to 'debug' in non-production", async () => {
      setValidEnv();
      delete process.env.LOG_LEVEL;

      const { config } = await import("@/lib/config");

      expect(config.log.level).toBe("debug");
    });

    it("accepts a valid LOG_LEVEL", async () => {
      setValidEnv();
      process.env.LOG_LEVEL = "warn";

      const { config } = await import("@/lib/config");

      expect(config.log.level).toBe("warn");
    });

    it("throws on invalid LOG_LEVEL", async () => {
      setValidEnv();
      process.env.LOG_LEVEL = "verbose";

      await expect(import("@/lib/config")).rejects.toThrow("LOG_LEVEL");
    });
  });
});
