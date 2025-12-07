import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { signup, login, logout } from "@/lib/auth/service";
import { AuthServiceError } from "@/lib/auth/service/errors";
import type {
  SignupResult,
  LoginResult,
  LogoutResult,
} from "@/lib/auth/service/types";
import * as supabaseServer from "@/lib/supabase/server";
import * as emailUtils from "@/lib/utils/formatting/email";
import * as supabaseErrors from "@/lib/auth/helpers/supabase-errors";

// Mock the Supabase server client
vi.mock("@/lib/supabase/server");

// Mock the email masking utility
vi.mock("@/lib/utils/formatting/email");

// Mock the supabase error helper
vi.mock("@/lib/auth/helpers/supabase-errors");

describe("AuthService", () => {
  let mockSupabase: {
    auth: {
      signUp: ReturnType<typeof vi.fn>;
      signInWithPassword: ReturnType<typeof vi.fn>;
      signOut: ReturnType<typeof vi.fn>;
      getUser: ReturnType<typeof vi.fn>;
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

      vi.mocked(supabaseErrors.isEmailNotVerifiedError).mockReturnValue(true);

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

      vi.mocked(supabaseErrors.isEmailNotVerifiedError).mockReturnValue(false);

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
});
