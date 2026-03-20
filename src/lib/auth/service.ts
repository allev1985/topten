/**
 * Authentication Service
 *
 * Thin wrapper around BetterAuth's server API that adds structured logging
 * and consistent error mapping. All server actions and server components
 * call this service rather than auth.api directly.
 *
 * @see docs/decisions/authentication.md
 * @module auth/service
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { maskEmail } from "@/lib/utils/formatting/email";
import { createServiceLogger } from "@/lib/services/logging";
import {
  AuthServiceError,
  invalidCredentialsError,
  emailNotConfirmedError,
  serviceError,
  isInvalidCredentialsError,
  isEmailNotVerifiedError,
} from "./service/errors";
import type {
  SignupResult,
  LoginResult,
  LogoutResult,
  ResetPasswordResult,
  UpdatePasswordResult,
  SessionResult,
} from "@/types/auth";

const log = createServiceLogger("auth-service");

async function getHeaders() {
  return await headers();
}

/**
 * Sign up a new user with email and password.
 *
 * BetterAuth creates the user record, fires databaseHooks to auto-generate
 * vanitySlug, then sends a verification email. The user cannot log in until
 * their email is verified.
 */
export async function signup(
  email: string,
  password: string,
  name: string
): Promise<SignupResult> {
  try {
    log.info({ method: "signup", email: maskEmail(email) }, "Signup attempt");

    const h = await getHeaders();
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
      headers: h,
    });

    const requiresEmailConfirmation = !result.user?.emailVerified;

    log.info(
      {
        method: "signup",
        email: maskEmail(email),
        userId: result.user?.id,
        requiresEmailConfirmation,
      },
      requiresEmailConfirmation
        ? "Signup successful, verification email sent"
        : "Signup successful"
    );

    return {
      requiresEmailConfirmation,
      user: result.user
        ? {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            emailVerified: result.user.emailVerified,
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
 * Log in a user with email and password.
 *
 * BetterAuth validates credentials, creates a session, and sets the session
 * cookie via the nextCookies() plugin.
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    log.info({ method: "login", email: maskEmail(email) }, "Login attempt");

    const h = await getHeaders();
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: h,
    });

    if (!result.user) {
      throw serviceError("Login succeeded but no user was returned");
    }

    log.info(
      { method: "login", email: maskEmail(email), userId: result.user.id },
      "Login successful"
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        emailVerified: result.user.emailVerified,
      },
    };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;

    log.error(
      { method: "login", email: maskEmail(email), err: error },
      "Login failed"
    );

    if (isEmailNotVerifiedError(error)) throw emailNotConfirmedError(error);
    if (isInvalidCredentialsError(error)) throw invalidCredentialsError(error);

    throw serviceError("An unexpected error occurred during login", error);
  }
}

/**
 * Log out the current user.
 *
 * Revokes the session and clears the session cookie.
 * Idempotent — succeeds even if no session exists.
 */
export async function logout(): Promise<LogoutResult> {
  try {
    const h = await getHeaders();
    const session = await auth.api.getSession({ headers: h });

    await auth.api.signOut({ headers: h });

    log.info(
      { method: "logout", userId: session?.user?.id },
      session ? "User logged out" : "Logout request (no active session)"
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
 * Request a password reset email.
 *
 * Always returns success regardless of whether the email exists (enumeration
 * protection). BetterAuth only sends an email if the account exists.
 */
export async function resetPassword(
  email: string,
  options?: { redirectTo?: string }
): Promise<ResetPasswordResult> {
  try {
    log.info(
      { method: "resetPassword", email: maskEmail(email) },
      "Password reset requested"
    );

    const h = await getHeaders();
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: options?.redirectTo ?? "/reset-password",
      },
      headers: h,
    });

    log.info(
      { method: "resetPassword", email: maskEmail(email) },
      "Password reset request processed"
    );

    return { success: true };
  } catch (error) {
    // Log internally but always return success for enumeration protection
    log.warn(
      { method: "resetPassword", email: maskEmail(email), err: error },
      "Password reset error (returning success for enumeration protection)"
    );
    return { success: true };
  }
}

/**
 * Update password using a reset token (unauthenticated flow).
 *
 * Called from the /reset-password page after the user clicks the email link.
 * Signs the user out after success for security.
 */
export async function updatePassword(
  password: string,
  token: string
): Promise<UpdatePasswordResult> {
  try {
    log.info(
      { method: "updatePassword" },
      "Password update requested via reset token"
    );

    const h = await getHeaders();
    await auth.api.resetPassword({
      body: { newPassword: password, token },
      headers: h,
    });

    log.info({ method: "updatePassword" }, "Password updated successfully");
    return { success: true };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;

    log.error(
      { method: "updatePassword", err: error },
      "Password update failed"
    );

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("expired")
    ) {
      throw serviceError(
        "Authentication link has expired. Please request a new one.",
        error
      );
    }

    throw serviceError("Failed to update password", error);
  }
}

/**
 * Change password for an already-authenticated user.
 *
 * Verifies the current password before allowing the change.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<UpdatePasswordResult> {
  try {
    log.info({ method: "changePassword" }, "Password change requested");

    const h = await getHeaders();
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: h,
    });

    log.info({ method: "changePassword" }, "Password changed successfully");
    return { success: true };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;

    log.error(
      { method: "changePassword", err: error },
      "Password change failed"
    );

    if (isInvalidCredentialsError(error)) {
      throw serviceError("Current password is incorrect", error);
    }

    throw serviceError("Failed to change password", error);
  }
}

/**
 * Get current session information.
 *
 * Returns authenticated=false (not an error) when no session exists.
 */
export async function getSession(): Promise<SessionResult> {
  try {
    const h = await getHeaders();
    const session = await auth.api.getSession({ headers: h });

    if (!session?.user) {
      log.debug({ method: "getSession" }, "Session check: not authenticated");
      return { authenticated: false, user: null, session: null };
    }

    log.debug(
      { method: "getSession", userId: session.user.id },
      "Session check: authenticated"
    );

    return {
      authenticated: true,
      user: { id: session.user.id, email: session.user.email },
      session: {
        expiresAt: session.session.expiresAt
          ? new Date(session.session.expiresAt).toISOString()
          : null,
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
