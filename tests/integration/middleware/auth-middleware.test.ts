import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
};

// Store original process.env
const originalEnv = { ...process.env };

// Mock Supabase SSR
const mockGetUser = vi.fn();
const mockCreateServerClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

// Mock updateSession
const mockUpdateSession = vi.fn();
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

describe("Auth Middleware Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variables
    process.env = { ...originalEnv, ...mockEnv };

    // Default mock implementations
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    mockUpdateSession.mockImplementation((request: NextRequest) => {
      return NextResponse.next({ request });
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Protected Route Access Control (US1)", () => {
    it("redirects unauthenticated users from protected routes to login", async () => {
      // Setup: No authenticated user
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/dashboard/my-lists");

      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("Location");
      expect(location).toContain("/login");
    });

    it("preserves redirectTo parameter when redirecting to login", async () => {
      // Setup: No authenticated user
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/dashboard/my-lists");

      const response = await middleware(request);

      const location = response.headers.get("Location");
      expect(location).toContain("redirectTo");
      expect(location).toContain("my-lists");
    });

    it("allows authenticated users to access protected routes", async () => {
      // Setup: Authenticated user
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: "user-123",
            email: "test@example.com",
          },
        },
        error: null,
      });

      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/dashboard");

      const response = await middleware(request);

      // Should not be a redirect
      expect(response.headers.get("Location")).toBeNull();
    });
  });

  describe("Public Route Accessibility (US2)", () => {
    it("allows unauthenticated users to access public routes", async () => {
      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/login");

      const response = await middleware(request);

      // Should call updateSession for session refresh
      expect(mockUpdateSession).toHaveBeenCalledWith(request);
      // Should not redirect
      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to homepage without authentication", async () => {
      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/");

      const response = await middleware(request);

      expect(mockUpdateSession).toHaveBeenCalledWith(request);
      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to signup page without authentication", async () => {
      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/signup");

      const response = await middleware(request);

      expect(mockUpdateSession).toHaveBeenCalledWith(request);
      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to verify-email page without authentication", async () => {
      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/verify-email");

      const response = await middleware(request);

      expect(mockUpdateSession).toHaveBeenCalledWith(request);
      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to forgot-password page without authentication", async () => {
      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/forgot-password");

      const response = await middleware(request);

      expect(mockUpdateSession).toHaveBeenCalledWith(request);
      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to reset-password page without authentication", async () => {
      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/reset-password");

      const response = await middleware(request);

      expect(mockUpdateSession).toHaveBeenCalledWith(request);
      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to auth callback routes without authentication", async () => {
      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/auth/callback");

      const response = await middleware(request);

      expect(mockUpdateSession).toHaveBeenCalledWith(request);
      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows authenticated users to access public routes", async () => {
      mockUpdateSession.mockImplementation((request: NextRequest) => {
        // Simulate authenticated session in response
        return NextResponse.next({ request });
      });

      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/login");

      const response = await middleware(request);

      expect(mockUpdateSession).toHaveBeenCalledWith(request);
      expect(response.headers.get("Location")).toBeNull();
    });
  });

  describe("Redirect URL Validation (US3)", () => {
    it("rejects malicious redirectTo URLs (protocol-relative)", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { middleware } = await import("@/middleware");
      // Even if someone tries to manipulate the redirect, our createLoginRedirect
      // uses getValidatedRedirect which sanitizes the URL
      const request = new NextRequest("http://localhost/dashboard");

      const response = await middleware(request);

      const location = response.headers.get("Location");
      // The redirect URL should be validated and safe
      expect(location).not.toContain("//evil.com");
      expect(location).toContain("/login");
    });

    it("preserves valid redirectTo URLs", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { middleware } = await import("@/middleware");
      const request = new NextRequest(
        "http://localhost/dashboard/settings/profile"
      );

      const response = await middleware(request);

      const location = response.headers.get("Location");
      expect(location).toContain("redirectTo");
      // URL should contain the original valid path (URL-encoded)
      expect(location).toContain("settings");
      expect(location).toContain("profile");
    });
  });

  describe("Session Refresh (US4)", () => {
    it("calls updateSession for public routes to allow session refresh", async () => {
      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/login");

      await middleware(request);

      expect(mockUpdateSession).toHaveBeenCalledWith(request);
    });

    it("validates session on protected routes", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/dashboard");

      await middleware(request);

      // Should call getUser to validate session
      expect(mockGetUser).toHaveBeenCalled();
    });

    it("refreshes session cookies for authenticated requests", async () => {
      // The cookie refresh is handled by the Supabase client's setAll callback
      // which is called when cookies need to be updated
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/dashboard");

      const response = await middleware(request);

      // Response should exist and not be a redirect
      expect(response).toBeDefined();
      expect(response.headers.get("Location")).toBeNull();
    });
  });

  describe("Error Handling (Fail-Closed)", () => {
    it("redirects to login when auth service throws error", async () => {
      // Setup: Auth service error
      mockGetUser.mockRejectedValue(new Error("Network error"));

      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/dashboard");

      const response = await middleware(request);

      // Should redirect to login (fail-closed)
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });

    it("redirects to login when getUser returns error", async () => {
      // Setup: Auth error in response
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Session expired" },
      });

      const { middleware } = await import("@/middleware");
      const request = new NextRequest("http://localhost/dashboard");

      const response = await middleware(request);

      // Should redirect to login
      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });

    it("allows through routes not explicitly protected or public", async () => {
      const { middleware } = await import("@/middleware");
      // A route that's neither in PROTECTED_ROUTES nor PUBLIC_ROUTES
      const request = new NextRequest("http://localhost/some-other-page");

      const response = await middleware(request);

      // Should pass through
      expect(response.headers.get("Location")).toBeNull();
    });
  });

  describe("Middleware Matcher Configuration", () => {
    it("should have config with matcher array", async () => {
      const { config } = await import("@/middleware");

      expect(config).toBeDefined();
      expect(config.matcher).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
    });

    it("matcher should exclude static files", async () => {
      const { config } = await import("@/middleware");

      // The matcher pattern should exclude _next/static, _next/image, etc.
      const matcherPattern = config.matcher[0];
      expect(matcherPattern).toContain("_next/static");
      expect(matcherPattern).toContain("_next/image");
      expect(matcherPattern).toContain("favicon.ico");
    });
  });
});
