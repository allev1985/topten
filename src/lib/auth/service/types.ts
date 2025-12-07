/**
 * Type definitions for the Authentication Service
 * @module auth/service/types
 */

import type { User } from "@supabase/supabase-js";

/**
 * Result of a successful signup operation
 */
export interface SignupResult {
  /**
   * Whether email confirmation is required
   * True when email verification is enabled in Supabase settings
   */
  requiresEmailConfirmation: boolean;
  /**
   * User object from Supabase (may be null if email confirmation required)
   */
  user: User | null;
  /**
   * Session token (only present if no email confirmation required)
   */
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
}

/**
 * Result of a successful login operation
 */
export interface LoginResult {
  /**
   * Authenticated user object
   */
  user: User;
  /**
   * Session tokens
   */
  session: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Result of a successful logout operation
 */
export interface LogoutResult {
  /**
   * Always true if logout succeeded
   */
  success: true;
}

/**
 * Result of a password reset request
 */
export interface ResetPasswordResult {
  /**
   * Always true if reset email request was processed
   * Note: Does not indicate whether email exists (enumeration protection)
   */
  success: true;
}

/**
 * Result of a successful password update
 */
export interface UpdatePasswordResult {
  /**
   * Always true if password was updated successfully
   */
  success: true;
}

/**
 * Session information with expiry details
 */
export interface SessionResult {
  /**
   * Whether a valid session exists
   */
  authenticated: boolean;
  /**
   * User information if authenticated
   */
  user: {
    id: string;
    email: string | undefined;
  } | null;
  /**
   * Session expiry information if authenticated
   */
  session: {
    expiresAt: string | null;
    isExpiringSoon: boolean;
  } | null;
}

/**
 * Result of a session refresh operation
 */
export interface RefreshSessionResult {
  /**
   * Session expiry information
   */
  session: {
    access_token: string;
    refresh_token: string;
    expiresAt: string | null;
  };
}

/**
 * Result of a successful email verification operation
 */
export interface VerifyEmailResult {
  /**
   * Authenticated user object from Supabase
   */
  user: User;
  /**
   * Session tokens created during verification
   */
  session: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Email verification function signature
 */
export type VerifyEmailFunction = (
  token_hash: string,
  type: "email"
) => Promise<VerifyEmailResult>;
