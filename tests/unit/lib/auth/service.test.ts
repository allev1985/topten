import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  signup,
  login,
  logout,
  resetPassword,
  updatePassword,
  getSession,
  refreshSession,
  verifyEmail,
} from "@/lib/auth/service";
import { AuthServiceError } from "@/lib/auth/service/errors";
import type {
  SignupResult,
  LoginResult,
  LogoutResult,
  ResetPasswordResult,
  UpdatePasswordResult,
  SessionResult,
  RefreshSessionResult,
  VerifyEmailResult,
} from "@/lib/auth/service/types";
import * as supabaseServer from "@/lib/supabase/server";
import * as emailUtils from "@/lib/utils/formatting/email";
import * as serviceErrors from "@/lib/auth/service/errors";
import * as sessionHelpers from "@/lib/auth/helpers/session";

// Mock the Supabase server client
vi.mock("@/lib/supabase/server");

// Mock the email masking utility
vi.mock("@/lib/utils/formatting/email");

// Mock the service errors module
vi.mock("@/lib/auth/service/errors", async () => {
  const actual = await vi.importActual<typeof serviceErrors>(
    "@/lib/auth/service/errors"
  );
  return {
    ...actual,
    isEmailNotVerifiedError: vi.fn(),
    isExpiredTokenError: vi.fn(),
    isSessionError: vi.fn(),
  };
});

// Mock the session helpers
vi.mock("@/lib/auth/helpers/session");

// Helper to create mock user
const mockUser = {
  id: "user-123",
  email: "test@example.com",
};

// Helper to create mock session
const createMockSession = (expiresInSeconds: number) => ({
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: expiresInSeconds,
  expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  token_type: "bearer",
  user: mockUser,
});

describe("AuthService", () => {
  let mockSupabase: {
    auth: {
      signUp: ReturnType<typeof vi.fn>;
      signInWithPassword: ReturnType<typeof vi.fn>;
      signOut: ReturnType<typeof vi.fn>;
      getUser: ReturnType<typeof vi.fn>;
      resetPasswordForEmail: ReturnType<typeof vi.fn>;
      updateUser: ReturnType<typeof vi.fn>;
      verifyOtp: ReturnType<typeof vi.fn>;
      getSession: ReturnType<typeof vi.fn>;
      refreshSession: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getUser: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        verifyOtp: vi.fn(),
        getSession: vi.fn(),
        refreshSession: vi.fn(),
      },
    };

    // Mock createClient to return our mock
    vi.mocked(supabaseServer.createClient).mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase as any
    );

    // Mock maskEmail to just return the email
    vi.mocked(emailUtils.maskEmail).mockImplementation(
      (email: string) => email
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signup", () => {
    const testEmail = "test@example.com";
    const testPassword = "SecurePass123!";

    it("should successfully sign up a user with email confirmation required", async () => {
      const mockUser = {
        id: "user-123",
        email: testEmail,
        created_at: new Date().toISOString(),
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: null, // No session when email confirmation required
        },
        error: null,
      });

      const result: SignupResult = await signup(testEmail, testPassword);

      expect(result).toEqual({
        requiresEmailConfirmation: true,
        user: mockUser,
        session: null,
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: undefined,
        },
      });
    });

    it("should successfully sign up a user without email confirmation (auto-login)", async () => {
      const mockUser = {
        id: "user-123",
        email: testEmail,
        created_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const result: SignupResult = await signup(testEmail, testPassword);

      expect(result).toEqual({
        requiresEmailConfirmation: false,
        user: mockUser,
        session: {
          access_token: mockSession.access_token,
          refresh_token: mockSession.refresh_token,
        },
      });
    });

    it("should include emailRedirectTo in options when provided", async () => {
      const redirectUrl = "https://example.com/verify";

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: "user-123", email: testEmail },
          session: null,
        },
        error: null,
      });

      await signup(testEmail, testPassword, { emailRedirectTo: redirectUrl });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
    });

    it("should throw AuthServiceError when Supabase returns an error", async () => {
      const supabaseError = {
        message: "User already exists",
        status: 400,
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: supabaseError,
      });

      await expect(signup(testEmail, testPassword)).rejects.toThrow(
        AuthServiceError
      );
      await expect(signup(testEmail, testPassword)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Failed to create account",
      });
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      mockSupabase.auth.signUp.mockRejectedValue(new Error("Network error"));

      await expect(signup(testEmail, testPassword)).rejects.toThrow(
        AuthServiceError
      );
      await expect(signup(testEmail, testPassword)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "An unexpected error occurred during signup",
      });
    });
  });

  describe("login", () => {
    const testEmail = "test@example.com";
    const testPassword = "SecurePass123!";

    it("should successfully log in a user", async () => {
      const mockUser = {
        id: "user-123",
        email: testEmail,
        created_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const result: LoginResult = await login(testEmail, testPassword);

      expect(result).toEqual({
        user: mockUser,
        session: {
          access_token: mockSession.access_token,
          refresh_token: mockSession.refresh_token,
        },
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: testEmail,
        password: testPassword,
      });
    });

    it("should throw EMAIL_NOT_CONFIRMED error for unverified email", async () => {
      const supabaseError = {
        message: "Email not confirmed",
        code: "email_not_confirmed",
        status: 400,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: supabaseError,
      });

      vi.mocked(serviceErrors.isEmailNotVerifiedError).mockReturnValue(true);

      await expect(login(testEmail, testPassword)).rejects.toThrow(
        AuthServiceError
      );
      await expect(login(testEmail, testPassword)).rejects.toMatchObject({
        code: "EMAIL_NOT_CONFIRMED",
        message: "Please verify your email before logging in",
      });
    });

    it("should throw INVALID_CREDENTIALS error for wrong password", async () => {
      const supabaseError = {
        message: "Invalid login credentials",
        status: 400,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: supabaseError,
      });

      vi.mocked(serviceErrors.isEmailNotVerifiedError).mockReturnValue(false);

      await expect(login(testEmail, testPassword)).rejects.toThrow(
        AuthServiceError
      );
      await expect(login(testEmail, testPassword)).rejects.toMatchObject({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    });

    it("should throw SERVICE_ERROR when user data is incomplete", async () => {
      // Simulate successful auth but missing session (edge case)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: "user-123", email: testEmail },
          session: null, // Should not happen on successful login
        },
        error: null,
      });

      await expect(login(testEmail, testPassword)).rejects.toThrow(
        AuthServiceError
      );
      await expect(login(testEmail, testPassword)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Login succeeded but session data is incomplete",
      });
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error("Network error")
      );

      await expect(login(testEmail, testPassword)).rejects.toThrow(
        AuthServiceError
      );
      await expect(login(testEmail, testPassword)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "An unexpected error occurred during login",
      });
    });
  });

  describe("logout", () => {
    it("should successfully log out a user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: "user-123",
            email: "test@example.com",
          },
        },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result: LogoutResult = await logout();

      expect(result).toEqual({
        success: true,
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("should succeed even when no user is logged in", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: null,
        },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result: LogoutResult = await logout();

      expect(result).toEqual({
        success: true,
      });
    });

    it("should succeed even when Supabase signOut returns an error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "user-123" },
        },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: "Session already expired" },
      });

      const result: LogoutResult = await logout();

      // Should still succeed for idempotency
      expect(result).toEqual({
        success: true,
      });
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error("Network error"));

      await expect(logout()).rejects.toThrow(AuthServiceError);
      await expect(logout()).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "An unexpected error occurred during logout",
      });
    });
  });

  describe("resetPassword", () => {
    const testEmail = "test@example.com";

    it("should successfully request password reset", async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      const result: ResetPasswordResult = await resetPassword(testEmail);

      expect(result).toEqual({
        success: true,
      });

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        testEmail,
        {
          redirectTo: undefined,
        }
      );
    });

    it("should include redirectTo in options when provided", async () => {
      const redirectUrl = "https://example.com/reset";

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      await resetPassword(testEmail, { redirectTo: redirectUrl });

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        testEmail,
        {
          redirectTo: redirectUrl,
        }
      );
    });

    it("should return success even when Supabase returns an error (enumeration protection)", async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: "User not found" },
      });

      const result: ResetPasswordResult = await resetPassword(testEmail);

      expect(result).toEqual({
        success: true,
      });
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      mockSupabase.auth.resetPasswordForEmail.mockRejectedValue(
        new Error("Network error")
      );

      await expect(resetPassword(testEmail)).rejects.toThrow(AuthServiceError);
      await expect(resetPassword(testEmail)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "An unexpected error occurred during password reset",
      });
    });
  });

  describe("updatePassword", () => {
    const testPassword = "NewSecurePass123!";
    const testEmail = "test@example.com";

    it("should successfully update password with OTP token", async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: {
          user: { id: "user-123", email: testEmail },
        },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: "user-123", email: testEmail } },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result: UpdatePasswordResult = await updatePassword(testPassword, {
        token_hash: "valid-token",
        type: "recovery",
      });

      expect(result).toEqual({
        success: true,
      });

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        type: "recovery",
        token_hash: "valid-token",
      });

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: testPassword,
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("should successfully update password with session", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "user-123", email: testEmail },
        },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: "user-123", email: testEmail } },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result: UpdatePasswordResult = await updatePassword(testPassword);

      expect(result).toEqual({
        success: true,
      });

      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: testPassword,
      });
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("should throw error for invalid OTP token", async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" },
      });

      vi.mocked(serviceErrors.isExpiredTokenError).mockReturnValue(false);

      await expect(
        updatePassword(testPassword, {
          token_hash: "invalid-token",
          type: "recovery",
        })
      ).rejects.toThrow(AuthServiceError);
      await expect(
        updatePassword(testPassword, {
          token_hash: "invalid-token",
          type: "recovery",
        })
      ).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Authentication failed",
      });
    });

    it("should throw error for expired OTP token", async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: null },
        error: { message: "Token has expired" },
      });

      vi.mocked(serviceErrors.isExpiredTokenError).mockReturnValue(true);

      await expect(
        updatePassword(testPassword, {
          token_hash: "expired-token",
          type: "recovery",
        })
      ).rejects.toThrow(AuthServiceError);
      await expect(
        updatePassword(testPassword, {
          token_hash: "expired-token",
          type: "recovery",
        })
      ).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Authentication link has expired. Please request a new one.",
      });
    });

    it("should throw error for unauthenticated session", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      await expect(updatePassword(testPassword)).rejects.toThrow(
        AuthServiceError
      );
      await expect(updatePassword(testPassword)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Authentication required",
      });
    });

    it("should succeed even if signOut fails after password update", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: { id: "user-123", email: testEmail },
        },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: "user-123", email: testEmail } },
        error: null,
      });

      mockSupabase.auth.signOut.mockRejectedValue(new Error("Sign out failed"));

      const result: UpdatePasswordResult = await updatePassword(testPassword);

      expect(result).toEqual({
        success: true,
      });
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error("Network error"));

      await expect(updatePassword(testPassword)).rejects.toThrow(
        AuthServiceError
      );
      await expect(updatePassword(testPassword)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "An unexpected error occurred during password update",
      });
    });
  });

  describe("getSession", () => {
    it("should return authenticated session info", async () => {
      const mockSession = createMockSession(3600);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      vi.mocked(sessionHelpers.getSessionInfo).mockReturnValue({
        isValid: true,
        user: { id: mockUser.id, email: mockUser.email },
        expiresAt: new Date(mockSession.expires_at * 1000),
        isExpiringSoon: false,
      });

      const result: SessionResult = await getSession();

      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
      });
      expect(result.session).toBeDefined();
      expect(result.session?.isExpiringSoon).toBe(false);
    });

    it("should return unauthenticated when no session exists", async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(sessionHelpers.getSessionInfo).mockReturnValue({
        isValid: false,
        user: null,
        expiresAt: null,
        isExpiringSoon: false,
      });

      const result: SessionResult = await getSession();

      expect(result.authenticated).toBe(false);
      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      mockSupabase.auth.getSession.mockRejectedValue(
        new Error("Network error")
      );

      await expect(getSession()).rejects.toThrow(AuthServiceError);
      await expect(getSession()).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "An unexpected error occurred while getting session",
      });
    });
  });

  describe("refreshSession", () => {
    it("should successfully refresh session", async () => {
      const mockSession = {
        ...createMockSession(3600),
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      };
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result: RefreshSessionResult = await refreshSession();

      expect(result.session.access_token).toBe("new-access-token");
      expect(result.session.refresh_token).toBe("new-refresh-token");
      expect(result.session.expiresAt).toBeDefined();

      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
    });

    it("should throw error when refresh fails", async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Refresh token expired" },
      });

      await expect(refreshSession()).rejects.toThrow(AuthServiceError);
      await expect(refreshSession()).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Session has expired. Please log in again.",
      });
    });

    it("should throw error when no session is returned", async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(refreshSession()).rejects.toThrow(AuthServiceError);
      await expect(refreshSession()).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Session has expired. Please log in again.",
      });
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      mockSupabase.auth.refreshSession.mockRejectedValue(
        new Error("Network error")
      );

      await expect(refreshSession()).rejects.toThrow(AuthServiceError);
      await expect(refreshSession()).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "An unexpected error occurred during session refresh",
      });
    });
  });

  describe("verifyEmail", () => {
    const testTokenHash = "test-token-hash-123";
    const testType = "email" as const;

    it("should successfully verify email and return user and session", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        created_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
      };

      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const result: VerifyEmailResult = await verifyEmail(
        testTokenHash,
        testType
      );

      expect(result).toEqual({
        user: mockUser,
        session: {
          access_token: mockSession.access_token,
          refresh_token: mockSession.refresh_token,
        },
      });

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        type: testType,
        token_hash: testTokenHash,
      });
    });

    it("should call Supabase verifyOtp with correct parameters", async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: {
          user: mockUser,
          session: createMockSession(3600),
        },
        error: null,
      });

      await verifyEmail(testTokenHash, testType);

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        type: "email",
        token_hash: testTokenHash,
      });
      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthServiceError with expired token error", async () => {
      const expiredError = {
        message: "Token has expired",
        code: "otp_expired",
      };

      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: expiredError,
      });

      vi.mocked(serviceErrors.isExpiredTokenError).mockReturnValue(true);

      await expect(verifyEmail(testTokenHash, testType)).rejects.toThrow(
        AuthServiceError
      );
      await expect(verifyEmail(testTokenHash, testType)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Verification link has expired. Please request a new one.",
      });
    });

    it("should throw AuthServiceError with invalid token error", async () => {
      const invalidError = {
        message: "Invalid token",
        code: "invalid_token",
      };

      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: invalidError,
      });

      vi.mocked(serviceErrors.isExpiredTokenError).mockReturnValue(false);

      await expect(verifyEmail(testTokenHash, testType)).rejects.toThrow(
        AuthServiceError
      );
      await expect(verifyEmail(testTokenHash, testType)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Invalid verification link",
      });
    });

    it("should throw AuthServiceError on Supabase errors", async () => {
      const serverError = {
        message: "Database connection failed",
        code: "db_error",
      };

      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: serverError,
      });

      vi.mocked(serviceErrors.isExpiredTokenError).mockReturnValue(false);

      await expect(verifyEmail(testTokenHash, testType)).rejects.toThrow(
        AuthServiceError
      );
      await expect(verifyEmail(testTokenHash, testType)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });

    it("should throw error when no user is returned", async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: {
          user: null,
          session: createMockSession(3600),
        },
        error: null,
      });

      await expect(verifyEmail(testTokenHash, testType)).rejects.toThrow(
        AuthServiceError
      );
      await expect(verifyEmail(testTokenHash, testType)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Verification failed - no user or session created",
      });
    });

    it("should throw error when no session is returned", async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: {
          user: mockUser,
          session: null,
        },
        error: null,
      });

      await expect(verifyEmail(testTokenHash, testType)).rejects.toThrow(
        AuthServiceError
      );
      await expect(verifyEmail(testTokenHash, testType)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "Verification failed - no user or session created",
      });
    });

    it("should wrap unexpected errors in AuthServiceError", async () => {
      mockSupabase.auth.verifyOtp.mockRejectedValue(new Error("Network error"));

      await expect(verifyEmail(testTokenHash, testType)).rejects.toThrow(
        AuthServiceError
      );
      await expect(verifyEmail(testTokenHash, testType)).rejects.toMatchObject({
        code: "SERVICE_ERROR",
        message: "An unexpected error occurred during email verification",
      });
    });
  });
});
