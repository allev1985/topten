import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/password/reset/route";
import { NextRequest } from "next/server";

// Mock the Supabase server client
const mockResetPasswordForEmail = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    })
  ),
}));

describe("POST /api/auth/password/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for successful reset
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
  });

  const createRequest = (body: unknown): NextRequest => {
    return new NextRequest("http://localhost:3000/api/auth/password/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("password reset success", () => {
    it("returns 200 success for registered email", async () => {
      const request = createRequest({
        email: "registered@example.com",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe(
        "If an account exists, a password reset email has been sent"
      );
    });

    it("returns 200 success for unregistered email (enumeration protection)", async () => {
      // Simulate Supabase returning success even for non-existent emails
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const request = createRequest({
        email: "unknown@example.com",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe(
        "If an account exists, a password reset email has been sent"
      );
    });

    it("calls resetPasswordForEmail with correct params", async () => {
      const request = createRequest({
        email: "test@example.com",
      });

      await POST(request);

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/reset-password"),
        })
      );
    });

    it("normalizes email to lowercase", async () => {
      const request = createRequest({
        email: "Test@Example.COM",
      });

      await POST(request);

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(Object)
      );
    });

    it("trims whitespace from email", async () => {
      const request = createRequest({
        email: "  test@example.com  ",
      });

      await POST(request);

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(Object)
      );
    });
  });

  describe("validation errors", () => {
    it("returns 400 for invalid email format", async () => {
      const request = createRequest({
        email: "invalid-email",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "email",
            message: expect.stringContaining("email"),
          }),
        ])
      );
    });

    it("returns 400 for missing email", async () => {
      const request = createRequest({});

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for empty email", async () => {
      const request = createRequest({ email: "" });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("server errors", () => {
    it("returns 500 for server errors", async () => {
      mockResetPasswordForEmail.mockRejectedValue(
        new Error("Connection failed")
      );

      const request = createRequest({
        email: "test@example.com",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SERVER_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });

    it("still returns success when Supabase returns an error (enumeration protection)", async () => {
      // Even if Supabase returns an error, we should return success
      // to prevent user enumeration
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: "User not found" },
      });

      const request = createRequest({
        email: "notfound@example.com",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe("logging", () => {
    it("logs reset requests with masked email", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const request = createRequest({
        email: "test@example.com",
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[PasswordReset]",
        expect.stringContaining("te***@example.com")
      );

      consoleSpy.mockRestore();
    });

    it("does not log full email address", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const request = createRequest({
        email: "sensitive@example.com",
      });

      await POST(request);

      const allLogs = [
        ...consoleSpy.mock.calls.map((c) => JSON.stringify(c)),
        ...consoleErrorSpy.mock.calls.map((c) => JSON.stringify(c)),
      ].join(" ");

      expect(allLogs).not.toContain("sensitive@example.com");

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
