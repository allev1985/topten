/**
 * Integration tests for Auth Service
 *
 * Tests complete authentication workflows using BetterAuth mocks to validate
 * end-to-end auth flows across multiple operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  signup,
  login,
  logout,
  resetPassword,
  updatePassword,
  changePassword,
  getSession,
} from "@/lib/auth";
import { AuthServiceError } from "@/lib/auth/errors";
import { TEST_CREDENTIALS, TEST_TOKENS } from "../../fixtures/auth";
import {
  createMockUser,
  createMockBetterAuthSession,
} from "../../utils/auth/mocks";

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

vi.mock("@/lib/utils/formatting/email", () => ({
  maskEmail: (email: string) => email,
}));

vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("Auth Service Integration Tests", () => {
  const testUser = createMockUser();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Workflow 1: Signup → Login", () => {
    it("completes signup then login after email verification", async () => {
      // Step 1: Signup — email not yet verified
      mockAuthApi.signUpEmail.mockResolvedValue({
        user: { ...testUser, emailVerified: false },
      });

      const signupResult = await signup(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password,
        "Test User"
      );

      expect(signupResult.requiresEmailConfirmation).toBe(true);
      expect(signupResult.user?.id).toBe(testUser.id);

      // Step 2: Login after email is verified externally
      mockAuthApi.signInEmail.mockResolvedValue({ user: testUser });

      const loginResult = await login(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );

      expect(loginResult.user!.id).toBe(testUser.id);
      expect(loginResult.user!.email).toBe(TEST_CREDENTIALS.email);
    });
  });

  describe("Workflow 2: Password Reset Flow", () => {
    it("completes request → token update → login with new password", async () => {
      // Step 1: Request password reset
      mockAuthApi.requestPasswordReset.mockResolvedValue(undefined);

      const resetResult = await resetPassword(TEST_CREDENTIALS.email);

      expect(resetResult.success).toBe(true);

      // Step 2: Update password with reset token
      mockAuthApi.resetPassword.mockResolvedValue(undefined);

      const updateResult = await updatePassword(
        "NewPassword123!",
        TEST_TOKENS.validTokenHash
      );

      expect(updateResult.success).toBe(true);

      // Step 3: Login with new password
      mockAuthApi.signInEmail.mockResolvedValue({ user: testUser });

      const loginResult = await login(
        TEST_CREDENTIALS.email,
        "NewPassword123!"
      );

      expect(loginResult.user!.id).toBe(testUser.id);
    });
  });

  describe("Workflow 3: Session Lifecycle", () => {
    it("handles login → get session → logout → verify session gone", async () => {
      const mockSession = createMockBetterAuthSession();

      // Step 1: Login
      mockAuthApi.signInEmail.mockResolvedValue({ user: testUser });

      const loginResult = await login(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );

      expect(loginResult.user!.id).toBe(testUser.id);

      // Step 2: Get session
      mockAuthApi.getSession.mockResolvedValue(mockSession);

      const sessionResult = await getSession();

      expect(sessionResult.authenticated).toBe(true);
      expect(sessionResult.user?.id).toBe(testUser.id);

      // Step 3: Logout
      mockAuthApi.getSession.mockResolvedValue(mockSession);
      mockAuthApi.signOut.mockResolvedValue(undefined);

      const logoutResult = await logout();

      expect(logoutResult.success).toBe(true);

      // Step 4: Session is gone after logout
      mockAuthApi.getSession.mockResolvedValue(null);

      const finalSession = await getSession();

      expect(finalSession.authenticated).toBe(false);
      expect(finalSession.user).toBeNull();
    });
  });

  describe("Workflow 4: Password Change Flow", () => {
    it("handles change password then login with new password", async () => {
      // Step 1: Change password
      mockAuthApi.changePassword.mockResolvedValue(undefined);

      const changeResult = await changePassword(
        TEST_CREDENTIALS.password,
        "NewPassword456!"
      );

      expect(changeResult.success).toBe(true);

      // Step 2: Login with new password
      mockAuthApi.signInEmail.mockResolvedValue({ user: testUser });

      const loginResult = await login(
        TEST_CREDENTIALS.email,
        "NewPassword456!"
      );

      expect(loginResult.user!.id).toBe(testUser.id);
    });
  });

  describe("State Transitions", () => {
    it("maintains consistent user ID across signup, login, and session", async () => {
      const consistentUserId = "consistent-user-id";
      const specificUser = createMockUser({ id: consistentUserId });

      // Signup
      mockAuthApi.signUpEmail.mockResolvedValue({
        user: { ...specificUser, emailVerified: false },
      });

      const signupResult = await signup(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password,
        "Test User"
      );

      expect(signupResult.user?.id).toBe(consistentUserId);

      // Login
      mockAuthApi.signInEmail.mockResolvedValue({ user: specificUser });

      const loginResult = await login(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );

      expect(loginResult.user!.id).toBe(consistentUserId);

      // Get session
      mockAuthApi.getSession.mockResolvedValue(
        createMockBetterAuthSession({ userId: consistentUserId })
      );

      const sessionResult = await getSession();

      expect(sessionResult.user?.id).toBe(consistentUserId);
    });

    it("always returns success for reset password (enumeration protection)", async () => {
      // Success case — email exists
      mockAuthApi.requestPasswordReset.mockResolvedValue(undefined);

      const successResult = await resetPassword("exists@example.com");

      expect(successResult.success).toBe(true);

      // Failure case — email doesn't exist; service still returns success
      mockAuthApi.requestPasswordReset.mockRejectedValue(
        new Error("User not found")
      );

      const failResult = await resetPassword("nonexistent@example.com");

      expect(failResult.success).toBe(true);
    });

    it("propagates AuthServiceError for invalid credentials on login", async () => {
      mockAuthApi.signInEmail.mockRejectedValue(
        new Error("Invalid email or password")
      );

      await expect(
        login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.weakPassword)
      ).rejects.toThrow(AuthServiceError);
    });
  });
});
