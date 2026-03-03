/**
 * Mock factories for Auth Service tests
 *
 * Provides reusable mock factories for Supabase clients, users, sessions,
 * and service results to reduce duplication across auth tests.
 */

import type { User, Session } from "@supabase/supabase-js";
import type { Mock } from "vitest";

/**
 * Creates a mock user object for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "user-123",
    email: "test@example.com",
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    ...overrides,
  } as User;
}

/**
 * Creates a mock session object for testing
 */
export function createMockSession(
  expiresInSeconds = 3600,
  overrides?: Partial<Session>
): Session {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: expiresInSeconds,
    expires_at: now + expiresInSeconds,
    token_type: "bearer",
    user: createMockUser(),
    ...overrides,
  } as Session;
}

/**
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
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

/**
 * Mock successful signup result
 */
export function mockSuccessfulSignup(
  requiresConfirmation = false,
  user = createMockUser()
) {
  return {
    data: {
      user,
      session: requiresConfirmation ? null : createMockSession(),
    },
    error: null,
  };
}

/**
 * Mock successful login result
 */
export function mockSuccessfulLogin(user = createMockUser()) {
  return {
    data: {
      user,
      session: createMockSession(),
    },
    error: null,
  };
}

/**
 * Mock error response from Supabase
 */
export function mockSupabaseError(message: string, code?: string) {
  return {
    data: { user: null, session: null },
    error: {
      message,
      code,
      status: 400,
    },
  };
}
