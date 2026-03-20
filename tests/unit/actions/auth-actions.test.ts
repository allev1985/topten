import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signupAction,
  loginAction,
  passwordResetRequestAction,
  passwordUpdateAction,
  passwordChangeAction,
} from "@/actions/auth-actions";

// Mock Next.js navigation — simulate Next.js's digest format so isRedirect checks pass
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const err = new Error(`REDIRECT:${url}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  }),
}));

// Mock Next.js headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock config — preserve schema dependencies via importOriginal
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

// Mock auth service (auto-mock)
vi.mock("@/lib/auth/service");
vi.mock("@/lib/auth/errors", () => ({
  AuthServiceError: class AuthServiceError extends Error {
    public readonly code: string;
    public readonly originalError?: unknown;

    constructor(code: string, message: string, originalError?: unknown) {
      super(message);
      this.name = "AuthServiceError";
      this.code = code;
      this.originalError = originalError;
    }
  },
  isEmailNotVerifiedError: vi.fn(),
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

// Import after mocking
import {
  signup,
  login,
  resetPassword,
  updatePassword,
  changePassword,
  getSession,
} from "@/lib/auth";
import { AuthServiceError } from "@/lib/auth/errors";

// Typed mock references
const mockSignup = vi.mocked(signup);
const mockLogin = vi.mocked(login);
const mockResetPassword = vi.mocked(resetPassword);
const mockUpdatePassword = vi.mocked(updatePassword);
const mockChangePassword = vi.mocked(changePassword);
const mockGetSession = vi.mocked(getSession);

// Helper to create FormData
function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
}

const initialState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
} satisfies import("@/types/forms").ActionState<unknown>;

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
        user: {
          id: "123",
          email: "test@example.com",
          name: "test@example.com",
          emailVerified: false,
        },
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      await expect(signupAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/verify-email"
      );

      // name falls back to email when no name field is provided
      expect(mockSignup).toHaveBeenCalledWith(
        "test@example.com",
        "ValidPass123!@#",
        "test@example.com"
      );
    });

    it("redirects even when email already exists (user enumeration protection)", async () => {
      mockSignup.mockRejectedValue(new Error("User already exists"));

      const formData = createFormData({
        email: "existing@example.com",
        password: "ValidPass123!@#",
      });

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
      mockLogin.mockRejectedValue(
        new AuthServiceError("INVALID_CREDENTIALS", "Invalid email or password")
      );

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
      mockLogin.mockResolvedValue({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          emailVerified: true,
        },
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      await expect(loginAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/dashboard"
      );

      expect(mockLogin).toHaveBeenCalledWith(
        "test@example.com",
        "ValidPass123!@#"
      );
    });

    it("redirects to specified redirectTo on successful login", async () => {
      mockLogin.mockResolvedValue({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          emailVerified: true,
        },
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
      mockLogin.mockResolvedValue({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          emailVerified: true,
        },
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
        redirectTo: "https://evil.com",
      });

      await expect(loginAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/dashboard"
      );
    });

    it("returns error for unverified email", async () => {
      mockLogin.mockRejectedValue(
        new AuthServiceError("EMAIL_NOT_CONFIRMED", "Email not verified")
      );

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
      mockResetPassword.mockResolvedValue({ success: true });

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
          redirectTo: expect.stringContaining("/reset-password"),
        })
      );
    });

    it("returns same success message even if email does not exist", async () => {
      mockResetPassword.mockResolvedValue({ success: true });

      const formData = createFormData({
        email: "nonexistent@example.com",
      });

      const result = await passwordResetRequestAction(initialState, formData);

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

    it("returns error when reset link has expired", async () => {
      mockUpdatePassword.mockRejectedValue(
        new AuthServiceError(
          "SERVICE_ERROR",
          "Authentication link has expired. Please request a new one."
        )
      );

      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
        token: "expired-token",
      });

      const result = await passwordUpdateAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        "Reset link has expired. Please request a new one."
      );
    });

    it("redirects to login on successful password update", async () => {
      mockUpdatePassword.mockResolvedValue({ success: true });

      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
        token: "valid-reset-token",
      });

      await expect(
        passwordUpdateAction(initialState, formData)
      ).rejects.toThrow("REDIRECT:/login");

      expect(mockUpdatePassword).toHaveBeenCalledWith(
        "ValidPass123!@#",
        "valid-reset-token"
      );
    });

    it("returns error when update fails", async () => {
      mockUpdatePassword.mockRejectedValue(
        new AuthServiceError("SERVICE_ERROR", "Update failed")
      );

      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
        token: "valid-reset-token",
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
      expect(result.error).toBe("You must be logged in to perform this action");
    });

    it("returns error when current password is incorrect", async () => {
      mockGetSession.mockResolvedValue({
        authenticated: true,
        user: { id: "123", email: "test@example.com" },
        session: { expiresAt: new Date(Date.now() + 3600000).toISOString() },
      });
      mockChangePassword.mockRejectedValue(
        new AuthServiceError("SERVICE_ERROR", "Current password is incorrect")
      );

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
      mockGetSession.mockResolvedValue({
        authenticated: true,
        user: { id: "123", email: "test@example.com" },
        session: { expiresAt: new Date(Date.now() + 3600000).toISOString() },
      });
      mockChangePassword.mockResolvedValue({ success: true });

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
      mockGetSession.mockResolvedValue({
        authenticated: true,
        user: { id: "123", email: "test@example.com" },
        session: { expiresAt: new Date(Date.now() + 3600000).toISOString() },
      });
      mockChangePassword.mockRejectedValue(
        new AuthServiceError("SERVICE_ERROR", "Update failed")
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
