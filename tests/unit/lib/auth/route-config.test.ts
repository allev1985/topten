import { describe, it, expect } from "vitest";
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "@/lib/config";
import { isProtectedRoute, isPublicRoute } from "@/lib/auth/helpers/middleware";

describe("route-config", () => {
  describe("PROTECTED_ROUTES", () => {
    it("includes /dashboard", () => {
      expect(PROTECTED_ROUTES).toContain("/dashboard");
    });

    it("includes /settings", () => {
      expect(PROTECTED_ROUTES).toContain("/settings");
    });

    it("is a tuple type (const assertion)", () => {
      // The `as const` assertion creates a readonly tuple type
      // We verify it has a fixed length and expected values
      expect(PROTECTED_ROUTES.length).toBe(2);
    });
  });

  describe("PUBLIC_ROUTES", () => {
    it("includes homepage", () => {
      expect(PUBLIC_ROUTES).toContain("/");
    });

    it("includes login page", () => {
      expect(PUBLIC_ROUTES).toContain("/login");
    });

    it("includes signup page", () => {
      expect(PUBLIC_ROUTES).toContain("/signup");
    });

    it("includes verify-email page", () => {
      expect(PUBLIC_ROUTES).toContain("/verify-email");
    });

    it("includes forgot-password page", () => {
      expect(PUBLIC_ROUTES).toContain("/forgot-password");
    });

    it("includes reset-password page", () => {
      expect(PUBLIC_ROUTES).toContain("/reset-password");
    });

    it("includes auth callback routes", () => {
      expect(PUBLIC_ROUTES).toContain("/auth");
    });

    it("is a tuple type (const assertion)", () => {
      // The `as const` assertion creates a readonly tuple type
      // We verify it has the expected number of public routes
      expect(PUBLIC_ROUTES.length).toBe(7);
    });
  });

  describe("isProtectedRoute", () => {
    it("returns true for /dashboard", () => {
      expect(isProtectedRoute("/dashboard")).toBe(true);
    });

    it("returns true for /dashboard/my-lists", () => {
      expect(isProtectedRoute("/dashboard/my-lists")).toBe(true);
    });

    it("returns true for /settings", () => {
      expect(isProtectedRoute("/settings")).toBe(true);
    });

    it("returns true for /settings/password", () => {
      expect(isProtectedRoute("/settings/password")).toBe(true);
    });

    it("returns true for /dashboard/settings/password", () => {
      expect(isProtectedRoute("/dashboard/settings/password")).toBe(true);
    });

    it("returns false for /login", () => {
      expect(isProtectedRoute("/login")).toBe(false);
    });

    it("returns false for /", () => {
      expect(isProtectedRoute("/")).toBe(false);
    });

    it("returns false for /dashboardz (not a nested route)", () => {
      expect(isProtectedRoute("/dashboardz")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isProtectedRoute("")).toBe(false);
    });
  });

  describe("isPublicRoute", () => {
    it("returns true for /", () => {
      expect(isPublicRoute("/")).toBe(true);
    });

    it("returns true for /login", () => {
      expect(isPublicRoute("/login")).toBe(true);
    });

    it("returns true for /signup", () => {
      expect(isPublicRoute("/signup")).toBe(true);
    });

    it("returns true for /verify-email", () => {
      expect(isPublicRoute("/verify-email")).toBe(true);
    });

    it("returns true for /forgot-password", () => {
      expect(isPublicRoute("/forgot-password")).toBe(true);
    });

    it("returns true for /reset-password", () => {
      expect(isPublicRoute("/reset-password")).toBe(true);
    });

    it("returns true for /auth/callback", () => {
      expect(isPublicRoute("/auth/callback")).toBe(true);
    });

    it("returns true for /auth/error", () => {
      expect(isPublicRoute("/auth/error")).toBe(true);
    });

    it("returns false for /dashboard", () => {
      expect(isPublicRoute("/dashboard")).toBe(false);
    });

    it("returns false for /dashboard/my-lists", () => {
      expect(isPublicRoute("/dashboard/my-lists")).toBe(false);
    });

    it("returns false for /loginz (not a nested route)", () => {
      expect(isPublicRoute("/loginz")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isPublicRoute("")).toBe(false);
    });
  });
});
