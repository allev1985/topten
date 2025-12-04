import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "@/app/api/auth/password/route";
import { NextRequest } from "next/server";

// Mock the Supabase server client
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
        updateUser: mockUpdateUser,
        verifyOtp: mockVerifyOtp,
        signOut: mockSignOut,
      },
    })
  ),
}));

describe("PUT /api/auth/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    mockSignOut.mockResolvedValue({ error: null });
  });

  const createRequest = (body: unknown): NextRequest => {
    return new NextRequest("http://localhost:3000/api/auth/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("OTP token authentication", () => {
    it("returns 200 for valid password update with recovery token", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "valid-token-hash",
        type: "recovery",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Password updated successfully");
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        type: "recovery",
        token_hash: "valid-token-hash",
      });
    });

    it("returns 200 for valid password update with email token", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "valid-token-hash",
        type: "email",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        type: "email",
        token_hash: "valid-token-hash",
      });
    });

    it("returns 401 for invalid OTP token", async () => {
      mockVerifyOtp.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" },
      });

      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "invalid-token",
        type: "recovery",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
      expect(body.error.message).toBe("Authentication failed");
    });

    it("returns 401 for expired OTP token", async () => {
      mockVerifyOtp.mockResolvedValue({
        data: { user: null },
        error: { message: "Token has expired" },
      });

      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "expired-token",
        type: "recovery",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
      expect(body.error.message).toBe(
        "Authentication link has expired. Please request a new one."
      );
    });
  });

  describe("session-based authentication", () => {
    it("returns 200 for valid password update (authenticated user)", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Password updated successfully");
    });

    it("calls updateUser with correct params", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
      });

      await PUT(request);

      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "NewSecurePass123!",
      });
    });

    it("returns 401 for unauthenticated request", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const request = createRequest({
        password: "NewSecurePass123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
    });
  });

  describe("sign out after reset", () => {
    it("calls signOut after successful password update via OTP", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "valid-token",
        type: "recovery",
      });

      await PUT(request);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it("calls signOut after successful password update via session", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
      });

      await PUT(request);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it("returns success even if signOut fails (logs error)", async () => {
      mockSignOut.mockRejectedValue(new Error("Sign out failed"));

      const request = createRequest({
        password: "NewSecurePass123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Password updated successfully");
    });
  });

  describe("authentication priority", () => {
    it("prioritizes OTP token over session when both available", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "valid-token",
        type: "recovery",
      });

      await PUT(request);

      expect(mockVerifyOtp).toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
    });
  });

  describe("validation errors", () => {
    it("returns 400 for password not meeting complexity requirements - too short", async () => {
      const request = createRequest({
        password: "Short1!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("at least 12 characters"),
          }),
        ])
      );
    });

    it("returns 400 for password missing uppercase", async () => {
      const request = createRequest({
        password: "lowercaseonly123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("uppercase"),
          }),
        ])
      );
    });

    it("returns 400 for password missing lowercase", async () => {
      const request = createRequest({
        password: "UPPERCASEONLY123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("lowercase"),
          }),
        ])
      );
    });

    it("returns 400 for password missing digit", async () => {
      const request = createRequest({
        password: "NoDigitsHere!!!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("number"),
          }),
        ])
      );
    });

    it("returns 400 for password missing symbol", async () => {
      const request = createRequest({
        password: "NoSymbolsHere123",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("special character"),
          }),
        ])
      );
    });

    it("returns 400 for missing password", async () => {
      const request = createRequest({});

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for empty password", async () => {
      const request = createRequest({ password: "" });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("authentication errors", () => {
    it("returns 401 for unauthenticated request", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const request = createRequest({
        password: "NewSecurePass123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
    });

    it("returns 401 when updateUser returns expired token error", async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: null },
        error: { code: "session_expired", message: "Session has expired" },
      });

      const request = createRequest({
        password: "NewSecurePass123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
    });
  });

  describe("server errors", () => {
    it("returns 500 for server errors", async () => {
      mockGetUser.mockRejectedValue(new Error("Connection failed"));

      const request = createRequest({
        password: "NewSecurePass123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SERVER_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });

    it("returns 500 when updateUser throws exception", async () => {
      mockUpdateUser.mockRejectedValue(new Error("Unexpected error"));

      const request = createRequest({
        password: "NewSecurePass123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SERVER_ERROR");
    });
  });

  describe("logging", () => {
    it("logs password updates with masked user info", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const request = createRequest({
        password: "NewSecurePass123!",
      });

      await PUT(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[PasswordUpdate]",
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it("does not log password in logs", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const request = createRequest({
        password: "NewSecurePass123!",
      });

      await PUT(request);

      const allLogs = [
        ...consoleSpy.mock.calls.map((c) => JSON.stringify(c)),
        ...consoleErrorSpy.mock.calls.map((c) => JSON.stringify(c)),
      ].join(" ");

      expect(allLogs).not.toContain("NewSecurePass123!");

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
