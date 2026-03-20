import { describe, it, expect, expectTypeOf } from "vitest";
import type { AuthUser, AuthError, AuthState, AuthResult } from "@/types/auth";

describe("Auth Types", () => {
  describe("AuthError interface", () => {
    it("should have required code and message properties", () => {
      const error: AuthError = {
        code: "invalid_credentials",
        message: "Invalid email or password",
      };

      expect(error.code).toBe("invalid_credentials");
      expect(error.message).toBe("Invalid email or password");
    });
  });

  describe("AuthState discriminated union", () => {
    it("should allow authenticated state with user", () => {
      const mockUser: AuthUser = {
        id: "123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: true,
      };

      const authState: AuthState = {
        status: "authenticated",
        user: mockUser,
      };

      expect(authState.status).toBe("authenticated");
      expect(authState.user).toBe(mockUser);
    });

    it("should allow unauthenticated state with null user", () => {
      const authState: AuthState = {
        status: "unauthenticated",
        user: null,
      };

      expect(authState.status).toBe("unauthenticated");
      expect(authState.user).toBeNull();
    });

    it("should allow loading state with null user", () => {
      const authState: AuthState = {
        status: "loading",
        user: null,
      };

      expect(authState.status).toBe("loading");
      expect(authState.user).toBeNull();
    });
  });

  describe("AuthResult generic type", () => {
    it("should allow success result with data", () => {
      const successResult: AuthResult<{ token: string }> = {
        success: true,
        data: { token: "jwt-token" },
      };

      expect(successResult.success).toBe(true);
      if (successResult.success) {
        expect(successResult.data.token).toBe("jwt-token");
      }
    });

    it("should allow failure result with error", () => {
      const failureResult: AuthResult<{ token: string }> = {
        success: false,
        error: {
          code: "invalid_credentials",
          message: "Invalid email or password",
        },
      };

      expect(failureResult.success).toBe(false);
      if (!failureResult.success) {
        expect(failureResult.error.code).toBe("invalid_credentials");
      }
    });
  });

  describe("Type exports", () => {
    it("should export AuthUser type", () => {
      const user = {} as AuthUser;
      expectTypeOf(user).toMatchTypeOf<AuthUser>();
    });

    it("should export AuthError interface", () => {
      const error: AuthError = { code: "test", message: "test" };
      expectTypeOf(error).toMatchTypeOf<AuthError>();
    });

    it("should export AuthState type", () => {
      const state: AuthState = { status: "loading", user: null };
      expectTypeOf(state).toMatchTypeOf<AuthState>();
    });

    it("should export AuthResult generic type", () => {
      const result: AuthResult<string> = { success: true, data: "test" };
      expectTypeOf(result).toMatchTypeOf<AuthResult<string>>();
    });
  });
});
