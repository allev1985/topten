import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/signup/route";
import { NextRequest } from "next/server";

// Mock the Supabase server client
const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signUp: mockSignUp,
      },
    })
  ),
}));

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for successful signup
    mockSignUp.mockResolvedValue({
      data: { user: { id: "123" }, session: null },
      error: null,
    });
  });

  const createRequest = (body: unknown): NextRequest => {
    return new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify(body),
    });
  };

  describe("valid signup", () => {
    it("returns 201 with success message for valid credentials", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.message).toBe(
        "Please check your email to verify your account"
      );
    });

    it("calls Supabase signUp with correct parameters", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      await POST(request);

      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "SecurePass123!",
        options: {
          emailRedirectTo: expect.stringContaining("/api/auth/verify"),
        },
      });
    });

    it("normalizes email to lowercase", async () => {
      const request = createRequest({
        email: "Test@Example.COM",
        password: "SecurePass123!",
      });

      await POST(request);

      expect(mockSignUp).toHaveBeenCalledWith(
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

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
        })
      );
    });
  });

  describe("invalid email", () => {
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
  });

  describe("weak password", () => {
    it("returns 400 for password shorter than 12 characters", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "Short1!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("12"),
          }),
        ])
      );
    });

    it("returns 400 for password without uppercase", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "securepass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("uppercase"),
          }),
        ])
      );
    });

    it("returns 400 for password without lowercase", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SECUREPASS123!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("lowercase"),
          }),
        ])
      );
    });

    it("returns 400 for password without number", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePassword!",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("number"),
          }),
        ])
      );
    });

    it("returns 400 for password without special character", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass1234",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "password",
            message: expect.stringContaining("special character"),
          }),
        ])
      );
    });

    it("returns all password validation errors at once", async () => {
      const request = createRequest({
        email: "test@example.com",
        password: "weak",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.details.length).toBeGreaterThan(1);
    });
  });

  describe("user enumeration protection", () => {
    it("returns identical 201 response for existing email", async () => {
      // Simulate Supabase returning an error for existing user
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" },
      });

      const request = createRequest({
        email: "existing@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      // Should return same response as successful signup
      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.message).toBe(
        "Please check your email to verify your account"
      );
    });

    it("does not leak whether email exists in error message", async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered" },
      });

      const request = createRequest({
        email: "existing@example.com",
        password: "SecurePass123!",
      });

      const response = await POST(request);
      const body = await response.json();

      // Response should not contain any indication of existing user
      expect(JSON.stringify(body)).not.toContain("already");
      expect(JSON.stringify(body)).not.toContain("exists");
      expect(JSON.stringify(body)).not.toContain("registered");
    });
  });

  describe("error handling", () => {
    it("returns 500 for invalid JSON body", async () => {
      const request = new NextRequest("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });

    it("returns 500 for Supabase connection error", async () => {
      mockSignUp.mockRejectedValue(new Error("Connection failed"));

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
  });

  describe("logging", () => {
    it("logs signup attempt on success", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Signup]",
        expect.stringContaining("Signup attempt")
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
  });
});
