/**
 * Integration tests for Auth Service
 *
 * Tests complete authentication workflows with realistic Supabase mocks
 * to validate end-to-end auth flows.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
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
import * as supabaseServer from "@/lib/supabase/server";
import * as sessionHelpers from "@/lib/auth/helpers/session";
import {
  createMockUser,
  createMockSession,
  TEST_CREDENTIALS,
  TEST_TOKENS,
} from "../../utils/auth";

// Mock dependencies
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/utils/formatting/email", () => ({
  maskEmail: (email: string) => email.replace(/@.+$/, "@***"),
}));
vi.mock("@/lib/auth/helpers/session");

describe("Auth Service Integration Tests", () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  function createMockSupabaseClient() {
    return {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getUser: vi.fn(),
        getSession: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        verifyOtp: vi.fn(),
        refreshSession: vi.fn(),
      },
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    vi.mocked(supabaseServer.createClient).mockResolvedValue(
      mockSupabase as any
    );
  });

  describe("Workflow 1: Complete Signup Flow", () => {
    it("should complete signup → email verification → login workflow", async () => {
      const testUser = createMockUser();
      const testSession = createMockSession();

      // Step 1: Signup
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: testUser, session: null },
        error: null,
      });

      const signupResult = await signup(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );

      expect(signupResult.requiresEmailConfirmation).toBe(true);
      expect(signupResult.user).toEqual(testUser);
      expect(signupResult.session).toBeNull();

      // Step 2: Verify email
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: testUser, session: testSession },
        error: null,
      });

      const verifyResult = await verifyEmail(TEST_TOKENS.validTokenHash, "email");

      expect(verifyResult.user).toEqual(testUser);
      expect(verifyResult.session).toBeDefined();

      // Step 3: Login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: testUser, session: testSession },
        error: null,
      });

      const loginResult = await login(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );

      expect(loginResult.user).toEqual(testUser);
      expect(loginResult.session).toBeDefined();
    });
  });

  describe("Workflow 2: Password Reset Flow", () => {
    it("should complete password reset request → update → login workflow", async () => {
      const testUser = createMockUser();
      const testSession = createMockSession();

      // Step 1: Request password reset
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      const resetResult = await resetPassword(TEST_CREDENTIALS.email);

      expect(resetResult.success).toBe(true);

      // Step 2: Update password with OTP token
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: testUser },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const updateResult = await updatePassword("NewPassword123!", {
        token_hash: TEST_TOKENS.validTokenHash,
        type: "recovery",
      });

      expect(updateResult.success).toBe(true);

      // Step 3: Login with new password
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: testUser, session: testSession },
        error: null,
      });

      const loginResult = await login(TEST_CREDENTIALS.email, "NewPassword123!");

      expect(loginResult.user).toEqual(testUser);
      expect(loginResult.session).toBeDefined();
    });
  });

  describe("Workflow 3: Session Lifecycle", () => {
    it("should handle login → get session → refresh session → logout workflow", async () => {
      const testUser = createMockUser();
      const testSession = createMockSession();

      // Step 1: Login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: testUser, session: testSession },
        error: null,
      });

      const loginResult = await login(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );

      expect(loginResult.user).toEqual(testUser);

      // Step 2: Get session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: testSession },
        error: null,
      });

      vi.mocked(sessionHelpers.getSessionInfo).mockReturnValue({
        isValid: true,
        user: testUser,
        expiresAt: new Date(testSession.expires_at! * 1000),
        isExpiringSoon: false,
      });

      const sessionResult = await getSession();

      expect(sessionResult.authenticated).toBe(true);
      expect(sessionResult.user).toEqual(testUser);

      // Step 3: Refresh session
      const refreshedSession = createMockSession(7200); // 2 hours
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: refreshedSession },
        error: null,
      });

      const refreshResult = await refreshSession();

      expect(refreshResult.session.access_token).toBe(
        refreshedSession.access_token
      );

      // Step 4: Logout
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const logoutResult = await logout();

      expect(logoutResult.success).toBe(true);

      // Step 5: Verify session is gone
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

      const finalSessionResult = await getSession();

      expect(finalSessionResult.authenticated).toBe(false);
    });
  });

  describe("Workflow 4: Password Change Flow", () => {
    it("should handle login → change password → logout → login with new password", async () => {
      const testUser = createMockUser();
      const testSession = createMockSession();

      // Step 1: Login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: testUser, session: testSession },
        error: null,
      });

      await login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

      // Step 2: Change password (session-based)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: testUser },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const updateResult = await updatePassword("NewPassword456!");

      expect(updateResult.success).toBe(true);

      // Step 3: Login with new password
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: testUser, session: testSession },
        error: null,
      });

      const newLoginResult = await login(TEST_CREDENTIALS.email, "NewPassword456!");

      expect(newLoginResult.user).toEqual(testUser);
      expect(newLoginResult.session).toBeDefined();
    });
  });

  describe("State Transitions and Validation", () => {
    it("should maintain consistent user state across operations", async () => {
      const consistentUserId = "consistent-user-id";
      const testUser = createMockUser({ id: consistentUserId });

      // Signup
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: testUser, session: null },
        error: null,
      });

      const signupResult = await signup(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );

      expect(signupResult.user?.id).toBe(consistentUserId);

      // Login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: testUser, session: createMockSession() },
        error: null,
      });

      const loginResult = await login(
        TEST_CREDENTIALS.email,
        TEST_CREDENTIALS.password
      );

      expect(loginResult.user.id).toBe(consistentUserId);

      // Get session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: createMockSession() },
        error: null,
      });

      vi.mocked(sessionHelpers.getSessionInfo).mockReturnValue({
        isValid: true,
        user: testUser,
        expiresAt: new Date(),
        isExpiringSoon: false,
      });

      const sessionResult = await getSession();

      expect(sessionResult.user?.id).toBe(consistentUserId);
    });

    it("should handle session expiry and refresh correctly", async () => {
      const testSession = createMockSession(3600);

      // Get session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: testSession },
        error: null,
      });

      vi.mocked(sessionHelpers.getSessionInfo).mockReturnValue({
        isValid: true,
        user: createMockUser(),
        expiresAt: new Date(testSession.expires_at! * 1000),
        isExpiringSoon: false,
      });

      const sessionResult = await getSession();

      expect(sessionResult.authenticated).toBe(true);

      // Refresh session
      const refreshedSession = createMockSession(7200);
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: refreshedSession },
        error: null,
      });

      const refreshResult = await refreshSession();

      expect(refreshResult.session.expiresAt).toBeDefined();
      expect(refreshResult.session.access_token).toBe(
        refreshedSession.access_token
      );
    });
  });
});
