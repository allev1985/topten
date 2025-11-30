import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "@/app/api/auth/password/route";
import { NextRequest } from "next/server";

// Mock the Supabase server client
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
        updateUser: mockUpdateUser,
        exchangeCodeForSession: mockExchangeCodeForSession,
        verifyOtp: mockVerifyOtp,
        signOut: mockSignOut,
      },
    })
  ),
}));

describe("PUT /api/auth/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    mockExchangeCodeForSession.mockResolvedValue({
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

  describe("PKCE code authentication", () => {
    it("returns 200 for valid PKCE code authentication", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        code: "valid-pkce-code",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Password updated successfully");
    });

    it("returns 401 for invalid PKCE code", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid code" },
      });

      const request = createRequest({
        password: "NewSecurePass123!",
        code: "invalid-code",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
      expect(body.error.message).toBe("Authentication failed");
    });

    it("returns 401 for expired PKCE code with appropriate message", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null },
        error: { message: "Code has expired" },
      });

      const request = createRequest({
        password: "NewSecurePass123!",
        code: "expired-code",
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

    it("calls exchangeCodeForSession when code is provided", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        code: "test-pkce-code",
      });

      await PUT(request);

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("test-pkce-code");
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });
  });

  describe("OTP token authentication", () => {
    it("returns 200 for valid OTP token authentication", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "valid-token-hash",
        type: "email",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Password updated successfully");
    });

    it("returns 401 for invalid OTP token", async () => {
      mockVerifyOtp.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" },
      });

      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "invalid-token",
        type: "email",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
      expect(body.error.message).toBe("Authentication failed");
    });

    it("returns 401 for expired OTP token with appropriate message", async () => {
      mockVerifyOtp.mockResolvedValue({
        data: { user: null },
        error: { message: "Token has expired" },
      });

      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "expired-token",
        type: "email",
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

    it("calls verifyOtp when token_hash and type are provided", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "test-token-hash",
        type: "email",
      });

      await PUT(request);

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        type: "email",
        token_hash: "test-token-hash",
      });
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("requires type=email when token_hash is provided", async () => {
      // When token_hash is provided without type, should fall back to session auth
      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "test-token-hash",
      });

      await PUT(request);

      // Should use session auth since type is missing
      expect(mockGetUser).toHaveBeenCalled();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });
  });

  describe("session-based authentication", () => {
    it("returns 200 for session-based authentication when no code or token provided", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("Password updated successfully");
    });

    it("returns 401 when session is invalid and no code/token provided", async () => {
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
      expect(body.error.message).toBe("Authentication required");
    });
  });

  describe("sign out after reset", () => {
    it("calls signOut after successful password update via PKCE", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        code: "valid-code",
      });

      await PUT(request);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it("calls signOut after successful password update via OTP", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "valid-token",
        type: "email",
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
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const request = createRequest({
        password: "NewSecurePass123!",
      });

      const response = await PUT(request);
      const body = await response.json();

      // Should still return success
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);

      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[PasswordUpdate]",
        expect.stringContaining("Sign-out failed")
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("authentication priority", () => {
    it("prioritizes PKCE code over OTP token when both provided", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        code: "pkce-code",
        token_hash: "otp-token",
        type: "email",
      });

      await PUT(request);

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("prioritizes OTP token over session when both available", async () => {
      const request = createRequest({
        password: "NewSecurePass123!",
        token_hash: "otp-token",
        type: "email",
      });

      await PUT(request);

      expect(mockVerifyOtp).toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("does not log sensitive data (code, token, password)", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const request = createRequest({
        password: "MySecretPass123!",
        code: "secret-pkce-code",
        token_hash: "secret-token-hash",
        type: "email",
      });

      await PUT(request);

      const allLogs = [
        ...consoleSpy.mock.calls.map((c) => JSON.stringify(c)),
        ...consoleErrorSpy.mock.calls.map((c) => JSON.stringify(c)),
      ].join(" ");

      expect(allLogs).not.toContain("MySecretPass123!");
      expect(allLogs).not.toContain("secret-pkce-code");
      expect(allLogs).not.toContain("secret-token-hash");

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("password update success", () => {
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

    it("returns 200 for valid password update (reset token session)", async () => {
      // Reset token sessions behave the same as authenticated users
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

    it("logs authentication method used", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      // Test PKCE
      await PUT(
        createRequest({
          password: "NewSecurePass123!",
          code: "test-code",
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[PasswordUpdate]",
        expect.stringContaining("PKCE")
      );

      consoleSpy.mockClear();

      // Test OTP
      await PUT(
        createRequest({
          password: "NewSecurePass123!",
          token_hash: "test-token",
          type: "email",
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[PasswordUpdate]",
        expect.stringContaining("OTP")
      );

      consoleSpy.mockClear();

      // Test session
      await PUT(
        createRequest({
          password: "NewSecurePass123!",
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[PasswordUpdate]",
        expect.stringContaining("session")
      );

      consoleSpy.mockRestore();
    });
  });
});
