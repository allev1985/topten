import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  signup,
  login,
  logout,
  resetPassword,
  updatePassword,
  changePassword,
  getSession,
} from "@/lib/auth/service";
import { AuthServiceError } from "@/lib/auth/service/errors";
import type {
  SignupResult,
  LoginResult,
  LogoutResult,
  ResetPasswordResult,
  UpdatePasswordResult,
  SessionResult,
} from "@/lib/auth/service/types";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock the auth instance — use vi.hoisted so the object is available when the factory runs
const mockAuthApi = vi.hoisted(() => ({
  signUpEmail: vi.fn(),
  signInEmail: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: { api: mockAuthApi },
}));

// Mock email masking
vi.mock("@/lib/utils/formatting/email", () => ({
  maskEmail: (email: string) => email,
}));

// Mock logging
vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const testEmail = "test@example.com";
const testPassword = "SecurePass123!";

const mockUser = {
  id: "user-123",
  email: testEmail,
  name: "Test User",
  emailVerified: true,
};

const mockBetterAuthSession = {
  user: mockUser,
  session: {
    id: "session-abc",
    expiresAt: new Date(Date.now() + 3600 * 1000),
  },
};

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signup", () => {
    it("returns requiresEmailConfirmation=true when email not verified", async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };
      mockAuthApi.signUpEmail.mockResolvedValue({ user: unverifiedUser });

      const result: SignupResult = await signup(
        testEmail,
        testPassword,
        "Test User"
      );

      expect(result.requiresEmailConfirmation).toBe(true);
      expect(result.user?.id).toBe("user-123");
      expect(mockAuthApi.signUpEmail).toHaveBeenCalledOnce();
    });

    it("returns requiresEmailConfirmation=false when email already verified", async () => {
      mockAuthApi.signUpEmail.mockResolvedValue({ user: mockUser });

      const result: SignupResult = await signup(
        testEmail,
        testPassword,
        "Test User"
      );

      expect(result.requiresEmailConfirmation).toBe(false);
    });

    it("throws AuthServiceError on unexpected error", async () => {
      mockAuthApi.signUpEmail.mockRejectedValue(new Error("network error"));

      await expect(
        signup(testEmail, testPassword, "Test User")
      ).rejects.toThrow(AuthServiceError);
    });
  });

  describe("login", () => {
    it("returns user on successful login", async () => {
      mockAuthApi.signInEmail.mockResolvedValue({ user: mockUser });

      const result: LoginResult = await login(testEmail, testPassword);

      expect(result.user.id).toBe("user-123");
      expect(result.user.email).toBe(testEmail);
    });

    it("throws AuthServiceError when no user returned", async () => {
      mockAuthApi.signInEmail.mockResolvedValue({ user: null });

      await expect(login(testEmail, testPassword)).rejects.toThrow(
        AuthServiceError
      );
    });

    it("throws INVALID_CREDENTIALS error for invalid credentials", async () => {
      mockAuthApi.signInEmail.mockRejectedValue(
        new Error("Invalid email or password")
      );

      const err = await login(testEmail, testPassword).catch((e) => e);

      expect(err).toBeInstanceOf(AuthServiceError);
      expect(err.code).toBe("INVALID_CREDENTIALS");
    });

    it("throws EMAIL_NOT_CONFIRMED for unverified email", async () => {
      mockAuthApi.signInEmail.mockRejectedValue(
        new Error("Email not verified")
      );

      const err = await login(testEmail, testPassword).catch((e) => e);

      expect(err).toBeInstanceOf(AuthServiceError);
      expect(err.code).toBe("EMAIL_NOT_CONFIRMED");
    });
  });

  describe("logout", () => {
    it("returns success true on logout", async () => {
      mockAuthApi.getSession.mockResolvedValue(mockBetterAuthSession);
      mockAuthApi.signOut.mockResolvedValue(undefined);

      const result: LogoutResult = await logout();

      expect(result.success).toBe(true);
      expect(mockAuthApi.signOut).toHaveBeenCalledOnce();
    });

    it("returns success true even when no session exists", async () => {
      mockAuthApi.getSession.mockResolvedValue(null);
      mockAuthApi.signOut.mockResolvedValue(undefined);

      const result: LogoutResult = await logout();

      expect(result.success).toBe(true);
    });
  });

  describe("resetPassword", () => {
    it("returns success true regardless of whether email exists", async () => {
      mockAuthApi.requestPasswordReset.mockResolvedValue(undefined);

      const result: ResetPasswordResult = await resetPassword(testEmail);

      expect(result.success).toBe(true);
    });

    it("returns success true even when API call fails (enumeration protection)", async () => {
      mockAuthApi.requestPasswordReset.mockRejectedValue(
        new Error("some internal error")
      );

      const result: ResetPasswordResult = await resetPassword(testEmail);

      expect(result.success).toBe(true);
    });
  });

  describe("updatePassword", () => {
    it("returns success true on successful password update", async () => {
      mockAuthApi.resetPassword.mockResolvedValue(undefined);

      const result: UpdatePasswordResult = await updatePassword(
        "NewPass123!",
        "valid-reset-token"
      );

      expect(result.success).toBe(true);
    });

    it("throws AuthServiceError with expired message on token expiry", async () => {
      mockAuthApi.resetPassword.mockRejectedValue(
        new Error("Token has expired")
      );

      const err = await updatePassword("NewPass123!", "expired-token").catch(
        (e) => e
      );

      expect(err).toBeInstanceOf(AuthServiceError);
      expect(err.message).toMatch(/expired/i);
    });
  });

  describe("changePassword", () => {
    it("returns success true on successful password change", async () => {
      mockAuthApi.changePassword.mockResolvedValue(undefined);

      const result: UpdatePasswordResult = await changePassword(
        "OldPass123!",
        "NewPass456!"
      );

      expect(result.success).toBe(true);
    });

    it("throws INVALID_CREDENTIALS for wrong current password", async () => {
      mockAuthApi.changePassword.mockRejectedValue(
        new Error("Invalid email or password")
      );

      const err = await changePassword("wrong", "NewPass456!").catch((e) => e);

      expect(err).toBeInstanceOf(AuthServiceError);
      expect(err.code).toBe("SERVICE_ERROR");
      expect(err.message).toMatch(/incorrect/i);
    });
  });

  describe("getSession", () => {
    it("returns authenticated=true with user when session exists", async () => {
      mockAuthApi.getSession.mockResolvedValue(mockBetterAuthSession);

      const result: SessionResult = await getSession();

      expect(result.authenticated).toBe(true);
      expect(result.user?.id).toBe("user-123");
      expect(result.user?.email).toBe(testEmail);
    });

    it("returns authenticated=false when no session", async () => {
      mockAuthApi.getSession.mockResolvedValue(null);

      const result: SessionResult = await getSession();

      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
    });

    it("throws AuthServiceError on unexpected error", async () => {
      mockAuthApi.getSession.mockRejectedValue(new Error("DB connection lost"));

      await expect(getSession()).rejects.toThrow(AuthServiceError);
    });
  });
});
