import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/schemas/auth";
import {
  validationError,
  authError,
  serverError,
  type AuthErrorDetail,
} from "@/lib/auth/errors";
import { getValidatedRedirect } from "@/lib/utils/redirect-validation";
import { maskEmail } from "@/lib/utils/email";

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Returns session tokens in cookies and a validated redirect URL.
 *
 * User Enumeration Protection:
 * - Returns identical error message for wrong email and wrong password
 * - Error details logged internally, not exposed to client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const details: AuthErrorDetail[] = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      const error = validationError(details);
      return NextResponse.json(error.toResponse(), {
        status: error.httpStatus,
      });
    }

    const { email, password, redirectTo } = result.data;

    console.info("[Login]", `Login attempt for email: ${maskEmail(email)}`);

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(
        "[Login]",
        `Login failed for ${maskEmail(email)}: ${error.message}`
      );

      // Check for unverified email using Supabase error status/code
      // Supabase returns status 400 with code 'email_not_confirmed' for unverified emails
      // Fallback to message check for broader compatibility
      const isUnverified =
        error.code === "email_not_confirmed" ||
        (error.status === 400 &&
          error.message.toLowerCase().includes("not confirmed"));

      const authErr = authError(
        isUnverified
          ? "Please verify your email before logging in"
          : "Invalid email or password"
      );
      return NextResponse.json(authErr.toResponse(), {
        status: authErr.httpStatus,
      });
    }

    console.info("[Login]", `Login successful for ${maskEmail(email)}`);

    const validRedirect = getValidatedRedirect(redirectTo);

    return NextResponse.json({
      success: true,
      redirectTo: validRedirect,
    });
  } catch (err) {
    console.error(
      "[Login]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    const error = serverError();
    return NextResponse.json(error.toResponse(), { status: error.httpStatus });
  }
}
