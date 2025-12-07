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
