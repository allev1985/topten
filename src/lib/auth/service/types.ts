/**
 * Type definitions for the Authentication Service
 * @module auth/service/types
 */

import type { AuthUser } from "@/types/auth";
export type { AuthUser };

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
