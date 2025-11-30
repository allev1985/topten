import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signupAction,
  loginAction,
  passwordResetRequestAction,
  passwordUpdateAction,
  passwordChangeAction,
  verifyEmailAction,
  resendVerificationAction,
} from "@/actions/auth-actions";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock Supabase client
const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
const mockVerifyOtp = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockResend = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signUp: mockSignUp,
        signInWithPassword: mockSignIn,
        resetPasswordForEmail: mockResetPasswordForEmail,
        updateUser: mockUpdateUser,
        getUser: mockGetUser,
        signOut: mockSignOut,
        verifyOtp: mockVerifyOtp,
        exchangeCodeForSession: mockExchangeCodeForSession,
        resend: mockResend,
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
      mockSignUp.mockResolvedValue({ error: null, data: { user: {} } });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      await expect(signupAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/verify-email"
      );
    });

    it("redirects even when email already exists (user enumeration protection)", async () => {
      mockSignUp.mockResolvedValue({
        error: { message: "User already exists" },
        data: null,
      });

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
      mockSignIn.mockResolvedValue({
        error: { message: "Invalid login credentials" },
        data: null,
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
      mockSignIn.mockResolvedValue({ error: null, data: { user: {} } });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      await expect(loginAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/dashboard"
      );
    });

    it("redirects to specified redirectTo on successful login", async () => {
      mockSignIn.mockResolvedValue({ error: null, data: { user: {} } });

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
      mockSignIn.mockResolvedValue({ error: null, data: { user: {} } });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
        redirectTo: "https://evil.com",
      });

      await expect(loginAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/dashboard"
      );
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
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const formData = createFormData({
        email: "test@example.com",
      });

      const result = await passwordResetRequestAction(initialState, formData);

      expect(result.isSuccess).toBe(true);
      expect(result.data?.message).toBe(
        "If an account exists, a password reset email has been sent"
      );
    });

    it("returns same success message even if email does not exist", async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: "User not found" },
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
      mockGetUser.mockResolvedValue({ data: { user: null } });

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
      mockGetUser.mockResolvedValue({ data: { user: { id: "123" } } });
      mockUpdateUser.mockResolvedValue({ error: null });
      mockSignOut.mockResolvedValue({ error: null });

      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
      });

      await expect(
        passwordUpdateAction(initialState, formData)
      ).rejects.toThrow("REDIRECT:/login");
    });

    it("returns error when update fails", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "123" } } });
      mockUpdateUser.mockResolvedValue({
        error: { message: "Update failed" },
      });

      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
      });

      const result = await passwordUpdateAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Failed to update password. Please try again.");
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
      mockGetUser.mockResolvedValue({ data: { user: null } });

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
      mockGetUser.mockResolvedValue({
        data: { user: { id: "123", email: "test@example.com" } },
      });
      mockSignIn.mockResolvedValue({
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
      mockGetUser.mockResolvedValue({
        data: { user: { id: "123", email: "test@example.com" } },
      });
      mockSignIn.mockResolvedValue({ error: null, data: { user: {} } });
      mockUpdateUser.mockResolvedValue({ error: null });

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
      mockGetUser.mockResolvedValue({
        data: { user: { id: "123", email: "test@example.com" } },
      });
      mockSignIn.mockResolvedValue({ error: null, data: { user: {} } });
      mockUpdateUser.mockResolvedValue({ error: { message: "Update failed" } });

      const formData = createFormData({
        currentPassword: "OldPass123!@#",
        password: "NewPass123!@#",
        confirmPassword: "NewPass123!@#",
      });

      const result = await passwordChangeAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("Failed to update password. Please try again.");
    });
  });

  describe("verifyEmailAction", () => {
    it("returns success for valid PKCE code", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: {} },
      });

      const result = await verifyEmailAction({ code: "valid-pkce-code" });

      expect(result.isSuccess).toBe(true);
      expect(result.data?.message).toBe("Email verified successfully");
      expect(result.data?.redirectTo).toBe("/dashboard");
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith(
        "valid-pkce-code"
      );
    });

    it("returns success for valid OTP token", async () => {
      mockVerifyOtp.mockResolvedValue({ error: null, data: { session: {} } });

      const result = await verifyEmailAction({
        token_hash: "valid-token-hash",
        type: "email",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.data?.message).toBe("Email verified successfully");
      expect(result.data?.redirectTo).toBe("/dashboard");
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        type: "email",
        token_hash: "valid-token-hash",
      });
    });

    it("returns error for expired PKCE code", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        error: { message: "code has expired" },
        data: null,
      });

      const result = await verifyEmailAction({ code: "expired-code" });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        "This verification link has expired. Please request a new one."
      );
    });

    it("returns error for expired OTP token", async () => {
      mockVerifyOtp.mockResolvedValue({
        error: { message: "Token has expired" },
        data: null,
      });

      const result = await verifyEmailAction({
        token_hash: "expired-token",
        type: "email",
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        "This verification link has expired. Please request a new one."
      );
    });

    it("returns error for invalid PKCE code", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        error: { message: "Invalid code" },
        data: null,
      });

      const result = await verifyEmailAction({ code: "invalid-code" });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        "This verification link is invalid. Please request a new one."
      );
    });

    it("returns error for invalid OTP token", async () => {
      mockVerifyOtp.mockResolvedValue({
        error: { message: "Invalid token" },
        data: null,
      });

      const result = await verifyEmailAction({
        token_hash: "invalid-token",
        type: "email",
      });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(
        "This verification link is invalid. Please request a new one."
      );
    });

    it("returns error when no verification parameters provided", async () => {
      const result = await verifyEmailAction({});

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("No verification code provided.");
    });

    it("returns error when only token_hash provided without type", async () => {
      const result = await verifyEmailAction({ token_hash: "some-token" });

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe("No verification code provided.");
    });
  });

  describe("resendVerificationAction", () => {
    it("returns success for valid email", async () => {
      mockResend.mockResolvedValue({ error: null });

      const formData = createFormData({ email: "test@example.com" });
      const result = await resendVerificationAction(initialState, formData);

      expect(result.isSuccess).toBe(true);
      expect(result.data?.message).toBe(
        "If an account exists with this email, a verification link has been sent."
      );
      expect(mockResend).toHaveBeenCalledWith({
        type: "signup",
        email: "test@example.com",
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining("/auth/verify"),
        }),
      });
    });

    it("returns same success message for non-existent email (enumeration protection)", async () => {
      mockResend.mockResolvedValue({ error: { message: "User not found" } });

      const formData = createFormData({ email: "nonexistent@example.com" });
      const result = await resendVerificationAction(initialState, formData);

      expect(result.isSuccess).toBe(true);
      expect(result.data?.message).toBe(
        "If an account exists with this email, a verification link has been sent."
      );
    });

    it("returns fieldErrors for invalid email format", async () => {
      const formData = createFormData({ email: "invalid-email" });
      const result = await resendVerificationAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.data).toBeNull();
    });

    it("returns fieldErrors for empty email", async () => {
      const formData = createFormData({ email: "" });
      const result = await resendVerificationAction(initialState, formData);

      expect(result.isSuccess).toBe(false);
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.data).toBeNull();
    });
  });
});
