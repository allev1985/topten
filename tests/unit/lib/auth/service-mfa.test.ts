import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMFACode, verifyMFACode } from "@/lib/auth";
import { AuthServiceError } from "@/lib/auth/errors";
import type { VerifyMFAResult } from "@/lib/auth/types";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

const mockAuthApi = vi.hoisted(() => ({
  sendTwoFactorOTP: vi.fn(),
  verifyTwoFactorOTP: vi.fn(),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: { api: mockAuthApi },
}));

vi.mock("@/lib/services/logging", () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  emailVerified: true,
};

describe("MFA service functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sendMFACode()", () => {
    it("resolves when BetterAuth sends the OTP successfully", async () => {
      mockAuthApi.sendTwoFactorOTP.mockResolvedValue({});

      await expect(sendMFACode()).resolves.toBeUndefined();
      expect(mockAuthApi.sendTwoFactorOTP).toHaveBeenCalledOnce();
    });

    it("re-throws an AuthServiceError without wrapping it", async () => {
      const original = new AuthServiceError("SERVICE_ERROR", "Already thrown");
      mockAuthApi.sendTwoFactorOTP.mockRejectedValue(original);

      await expect(sendMFACode()).rejects.toThrow(original);
    });

    it("throws INVALID_MFA_SESSION when two-factor cookie is missing (spaces format)", async () => {
      mockAuthApi.sendTwoFactorOTP.mockRejectedValue(
        new Error("Invalid two factor cookie")
      );

      await expect(sendMFACode()).rejects.toMatchObject({
        code: "INVALID_MFA_SESSION",
      });
    });

    it("throws INVALID_MFA_SESSION when two-factor cookie is missing (underscores format)", async () => {
      mockAuthApi.sendTwoFactorOTP.mockRejectedValue(
        new Error("INVALID_TWO_FACTOR_COOKIE")
      );

      await expect(sendMFACode()).rejects.toMatchObject({
        code: "INVALID_MFA_SESSION",
      });
    });

    it("throws SERVICE_ERROR for other unexpected errors", async () => {
      mockAuthApi.sendTwoFactorOTP.mockRejectedValue(
        new Error("Network error")
      );

      await expect(sendMFACode()).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });

  describe("verifyMFACode()", () => {
    it("returns a VerifyMFAResult with user details on success", async () => {
      mockAuthApi.verifyTwoFactorOTP.mockResolvedValue({ user: mockUser });

      const result = await verifyMFACode("123456");

      expect(result).toEqual<VerifyMFAResult>({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          emailVerified: true,
        },
      });
      expect(mockAuthApi.verifyTwoFactorOTP).toHaveBeenCalledWith({
        body: { code: "123456" },
        headers: expect.any(Headers),
      });
    });

    it("re-throws an AuthServiceError without wrapping it", async () => {
      const original = new AuthServiceError(
        "INVALID_MFA_CODE",
        "Already thrown"
      );
      mockAuthApi.verifyTwoFactorOTP.mockRejectedValue(original);

      await expect(verifyMFACode("000000")).rejects.toThrow(original);
    });

    it("throws INVALID_MFA_CODE when the code is wrong", async () => {
      mockAuthApi.verifyTwoFactorOTP.mockRejectedValue(
        new Error("INVALID_CODE")
      );

      await expect(verifyMFACode("000000")).rejects.toMatchObject({
        code: "INVALID_MFA_CODE",
      });
    });

    it("throws MFA_CODE_EXPIRED when the code has expired", async () => {
      mockAuthApi.verifyTwoFactorOTP.mockRejectedValue(
        new Error("OTP_HAS_EXPIRED")
      );

      await expect(verifyMFACode("123456")).rejects.toMatchObject({
        code: "MFA_CODE_EXPIRED",
      });
    });

    it("throws TOO_MANY_MFA_ATTEMPTS when rate limit is hit", async () => {
      mockAuthApi.verifyTwoFactorOTP.mockRejectedValue(
        new Error("TOO_MANY_ATTEMPTS")
      );

      await expect(verifyMFACode("123456")).rejects.toMatchObject({
        code: "TOO_MANY_MFA_ATTEMPTS",
      });
    });

    it("throws INVALID_MFA_SESSION when two-factor cookie is missing", async () => {
      mockAuthApi.verifyTwoFactorOTP.mockRejectedValue(
        new Error("Invalid two factor cookie")
      );

      await expect(verifyMFACode("123456")).rejects.toMatchObject({
        code: "INVALID_MFA_SESSION",
      });
    });

    it("throws SERVICE_ERROR for other unexpected errors", async () => {
      mockAuthApi.verifyTwoFactorOTP.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(verifyMFACode("123456")).rejects.toMatchObject({
        code: "SERVICE_ERROR",
      });
    });
  });
});
