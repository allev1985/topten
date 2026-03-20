/**
 * Mock factories for Auth Service tests
 *
 * Provides reusable mock factories compatible with BetterAuth's session model.
 */

import { vi } from "vitest";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Creates a mock user object for testing
 */
export function createMockUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    emailVerified: true,
    ...overrides,
  };
}

/**
 * Creates a mock BetterAuth session object for testing
 */
export function createMockBetterAuthSession(overrides?: {
  userId?: string;
  expiresInSeconds?: number;
}) {
  const expiresAt = new Date(
    Date.now() + (overrides?.expiresInSeconds ?? 3600) * 1000
  );
  const user = createMockUser(
    overrides?.userId !== undefined ? { id: overrides.userId } : undefined
  );
  return {
    user,
    session: {
      id: "session-abc",
      token: "mock-session-token",
      expiresAt,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

/**
 * Creates a mock BetterAuth auth.api instance for testing
 */
export function createMockAuthApi() {
  return {
    signUpEmail: vi.fn(),
    signInEmail: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
  };
}
