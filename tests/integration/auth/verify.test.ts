import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the Auth Service
vi.mock("@/lib/auth/service");

// Mock the Supabase server client (still needed for PKCE flow)
vi.mock("@/lib/supabase/server");

// Import after mocking
import { GET } from "@/app/api/auth/verify/route";
import { verifyEmail } from "@/lib/auth/service";
import { createClient } from "@/lib/supabase/server";
import { AuthServiceError } from "@/lib/auth/service/errors";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("GET /api/auth/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup verifyEmail mock
    vi.mocked(verifyEmail).mockResolvedValue({
      user: { id: "123", email: "test@example.com" } as User,
      session: { access_token: "token", refresh_token: "refresh" },
    });

    // Setup createClient mock
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          data: { user: { id: "123" }, session: { access_token: "token" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient);
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

    it("calls verifyEmail with correct parameters", async () => {
      const request = createRequest({
        token_hash: "valid_token_hash",
        type: "email",
      });

      await GET(request);

      expect(verifyEmail).toHaveBeenCalledWith("valid_token_hash", "email");
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

      const client = await createClient();
      expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith(
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

      expect(verifyEmail).toHaveBeenCalled();

      const client = await createClient();
      expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    });
  });

  describe("expired token", () => {
    it("redirects to /auth/error?error=expired_token for expired OTP", async () => {
      vi.mocked(verifyEmail).mockRejectedValue(
        new AuthServiceError(
          "SERVICE_ERROR",
          "Verification link has expired. Please request a new one."
        )
      );

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
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: "Token has expired" },
          }),
        },
      } as unknown as SupabaseClient);

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
      vi.mocked(verifyEmail).mockRejectedValue(
        new AuthServiceError("SERVICE_ERROR", "Invalid verification link")
      );

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
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          exchangeCodeForSession: vi.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: "Invalid authorization code" },
          }),
        },
      } as unknown as SupabaseClient);

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
      vi.mocked(verifyEmail).mockRejectedValue(new Error("Connection failed"));

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
      vi.mocked(verifyEmail).mockRejectedValue(
        new AuthServiceError("SERVICE_ERROR", "Invalid verification link")
      );

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
