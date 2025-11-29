import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/auth/verify/route";
import { NextRequest } from "next/server";

// Mock the Supabase server client
const mockVerifyOtp = vi.fn();
const mockExchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        verifyOtp: mockVerifyOtp,
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    })
  ),
}));

describe("GET /api/auth/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockVerifyOtp.mockResolvedValue({
      data: { user: { id: "123" }, session: { access_token: "token" } },
      error: null,
    });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "123" }, session: { access_token: "token" } },
      error: null,
    });
  });

  const createRequest = (params: Record<string, string>): NextRequest => {
    const url = new URL("http://localhost:3000/api/auth/verify");
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url.toString(), {
      method: "GET",
    });
  };

  describe("valid OTP token verification", () => {
    it("redirects to /dashboard on successful OTP verification", async () => {
      const request = createRequest({
        token_hash: "valid_token_hash",
        type: "email",
      });

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });

    it("calls verifyOtp with correct parameters", async () => {
      const request = createRequest({
        token_hash: "valid_token_hash",
        type: "email",
      });

      await GET(request);

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        type: "email",
        token_hash: "valid_token_hash",
      });
    });
  });

  describe("valid PKCE code exchange", () => {
    it("redirects to /dashboard on successful code exchange", async () => {
      const request = createRequest({
        code: "valid_authorization_code",
      });

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });

    it("calls exchangeCodeForSession with correct code", async () => {
      const request = createRequest({
        code: "valid_authorization_code",
      });

      await GET(request);

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith(
        "valid_authorization_code"
      );
    });

    it("prioritizes token_hash over code when both present", async () => {
      const request = createRequest({
        token_hash: "valid_token_hash",
        type: "email",
        code: "valid_code",
      });

      await GET(request);

      expect(mockVerifyOtp).toHaveBeenCalled();
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });
  });

  describe("expired token", () => {
    it("redirects to /auth/error?error=expired_token for expired OTP", async () => {
      mockVerifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Token has expired" },
      });

      const request = createRequest({
        token_hash: "expired_token",
        type: "email",
      });

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/auth/error?error=expired_token"
      );
    });

    it("redirects to /auth/error?error=expired_token for expired code", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Token has expired" },
      });

      const request = createRequest({
        code: "expired_code",
      });

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/auth/error?error=expired_token"
      );
    });
  });

  describe("invalid token", () => {
    it("redirects to /auth/error?error=invalid_token for invalid OTP", async () => {
      mockVerifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid token" },
      });

      const request = createRequest({
        token_hash: "invalid_token",
        type: "email",
      });

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/auth/error?error=invalid_token"
      );
    });

    it("redirects to /auth/error?error=invalid_token for invalid code", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid authorization code" },
      });

      const request = createRequest({
        code: "invalid_code",
      });

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/auth/error?error=invalid_token"
      );
    });
  });

  describe("missing token", () => {
    it("redirects to /auth/error?error=missing_token when no parameters", async () => {
      const request = createRequest({});

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/auth/error?error=missing_token"
      );
    });

    it("redirects to /auth/error?error=missing_token when only type without token_hash", async () => {
      const request = createRequest({
        type: "email",
      });

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/auth/error?error=missing_token"
      );
    });

    it("redirects to /auth/error?error=missing_token when only token_hash without type", async () => {
      const request = createRequest({
        token_hash: "some_token",
      });

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/auth/error?error=missing_token"
      );
    });
  });

  describe("error handling", () => {
    it("redirects to /auth/error?error=server_error on Supabase exception", async () => {
      mockVerifyOtp.mockRejectedValue(new Error("Connection failed"));

      const request = createRequest({
        token_hash: "valid_token",
        type: "email",
      });

      const response = await GET(request);

      expect([302, 307]).toContain(response.status);
      expect(response.headers.get("Location")).toBe(
        "http://localhost:3000/auth/error?error=server_error"
      );
    });
  });

  describe("logging", () => {
    it("logs verification attempt", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const request = createRequest({
        token_hash: "valid_token",
        type: "email",
      });

      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Verify]",
        expect.stringContaining("Verification attempt")
      );

      consoleSpy.mockRestore();
    });

    it("logs successful verification", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      const request = createRequest({
        token_hash: "valid_token",
        type: "email",
      });

      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Verify]",
        expect.stringContaining("successful")
      );

      consoleSpy.mockRestore();
    });

    it("logs verification errors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockVerifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid token" },
      });

      const request = createRequest({
        token_hash: "invalid_token",
        type: "email",
      });

      await GET(request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Verify]",
        expect.stringContaining("error")
      );

      consoleErrorSpy.mockRestore();
    });

    it("does not log sensitive token information", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const request = createRequest({
        token_hash: "secret_token_value_123",
        type: "email",
      });

      await GET(request);

      const allLogs = [
        ...consoleSpy.mock.calls.map((c) => JSON.stringify(c)),
        ...consoleErrorSpy.mock.calls.map((c) => JSON.stringify(c)),
      ].join(" ");

      // Should not contain the full token value
      expect(allLogs).not.toContain("secret_token_value_123");

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
