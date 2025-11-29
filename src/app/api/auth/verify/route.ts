import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REDIRECT, VERIFICATION_TYPE_EMAIL } from "@/lib/config";

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
      const { error } = await supabase.auth.verifyOtp({
        type: VERIFICATION_TYPE_EMAIL,
        token_hash,
      });

      if (error) {
        console.error("[Verify]", `OTP verification error: ${error.message}`);
        const errorType = error.message.toLowerCase().includes("expired")
          ? "expired_token"
          : "invalid_token";
        return NextResponse.redirect(
          `${origin}${REDIRECT.ERROR}?error=${errorType}`
        );
      }

      console.info(
        "[Verify]",
        "OTP verification successful, redirecting to dashboard"
      );
      return NextResponse.redirect(`${origin}${REDIRECT.SUCCESS}`);
    }

    // Handle PKCE code exchange
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[Verify]", `Code exchange error: ${error.message}`);
        const errorType = error.message.toLowerCase().includes("expired")
          ? "expired_token"
          : "invalid_token";
        return NextResponse.redirect(
          `${origin}${REDIRECT.ERROR}?error=${errorType}`
        );
      }

      console.info(
        "[Verify]",
        "Code exchange successful, redirecting to dashboard"
      );
      return NextResponse.redirect(`${origin}${REDIRECT.SUCCESS}`);
    }

    // No valid token or code provided
    console.error("[Verify]", "Missing token or code in verification request");
    return NextResponse.redirect(
      `${origin}${REDIRECT.ERROR}?error=missing_token`
    );
  } catch (err) {
    console.error(
      "[Verify]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.redirect(
      `${origin}${REDIRECT.ERROR}?error=server_error`
    );
  }
}
