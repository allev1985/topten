import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/logout/route";

// Mock the Supabase server client
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signOut: mockSignOut,
        getUser: mockGetUser,
      },
    })
  ),
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockSignOut.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: "123" } } });
  });

  describe("logout success", () => {
    it("returns 200 with success=true and message", async () => {
      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Logged out successfully");
    });

    it("calls signOut", async () => {
      await POST();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it("is idempotent (succeeds without active session)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Logged out successfully");
    });

    it("returns success even if signOut returns error (idempotency)", async () => {
      mockSignOut.mockResolvedValue({
        error: { message: "No active session" },
      });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Logged out successfully");
    });
  });

  describe("server errors", () => {
    it("returns 500 for Supabase connection error", async () => {
      mockGetUser.mockRejectedValue(new Error("Connection failed"));

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SERVER_ERROR");
    });

    it("returns 500 when signOut throws exception", async () => {
      mockSignOut.mockRejectedValue(new Error("Unexpected error"));

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SERVER_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });
  });

  describe("logging", () => {
    it("logs logout event for authenticated user", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });

      await POST();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Logout]",
        expect.stringContaining("User logged out")
      );

      consoleSpy.mockRestore();
    });

    it("logs logout request for unauthenticated user", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      mockGetUser.mockResolvedValue({ data: { user: null } });

      await POST();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Logout]",
        expect.stringContaining("no active session")
      );

      consoleSpy.mockRestore();
    });

    it("logs errors when signOut fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockSignOut.mockResolvedValue({
        error: { message: "Session cleanup failed" },
      });

      await POST();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Logout]",
        expect.stringContaining("Logout error")
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
