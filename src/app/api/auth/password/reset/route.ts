import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { passwordResetSchema } from "@/schemas/auth";
import {
  validationError,
  serverError,
  type AuthErrorDetail,
} from "@/lib/auth/errors";
import { maskEmail } from "@/lib/utils/email";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

/**
 * POST /api/auth/password/reset
 *
 * Requests a password reset email for the provided email address.
 *
 * User Enumeration Protection:
 * - Returns identical success response regardless of whether the email exists
 * - Errors are logged internally but not exposed to clients
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const result = passwordResetSchema.safeParse(body);

    if (!result.success) {
      const details: AuthErrorDetail[] = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      const error = validationError(details);
      return errorResponse(error);
    }

    const { email } = result.data;

    console.info(
      "[PasswordReset]",
      `Password reset requested for: ${maskEmail(email)}`
    );

    const supabase = await createClient();

    // Build the redirect URL for password reset
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const redirectTo = `${siteUrl}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // Log errors internally but always return success for enumeration protection
    if (error) {
      console.error(
        "[PasswordReset]",
        `Reset error for ${maskEmail(email)}: ${error.message}`
      );
    }

    // Always return success regardless of whether email exists
    return successResponse({
      message: "If an account exists, a password reset email has been sent",
    });
  } catch (err) {
    console.error(
      "[PasswordReset]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return errorResponse(serverError());
  }
}
