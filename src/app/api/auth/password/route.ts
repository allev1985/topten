import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { passwordUpdateSchema } from "@/schemas/auth";
import {
  validationError,
  authError,
  serverError,
  type AuthErrorDetail,
} from "@/lib/auth/errors";
import { maskEmail } from "@/lib/utils/formatting/email";
import { errorResponse, successResponse } from "@/lib/utils/api/response";

/**
 * PUT /api/auth/password
 *
 * Updates the user's password with support for multiple authentication methods.
 *
 * Authentication priority order:
 * 1. OTP token - from password reset email link (verifyOtp with type='recovery')
 * 2. Session - existing authenticated user (getUser)
 *
 * After successful password update, the user is automatically signed out.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const result = passwordUpdateSchema.safeParse(body);

    if (!result.success) {
      const details: AuthErrorDetail[] = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return errorResponse(validationError(details));
    }

    const { password, token_hash, type } = result.data;

    const supabase = await createClient();

    let userEmail: string | null = null;
    let authMethod: "OTP" | "session" = "session";

    // Authentication priority: OTP token → existing session

    // 1. Try OTP token authentication if provided
    if (token_hash && type) {
      authMethod = "OTP";
      console.info(
        "[PasswordUpdate]",
        `Attempting OTP token authentication (type: ${type})`
      );

      const { data, error: otpError } = await supabase.auth.verifyOtp({
        type: type as "recovery" | "email",
        token_hash,
      });

      if (otpError) {
        console.error(
          "[PasswordUpdate]",
          `OTP authentication failed: ${otpError.message}`
        );

        // Check for expired token
        if (otpError.message.toLowerCase().includes("expired")) {
          return errorResponse(
            authError(
              "Authentication link has expired. Please request a new one."
            )
          );
        }

        return errorResponse(authError("Authentication failed"));
      }

      userEmail = data.user?.email ?? null;
    }
    // 2. Fall back to existing session
    else {
      authMethod = "session";
      console.info(
        "[PasswordUpdate]",
        "Attempting session-based authentication"
      );

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error(
          "[PasswordUpdate]",
          `Session authentication failed: ${userError?.message ?? "No user"}`
        );
        return errorResponse(authError("Authentication required"));
      }

      userEmail = user.email ?? null;
    }

    console.info(
      "[PasswordUpdate]",
      `Password update requested via ${authMethod} for: ${maskEmail(userEmail ?? "unknown")}`
    );

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error(
        "[PasswordUpdate]",
        `Password update failed for ${maskEmail(userEmail ?? "unknown")}: ${updateError.message}`
      );

      // Check for session-related errors
      // Known Supabase session error codes
      const sessionErrorCodes = [
        "session_expired",
        "invalid_session",
        "no_session",
      ];
      const isSessionError =
        sessionErrorCodes.includes(updateError.code ?? "") ||
        updateError.message?.toLowerCase().includes("session");

      if (isSessionError) {
        return errorResponse(
          authError("Session has expired. Please log in again.")
        );
      }

      return errorResponse(authError("Failed to update password"));
    }

    console.info(
      "[PasswordUpdate]",
      `Password updated successfully via ${authMethod} for: ${maskEmail(userEmail ?? "unknown")}`
    );

    // Sign out user after successful password update for security
    try {
      await supabase.auth.signOut();
      console.info(
        "[PasswordUpdate]",
        `User signed out after password update: ${maskEmail(userEmail ?? "unknown")}`
      );
    } catch (signOutError) {
      // Log error but don't fail the operation - password was already updated successfully
      console.error(
        "[PasswordUpdate]",
        `Sign-out failed after password update: ${signOutError instanceof Error ? signOutError.message : "Unknown error"}`
      );
    }

    return successResponse({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error(
      "[PasswordUpdate]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return errorResponse(serverError());
  }
}
