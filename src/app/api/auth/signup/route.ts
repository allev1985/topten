import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth";
import {
  validationError,
  serverError,
  type AuthErrorDetail,
} from "@/lib/auth/errors";

/**
 * Consistent response for user enumeration protection
 * Returns the same message for both new and existing users
 */
const SUCCESS_RESPONSE = {
  success: true,
  message: "Please check your email to verify your account",
} as const;

/**
 * POST /api/auth/signup
 *
 * Creates a new user account and sends a verification email.
 *
 * User Enumeration Protection:
 * - Always returns 201 with generic success message
 * - Response is identical whether user is new or existing
 * - Error details are logged internally, not exposed to client
 *
 * @param request - NextRequest with JSON body containing email and password
 * @returns NextResponse with 201 for success, 400 for validation errors, 500 for server errors
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body - handle invalid JSON gracefully
    const body = await request.json().catch(() => ({}));

    // Validate input against schema
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      // Map Zod validation errors to API error format
      const details: AuthErrorDetail[] = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      const error = validationError(details);
      return NextResponse.json(error.toResponse(), {
        status: error.httpStatus,
      });
    }

    const { email, password } = result.data;

    // Log signup attempt (never log password)
    console.info("[Signup]", `Signup attempt for email: ${maskEmail(email)}`);

    // Get origin for email redirect URL
    const origin =
      request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;

    // Create Supabase client and attempt signup
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/api/auth/verify`,
      },
    });

    // Log error internally but don't expose to client (user enumeration protection)
    if (error) {
      console.error(
        "[Signup]",
        `Supabase signup error for ${maskEmail(email)}: ${error.message}`
      );
      // Still return success response to prevent enumeration
    } else {
      console.info(
        "[Signup]",
        `Signup successful for ${maskEmail(email)}, verification email sent`
      );
    }

    // Always return same response (user enumeration protection)
    return NextResponse.json(SUCCESS_RESPONSE, { status: 201 });
  } catch (err) {
    console.error(
      "[Signup]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    const error = serverError();
    return NextResponse.json(error.toResponse(), { status: error.httpStatus });
  }
}

/**
 * Masks email address for safe logging
 * Shows first 2 characters and domain only
 * Example: "test@example.com" -> "te***@example.com"
 */
function maskEmail(email: string): string {
  const parts = email.split("@");
  const local = parts[0] ?? "";
  const domain = parts[1];
  if (!domain || local.length <= 2) {
    return `${local.slice(0, 2)}***@${domain ?? "unknown"}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}
