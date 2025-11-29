import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionInfo } from "@/lib/utils/session";
import { serverError } from "@/lib/auth/errors";

/**
 * GET /api/auth/session
 *
 * Returns the current session status and user information.
 * Does not cause any side effects (idempotent).
 * Returns authenticated=false for unauthenticated requests (not an error).
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sessionInfo = getSessionInfo(session);

    if (!sessionInfo.isValid || !session) {
      console.info("[Session]", "Session status check: not authenticated");

      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
        session: null,
      });
    }

    console.info(
      "[Session]",
      `Session status check: authenticated as ${sessionInfo.user?.id ?? "unknown"}`
    );

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: sessionInfo.user,
      session: {
        expiresAt: sessionInfo.expiresAt?.toISOString() ?? null,
        isExpiringSoon: sessionInfo.isExpiringSoon,
      },
    });
  } catch (err) {
    console.error(
      "[Session]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    const error = serverError();
    return NextResponse.json(error.toResponse(), { status: error.httpStatus });
  }
}
