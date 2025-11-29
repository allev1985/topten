import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serverError } from "@/lib/auth/errors";

/**
 * POST /api/auth/logout
 *
 * Invalidates the current user session and clears cookies.
 * This endpoint is idempotent - returns success even if no session exists.
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Get current user for logging (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[Logout]", `Logout error: ${error.message}`);
      // Still return success for idempotency
    }

    console.info(
      "[Logout]",
      user
        ? `User logged out: ${user.id}`
        : "Logout request (no active session)"
    );

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error(
      "[Logout]",
      "Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    const error = serverError();
    return NextResponse.json(error.toResponse(), { status: error.httpStatus });
  }
}
