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
} from "./service/errors";
import type { SignupResult, LoginResult, LogoutResult } from "./service/types";

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
