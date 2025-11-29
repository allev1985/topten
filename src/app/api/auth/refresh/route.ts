import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serverError, AuthError } from "@/lib/auth/errors";

/**
 * POST /api/auth/refresh
 *
 * Refreshes the current session using the refresh token.
 * Updates session cookies with new tokens.
 * Used to extend session before access token expires.
 */
export async function POST() {
  try {
    console.info("[Refresh]", "Session refresh requested");

    const supabase = await createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error("[Refresh]", `Refresh failed: ${error.message}`);

      const expiredError = new AuthError(
        "EXPIRED_TOKEN",
        "Session has expired. Please log in again.",
        401
      );
      return NextResponse.json(expiredError.toResponse(), {
        status: expiredError.httpStatus,
      });
    }

    if (!session) {
      console.error("[Refresh]", "No session returned after refresh");

      const expiredError = new AuthError(
        "EXPIRED_TOKEN",
        "Session has expired. Please log in again.",
        401
      );
      return NextResponse.json(expiredError.toResponse(), {
        status: expiredError.httpStatus,
      });
    }

    const expiresAt = session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null;

    console.info(
      "[Refresh]",
      `Session refreshed successfully, expires at: ${expiresAt}`
    );

    return NextResponse.json({
      success: true,
      message: "Session refreshed successfully",
      session: {
        expiresAt,
      },
    });
  } catch (err) {
    console.error(
      "[Refresh]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    const error = serverError();
    return NextResponse.json(error.toResponse(), { status: error.httpStatus });
  }
}
