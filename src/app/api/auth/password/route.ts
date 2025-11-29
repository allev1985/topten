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
 * Updates the user's password. Can be called either:
 * 1. After clicking a password reset link (session established via reset token)
 * 2. By an authenticated user changing their password
 *
 * Requires a valid session (from either method).
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

    const { password } = result.data;

    const supabase = await createClient();

    // Check for active session via getUser (validates with Supabase server)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "[PasswordUpdate]",
        `Authentication check failed: ${userError?.message ?? "No user"}`
      );
      return errorResponse(authError("Authentication required"));
    }

    console.info(
      "[PasswordUpdate]",
      `Password update requested for: ${maskEmail(user.email ?? "unknown")}`
    );

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error(
        "[PasswordUpdate]",
        `Password update failed for ${maskEmail(user.email ?? "unknown")}: ${updateError.message}`
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
      `Password updated successfully for: ${maskEmail(user.email ?? "unknown")}`
    );

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
