import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyEmail } from "@/lib/auth/service";
import { AuthServiceError } from "@/lib/auth/service/errors";
import { config } from "@/lib/config";
import { redirectResponse } from "@/lib/utils/api/response";
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("auth-verify-route");

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

  const flow = token_hash ? "OTP" : code ? "PKCE" : "unknown";
  log.info({ method: "GET", flow }, "Email verification attempt");

  try {
    // Handle OTP-based verification (token_hash + type=email)
    if (token_hash && type === config.auth.verificationTypeEmail) {
      try {
        const result = await verifyEmail(token_hash, type);

        log.info(
          { method: "GET", flow: "OTP", userId: result.user.id },
          "OTP verification successful"
        );
        return redirectResponse(origin, config.auth.redirectRoutes.auth.success);
      } catch (error) {
        if (error instanceof AuthServiceError) {
          log.error(
            { method: "GET", flow: "OTP", err: error },
            "OTP verification error"
          );
          const errorType = error.message.toLowerCase().includes("expired")
            ? "expired_token"
            : "invalid_token";
          return redirectResponse(origin, config.auth.redirectRoutes.auth.error, {
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
        log.error(
          { method: "GET", flow: "PKCE", err: error },
          "Code exchange error"
        );
        const errorType = error.message.toLowerCase().includes("expired")
          ? "expired_token"
          : "invalid_token";
        return redirectResponse(origin, config.auth.redirectRoutes.auth.error, {
          error: errorType,
        });
      }

      log.info({ method: "GET", flow: "PKCE" }, "Code exchange successful");
      return redirectResponse(origin, config.auth.redirectRoutes.auth.success);
    }

    // No valid token or code provided
    log.warn({ method: "GET", flow: "unknown" }, "Missing token or code");
    return redirectResponse(origin, config.auth.redirectRoutes.auth.error, {
      error: "missing_token",
    });
  } catch (err) {
    log.error({ method: "GET", err }, "Unexpected error during verification");
    return redirectResponse(origin, config.auth.redirectRoutes.auth.error, {
      error: "server_error",
    });
  }
}
