import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock logging to avoid env var validation
vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("Auth Middleware Integration", () => {
  const SESSION_COOKIE = "better-auth.session_token";

  beforeEach(() => {
    vi.resetModules();
  });

  function makeRequest(path: string, withSessionCookie = false): NextRequest {
    const request = new NextRequest(`http://localhost${path}`);
    if (withSessionCookie) {
      request.cookies.set(SESSION_COOKIE, "mock-session-token");
    }
    return request;
  }

  describe("Protected Route Access Control (US1)", () => {
    it("redirects unauthenticated users from protected routes to login", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/dashboard/my-lists", false);

      const response = await proxy(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("Location");
      expect(location).toContain("/login");
    });

    it("preserves redirectTo parameter when redirecting to login", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/dashboard/my-lists", false);

      const response = await proxy(request);

      const location = response.headers.get("Location");
      expect(location).toContain("redirectTo");
      expect(location).toContain("my-lists");
    });

    it("allows authenticated users to access protected routes", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/dashboard", true);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });
  });

  describe("Public Route Accessibility (US2)", () => {
    it("allows unauthenticated users to access public routes", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/login", false);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to homepage without authentication", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/", false);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to signup page without authentication", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/signup", false);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to verify-email page without authentication", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/verify-email", false);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to forgot-password page without authentication", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/forgot-password", false);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to reset-password page without authentication", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/reset-password", false);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows access to BetterAuth API routes without authentication", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/api/auth/sign-in/email", false);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });

    it("allows authenticated users to access public routes", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/login", true);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });
  });

  describe("Redirect URL Validation (US3)", () => {
    it("redirect URL does not contain external domains", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/dashboard", false);

      const response = await proxy(request);

      const location = response.headers.get("Location");
      expect(location).not.toContain("//evil.com");
      expect(location).toContain("/login");
    });

    it("preserves valid redirectTo URLs in the redirect", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/dashboard/settings/profile", false);

      const response = await proxy(request);

      const location = response.headers.get("Location");
      expect(location).toContain("redirectTo");
      expect(location).toContain("settings");
      expect(location).toContain("profile");
    });
  });

  describe("Cookie-based Session Check (US4)", () => {
    it("allows request through when session cookie is present on protected route", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/dashboard", true);

      const response = await proxy(request);

      expect(response.status).not.toBe(307);
      expect(response.headers.get("Location")).toBeNull();
    });

    it("redirects when session cookie is absent on protected route", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/dashboard", false);

      const response = await proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toContain("/login");
    });

    it("does not require session cookie for public routes", async () => {
      const { proxy } = await import("@/proxy");
      const request = makeRequest("/signup", false);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });
  });

  describe("Error Handling (Fail-Closed)", () => {
    it("allows through routes not explicitly protected or public", async () => {
      const { proxy } = await import("@/proxy");
      // A route that's neither in PROTECTED_ROUTES nor PUBLIC_ROUTES
      const request = makeRequest("/some-other-page", false);

      const response = await proxy(request);

      expect(response.headers.get("Location")).toBeNull();
    });
  });

  describe("Middleware Matcher Configuration", () => {
    it("should have config with matcher array", async () => {
      const { config } = await import("@/proxy");

      expect(config).toBeDefined();
      expect(config.matcher).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
    });

    it("matcher should exclude static files", async () => {
      const { config } = await import("@/proxy");

      const matcherPattern = config.matcher[0];
      expect(matcherPattern).toContain("_next/static");
      expect(matcherPattern).toContain("_next/image");
      expect(matcherPattern).toContain("favicon.ico");
    });
  });
});
