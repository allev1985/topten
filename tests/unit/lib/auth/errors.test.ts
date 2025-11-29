import { describe, it, expect } from "vitest";

import {
  AuthError,
  validationError,
  invalidTokenError,
  expiredTokenError,
  serverError,
  type AuthErrorCode,
  type AuthErrorDetail,
  type AuthErrorResponse,
} from "@/lib/auth/errors";

describe("AuthError class", () => {
  describe("constructor", () => {
    it("creates error with correct code", () => {
      const error = new AuthError("VALIDATION_ERROR", "Test message", 400);
      expect(error.code).toBe("VALIDATION_ERROR");
    });

    it("creates error with correct message", () => {
      const error = new AuthError("VALIDATION_ERROR", "Test message", 400);
      expect(error.message).toBe("Test message");
    });

    it("creates error with correct httpStatus", () => {
      const error = new AuthError("VALIDATION_ERROR", "Test message", 400);
      expect(error.httpStatus).toBe(400);
    });

    it("creates error with optional details", () => {
      const details: AuthErrorDetail[] = [
        { field: "email", message: "Invalid email" },
      ];
      const error = new AuthError(
        "VALIDATION_ERROR",
        "Test message",
        400,
        details
      );
      expect(error.details).toEqual(details);
    });

    it("creates error without details when not provided", () => {
      const error = new AuthError("VALIDATION_ERROR", "Test message", 400);
      expect(error.details).toBeUndefined();
    });

    it("defaults httpStatus to 400 when not provided", () => {
      const error = new AuthError("VALIDATION_ERROR", "Test message");
      expect(error.httpStatus).toBe(400);
    });

    it("sets name to AuthError", () => {
      const error = new AuthError("VALIDATION_ERROR", "Test message", 400);
      expect(error.name).toBe("AuthError");
    });

    it("is an instance of Error", () => {
      const error = new AuthError("VALIDATION_ERROR", "Test message", 400);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("toResponse", () => {
    it("converts to response format without details", () => {
      const error = new AuthError("VALIDATION_ERROR", "Test message", 400);
      const response = error.toResponse();

      expect(response).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Test message",
        },
      });
    });

    it("converts to response format with details", () => {
      const details: AuthErrorDetail[] = [
        { field: "email", message: "Invalid email" },
        { field: "password", message: "Too short" },
      ];
      const error = new AuthError(
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        details
      );
      const response = error.toResponse();

      expect(response).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: [
            { field: "email", message: "Invalid email" },
            { field: "password", message: "Too short" },
          ],
        },
      });
    });

    it("returns success as false", () => {
      const error = new AuthError("SERVER_ERROR", "Error", 500);
      const response = error.toResponse();
      expect(response.success).toBe(false);
    });

    it("preserves all error codes in response", () => {
      const codes: AuthErrorCode[] = [
        "VALIDATION_ERROR",
        "INVALID_TOKEN",
        "EXPIRED_TOKEN",
        "AUTH_ERROR",
        "SERVER_ERROR",
      ];

      for (const code of codes) {
        const error = new AuthError(code, "Message", 400);
        const response = error.toResponse();
        expect(response.error.code).toBe(code);
      }
    });
  });

  describe("error codes", () => {
    it("supports VALIDATION_ERROR code", () => {
      const error = new AuthError("VALIDATION_ERROR", "Test", 400);
      expect(error.code).toBe("VALIDATION_ERROR");
    });

    it("supports INVALID_TOKEN code", () => {
      const error = new AuthError("INVALID_TOKEN", "Test", 400);
      expect(error.code).toBe("INVALID_TOKEN");
    });

    it("supports EXPIRED_TOKEN code", () => {
      const error = new AuthError("EXPIRED_TOKEN", "Test", 400);
      expect(error.code).toBe("EXPIRED_TOKEN");
    });

    it("supports AUTH_ERROR code", () => {
      const error = new AuthError("AUTH_ERROR", "Test", 401);
      expect(error.code).toBe("AUTH_ERROR");
    });

    it("supports SERVER_ERROR code", () => {
      const error = new AuthError("SERVER_ERROR", "Test", 500);
      expect(error.code).toBe("SERVER_ERROR");
    });
  });
});

describe("error factory functions", () => {
  describe("validationError", () => {
    it("creates error with VALIDATION_ERROR code", () => {
      const error = validationError([]);
      expect(error.code).toBe("VALIDATION_ERROR");
    });

    it("creates error with 400 status", () => {
      const error = validationError([]);
      expect(error.httpStatus).toBe(400);
    });

    it('creates error with "Validation failed" message', () => {
      const error = validationError([]);
      expect(error.message).toBe("Validation failed");
    });

    it("includes provided details", () => {
      const details: AuthErrorDetail[] = [
        { field: "email", message: "Invalid" },
      ];
      const error = validationError(details);
      expect(error.details).toEqual(details);
    });

    it("handles empty details array", () => {
      const error = validationError([]);
      expect(error.details).toEqual([]);
    });

    it("handles multiple details", () => {
      const details: AuthErrorDetail[] = [
        { field: "email", message: "Invalid email" },
        { field: "password", message: "Too short" },
        { field: "password", message: "No uppercase" },
      ];
      const error = validationError(details);
      expect(error.details).toHaveLength(3);
    });
  });

  describe("invalidTokenError", () => {
    it("creates error with INVALID_TOKEN code", () => {
      const error = invalidTokenError();
      expect(error.code).toBe("INVALID_TOKEN");
    });

    it("creates error with 400 status", () => {
      const error = invalidTokenError();
      expect(error.httpStatus).toBe(400);
    });

    it('creates error with "Invalid verification token" message', () => {
      const error = invalidTokenError();
      expect(error.message).toBe("Invalid verification token");
    });

    it("has no details", () => {
      const error = invalidTokenError();
      expect(error.details).toBeUndefined();
    });
  });

  describe("expiredTokenError", () => {
    it("creates error with EXPIRED_TOKEN code", () => {
      const error = expiredTokenError();
      expect(error.code).toBe("EXPIRED_TOKEN");
    });

    it("creates error with 400 status", () => {
      const error = expiredTokenError();
      expect(error.httpStatus).toBe(400);
    });

    it('creates error with "Verification token has expired" message', () => {
      const error = expiredTokenError();
      expect(error.message).toBe("Verification token has expired");
    });

    it("has no details", () => {
      const error = expiredTokenError();
      expect(error.details).toBeUndefined();
    });
  });

  describe("serverError", () => {
    it("creates error with SERVER_ERROR code", () => {
      const error = serverError();
      expect(error.code).toBe("SERVER_ERROR");
    });

    it("creates error with 500 status", () => {
      const error = serverError();
      expect(error.httpStatus).toBe(500);
    });

    it('creates error with "An unexpected error occurred" message', () => {
      const error = serverError();
      expect(error.message).toBe("An unexpected error occurred");
    });

    it("has no details", () => {
      const error = serverError();
      expect(error.details).toBeUndefined();
    });
  });
});

describe("type exports", () => {
  it("exports AuthErrorCode type", () => {
    // This test validates that the type is exported and usable
    const code: AuthErrorCode = "VALIDATION_ERROR";
    expect(code).toBe("VALIDATION_ERROR");
  });

  it("exports AuthErrorDetail type", () => {
    // This test validates that the type is exported and usable
    const detail: AuthErrorDetail = { field: "email", message: "Invalid" };
    expect(detail.field).toBe("email");
    expect(detail.message).toBe("Invalid");
  });

  it("exports AuthErrorResponse type", () => {
    // This test validates that the type is exported and usable
    const response: AuthErrorResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Error",
      },
    };
    expect(response.success).toBe(false);
  });
});
