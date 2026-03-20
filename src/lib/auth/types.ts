/**
 * Type definitions for the Auth Service
 * Application auth types — no dependency on any auth library's internal types.
 * @module lib/auth/types
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}

export type AuthState =
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated"; user: null }
  | { status: "loading"; user: null };

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };

/**
 * Session information for routing and display purposes.
 */
export interface SessionInfo {
  isValid: boolean;
  user: { id: string; email?: string } | null;
  expiresAt: Date | null;
  isExpiringSoon: boolean;
}

/** Result of a successful signup operation */
export interface SignupResult {
  /** Whether email confirmation is required before the user can log in */
  requiresEmailConfirmation: boolean;
  user: AuthUser | null;
}

/** Result of a login attempt */
export interface LoginResult {
  /** Populated when login completes without MFA */
  user: AuthUser | null;
  /** True when the login succeeded but MFA verification is still required */
  requiresMFA: boolean;
}

/** Result of a successful MFA code verification */
export interface VerifyMFAResult {
  user: AuthUser;
}

/** Result of a successful logout operation */
export interface LogoutResult {
  success: true;
}

/**
 * Result of a password reset request.
 * Always success: true — enumeration protection means we never reveal
 * whether the email exists in the system.
 */
export interface ResetPasswordResult {
  success: true;
}

/** Result of a successful password update */
export interface UpdatePasswordResult {
  success: true;
}

/** Current session state returned by the auth service */
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
