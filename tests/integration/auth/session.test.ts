import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/auth/session/route";

// Mock the Supabase server client
const mockGetSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getSession: mockGetSession,
      },
    })
  ),
}));

describe("GET /api/auth/session", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
  };

  const createMockSession = (expiresInSeconds: number) => ({
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: expiresInSeconds,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    token_type: "bearer",
    user: mockUser,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticated session", () => {
    it("returns 200 with user info for authenticated session", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: createMockSession(3600) },
        error: null,
      });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.authenticated).toBe(true);
      expect(body.user).toEqual({
        id: "user-123",
        email: "test@example.com",
      });
    });

    it("returns correct expiresAt timestamp", async () => {
      const session = createMockSession(3600);
      mockGetSession.mockResolvedValue({
        data: { session },
        error: null,
      });

      const response = await GET();
      const body = await response.json();

      expect(body.session).toBeDefined();
      expect(body.session.expiresAt).toBeDefined();
      // Verify it's a valid ISO date string
      expect(new Date(body.session.expiresAt).getTime()).toBeGreaterThan(
        Date.now()
      );
    });

    it("returns isExpiringSoon: true when within 5 minutes of expiry", async () => {
      // Session expiring in 4 minutes
      const session = createMockSession(240);
      mockGetSession.mockResolvedValue({
        data: { session },
        error: null,
      });

      const response = await GET();
      const body = await response.json();

      expect(body.session.isExpiringSoon).toBe(true);
    });

    it("returns isExpiringSoon: false when not near expiry", async () => {
      // Session expiring in 1 hour
      const session = createMockSession(3600);
      mockGetSession.mockResolvedValue({
        data: { session },
        error: null,
      });

      const response = await GET();
      const body = await response.json();

      expect(body.session.isExpiringSoon).toBe(false);
    });
  });

  describe("unauthenticated session", () => {
    it("returns 200 with authenticated: false for no session", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.authenticated).toBe(false);
      expect(body.user).toBeNull();
      expect(body.session).toBeNull();
    });

    it("returns 200 with authenticated: false when getSession returns error", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Session expired" },
      });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.authenticated).toBe(false);
    });
  });

  describe("response schema", () => {
    it("authenticated response matches contract schema", async () => {
      const session = createMockSession(3600);
      mockGetSession.mockResolvedValue({
        data: { session },
        error: null,
      });

      const response = await GET();
      const body = await response.json();

      // Verify response structure matches SessionStatusAuthenticated
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("authenticated", true);
      expect(body).toHaveProperty("user");
      expect(body.user).toHaveProperty("id");
      expect(body.user).toHaveProperty("email");
      expect(body).toHaveProperty("session");
      expect(body.session).toHaveProperty("expiresAt");
      expect(body.session).toHaveProperty("isExpiringSoon");
    });

    it("unauthenticated response matches contract schema", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const response = await GET();
      const body = await response.json();

      // Verify response structure matches SessionStatusUnauthenticated
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("authenticated", false);
      expect(body).toHaveProperty("user", null);
      expect(body).toHaveProperty("session", null);
    });
  });

  describe("server errors", () => {
    it("returns 500 for server errors", async () => {
      mockGetSession.mockRejectedValue(new Error("Connection failed"));

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SERVER_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });
  });

  describe("logging", () => {
    it("logs session status check", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      mockGetSession.mockResolvedValue({
        data: { session: createMockSession(3600) },
        error: null,
      });

      await GET();

      expect(consoleSpy).toHaveBeenCalledWith("[Session]", expect.any(String));

      consoleSpy.mockRestore();
    });
  });
});
