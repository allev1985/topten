import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  getRequestPathname,
  createLoginRedirect,
  createAllowResponse,
  pathStartsWithAny,
  getRedirectToFromRequest,
} from "@/lib/auth/middleware-helpers";

// Mock getValidatedRedirect
vi.mock("@/lib/utils/redirect-validation", () => ({
  getValidatedRedirect: vi.fn((url: string | null) => {
    // Simple mock: return valid paths, default for invalid
    if (url && url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return "/dashboard";
  }),
}));

describe("middleware-helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRequestPathname", () => {
    it("returns the pathname from the request", () => {
      const request = new NextRequest("http://localhost/dashboard/my-lists");
      expect(getRequestPathname(request)).toBe("/dashboard/my-lists");
    });

    it("returns root pathname for root URL", () => {
      const request = new NextRequest("http://localhost/");
      expect(getRequestPathname(request)).toBe("/");
    });

    it("handles paths with query strings", () => {
      const request = new NextRequest(
        "http://localhost/login?redirectTo=/dashboard"
      );
      expect(getRequestPathname(request)).toBe("/login");
    });
  });

  describe("createLoginRedirect", () => {
    it("redirects to /login with redirectTo parameter", () => {
      const request = new NextRequest("http://localhost/dashboard/my-lists");
      const response = createLoginRedirect(request, "/dashboard/my-lists");

      expect(response.status).toBe(307);
      const location = response.headers.get("Location");
      expect(location).toContain("/login");
      expect(location).toContain("redirectTo");
    });

    it("includes the original path in redirectTo", () => {
      const request = new NextRequest("http://localhost/dashboard/settings");
      const response = createLoginRedirect(request, "/dashboard/settings");

      const location = response.headers.get("Location");
      // URL should contain the path (URL-encoded)
      expect(location).toContain("redirectTo=");
      // The path gets URL-encoded, so check for encoded version
      expect(location).toContain("%2Fdashboard%2Fsettings");
    });

    it("uses validated redirect URL", async () => {
      const { getValidatedRedirect } =
        await import("@/lib/utils/redirect-validation");
      const request = new NextRequest("http://localhost/dashboard");
      createLoginRedirect(request, "/dashboard");

      expect(getValidatedRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });

  describe("createAllowResponse", () => {
    it("returns a NextResponse with 200-like pass-through", () => {
      const request = new NextRequest("http://localhost/dashboard");
      const response = createAllowResponse(request);

      // NextResponse.next() returns a response that passes through
      expect(response).toBeDefined();
      expect(response.headers.get("Location")).toBeNull();
    });
  });

  describe("pathStartsWithAny", () => {
    it("returns true when pathname exactly matches a prefix", () => {
      expect(pathStartsWithAny("/dashboard", ["/dashboard"])).toBe(true);
    });

    it("returns true when pathname starts with a prefix followed by /", () => {
      expect(pathStartsWithAny("/dashboard/my-lists", ["/dashboard"])).toBe(
        true
      );
    });

    it("returns false when pathname does not match any prefix", () => {
      expect(pathStartsWithAny("/login", ["/dashboard"])).toBe(false);
    });

    it("returns false for similar but not nested paths", () => {
      expect(pathStartsWithAny("/dashboardz", ["/dashboard"])).toBe(false);
    });

    it("handles multiple prefixes", () => {
      const prefixes = ["/dashboard", "/admin", "/settings"];
      expect(pathStartsWithAny("/admin/users", prefixes)).toBe(true);
      expect(pathStartsWithAny("/settings", prefixes)).toBe(true);
      expect(pathStartsWithAny("/public", prefixes)).toBe(false);
    });

    it("returns false for empty prefixes array", () => {
      expect(pathStartsWithAny("/dashboard", [])).toBe(false);
    });

    it("returns false for empty pathname", () => {
      expect(pathStartsWithAny("", ["/dashboard"])).toBe(false);
    });
  });

  describe("getRedirectToFromRequest", () => {
    it("returns validated redirectTo from query params", async () => {
      const { getValidatedRedirect } =
        await import("@/lib/utils/redirect-validation");
      const request = new NextRequest(
        "http://localhost/login?redirectTo=/dashboard/my-lists"
      );

      const result = getRedirectToFromRequest(request);

      expect(getValidatedRedirect).toHaveBeenCalledWith("/dashboard/my-lists");
      expect(result).toBe("/dashboard/my-lists");
    });

    it("returns default when redirectTo is missing", async () => {
      const { getValidatedRedirect } =
        await import("@/lib/utils/redirect-validation");
      const request = new NextRequest("http://localhost/login");

      const result = getRedirectToFromRequest(request);

      expect(getValidatedRedirect).toHaveBeenCalledWith(null);
      expect(result).toBe("/dashboard");
    });

    it("returns default for invalid redirectTo", async () => {
      const { getValidatedRedirect } =
        await import("@/lib/utils/redirect-validation");
      const request = new NextRequest(
        "http://localhost/login?redirectTo=//evil.com"
      );

      const result = getRedirectToFromRequest(request);

      expect(getValidatedRedirect).toHaveBeenCalledWith("//evil.com");
      expect(result).toBe("/dashboard");
    });
  });
});
