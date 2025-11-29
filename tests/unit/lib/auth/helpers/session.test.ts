import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getSessionInfo,
  isSessionExpired,
  getSessionTimeRemaining,
  isSessionExpiringSoon,
} from "@/lib/auth/helpers/session";
import { SESSION_EXPIRY_THRESHOLD_MS } from "@/lib/config";
import type { Session, User } from "@supabase/supabase-js";

describe("Session utilities", () => {
  const mockUser: User = {
    id: "user-123",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };

  const createMockSession = (
    expiresInSeconds: number,
    user: User | null = mockUser
  ): Session => {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: expiresInSeconds,
      expires_at: expiresAt,
      token_type: "bearer",
      user: user as User,
    };
  };

  describe("SESSION_EXPIRY_THRESHOLD_MS", () => {
    it("equals 5 minutes in milliseconds", () => {
      expect(SESSION_EXPIRY_THRESHOLD_MS).toBe(5 * 60 * 1000);
    });
  });

  describe("getSessionInfo", () => {
    it("returns correct structure for valid session", () => {
      const session = createMockSession(3600); // 1 hour from now

      const result = getSessionInfo(session);

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual({
        id: "user-123",
        email: "test@example.com",
      });
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.isExpiringSoon).toBe(false);
    });

    it("returns correct structure for null session", () => {
      const result = getSessionInfo(null);

      expect(result.isValid).toBe(false);
      expect(result.user).toBeNull();
      expect(result.expiresAt).toBeNull();
      expect(result.isExpiringSoon).toBe(false);
    });

    it("returns null user when session user is null", () => {
      const session = createMockSession(3600, null);

      const result = getSessionInfo(session);

      expect(result.isValid).toBe(true);
      expect(result.user).toBeNull();
    });

    it("calculates expiresAt from expires_at timestamp", () => {
      const session = createMockSession(3600);

      const result = getSessionInfo(session);

      const expectedDate = new Date(session.expires_at! * 1000);
      expect(result.expiresAt?.getTime()).toEqual(expectedDate.getTime());
    });

    it("sets isExpiringSoon true when within 5 minutes of expiry", () => {
      const session = createMockSession(240); // 4 minutes from now

      const result = getSessionInfo(session);

      expect(result.isExpiringSoon).toBe(true);
    });

    it("sets isExpiringSoon false when more than 5 minutes from expiry", () => {
      const session = createMockSession(600); // 10 minutes from now

      const result = getSessionInfo(session);

      expect(result.isExpiringSoon).toBe(false);
    });
  });

  describe("isSessionExpired", () => {
    let originalDateNow: () => number;

    beforeEach(() => {
      originalDateNow = Date.now;
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it("returns true for null session", () => {
      expect(isSessionExpired(null)).toBe(true);
    });

    it("returns true when session is expired", () => {
      const session = createMockSession(-60); // Expired 1 minute ago

      expect(isSessionExpired(session)).toBe(true);
    });

    it("returns false for valid non-expired session", () => {
      const session = createMockSession(3600); // 1 hour from now

      expect(isSessionExpired(session)).toBe(false);
    });

    it("returns true for session without expires_at", () => {
      const session = createMockSession(3600);
      delete (session as unknown as Record<string, unknown>).expires_at;

      expect(isSessionExpired(session)).toBe(true);
    });

    it("returns true when expires_at is exactly now", () => {
      const now = Date.now();
      Date.now = () => now;

      const session: Session = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_in: 0,
        expires_at: Math.floor(now / 1000),
        token_type: "bearer",
        user: mockUser,
      };

      expect(isSessionExpired(session)).toBe(true);
    });
  });

  describe("getSessionTimeRemaining", () => {
    let originalDateNow: () => number;

    beforeEach(() => {
      originalDateNow = Date.now;
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it("returns 0 for null session", () => {
      expect(getSessionTimeRemaining(null)).toBe(0);
    });

    it("returns 0 for expired session", () => {
      const session = createMockSession(-60); // Expired 1 minute ago

      expect(getSessionTimeRemaining(session)).toBe(0);
    });

    it("returns correct milliseconds for valid session", () => {
      const now = Date.now();
      Date.now = () => now;

      const expiresInSeconds = 3600; // 1 hour
      const session: Session = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_in: expiresInSeconds,
        expires_at: Math.floor(now / 1000) + expiresInSeconds,
        token_type: "bearer",
        user: mockUser,
      };

      const result = getSessionTimeRemaining(session);

      // Account for sub-second timing differences due to floor operation
      // expires_at is in seconds, so we expect ~expiresInSeconds * 1000 ± 999ms
      expect(result).toBeGreaterThan(expiresInSeconds * 1000 - 1000);
      expect(result).toBeLessThanOrEqual(expiresInSeconds * 1000);
    });

    it("returns 0 for session without expires_at", () => {
      const session = createMockSession(3600);
      delete (session as unknown as Record<string, unknown>).expires_at;

      expect(getSessionTimeRemaining(session)).toBe(0);
    });

    it("never returns negative values", () => {
      const session = createMockSession(-3600); // Expired 1 hour ago

      expect(getSessionTimeRemaining(session)).toBe(0);
    });
  });

  describe("isSessionExpiringSoon", () => {
    let originalDateNow: () => number;

    beforeEach(() => {
      originalDateNow = Date.now;
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it("returns false for null session", () => {
      expect(isSessionExpiringSoon(null)).toBe(false);
    });

    it("returns true when within default 5-minute threshold", () => {
      const session = createMockSession(240); // 4 minutes from now

      expect(isSessionExpiringSoon(session)).toBe(true);
    });

    it("returns false when more than 5 minutes from expiry", () => {
      const session = createMockSession(600); // 10 minutes from now

      expect(isSessionExpiringSoon(session)).toBe(false);
    });

    it("returns false for already expired session", () => {
      const session = createMockSession(-60); // Expired 1 minute ago

      expect(isSessionExpiringSoon(session)).toBe(false);
    });

    it("uses custom threshold when provided", () => {
      const session = createMockSession(900); // 15 minutes from now
      const customThreshold = 20 * 60 * 1000; // 20 minutes

      expect(isSessionExpiringSoon(session, customThreshold)).toBe(true);
    });

    it("returns false when custom threshold makes session not expiring soon", () => {
      const session = createMockSession(240); // 4 minutes from now
      const customThreshold = 60 * 1000; // 1 minute

      expect(isSessionExpiringSoon(session, customThreshold)).toBe(false);
    });

    it("returns true exactly at threshold boundary", () => {
      const now = Date.now();
      Date.now = () => now;

      const thresholdSeconds = SESSION_EXPIRY_THRESHOLD_MS / 1000;
      const session: Session = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_in: thresholdSeconds,
        expires_at: Math.floor(now / 1000) + thresholdSeconds,
        token_type: "bearer",
        user: mockUser,
      };

      expect(isSessionExpiringSoon(session)).toBe(true);
    });

    it("returns false for session without expires_at", () => {
      const session = createMockSession(240);
      delete (session as unknown as Record<string, unknown>).expires_at;

      expect(isSessionExpiringSoon(session)).toBe(false);
    });
  });
});
