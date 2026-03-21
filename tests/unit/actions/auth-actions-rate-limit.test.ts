import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const err = new Error(`REDIRECT:${url}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config")>();
  return {
    ...actual,
    getAppUrl: () => "http://localhost:3000",
  };
});

// Mock auth service (auto-mock)
vi.mock("@/lib/auth/service");
vi.mock("@/lib/auth/errors", () => ({
  AuthServiceError: class AuthServiceError extends Error {
    public readonly code: string;
    constructor(code: string, message: string) {
      super(message);
      this.name = "AuthServiceError";
      this.code = code;
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

// Mock profile service
vi.mock("@/lib/profile", () => ({
  isSlugAvailable: vi.fn().mockResolvedValue(true),
  updateSlug: vi.fn().mockResolvedValue(undefined),
}));

// Mock getClientIP
const mockGetClientIP = vi.fn().mockResolvedValue("192.168.1.1");
vi.mock("@/lib/utils/request", () => ({
  getClientIP: (...args: unknown[]) => mockGetClientIP(...args),
}));

// Mock requireAuth
const mockRequireAuth = vi.fn();
vi.mock("@/lib/utils/actions", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));

// Mock rate limiters with controllable check functions
const mockLoginIPCheck = vi.fn();
const mockLoginEmailCheck = vi.fn();
const mockSignupCheck = vi.fn();
const mockResetPasswordIPCheck = vi.fn();
const mockResetPasswordEmailCheck = vi.fn();
const mockMfaSendCheck = vi.fn();
const mockMfaVerifyCheck = vi.fn();
const mockPasswordChangeCheck = vi.fn();

vi.mock("@/lib/services/rate-limit", () => ({
  loginIPLimiter: { check: (...args: unknown[]) => mockLoginIPCheck(...args) },
  loginEmailLimiter: {
    check: (...args: unknown[]) => mockLoginEmailCheck(...args),
  },
  signupLimiter: { check: (...args: unknown[]) => mockSignupCheck(...args) },
  resetPasswordIPLimiter: {
    check: (...args: unknown[]) => mockResetPasswordIPCheck(...args),
  },
  resetPasswordEmailLimiter: {
    check: (...args: unknown[]) => mockResetPasswordEmailCheck(...args),
  },
  mfaSendLimiter: { check: (...args: unknown[]) => mockMfaSendCheck(...args) },
  mfaVerifyLimiter: {
    check: (...args: unknown[]) => mockMfaVerifyCheck(...args),
  },
  passwordChangeLimiter: {
    check: (...args: unknown[]) => mockPasswordChangeCheck(...args),
  },
}));

import {
  signupAction,
  loginAction,
  passwordResetRequestAction,
  passwordChangeAction,
  sendMFACodeAction,
  verifyMFAAction,
} from "@/actions/auth-actions";
import { signup, login, resetPassword, sendMFACode } from "@/lib/auth";

const mockSignup = vi.mocked(signup);
const mockLogin = vi.mocked(login);
const mockResetPassword = vi.mocked(resetPassword);
const mockSendMFACode = vi.mocked(sendMFACode);

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

const initialState = {
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
} satisfies import("@/types/forms").ActionState<unknown>;

const RATE_LIMIT_MESSAGE = "Too many attempts. Please try again later.";

const allowed = {
  allowed: true,
  current: 1,
  limit: 10,
  retryAfterSeconds: 0,
};

const blocked = {
  allowed: false,
  current: 10,
  limit: 10,
  retryAfterSeconds: 300,
};

describe("Auth actions — rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: all limiters allow
    mockLoginIPCheck.mockResolvedValue(allowed);
    mockLoginEmailCheck.mockResolvedValue(allowed);
    mockSignupCheck.mockResolvedValue(allowed);
    mockResetPasswordIPCheck.mockResolvedValue(allowed);
    mockResetPasswordEmailCheck.mockResolvedValue(allowed);
    mockMfaSendCheck.mockResolvedValue(allowed);
    mockMfaVerifyCheck.mockResolvedValue(allowed);
    mockPasswordChangeCheck.mockResolvedValue(allowed);

    mockGetClientIP.mockResolvedValue("192.168.1.1");
    mockRequireAuth.mockResolvedValue({
      userId: "user-123",
      email: "test@example.com",
    });
  });

  describe("signupAction", () => {
    it("returns rate limit error when IP is rate-limited", async () => {
      mockSignupCheck.mockResolvedValue(blocked);

      const fd = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
        name: "Test",
        vanitySlug: "test-user",
      });

      const result = await signupAction(initialState, fd);

      expect(result.error).toBe(RATE_LIMIT_MESSAGE);
      expect(result.isSuccess).toBe(false);
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it("proceeds when IP is within limit", async () => {
      mockSignupCheck.mockResolvedValue(allowed);
      mockSignup.mockResolvedValue({ user: { id: "u1" } } as never);

      const fd = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
        confirmPassword: "ValidPass123!@#",
        name: "Test",
        vanitySlug: "test-user",
      });

      await expect(signupAction(initialState, fd)).rejects.toThrow("REDIRECT");
      expect(mockSignupCheck).toHaveBeenCalledWith("192.168.1.1");
    });
  });

  describe("loginAction", () => {
    it("returns rate limit error when IP is rate-limited", async () => {
      mockLoginIPCheck.mockResolvedValue(blocked);

      const fd = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      const result = await loginAction(initialState, fd);

      expect(result.error).toBe(RATE_LIMIT_MESSAGE);
      expect(result.isSuccess).toBe(false);
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockLoginEmailCheck).not.toHaveBeenCalled();
    });

    it("returns rate limit error when email is rate-limited", async () => {
      mockLoginIPCheck.mockResolvedValue(allowed);
      mockLoginEmailCheck.mockResolvedValue(blocked);

      const fd = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      const result = await loginAction(initialState, fd);

      expect(result.error).toBe(RATE_LIMIT_MESSAGE);
      expect(result.isSuccess).toBe(false);
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("checks email limiter with lowercased email", async () => {
      mockLoginIPCheck.mockResolvedValue(allowed);
      mockLoginEmailCheck.mockResolvedValue(blocked);

      const fd = createFormData({
        email: "Test@Example.COM",
        password: "ValidPass123!@#",
      });

      await loginAction(initialState, fd);

      expect(mockLoginEmailCheck).toHaveBeenCalledWith("test@example.com");
    });

    it("proceeds when both IP and email are within limits", async () => {
      mockLoginIPCheck.mockResolvedValue(allowed);
      mockLoginEmailCheck.mockResolvedValue(allowed);
      mockLogin.mockResolvedValue({ requiresMFA: false } as never);

      const fd = createFormData({
        email: "test@example.com",
        password: "ValidPass123!@#",
      });

      await expect(loginAction(initialState, fd)).rejects.toThrow("REDIRECT");
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  describe("passwordResetRequestAction", () => {
    it("returns rate limit error when IP is rate-limited", async () => {
      mockResetPasswordIPCheck.mockResolvedValue(blocked);

      const fd = createFormData({ email: "test@example.com" });

      const result = await passwordResetRequestAction(initialState, fd);

      expect(result.error).toBe(RATE_LIMIT_MESSAGE);
      expect(result.isSuccess).toBe(false);
      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it("returns rate limit error when email is rate-limited", async () => {
      mockResetPasswordIPCheck.mockResolvedValue(allowed);
      mockResetPasswordEmailCheck.mockResolvedValue(blocked);

      const fd = createFormData({ email: "test@example.com" });

      const result = await passwordResetRequestAction(initialState, fd);

      expect(result.error).toBe(RATE_LIMIT_MESSAGE);
      expect(result.isSuccess).toBe(false);
      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it("proceeds when both limiters allow", async () => {
      mockResetPasswordIPCheck.mockResolvedValue(allowed);
      mockResetPasswordEmailCheck.mockResolvedValue(allowed);
      mockResetPassword.mockResolvedValue(undefined as never);

      const fd = createFormData({ email: "test@example.com" });

      const result = await passwordResetRequestAction(initialState, fd);

      expect(result.isSuccess).toBe(true);
      expect(mockResetPassword).toHaveBeenCalled();
    });
  });

  describe("passwordChangeAction", () => {
    it("returns rate limit error when userId is rate-limited", async () => {
      mockPasswordChangeCheck.mockResolvedValue(blocked);

      const fd = createFormData({
        currentPassword: "OldPass123!@#",
        password: "NewPass123!@#",
        confirmPassword: "NewPass123!@#",
      });

      const result = await passwordChangeAction(initialState, fd);

      expect(result.error).toBe(RATE_LIMIT_MESSAGE);
      expect(result.isSuccess).toBe(false);
    });

    it("checks rate limit with the authenticated userId", async () => {
      mockPasswordChangeCheck.mockResolvedValue(blocked);

      const fd = createFormData({
        currentPassword: "OldPass123!@#",
        password: "NewPass123!@#",
        confirmPassword: "NewPass123!@#",
      });

      await passwordChangeAction(initialState, fd);

      expect(mockPasswordChangeCheck).toHaveBeenCalledWith("user-123");
    });
  });

  describe("sendMFACodeAction", () => {
    it("returns rate limit error when IP is rate-limited", async () => {
      mockMfaSendCheck.mockResolvedValue(blocked);

      const result = await sendMFACodeAction();

      expect(result.error).toBe(RATE_LIMIT_MESSAGE);
      expect(mockSendMFACode).not.toHaveBeenCalled();
    });

    it("proceeds when IP is within limit", async () => {
      mockMfaSendCheck.mockResolvedValue(allowed);
      mockSendMFACode.mockResolvedValue(undefined);

      const result = await sendMFACodeAction();

      expect(result).toEqual({});
      expect(mockSendMFACode).toHaveBeenCalled();
    });
  });

  describe("verifyMFAAction", () => {
    it("returns rate limit error when IP is rate-limited", async () => {
      mockMfaVerifyCheck.mockResolvedValue(blocked);

      const fd = createFormData({
        code: "123456",
        redirectTo: "/dashboard",
      });

      const result = await verifyMFAAction(initialState, fd);

      expect(result.error).toBe(RATE_LIMIT_MESSAGE);
      expect(result.isSuccess).toBe(false);
    });
  });
});
