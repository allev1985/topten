import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  AuthUser,
  AuthSession,
  AuthError,
  AuthState,
  AuthResult,
} from "@/types/auth";

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

    it("should allow optional status property", () => {
      const errorWithStatus: AuthError = {
        code: "session_expired",
        message: "Your session has expired",
        status: 401,
      };

      expect(errorWithStatus.status).toBe(401);
    });

    it("should work without status property", () => {
      const errorWithoutStatus: AuthError = {
        code: "token_refresh_failed",
        message: "Failed to refresh access token",
      };

      expect(errorWithoutStatus.status).toBeUndefined();
    });
  });

  describe("AuthState discriminated union", () => {
    it("should allow authenticated state with user and session", () => {
      const mockUser = { id: "123", email: "test@example.com" } as AuthUser;
      const mockSession = { access_token: "token" } as AuthSession;

      const authState: AuthState = {
        status: "authenticated",
        user: mockUser,
        session: mockSession,
      };

      expect(authState.status).toBe("authenticated");
      expect(authState.user).toBe(mockUser);
      expect(authState.session).toBe(mockSession);
    });

    it("should allow unauthenticated state with null user and session", () => {
      const authState: AuthState = {
        status: "unauthenticated",
        user: null,
        session: null,
      };

      expect(authState.status).toBe("unauthenticated");
      expect(authState.user).toBeNull();
      expect(authState.session).toBeNull();
    });

    it("should allow loading state with null user and session", () => {
      const authState: AuthState = {
        status: "loading",
        user: null,
        session: null,
      };

      expect(authState.status).toBe("loading");
      expect(authState.user).toBeNull();
      expect(authState.session).toBeNull();
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

    it("should work with different data types", () => {
      const stringResult: AuthResult<string> = {
        success: true,
        data: "success",
      };

      const numberResult: AuthResult<number> = {
        success: true,
        data: 42,
      };

      const objectResult: AuthResult<{ id: string; name: string }> = {
        success: true,
        data: { id: "1", name: "Test" },
      };

      expect(stringResult.data).toBe("success");
      expect(numberResult.data).toBe(42);
      expect(objectResult.data).toEqual({ id: "1", name: "Test" });
    });
  });

  describe("Type exports", () => {
    it("should export AuthUser type (re-exported from supabase)", () => {
      // This test verifies the type is accessible
      const user = {} as AuthUser;
      expectTypeOf(user).toMatchTypeOf<AuthUser>();
    });

    it("should export AuthSession type (re-exported from supabase)", () => {
      // This test verifies the type is accessible
      const session = {} as AuthSession;
      expectTypeOf(session).toMatchTypeOf<AuthSession>();
    });

    it("should export AuthError interface", () => {
      const error: AuthError = { code: "test", message: "test" };
      expectTypeOf(error).toMatchTypeOf<AuthError>();
    });

    it("should export AuthState type", () => {
      const state: AuthState = { status: "loading", user: null, session: null };
      expectTypeOf(state).toMatchTypeOf<AuthState>();
    });

    it("should export AuthResult generic type", () => {
      const result: AuthResult<string> = { success: true, data: "test" };
      expectTypeOf(result).toMatchTypeOf<AuthResult<string>>();
    });
  });
});
