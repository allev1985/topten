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

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

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
    mockFetch.mockReset();
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message: "Please check your email to verify your account",
          }),
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      await expect(signupAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/verify-email"
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/auth/signup",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "ValidPass123!@#",
          }),
        })
      );
    });

    it("redirects even when email already exists (user enumeration protection)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: "AUTH_ERROR",
              message: "User already exists",
            },
          }),
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
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: "AUTH_ERROR",
              message: "Invalid email or password",
            },
          }),
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            redirectTo: "/dashboard",
          }),
      });

      const formData = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      await expect(loginAction(initialState, formData)).rejects.toThrow(
        "REDIRECT:/dashboard"
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "ValidPass123!@#",
            redirectTo: undefined,
          }),
        })
      );
    });

    it("redirects to specified redirectTo on successful login", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            redirectTo: "/settings",
          }),
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            // API should validate and return default if invalid
            redirectTo: "/dashboard",
          }),
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message:
              "If an account exists, a password reset email has been sent",
          }),
      });

      const formData = createFormData({
        email: "test@example.com",
      });

      const result = await passwordResetRequestAction(initialState, formData);

      expect(result.isSuccess).toBe(true);
      expect(result.data?.message).toBe(
        "If an account exists, a password reset email has been sent"
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/auth/password/reset",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
          }),
        })
      );
    });

    it("returns same success message even if email does not exist", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message:
              "If an account exists, a password reset email has been sent",
          }),
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
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: "AUTH_ERROR",
              message: "Authentication required",
            },
          }),
      });

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
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message: "Password updated successfully",
          }),
      });

      const formData = createFormData({
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
      });

      await expect(
        passwordUpdateAction(initialState, formData)
      ).rejects.toThrow("REDIRECT:/login");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/auth/password",
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Cookie: "session=mock-session-value",
          }),
          body: JSON.stringify({
            password: "ValidPass123!@#",
          }),
        })
      );
    });

    it("returns error when update fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "Update failed",
            },
          }),
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
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            authenticated: false,
            user: null,
          }),
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
      // First call for session - returns authenticated user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            authenticated: true,
            user: { id: "123", email: "test@example.com" },
          }),
      });

      // Second call for login/verify - returns error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: "AUTH_ERROR",
              message: "Invalid credentials",
            },
          }),
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
      // First call for session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            authenticated: true,
            user: { id: "123", email: "test@example.com" },
          }),
      });

      // Second call for login/verify
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            redirectTo: "/dashboard",
          }),
      });

      // Third call for password update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message: "Password updated successfully",
          }),
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
      // First call for session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            authenticated: true,
            user: { id: "123", email: "test@example.com" },
          }),
      });

      // Second call for login/verify
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            redirectTo: "/dashboard",
          }),
      });

      // Third call for password update - fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "Update failed",
            },
          }),
      });

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
});
