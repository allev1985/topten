import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import {
  errorResponse,
  successResponse,
  redirectResponse,
} from "@/lib/utils/api-response";
import { AuthError, validationError, serverError } from "@/lib/auth/errors";

describe("api-response utilities", () => {
  describe("errorResponse", () => {
    it("creates JSON response from AuthError with correct status", async () => {
      const error = serverError();
      const response = errorResponse(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      });
    });

    it("creates JSON response from validation error with details", async () => {
      const error = validationError([
        { field: "email", message: "Invalid email format" },
      ]);
      const response = errorResponse(error);

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: [{ field: "email", message: "Invalid email format" }],
        },
      });
    });

    it("creates JSON response with custom status from AuthError", async () => {
      const error = new AuthError("AUTH_ERROR", "Custom auth error", 401);
      const response = errorResponse(error);

      expect(response.status).toBe(401);
    });
  });

  describe("successResponse", () => {
    it("creates success JSON response with default status 200", async () => {
      const response = successResponse();

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({ success: true });
    });

    it("creates success JSON response with data", async () => {
      const response = successResponse({ userId: "123", name: "Test" });

      const body = await response.json();
      expect(body).toEqual({
        success: true,
        userId: "123",
        name: "Test",
      });
    });

    it("creates success JSON response with message", async () => {
      const response = successResponse({ message: "Logged out successfully" });

      const body = await response.json();
      expect(body).toEqual({
        success: true,
        message: "Logged out successfully",
      });
    });

    it("creates success JSON response with redirectTo", async () => {
      const response = successResponse({ redirectTo: "/dashboard" });

      const body = await response.json();
      expect(body).toEqual({
        success: true,
        redirectTo: "/dashboard",
      });
    });

    it("creates success JSON response with custom status", async () => {
      const response = successResponse({ id: "new-resource" }, 201);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toEqual({
        success: true,
        id: "new-resource",
      });
    });
  });

  describe("redirectResponse", () => {
    it("creates redirect response with origin and path", () => {
      const response = redirectResponse(
        "http://localhost:3000",
        "/auth/success"
      );

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/auth/success"
      );
    });

    it("creates redirect response with query parameters", () => {
      const response = redirectResponse(
        "http://localhost:3000",
        "/auth/error",
        { error: "invalid_token" }
      );

      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/auth/error?error=invalid_token"
      );
    });

    it("creates redirect response with multiple query parameters", () => {
      const response = redirectResponse(
        "http://localhost:3000",
        "/auth/error",
        { error: "expired_token", retry: "true" }
      );

      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/auth/error?error=expired_token&retry=true"
      );
    });

    it("creates redirect response without query parameters when empty object", () => {
      const response = redirectResponse(
        "http://localhost:3000",
        "/dashboard",
        {}
      );

      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });

    it("creates redirect response without query parameters when undefined", () => {
      const response = redirectResponse(
        "http://localhost:3000",
        "/dashboard",
        undefined
      );

      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });
  });
});
