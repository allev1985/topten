/**
 * Authentication Service
 *
 * Centralized service for all authentication operations.
 * Used by Server Actions and other server-side code.
 *
 * This module provides a clean abstraction over Supabase authentication,
 * handling common patterns like error mapping, logging, and session management.
 *
 * @module auth/service
 */

import { createClient } from "@/lib/supabase/server";
import { maskEmail } from "@/lib/utils/formatting/email";
import {
  AuthServiceError,
  invalidCredentialsError,
  emailNotConfirmedError,
  serviceError,
  isEmailNotVerifiedError,
  isExpiredTokenError,
  isSessionError,
} from "./service/errors";
import { getSessionInfo } from "./helpers/session";
import { createServiceLogger } from "@/lib/services/logging";
import type {
  SignupResult,
  LoginResult,
  LogoutResult,
  ResetPasswordResult,
  UpdatePasswordResult,
  SessionResult,
  RefreshSessionResult,
  VerifyEmailResult,
} from "./service/types";

const log = createServiceLogger("auth-service");

/**
 * Sign up a new user with email and password
 *
 * Creates a new user account in Supabase and sends a verification email.
 * The behavior depends on Supabase email confirmation settings:
 * - If email confirmation is required: user is created but cannot log in until verified
 * - If email confirmation is disabled: user is created and automatically logged in
 *
 * @param email - User's email address
 * @param password - User's password (must meet password requirements)
 * @param options - Optional configuration
 * @param options.emailRedirectTo - URL to redirect to after email verification
 * @returns SignupResult with user and session information
 * @throws {AuthServiceError} If signup fails
 */
export async function signup(
  email: string,
  password: string,
  options?: {
    emailRedirectTo?: string;
  }
): Promise<SignupResult> {
  try {
    log.info({ method: "signup", email: maskEmail(email) }, "Signup attempt");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: options?.emailRedirectTo,
      },
    });

    if (error) {
      log.error(
        { method: "signup", email: maskEmail(email), err: error },
        "Signup failed"
      );
      throw serviceError("Failed to create account", error);
    }

    // Supabase returns user even when email confirmation is required
    // Session is null when confirmation is required
    const requiresEmailConfirmation = !data.session;

    log.info(
      {
        method: "signup",
        email: maskEmail(email),
        requiresEmailConfirmation,
        userId: data.user?.id,
      },
      requiresEmailConfirmation
        ? "Signup successful, verification email sent"
        : "Signup successful, user auto-confirmed"
    );

    return {
      requiresEmailConfirmation,
      user: data.user,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }
        : null,
    };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;

    log.error(
      { method: "signup", err: error },
      "Unexpected error during signup"
    );
    throw serviceError("An unexpected error occurred during signup", error);
  }
}

/**
 * Log in a user with email and password
 *
 * Authenticates the user and creates a new session.
 * Session cookies are automatically set by the Supabase client.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns LoginResult with user and session information
 * @throws {AuthServiceError} If login fails, including:
 *   - INVALID_CREDENTIALS: Wrong email or password
 *   - EMAIL_NOT_CONFIRMED: Email not yet verified
 *   - SERVICE_ERROR: Unexpected errors
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    log.info({ method: "login", email: maskEmail(email) }, "Login attempt");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      log.error(
        { method: "login", email: maskEmail(email), err: error },
        "Login failed"
      );

      if (isEmailNotVerifiedError(error)) {
        throw emailNotConfirmedError(error);
      }

      throw invalidCredentialsError(error);
    }

    if (!data.user || !data.session) {
      log.error(
        { method: "login", email: maskEmail(email) },
        "Login succeeded but session data is incomplete"
      );
      throw serviceError("Login succeeded but session data is incomplete");
    }

    log.info(
      { method: "login", email: maskEmail(email), userId: data.user.id },
      "Login successful"
    );

    return {
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;

    log.error({ method: "login", err: error }, "Unexpected error during login");
    throw serviceError("An unexpected error occurred during login", error);
  }
}

/**
 * Log out the current user
 *
 * Terminates the user's session and clears session cookies.
 * This operation is idempotent - it succeeds even if no session exists.
 *
 * @returns LogoutResult indicating success
 * @throws {AuthServiceError} Only if an unexpected error occurs
 */
export async function logout(): Promise<LogoutResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      // Log but treat as success for idempotency — cookies are cleared regardless
      log.warn(
        { method: "logout", userId: user?.id, err: error },
        "Logout Supabase API error (session cookies still cleared)"
      );
    }

    log.info(
      { method: "logout", userId: user?.id },
      user ? "User logged out" : "Logout request (no active session)"
    );

    return { success: true };
  } catch (error) {
    log.error(
      { method: "logout", err: error },
      "Unexpected error during logout"
    );
    throw serviceError("An unexpected error occurred during logout", error);
  }
}

/**
 * Request a password reset email
 *
 * Sends a password reset email to the specified address.
 * This operation implements user enumeration protection - it always returns
 * success regardless of whether the email exists in the system.
 *
 * @param email - User's email address
 * @param options - Optional configuration
 * @param options.redirectTo - URL to redirect to after password reset
 * @returns ResetPasswordResult indicating the request was processed
 * @throws {AuthServiceError} Only if an unexpected error occurs
 */
export async function resetPassword(
  email: string,
  options?: {
    redirectTo?: string;
  }
): Promise<ResetPasswordResult> {
  try {
    log.info(
      { method: "resetPassword", email: maskEmail(email) },
      "Password reset requested"
    );

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: options?.redirectTo,
    });

    // Log errors internally but always return success for enumeration protection
    if (error) {
      log.warn(
        { method: "resetPassword", email: maskEmail(email), err: error },
        "Password reset Supabase error (returning success for enumeration protection)"
      );
    } else {
      log.info(
        { method: "resetPassword", email: maskEmail(email) },
        "Password reset request processed"
      );
    }

    return { success: true };
  } catch (error) {
    log.error(
      { method: "resetPassword", err: error },
      "Unexpected error during password reset"
    );
    throw serviceError(
      "An unexpected error occurred during password reset",
      error
    );
  }
}

/**
 * Update user password
 *
 * Updates the user's password with support for multiple authentication methods:
 * 1. OTP token - from password reset email (token_hash + type)
 * 2. Session - existing authenticated user
 *
 * The function automatically signs out the user after a successful password update
 * for security reasons.
 *
 * @param password - New password
 * @param options - Authentication options
 * @param options.token_hash - OTP token hash from password reset email
 * @param options.type - OTP token type ('recovery' or 'email')
 * @returns UpdatePasswordResult indicating success
 * @throws {AuthServiceError} If authentication fails or password update fails
 */
export async function updatePassword(
  password: string,
  options?: {
    token_hash?: string;
    type?: "recovery" | "email";
  }
): Promise<UpdatePasswordResult> {
  try {
    const supabase = await createClient();

    let userEmail: string | null = null;
    let authMethod: "OTP" | "session" = "session";

    // Authentication priority: OTP token → existing session

    // 1. Try OTP token authentication if provided
    if (options?.token_hash && options?.type) {
      authMethod = "OTP";
      log.debug(
        { method: "updatePassword", authMethod, otpType: options.type },
        "Attempting OTP token authentication"
      );

      const { data, error: otpError } = await supabase.auth.verifyOtp({
        type: options.type,
        token_hash: options.token_hash,
      });

      if (otpError) {
        log.error(
          { method: "updatePassword", authMethod, err: otpError },
          "OTP authentication failed"
        );

        if (isExpiredTokenError(otpError)) {
          throw serviceError(
            "Authentication link has expired. Please request a new one.",
            otpError
          );
        }

        throw serviceError("Authentication failed", otpError);
      }

      userEmail = data.user?.email ?? null;
    }
    // 2. Fall back to existing session
    else {
      authMethod = "session";
      log.debug(
        { method: "updatePassword", authMethod },
        "Attempting session-based authentication"
      );

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        log.error(
          { method: "updatePassword", authMethod, err: userError },
          "Session authentication failed"
        );
        throw serviceError("Authentication required", userError);
      }

      userEmail = user.email ?? null;
    }

    log.info(
      {
        method: "updatePassword",
        authMethod,
        email: maskEmail(userEmail ?? "unknown"),
      },
      "Password update requested"
    );

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      log.error(
        {
          method: "updatePassword",
          authMethod,
          email: maskEmail(userEmail ?? "unknown"),
          err: updateError,
        },
        "Password update failed"
      );

      if (isSessionError(updateError)) {
        throw serviceError(
          "Session has expired. Please log in again.",
          updateError
        );
      }

      throw serviceError("Failed to update password", updateError);
    }

    log.info(
      {
        method: "updatePassword",
        authMethod,
        email: maskEmail(userEmail ?? "unknown"),
      },
      "Password updated successfully"
    );

    // Sign out user after successful password update for security
    try {
      await supabase.auth.signOut();
      log.info(
        {
          method: "updatePassword",
          email: maskEmail(userEmail ?? "unknown"),
        },
        "User signed out after password update"
      );
    } catch (signOutError) {
      // Password was already updated — don't fail the operation
      log.warn(
        { method: "updatePassword", err: signOutError },
        "Sign-out failed after password update (password was still updated)"
      );
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;

    log.error(
      { method: "updatePassword", err: error },
      "Unexpected error during password update"
    );
    throw serviceError(
      "An unexpected error occurred during password update",
      error
    );
  }
}

/**
 * Get current session information
 *
 * Retrieves the current user's session status and information.
 * This operation is idempotent and does not cause side effects.
 * Returns authenticated=false for unauthenticated requests (not an error).
 *
 * @returns SessionResult with authentication status and user info
 * @throws {AuthServiceError} Only if an unexpected error occurs
 */
export async function getSession(): Promise<SessionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sessionInfo = getSessionInfo(session);

    if (!sessionInfo.isValid || !session) {
      log.debug({ method: "getSession" }, "Session check: not authenticated");

      return {
        authenticated: false,
        user: null,
        session: null,
      };
    }

    log.debug(
      { method: "getSession", userId: sessionInfo.user?.id },
      "Session check: authenticated"
    );

    return {
      authenticated: true,
      user: sessionInfo.user,
      session: {
        expiresAt: sessionInfo.expiresAt?.toISOString() ?? null,
        isExpiringSoon: sessionInfo.isExpiringSoon,
      },
    };
  } catch (error) {
    log.error(
      { method: "getSession", err: error },
      "Unexpected error during getSession"
    );
    throw serviceError(
      "An unexpected error occurred while getting session",
      error
    );
  }
}

/**
 * Refresh the current session
 *
 * Refreshes the user's session using the refresh token.
 * Updates session cookies with new tokens.
 * Should be called before the access token expires to maintain authentication.
 *
 * @returns RefreshSessionResult with new session tokens and expiry
 * @throws {AuthServiceError} If refresh fails (e.g., expired refresh token)
 */
export async function refreshSession(): Promise<RefreshSessionResult> {
  try {
    log.debug({ method: "refreshSession" }, "Session refresh requested");

    const supabase = await createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      log.error(
        { method: "refreshSession", err: error },
        "Session refresh failed"
      );
      throw serviceError("Session has expired. Please log in again.", error);
    }

    if (!session) {
      log.error(
        { method: "refreshSession" },
        "No session returned after refresh"
      );
      throw serviceError("Session has expired. Please log in again.");
    }

    const expiresAt = session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null;

    log.info(
      { method: "refreshSession", expiresAt },
      "Session refreshed successfully"
    );

    return {
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expiresAt,
      },
    };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;

    log.error(
      { method: "refreshSession", err: error },
      "Unexpected error during session refresh"
    );
    throw serviceError(
      "An unexpected error occurred during session refresh",
      error
    );
  }
}

/**
 * Verify a user's email address using an OTP token
 *
 * Verifies email using a token from the verification email and creates an authenticated session.
 * This function is used in the email verification flow after a user clicks the verification link.
 *
 * @param token_hash - The hashed OTP token from the verification email URL
 * @param type - The verification type (must be "email" for email verification)
 * @returns VerifyEmailResult with user and session information
 * @throws {AuthServiceError} If verification fails (expired token, invalid token, or server error)
 */
export async function verifyEmail(
  token_hash: string,
  type: "email"
): Promise<VerifyEmailResult> {
  try {
    log.info({ method: "verifyEmail" }, "Email verification attempt");

    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      log.error(
        { method: "verifyEmail", err: error },
        "Email verification failed"
      );

      if (isExpiredTokenError(error)) {
        throw serviceError(
          "Verification link has expired. Please request a new one.",
          error
        );
      }

      throw serviceError("Invalid verification link", error);
    }

    if (!data.user || !data.session) {
      log.error(
        { method: "verifyEmail" },
        "No user or session returned from verification"
      );
      throw serviceError("Verification failed - no user or session created");
    }

    log.info(
      { method: "verifyEmail", userId: data.user.id },
      "Email verified successfully"
    );

    return {
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;

    log.error(
      { method: "verifyEmail", err: error },
      "Unexpected error during email verification"
    );
    throw serviceError(
      "An unexpected error occurred during email verification",
      error
    );
  }
}
