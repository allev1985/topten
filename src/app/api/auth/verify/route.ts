import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyEmail } from "@/lib/auth/service";
import { AuthServiceError } from "@/lib/auth/service/errors";
import { REDIRECT_ROUTES, VERIFICATION_TYPE_EMAIL } from "@/lib/config";
import { redirectResponse } from "@/lib/utils/api/response";

/**
 * GET /api/auth/verify
 *
 * Verifies a user's email address using a token from the verification email.
 *
 * Supports two verification flows:
 * 1. OTP-based: Uses token_hash and type=email query parameters
 * 2. PKCE-based: Uses code query parameter
 *
 * On success:
 * - Marks the user's email as verified
 * - Creates an authenticated session
 * - Redirects to /dashboard with session cookie
 *
 * On error:
 * - Redirects to /auth/error with appropriate error parameter
 *
 * @param request - NextRequest with query parameters for verification
 * @returns NextResponse redirect to dashboard or error page
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  const supabase = await createClient();
  const origin = request.nextUrl.origin;

  // Log verification attempt (don't log full token)
  console.info(
    "[Verify]",
    `Verification attempt via ${token_hash ? "OTP" : code ? "PKCE" : "unknown"}`
  );

  try {
    // Handle OTP-based verification (token_hash + type=email)
    if (token_hash && type === VERIFICATION_TYPE_EMAIL) {
      try {
        const result = await verifyEmail(token_hash, type);

        console.info(
          "[Verify]",
          `OTP verification successful for user: ${result.user.id}, redirecting to dashboard`
        );
        return redirectResponse(origin, REDIRECT_ROUTES.auth.success);
      } catch (error) {
        if (error instanceof AuthServiceError) {
          console.error("[Verify]", `OTP verification error: ${error.message}`);
          const errorType = error.message.toLowerCase().includes("expired")
            ? "expired_token"
            : "invalid_token";
          return redirectResponse(origin, REDIRECT_ROUTES.auth.error, {
            error: errorType,
          });
        }
        throw error;
      }
    }

    // Handle PKCE code exchange
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[Verify]", `Code exchange error: ${error.message}`);
        const errorType = error.message.toLowerCase().includes("expired")
          ? "expired_token"
          : "invalid_token";
        return redirectResponse(origin, REDIRECT_ROUTES.auth.error, {
          error: errorType,
        });
      }

      console.info(
        "[Verify]",
        "Code exchange successful, redirecting to dashboard"
      );
      return redirectResponse(origin, REDIRECT_ROUTES.auth.success);
    }

    // No valid token or code provided
    console.error("[Verify]", "Missing token or code in verification request");
    return redirectResponse(origin, REDIRECT_ROUTES.auth.error, {
      error: "missing_token",
    });
  } catch (err) {
    console.error(
      "[Verify]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return redirectResponse(origin, REDIRECT_ROUTES.auth.error, {
      error: "server_error",
    });
  }
}
