import { describe, it, expect } from "vitest";
import {
  getSessionInfo,
  isSessionExpiringSoon,
  type BetterAuthSession,
} from "@/lib/auth/helpers/session";
import { config } from "@/lib/config/client";

describe("Session utilities", () => {
  const createMockSession = (expiresInMs: number): BetterAuthSession => ({
    user: { id: "user-123", email: "test@example.com", name: "Test User" },
    session: { expiresAt: new Date(Date.now() + expiresInMs) },
  });

  describe("config.auth.sessionExpiryThresholdMs", () => {
    it("equals 5 minutes in milliseconds", () => {
      expect(config.auth.sessionExpiryThresholdMs).toBe(5 * 60 * 1000);
    });
  });

  describe("getSessionInfo", () => {
    it("returns correct structure for valid session", () => {
      const session = createMockSession(3600 * 1000); // 1 hour

      const result = getSessionInfo(session);

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual({
        id: "user-123",
        email: "test@example.com",
      });
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.isExpiringSoon).toBe(false);
    });

    it("returns invalid for null session", () => {
      const result = getSessionInfo(null);

      expect(result.isValid).toBe(false);
      expect(result.user).toBeNull();
      expect(result.expiresAt).toBeNull();
      expect(result.isExpiringSoon).toBe(false);
    });

    it("marks session expiring soon when within threshold", () => {
      const threshold = config.auth.sessionExpiryThresholdMs;
      const session = createMockSession(threshold - 30_000); // 30s before threshold

      const result = getSessionInfo(session);

      expect(result.isExpiringSoon).toBe(true);
    });

    it("does not mark session expiring soon when well beyond threshold", () => {
      const threshold = config.auth.sessionExpiryThresholdMs;
      const session = createMockSession(threshold + 60_000); // 1 min beyond threshold

      const result = getSessionInfo(session);

      expect(result.isExpiringSoon).toBe(false);
    });
  });

  describe("isSessionExpiringSoon", () => {
    it("returns true when expiry is within default threshold", () => {
      const threshold = config.auth.sessionExpiryThresholdMs;
      const expiresAt = new Date(Date.now() + threshold - 30_000);

      expect(isSessionExpiringSoon(expiresAt)).toBe(true);
    });

    it("returns false when expiry is beyond threshold", () => {
      const threshold = config.auth.sessionExpiryThresholdMs;
      const expiresAt = new Date(Date.now() + threshold + 60_000);

      expect(isSessionExpiringSoon(expiresAt)).toBe(false);
    });

    it("returns false for already-expired date", () => {
      const expiresAt = new Date(Date.now() - 1000);
      expect(isSessionExpiringSoon(expiresAt)).toBe(false);
    });

    it("respects a custom threshold", () => {
      const customThresholdMs = 10_000; // 10 seconds
      const expiresAt = new Date(Date.now() + 5_000); // 5s from now

      expect(isSessionExpiringSoon(expiresAt, customThresholdMs)).toBe(true);
    });
  });
});
