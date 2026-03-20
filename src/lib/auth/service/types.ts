/**
 * Type definitions for the Authentication Service
 * @module auth/service/types
 */

/**
 * Minimal user shape returned from auth service methods.
 * Consumers should not depend on BetterAuth's internal User type directly.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

/**
 * Result of a successful signup operation
 */
export interface SignupResult {
  /** Whether email confirmation is required before the user can log in */
  requiresEmailConfirmation: boolean;
  user: AuthUser | null;
}

/**
 * Result of a successful login operation
 */
export interface LoginResult {
  user: AuthUser;
}

/**
 * Result of a successful logout operation
 */
export interface LogoutResult {
  success: true;
}

/**
 * Result of a password reset request
 */
export interface ResetPasswordResult {
  /**
   * Always true — enumeration protection means we never reveal whether
   * the email exists in the system.
   */
  success: true;
}

/**
 * Result of a successful password update
 */
export interface UpdatePasswordResult {
  success: true;
}

/**
 * Current session state
 */
export interface SessionResult {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
  } | null;
  session: {
    expiresAt: string | null;
  } | null;
}
