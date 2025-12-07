import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signupAction,
  loginAction,
  passwordResetRequestAction,
  passwordUpdateAction,
  passwordChangeAction,
} from "@/actions/auth-actions";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock Next.js cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: () => [{ name: "session", value: "mock-session-value" }],
    })
  ),
}));

// Mock config - use importOriginal to preserve schema dependencies
vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return {
    ...actual,
    getAppUrl: () => "http://localhost:3000",
    REDIRECT_ROUTES: {
      default: "/dashboard",
      auth: {
        success: "/dashboard",
        error: "/auth/error",
      },
    },
  };
});

// Mock auth service
vi.mock("@/lib/auth/service");
vi.mock("@/lib/auth/service/errors", () => ({
  AuthServiceError: class AuthServiceError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthServiceError";
    }
  },
  isEmailNotVerifiedError: vi.fn(),
}));

// Import after mocking
import { signup, logout, resetPassword, updatePassword, getSession } from "@/lib/auth/service";
import { AuthServiceError } from "@/lib/auth/service/errors";

// Get typed mock references
const mockSignup = vi.mocked(signup);
const mockLogout = vi.mocked(logout);
const mockResetPassword = vi.mocked(resetPassword);
const mockUpdatePassword = vi.mocked(updatePassword);
const mockGetSession = vi.mocked(getSession);

// Mock fetch globally (still used by other actions)
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        getUser: mockGetUser,
        signOut: mockSignOut,
        updateUser: mockUpdateUser,
      },
    })
  ),
}));

// Helper to create FormData
function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
}

// Default initial state for server actions - using 'as' to match action expectations
const initialState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("Auth Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signupAction", () => {
    it("returns fieldErrors for invalid email", async () => {
      const formData = createFormData({
        email: "invalid-email",
        password: "ValidPass123!@#",
      });

      const result = await signupAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.data).toBeNull();
    });

    it("returns fieldErrors for weak password", async () => {
      const formData = createFormData({
        email: "test@example.com",
        password: "weak",
      });

      const result = await signupAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.password).toBeDefined();
      expect(result.fieldErrors.password?.length).toBeGreaterThan(0);
    });

    it("returns fieldErrors for missing email", async () => {
      const formData = createFormData({
        email: "",
        password: "ValidPass123!@#",
      });

      const result = await signupAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.email).toBeDefined();
    });

    it("returns fieldErrors for missing password", async () => {
      const formData = createFormData({
        email: "test@example.com",
        password: "",
      });

      const result = await signupAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.password).toBeDefined();
    });

    it("redirects to verify-email on successful signup", async () => {
      mockSignup.mockResolvedValue({
        requiresEmailConfirmation: true,
        user: { id: "123", email: "test@example.com" },
        session: null,
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      await expect(signupAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/verify-email"
      );

      expect(mockSignup).toHaveBeenCalledWith(
        "test@example.com",
        "ValidPass123!@#"
      );
    });

    it("redirects even when email already exists (user enumeration protection)", async () => {
      mockSignup.mockRejectedValue(new Error("User already exists"));

      const formData = createFormData({
        email: "existing@example.com",
        password: "ValidPass123!@#",
      });

      // Should still redirect (same response for existing email)
      await expect(signupAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/verify-email"
      );
    });
  });

  describe("loginAction", () => {
    it("returns fieldErrors for invalid email format", async () => {
      const formData = createFormData({
        email: "invalid",
        password: "anypassword",
      });

      const result = await loginAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.email).toBeDefined();
    });

    it("returns fieldErrors for empty password", async () => {
      const formData = createFormData({
        email: "test@example.com",
        password: "",
      });

      const result = await loginAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.password).toBeDefined();
    });

    it("returns error for invalid credentials", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Invalid login credentials",
          status: 400,
        },
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "wrongpassword",
      });

      const result = await loginAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Invalid email or password");
      expect(result.fieldErrors).toEqual({});
    });

    it("redirects to dashboard on successful login", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      await expect(loginAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/dashboard"
      );

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });
    });

    it("redirects to specified redirectTo on successful login", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
        redirectTo: "/settings",
      });

      await expect(loginAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/settings"
      );
    });

    it("ignores invalid redirectTo and uses default", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" },
          session: { access_token: "token-123" },
        },
        error: null,
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
        redirectTo: "https://evil.com",
      });

      // Should use default redirect since evil.com is not valid
      await expect(loginAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/dashboard"
      );
    });

    it("returns error for unverified email", async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Email not confirmed",
          status: 400,
          code: "email_not_confirmed",
        },
      });

      const formData = createFormData({
        email: "unverified@example.com",
        password: "ValidPass123!@#",
      });

      const result = await loginAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Please verify your email before logging in");
    });
  });

  describe("passwordResetRequestAction", () => {
    it("returns fieldErrors for invalid email", async () => {
      const formData = createFormData({
        email: "invalid",
      });

      const result = await passwordResetRequestAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.email).toBeDefined();
    });

    it("returns success message regardless of email existence", async () => {
      mockResetPassword.mockResolvedValue({
        success: true,
      });

      const formData = createFormData({
        email: "test@example.com",
      });

      const result = await passwordResetRequestAction(initialState, formData);

      expect(result.isSuccess).toBe(true);
      expect(result.data?.message).toBe(
        "If an account exists, a password reset email has been sent"
      );

      expect(mockResetPassword).toHaveBeenCalledWith(
        "test@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/auth/password/update"),
        })
      );
    });

    it("returns same success message even if email does not exist", async () => {
      mockResetPassword.mockResolvedValue({
        success: true,
      });

      const formData = createFormData({
        email: "nonexistent@example.com",
      });

      const result = await passwordResetRequestAction(initialState, formData);

      // Should still return success for user enumeration protection
      expect(result.isSuccess).toBe(true);
      expect(result.data?.message).toBe(
        "If an account exists, a password reset email has been sent"
      );
    });
  });

  describe("passwordUpdateAction", () => {
    it("returns fieldErrors when passwords do not match", async () => {
      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "DifferentPass123!@#",
      });

      const result = await passwordUpdateAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.confirmPassword).toContain(
        "Passwords do not match"
      );
    });

    it("returns fieldErrors for weak password", async () => {
      const formData = createFormData({
        password: "weak",
        confirmPassword: "weak",
      });

      const result = await passwordUpdateAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.password).toBeDefined();
    });

    it("returns error when session has expired", async () => {
      mockUpdatePassword.mockRejectedValue(
        new AuthServiceError("Authentication link has expired. Please request a new one.")
      );

      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
      });

      const result = await passwordUpdateAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        "Session has expired. Please request a new reset link."
      );
    });

    it("redirects to login on successful password update", async () => {
      mockUpdatePassword.mockResolvedValue({
        success: true,
      });

      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
      });

      await expect(
        passwordUpdateAction(initialState, formData)
      ).rejects.toThrow("REDIRECT:/login");

      expect(mockUpdatePassword).toHaveBeenCalledWith(
        "ValidPass123!@#",
        expect.objectContaining({})
      );
    });

    it("returns error when update fails", async () => {
      mockUpdatePassword.mockRejectedValue(
        new AuthServiceError("Update failed")
      );

      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
      });

      const result = await passwordUpdateAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });

  describe("passwordChangeAction", () => {
    it("returns fieldErrors when current password is missing", async () => {
      const formData = createFormData({
        currentPassword: "",
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
      });

      const result = await passwordChangeAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.currentPassword).toBeDefined();
    });

    it("returns fieldErrors when passwords do not match", async () => {
      const formData = createFormData({
        currentPassword: "OldPass123!@#",
        password: "NewPass123!@#",
        confirmPassword: "DifferentPass123!@#",
      });

      const result = await passwordChangeAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.confirmPassword).toContain(
        "Passwords do not match"
      );
    });

    it("returns fieldErrors for weak new password", async () => {
      const formData = createFormData({
        currentPassword: "OldPass123!@#",
        password: "weak",
        confirmPassword: "weak",
      });

      const result = await passwordChangeAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.password).toBeDefined();
    });

    it("returns error when not authenticated", async () => {
      mockGetSession.mockResolvedValue({
        authenticated: false,
        user: null,
        session: null,
      });

      const formData = createFormData({
        currentPassword: "OldPass123!@#",
        password: "NewPass123!@#",
        confirmPassword: "NewPass123!@#",
      });

      const result = await passwordChangeAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Authentication required");
    });

    it("returns error when current password is incorrect", async () => {
      // Mock authenticated session
      mockGetSession.mockResolvedValue({
        authenticated: true,
        user: { id: "123", email: "test@example.com" },
        session: { expiresAt: "2025-12-08T00:00:00.000Z", isExpiringSoon: false },
      });

      // Mock incorrect password verification
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      });

      const formData = createFormData({
        currentPassword: "WrongPass123!@#",
        password: "NewPass123!@#",
        confirmPassword: "NewPass123!@#",
      });

      const result = await passwordChangeAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Current password is incorrect");
    });

    it("returns success on successful password change", async () => {
      // Mock authenticated session
      mockGetSession.mockResolvedValue({
        authenticated: true,
        user: { id: "123", email: "test@example.com" },
        session: { expiresAt: "2025-12-08T00:00:00.000Z", isExpiringSoon: false },
      });

      // Mock correct password verification
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: "123", email: "test@example.com" },
          session: { access_token: "token" },
        },
        error: null,
      });

      // Mock successful password update
      mockUpdatePassword.mockResolvedValue({
        success: true,
      });

      const formData = createFormData({
        currentPassword: "OldPass123!@#",
        password: "NewPass123!@#",
        confirmPassword: "NewPass123!@#",
      });

      const result = await passwordChangeAction(initialState, formData);

      expect(result.isSuccess).toBe(true);
      expect(result.data?.message).toBe("Password updated successfully");
    });

    it("returns error when password update fails", async () => {
      // Mock authenticated session
      mockGetSession.mockResolvedValue({
        authenticated: true,
        user: { id: "123", email: "test@example.com" },
        session: { expiresAt: "2025-12-08T00:00:00.000Z", isExpiringSoon: false },
      });

      // Mock correct password verification
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: "123", email: "test@example.com" },
          session: { access_token: "token" },
        },
        error: null,
      });

      // Mock password update failure
      mockUpdatePassword.mockRejectedValue(
        new AuthServiceError("Update failed")
      );

      const formData = createFormData({
        currentPassword: "OldPass123!@#",
        password: "NewPass123!@#",
        confirmPassword: "NewPass123!@#",
      });

      const result = await passwordChangeAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });
});
