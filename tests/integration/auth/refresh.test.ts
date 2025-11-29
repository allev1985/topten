import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/refresh/route";

// Mock the Supabase server client
const mockRefreshSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        refreshSession: mockRefreshSession,
      },
    })
  ),
}));

describe("POST /api/auth/refresh", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
  };

  const createMockSession = (expiresInSeconds: number) => ({
    access_token: "new-access-token",
    refresh_token: "new-refresh-token",
    expires_in: expiresInSeconds,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    token_type: "bearer",
    user: mockUser,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for successful refresh
    mockRefreshSession.mockResolvedValue({
      data: { session: createMockSession(3600) },
      error: null,
    });
  });

  describe("refresh success", () => {
    it("returns 200 with new session for valid refresh token", async () => {
      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Session refreshed successfully");
    });

    it("returns new expiresAt timestamp", async () => {
      const session = createMockSession(3600);
      mockRefreshSession.mockResolvedValue({
        data: { session },
        error: null,
      });

      const response = await POST();
      const body = await response.json();

      expect(body.session).toBeDefined();
      expect(body.session.expiresAt).toBeDefined();
      // Verify it's a valid ISO date string
      expect(new Date(body.session.expiresAt).getTime()).toBeGreaterThan(
        Date.now()
      );
    });

    it("calls refreshSession on Supabase client", async () => {
      await POST();

      expect(mockRefreshSession).toHaveBeenCalled();
    });

    it("response includes success message", async () => {
      const response = await POST();
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.message).toBe("Session refreshed successfully");
    });
  });

  describe("authentication errors", () => {
    it("returns 401 for expired refresh token", async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: {
          code: "refresh_token_expired",
          message: "Refresh token has expired",
        },
      });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("EXPIRED_TOKEN");
      expect(body.error.message).toBe(
        "Session has expired. Please log in again."
      );
    });

    it("returns 401 for invalid/missing refresh token", async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: {
          code: "invalid_refresh_token",
          message: "Invalid refresh token",
        },
      });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("EXPIRED_TOKEN");
    });

    it("returns 401 when no session is returned", async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("EXPIRED_TOKEN");
    });
  });

  describe("server errors", () => {
    it("returns 500 for server errors", async () => {
      mockRefreshSession.mockRejectedValue(new Error("Connection failed"));

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SERVER_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });
  });

  describe("logging", () => {
    it("logs refresh request", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      await POST();

      expect(consoleSpy).toHaveBeenCalledWith("[Refresh]", expect.any(String));

      consoleSpy.mockRestore();
    });

    it("logs refresh errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Token expired" },
      });

      await POST();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Refresh]",
        expect.stringContaining("Token expired")
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
