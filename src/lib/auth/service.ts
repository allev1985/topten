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
import type {
  SignupResult,
  LoginResult,
  LogoutResult,
  ResetPasswordResult,
  UpdatePasswordResult,
  SessionResult,
  RefreshSessionResult,
} from "./service/types";

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
 *
 * @example
 * ```typescript
 * try {
 *   const result = await signup("user@example.com", "SecurePass123!");
 *   if (result.requiresEmailConfirmation) {
 *     console.log("Please check your email to verify your account");
 *   } else {
 *     console.log("Account created and logged in");
 *   }
 * } catch (error) {
 *   if (error instanceof AuthServiceError) {
 *     console.error("Signup failed:", error.message);
 *   }
 * }
 * ```
 */
export async function signup(
  email: string,
  password: string,
  options?: {
    emailRedirectTo?: string;
  }
): Promise<SignupResult> {
  try {
    console.info(
      "[AuthService:signup]",
      `Signup attempt for email: ${maskEmail(email)}`
    );

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: options?.emailRedirectTo,
      },
    });

    if (error) {
      console.error(
        "[AuthService:signup]",
        `Signup failed for ${maskEmail(email)}: ${error.message}`
      );
      throw serviceError("Failed to create account", error);
    }

    // Supabase returns user even when email confirmation is required
    // Session is null when confirmation is required
    const requiresEmailConfirmation = !data.session;

    if (requiresEmailConfirmation) {
      console.info(
        "[AuthService:signup]",
        `Signup successful for ${maskEmail(email)}, verification email sent`
      );
    } else {
      console.info(
        "[AuthService:signup]",
        `Signup successful for ${maskEmail(email)}, user auto-confirmed`
      );
    }

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
    // Re-throw AuthServiceError as-is
    if (error instanceof AuthServiceError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error(
      "[AuthService:signup]",
      "Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
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
 *
 * @example
 * ```typescript
 * try {
 *   const result = await login("user@example.com", "SecurePass123!");
 *   console.log("Logged in as:", result.user.email);
 * } catch (error) {
 *   if (error instanceof AuthServiceError) {
 *     if (error.code === "EMAIL_NOT_CONFIRMED") {
 *       console.error("Please verify your email first");
 *     } else if (error.code === "INVALID_CREDENTIALS") {
 *       console.error("Invalid email or password");
 *     }
 *   }
 * }
 * ```
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    console.info(
      "[AuthService:login]",
      `Login attempt for email: ${maskEmail(email)}`
    );

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(
        "[AuthService:login]",
        `Login failed for ${maskEmail(email)}: ${error.message}`
      );

      // Check if this is an email not confirmed error
      if (isEmailNotVerifiedError(error)) {
        throw emailNotConfirmedError(error);
      }

      // All other errors are treated as invalid credentials for security
      throw invalidCredentialsError(error);
    }

    // Supabase should return both user and session on successful login
    if (!data.user || !data.session) {
      console.error(
        "[AuthService:login]",
        `Login succeeded but missing user or session for ${maskEmail(email)}`
      );
      throw serviceError("Login succeeded but session data is incomplete");
    }

    console.info(
      "[AuthService:login]",
      `Login successful for ${maskEmail(email)}`
    );

    return {
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };
  } catch (error) {
    // Re-throw AuthServiceError as-is
    if (error instanceof AuthServiceError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error(
      "[AuthService:login]",
      "Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
    );
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
 *
 * @example
 * ```typescript
 * try {
 *   await logout();
 *   console.log("Logged out successfully");
 * } catch (error) {
 *   console.error("Logout failed:", error);
 * }
 * ```
 */
export async function logout(): Promise<LogoutResult> {
  try {
    const supabase = await createClient();

    // Get current user for logging (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[AuthService:logout]", `Logout error: ${error.message}`);
      // Still treat as success for idempotency
      // Session cookies will be cleared even if Supabase API call fails
    }

    console.info(
      "[AuthService:logout]",
      user
        ? `User logged out: ${user.id}`
        : "Logout request (no active session)"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[AuthService:logout]",
      "Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
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
 *
 * @example
 * ```typescript
 * try {
 *   await resetPassword("user@example.com");
 *   console.log("If an account exists, a reset email has been sent");
 * } catch (error) {
 *   console.error("Reset request failed:", error);
 * }
 * ```
 */
export async function resetPassword(
  email: string,
  options?: {
    redirectTo?: string;
  }
): Promise<ResetPasswordResult> {
  try {
    console.info(
      "[AuthService:resetPassword]",
      `Password reset requested for: ${maskEmail(email)}`
    );

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: options?.redirectTo,
    });

    // Log errors internally but always return success for enumeration protection
    if (error) {
      console.error(
        "[AuthService:resetPassword]",
        `Reset error for ${maskEmail(email)}: ${error.message}`
      );
    }

    console.info(
      "[AuthService:resetPassword]",
      `Password reset request processed for: ${maskEmail(email)}`
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[AuthService:resetPassword]",
      "Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
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
 *
 * @example
 * ```typescript
 * // Update password with OTP token (from reset email)
 * try {
 *   await updatePassword("NewSecurePass123!", {
 *     token_hash: "abc123",
 *     type: "recovery"
 *   });
 *   console.log("Password updated, please log in again");
 * } catch (error) {
 *   console.error("Password update failed:", error);
 * }
 *
 * // Update password for authenticated user (session-based)
 * try {
 *   await updatePassword("NewSecurePass123!");
 *   console.log("Password updated, please log in again");
 * } catch (error) {
 *   console.error("Password update failed:", error);
 * }
 * ```
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
      console.info(
        "[AuthService:updatePassword]",
        `Attempting OTP token authentication (type: ${options.type})`
      );

      const { data, error: otpError } = await supabase.auth.verifyOtp({
        type: options.type,
        token_hash: options.token_hash,
      });

      if (otpError) {
        console.error(
          "[AuthService:updatePassword]",
          `OTP authentication failed: ${otpError.message}`
        );

        // Check for expired token
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
      console.info(
        "[AuthService:updatePassword]",
        "Attempting session-based authentication"
      );

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error(
          "[AuthService:updatePassword]",
          `Session authentication failed: ${userError?.message ?? "No user"}`
        );
        throw serviceError("Authentication required", userError);
      }

      userEmail = user.email ?? null;
    }

    console.info(
      "[AuthService:updatePassword]",
      `Password update requested via ${authMethod} for: ${maskEmail(userEmail ?? "unknown")}`
    );

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error(
        "[AuthService:updatePassword]",
        `Password update failed for ${maskEmail(userEmail ?? "unknown")}: ${updateError.message}`
      );

      // Check for session-related errors
      if (isSessionError(updateError)) {
        throw serviceError(
          "Session has expired. Please log in again.",
          updateError
        );
      }

      throw serviceError("Failed to update password", updateError);
    }

    console.info(
      "[AuthService:updatePassword]",
      `Password updated successfully via ${authMethod} for: ${maskEmail(userEmail ?? "unknown")}`
    );

    // Sign out user after successful password update for security
    try {
      await supabase.auth.signOut();
      console.info(
        "[AuthService:updatePassword]",
        `User signed out after password update: ${maskEmail(userEmail ?? "unknown")}`
      );
    } catch (signOutError) {
      // Log error but don't fail the operation - password was already updated successfully
      console.error(
        "[AuthService:updatePassword]",
        `Sign-out failed after password update: ${signOutError instanceof Error ? signOutError.message : "Unknown error"}`
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    // Re-throw AuthServiceError as-is
    if (error instanceof AuthServiceError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error(
      "[AuthService:updatePassword]",
      "Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
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
 *
 * @example
 * ```typescript
 * try {
 *   const session = await getSession();
 *   if (session.authenticated) {
 *     console.log("Logged in as:", session.user?.email);
 *     console.log("Session expires at:", session.session?.expiresAt);
 *     if (session.session?.isExpiringSoon) {
 *       console.log("Session is expiring soon, consider refreshing");
 *     }
 *   } else {
 *     console.log("Not authenticated");
 *   }
 * } catch (error) {
 *   console.error("Failed to get session:", error);
 * }
 * ```
 */
export async function getSession(): Promise<SessionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sessionInfo = getSessionInfo(session);

    if (!sessionInfo.isValid || !session) {
      console.info(
        "[AuthService:getSession]",
        "Session status check: not authenticated"
      );

      return {
        authenticated: false,
        user: null,
        session: null,
      };
    }

    console.info(
      "[AuthService:getSession]",
      `Session status check: authenticated as ${sessionInfo.user?.id ?? "unknown"}`
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
    console.error(
      "[AuthService:getSession]",
      "Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
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
 *
 * @example
 * ```typescript
 * try {
 *   const result = await refreshSession();
 *   console.log("Session refreshed, expires at:", result.session.expiresAt);
 * } catch (error) {
 *   if (error instanceof AuthServiceError) {
 *     console.error("Session expired, please log in again");
 *   }
 * }
 * ```
 */
export async function refreshSession(): Promise<RefreshSessionResult> {
  try {
    console.info("[AuthService:refreshSession]", "Session refresh requested");

    const supabase = await createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error(
        "[AuthService:refreshSession]",
        `Refresh failed: ${error.message}`
      );
      throw serviceError("Session has expired. Please log in again.", error);
    }

    if (!session) {
      console.error(
        "[AuthService:refreshSession]",
        "No session returned after refresh"
      );
      throw serviceError("Session has expired. Please log in again.");
    }

    const expiresAt = session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null;

    console.info(
      "[AuthService:refreshSession]",
      `Session refreshed successfully, expires at: ${expiresAt}`
    );

    return {
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expiresAt,
      },
    };
  } catch (error) {
    // Re-throw AuthServiceError as-is
    if (error instanceof AuthServiceError) {
      throw error;
    }

    // Wrap unexpected errors
    console.error(
      "[AuthService:refreshSession]",
      "Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw serviceError(
      "An unexpected error occurred during session refresh",
      error
    );
  }
}
