import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";

// Mock the Supabase server client
const mockSignInWithPassword = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    })
  ),
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for successful login
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "123", email: "test@example.com" }, session: {} },
      error: null,
    });
  });

  const createRequest = (body: unknown): NextRequest => {
    return new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("login success", () => {
    it("returns 200 with success=true and redirectTo", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.redirectTo).toBe("/dashboard");
    });

    it("calls signInWithPassword with correct params", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      await POST(request);

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "SecurePass123!",
      });
    });

    it("normalizes email to lowercase", async () => {
      const request = createRequest({
        email: "Test@Example.COM",
        password: "SecurePass123!",
      });

      await POST(request);

      expect(mockSignInWithPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
        })
      );
    });

    it("trims whitespace from email", async () => {
      const request = createRequest({
        email: "  test@example.com  ",
        password: "SecurePass123!",
      });

      await POST(request);

      expect(mockSignInWithPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
        })
      );
    });
  });

  describe("redirectTo handling", () => {
    it("returns /dashboard as default when redirectTo not provided", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.redirectTo).toBe("/dashboard");
    });

    it("accepts valid relative paths", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
        redirectTo: "/lists/my-favorites",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.redirectTo).toBe("/lists/my-favorites");
    });

    it("validates and returns provided redirectTo", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
        redirectTo: "/@username/coffee-cafes/my-list",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.redirectTo).toBe("/@username/coffee-cafes/my-list");
    });
  });

  describe("validation errors", () => {
    it("returns 400 for missing email", async () => {
      const request = createRequest({
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid email format", async () => {
      const request = createRequest({
        email: "invalid-email",
        password: "SecurePass123!",
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

    it("returns 400 for missing password", async () => {
      const request = createRequest({
        email: "test@example.com",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for empty email", async () => {
      const request = createRequest({
        email: "",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for empty password", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("authentication failures", () => {
    it("returns 401 with AUTH_ERROR for wrong password", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Invalid login credentials",
          code: "invalid_credentials",
        },
      });

      const request = createRequest({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
      expect(body.error.message).toBe("Invalid email or password");
    });

    it("returns 401 with identical message for unknown email (user enumeration protection)", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Invalid login credentials",
          code: "invalid_credentials",
        },
      });

      const request = createRequest({
        email: "unknown@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
      expect(body.error.message).toBe("Invalid email or password");
    });
  });

  describe("unverified email", () => {
    it("returns 401 with verify email message when email not confirmed via error code", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Email not confirmed",
          code: "email_not_confirmed",
          status: 400,
        },
      });

      const request = createRequest({
        email: "unverified@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
      expect(body.error.message).toBe(
        "Please verify your email before logging in"
      );
    });

    it("returns 401 with verify email message when email not confirmed via message", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Email not confirmed",
          status: 400,
        },
      });

      const request = createRequest({
        email: "unverified@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_ERROR");
      expect(body.error.message).toBe(
        "Please verify your email before logging in"
      );
    });
  });

  describe("redirect validation (integration)", () => {
    it("rejects absolute external URLs (https://evil.com)", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
        redirectTo: "https://evil.com",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.redirectTo).toBe("/dashboard");
    });

    it("rejects protocol-relative URLs (//evil.com)", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
        redirectTo: "//evil.com",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.redirectTo).toBe("/dashboard");
    });

    it("rejects javascript: URLs", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
        redirectTo: "javascript:alert(1)",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.redirectTo).toBe("/dashboard");
    });

    it("rejects data: URLs", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
        redirectTo: "data:text/html,<script>alert(1)</script>",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.redirectTo).toBe("/dashboard");
    });

    it("handles URL-encoded malicious URLs", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
        redirectTo: "/%2f%2fevil.com",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.redirectTo).toBe("/dashboard");
    });
  });

  describe("server errors", () => {
    it("returns 500 for Supabase connection error", async () => {
      mockSignInWithPassword.mockRejectedValue(new Error("Connection failed"));

      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SERVER_ERROR");
    });

    it("returns 500 for unexpected exceptions", async () => {
      mockSignInWithPassword.mockRejectedValue(new Error("Unexpected error"));

      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("SERVER_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });
  });

  describe("logging", () => {
    it("logs login attempt on success", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Login]",
        expect.stringContaining("Login attempt")
      );

      consoleSpy.mockRestore();
    });

    it("does not log password in logs", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      await POST(request);

      const allLogs = [
        ...consoleSpy.mock.calls.map((c) => JSON.stringify(c)),
        ...consoleErrorSpy.mock.calls.map((c) => JSON.stringify(c)),
      ].join(" ");

      expect(allLogs).not.toContain("SecurePass123!");

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("masks emails in logs", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      await POST(request);

      const allLogs = consoleSpy.mock.calls
        .map((c) => JSON.stringify(c))
        .join(" ");

      expect(allLogs).not.toContain("test@example.com");
      expect(allLogs).toContain("te***@example.com");

      consoleSpy.mockRestore();
    });
  });
});
