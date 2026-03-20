import { describe, it, expect } from "vitest";
import {
  isInvalidMFACodeError,
  isMFACodeExpiredError,
  isTooManyMFAAttemptsError,
  isInvalidMFASessionError,
} from "@/lib/auth/errors";

describe("MFA error detection functions", () => {
  describe("isInvalidMFACodeError()", () => {
    it("returns true for INVALID_CODE in the message (uppercase)", () => {
      expect(isInvalidMFACodeError(new Error("INVALID_CODE"))).toBe(true);
    });

    it("returns true for INVALID_CODE in the message (lowercase)", () => {
      expect(isInvalidMFACodeError(new Error("invalid_code"))).toBe(true);
    });

    it("returns true when INVALID_CODE appears within a longer message", () => {
      expect(
        isInvalidMFACodeError(new Error("Error: INVALID_CODE submitted"))
      ).toBe(true);
    });

    it("returns false for unrelated error messages", () => {
      expect(isInvalidMFACodeError(new Error("OTP_HAS_EXPIRED"))).toBe(false);
      expect(isInvalidMFACodeError(new Error("TOO_MANY_ATTEMPTS"))).toBe(false);
    });

    it("returns false for non-Error values", () => {
      expect(isInvalidMFACodeError("INVALID_CODE")).toBe(false);
      expect(isInvalidMFACodeError(null)).toBe(false);
      expect(isInvalidMFACodeError(undefined)).toBe(false);
      expect(isInvalidMFACodeError(42)).toBe(false);
    });
  });

  describe("isMFACodeExpiredError()", () => {
    it("returns true for OTP_HAS_EXPIRED in the message (uppercase)", () => {
      expect(isMFACodeExpiredError(new Error("OTP_HAS_EXPIRED"))).toBe(true);
    });

    it("returns true for OTP_HAS_EXPIRED in the message (lowercase)", () => {
      expect(isMFACodeExpiredError(new Error("otp_has_expired"))).toBe(true);
    });

    it("returns false for unrelated error messages", () => {
      expect(isMFACodeExpiredError(new Error("INVALID_CODE"))).toBe(false);
      expect(isMFACodeExpiredError(new Error("TOO_MANY_ATTEMPTS"))).toBe(false);
    });

    it("returns false for non-Error values", () => {
      expect(isMFACodeExpiredError(null)).toBe(false);
      expect(isMFACodeExpiredError("OTP_HAS_EXPIRED")).toBe(false);
    });
  });

  describe("isTooManyMFAAttemptsError()", () => {
    it("returns true for TOO_MANY_ATTEMPTS in the message (uppercase)", () => {
      expect(isTooManyMFAAttemptsError(new Error("TOO_MANY_ATTEMPTS"))).toBe(
        true
      );
    });

    it("returns true for TOO_MANY_ATTEMPTS in the message (lowercase)", () => {
      expect(isTooManyMFAAttemptsError(new Error("too_many_attempts"))).toBe(
        true
      );
    });

    it("returns false for unrelated error messages", () => {
      expect(isTooManyMFAAttemptsError(new Error("INVALID_CODE"))).toBe(false);
      expect(isTooManyMFAAttemptsError(new Error("OTP_HAS_EXPIRED"))).toBe(
        false
      );
    });

    it("returns false for non-Error values", () => {
      expect(isTooManyMFAAttemptsError(null)).toBe(false);
      expect(isTooManyMFAAttemptsError("TOO_MANY_ATTEMPTS")).toBe(false);
    });
  });

  describe("isInvalidMFASessionError()", () => {
    it("returns true for INVALID_TWO_FACTOR_COOKIE in the message (underscores)", () => {
      expect(
        isInvalidMFASessionError(new Error("INVALID_TWO_FACTOR_COOKIE"))
      ).toBe(true);
    });

    it("returns true for the human-readable message with spaces", () => {
      expect(
        isInvalidMFASessionError(new Error("Invalid two factor cookie"))
      ).toBe(true);
    });

    it("returns true when body.code is INVALID_TWO_FACTOR_COOKIE", () => {
      const err = Object.assign(new Error("Some BetterAuth error"), {
        body: { code: "INVALID_TWO_FACTOR_COOKIE" },
      });
      expect(isInvalidMFASessionError(err)).toBe(true);
    });

    it("returns false when body.code is a different value", () => {
      const err = Object.assign(new Error("Some error"), {
        body: { code: "INVALID_CODE" },
      });
      expect(isInvalidMFASessionError(err)).toBe(false);
    });

    it("returns false for unrelated error messages", () => {
      expect(isInvalidMFASessionError(new Error("INVALID_CODE"))).toBe(false);
      expect(isInvalidMFASessionError(new Error("OTP_HAS_EXPIRED"))).toBe(
        false
      );
    });

    it("returns false for non-Error values", () => {
      expect(isInvalidMFASessionError(null)).toBe(false);
      expect(isInvalidMFASessionError("INVALID_TWO_FACTOR_COOKIE")).toBe(false);
      expect(isInvalidMFASessionError(undefined)).toBe(false);
    });
  });
});
