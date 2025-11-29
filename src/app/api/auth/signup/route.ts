import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema, signupSuccessResponse } from "@/schemas/auth";
import {
  validationError,
  serverError,
  type AuthErrorDetail,
} from "@/lib/auth/errors";
import { getAppUrl } from "@/lib/config";
import { maskEmail } from "@/lib/utils/email";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

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
      return errorResponse(error);
    }

    const { email, password } = result.data;

    // Log signup attempt (never log password)
    console.info("[Signup]", `Signup attempt for email: ${maskEmail(email)}`);

    // Get origin for email redirect URL
    const origin = getAppUrl(request.headers.get("origin"));

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
    return successResponse(signupSuccessResponse, 201);
  } catch (err) {
    console.error(
      "[Signup]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    const error = serverError();
    return errorResponse(error);
  }
}
