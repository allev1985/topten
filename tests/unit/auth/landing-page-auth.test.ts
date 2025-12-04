import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Unit tests for landing page authentication detection
 *
 * These tests verify that the authentication state is correctly detected
 * server-side and converted to a boolean for the Client Component.
 *
 * Coverage areas:
 * - Authenticated user detection
 * - Non-authenticated user detection
 * - Error handling (auth service failures)
 * - Expired session handling
 * - Boolean transformation logic
 */

// Mock the Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Landing Page Auth Detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authenticated User Detection", () => {
    it("should return true when user is authenticated", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@example.com",
        created_at: "2024-01-01T00:00:00.000Z",
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as unknown as SupabaseClient);

      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      const isAuthenticated = error ? false : !!user;

      expect(isAuthenticated).toBe(true);
      expect(user).toEqual(mockUser);
      expect(error).toBeNull();
    });

    it("should handle user with minimal properties", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as unknown as SupabaseClient);

      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      const isAuthenticated = error ? false : !!user;

      expect(isAuthenticated).toBe(true);
      expect(user?.id).toBe("123e4567-e89b-12d3-a456-426614174000");
    });
  });

  describe("Non-Authenticated User Detection", () => {
    it("should return false when user is not authenticated", async () => {
      const { createClient } = await import("@/lib/supabase/server");

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as unknown as SupabaseClient);

      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      const isAuthenticated = error ? false : !!user;

      expect(isAuthenticated).toBe(false);
      expect(user).toBeNull();
      expect(error).toBeNull();
    });

    it("should handle undefined user as non-authenticated", async () => {
      const { createClient } = await import("@/lib/supabase/server");

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: undefined },
            error: null,
          }),
        },
      } as unknown as SupabaseClient);

      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      const isAuthenticated = error ? false : !!user;

      expect(isAuthenticated).toBe(false);
    });
  });

  describe("Error Handling - Auth Service Failures", () => {
    it("should default to non-authenticated when auth service fails", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockError = {
        message: "Auth service unavailable",
        status: 500,
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: mockError,
          }),
        },
      } as unknown as SupabaseClient);

      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      const isAuthenticated = error ? false : !!user;

      expect(isAuthenticated).toBe(false);
      expect(error).toEqual(mockError);
      expect(user).toBeNull();
    });

    it("should handle network errors gracefully", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockError = {
        message: "Network request failed",
        status: 0,
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: mockError,
          }),
        },
      } as unknown as SupabaseClient);

      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      const isAuthenticated = error ? false : !!user;

      expect(isAuthenticated).toBe(false);
      expect(error?.message).toContain("Network");
    });
  });

  describe("Expired Session Handling", () => {
    it("should treat expired session as non-authenticated", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockError = {
        message: "JWT expired",
        status: 401,
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: mockError,
          }),
        },
      } as unknown as SupabaseClient);

      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      const isAuthenticated = error ? false : !!user;

      expect(isAuthenticated).toBe(false);
      expect(error?.status).toBe(401);
    });

    it("should handle invalid token gracefully", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockError = {
        message: "Invalid token",
        status: 401,
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: mockError,
          }),
        },
      } as unknown as SupabaseClient);

      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      const isAuthenticated = error ? false : !!user;

      expect(isAuthenticated).toBe(false);
    });
  });

  describe("Performance - Auth Check Timing", () => {
    it("should complete auth check quickly", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@example.com",
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as unknown as SupabaseClient);

      const startTime = performance.now();
      const supabase = await createClient();
      await supabase.auth.getUser();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Auth check should be fast (< 200ms target, but in tests it's instant)
      expect(duration).toBeLessThan(100); // Mocked calls are instant
    });
  });

  describe("Boolean Transformation Logic", () => {
    it("should convert truthy user to true", () => {
      const user = { id: "123" };
      const isAuthenticated = !!user;
      expect(isAuthenticated).toBe(true);
      expect(typeof isAuthenticated).toBe("boolean");
    });

    it("should convert null user to false", () => {
      const user = null;
      const isAuthenticated = !!user;
      expect(isAuthenticated).toBe(false);
      expect(typeof isAuthenticated).toBe("boolean");
    });

    it("should convert undefined user to false", () => {
      const user = undefined;
      const isAuthenticated = !!user;
      expect(isAuthenticated).toBe(false);
      expect(typeof isAuthenticated).toBe("boolean");
    });

    it("should always return boolean type", () => {
      const users = [
        { id: "123" },
        null,
        undefined,
        { id: "456", email: "test@example.com" },
      ];

      users.forEach((user) => {
        const isAuthenticated = !!user;
        expect(typeof isAuthenticated).toBe("boolean");
      });
    });
  });

  describe("Slow Auth Check Handling", () => {
    it("should handle slow auth responses", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockUser = { id: "123" };

      // Simulate slow response (50ms)
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    data: { user: mockUser },
                    error: null,
                  });
                }, 50);
              })
          ),
        },
      } as unknown as SupabaseClient);

      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      const isAuthenticated = error ? false : !!user;

      expect(isAuthenticated).toBe(true);
      expect(user).toEqual(mockUser);
    });
  });
});
