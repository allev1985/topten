"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  signupSchema,
  loginSchema,
  passwordResetSchema,
  passwordUpdateSchema,
} from "@/schemas/auth";
import type { ActionState } from "@/types/forms";
import type { AuthErrorResponse } from "@/lib/auth/errors";
import { REDIRECT_ROUTES, getAppUrl } from "@/lib/config";
import { isValidRedirect } from "@/lib/utils/validation/redirect";
import { maskEmail } from "@/lib/utils/formatting/email";
import { isEmailNotVerifiedError } from "@/lib/auth/service/errors";
import { signup, logout, resetPassword, updatePassword, getSession } from "@/lib/auth/service";
import { AuthServiceError } from "@/lib/auth/service/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * Helper to get cookies as a string for forwarding to API routes
 */
async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

/**
 * Signup action success data
 */
export interface SignupSuccessData {
  message: string;
  redirectTo: string;
}

/**
 * Login action success data
 */
export interface LoginSuccessData {
  redirectTo: string;
}

/**
 * Password reset request success data
 */
export interface PasswordResetRequestSuccessData {
  message: string;
}

/**
 * Password update success data
 */
export interface PasswordUpdateSuccessData {
  message: string;
  redirectTo?: string;
}

/**
 * Helper to map Zod errors to field errors
 */
function mapZodErrors(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string[]> {
  return issues.reduce(
    (acc, issue) => {
      const field = issue.path.map(String).join(".");
      if (!acc[field]) acc[field] = [];
      acc[field].push(issue.message);
      return acc;
    },
    {} as Record<string, string[]>
  );
}

/**
 * Helper to map API validation error details to field errors
 */
function mapApiDetailsToFieldErrors(
  details?: Array<{ field: string; message: string }>
): Record<string, string[]> {
  if (!details) return {};
  return details.reduce(
    (acc, detail) => {
      if (!acc[detail.field]) acc[detail.field] = [];
      acc[detail.field]!.push(detail.message);
      return acc;
    },
    {} as Record<string, string[]>
  );
}

/**
 * Signup server action
 * Creates a new user account with email/password
 * Calls auth service signup() method directly
 */
export async function signupAction(
  _prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>> {
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate input (for immediate feedback - service will re-validate)
  const result = signupSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    await signup(result.data.email, result.data.password);
  } catch (err) {
    // Log errors but still redirect for enumeration protection
    console.error(
      "[Signup] Error:",
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  // Always redirect to verify-email page (user enumeration protection)
  redirect("/verify-email");
}

/**
 * Login server action
 * Authenticates user with email/password
 * Directly calls Supabase to ensure cookies are properly set
 */
export async function loginAction(
  _prevState: ActionState<LoginSuccessData>,
  formData: FormData
): Promise<ActionState<LoginSuccessData>> {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectToValue = formData.get("redirectTo");
  const redirectTo =
    typeof redirectToValue === "string" && redirectToValue
      ? redirectToValue
      : undefined;

  // Validate input
  const result = loginSchema.safeParse({ email, password, redirectTo });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    console.info(
      "[Login]",
      `Login attempt for email: ${maskEmail(result.data.email)}`
    );

    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      console.error(
        "[Login]",
        `Login failed for ${maskEmail(result.data.email)}: ${error.message}`
      );

      return {
        data: null,
        error: isEmailNotVerifiedError(error)
          ? "Please verify your email before logging in"
          : "Invalid email or password",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    console.info(
      "[Login]",
      `Login successful for ${maskEmail(result.data.email)}`
    );

    // Get validated redirect URL
    const targetUrl =
      result.data.redirectTo && isValidRedirect(result.data.redirectTo)
        ? result.data.redirectTo
        : REDIRECT_ROUTES.default;

    redirect(targetUrl);
  } catch (err) {
    // Check if this is a redirect (Next.js throws for redirect)
    const isRedirect =
      (typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof (err as { digest: string }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) ||
      (err instanceof Error && err.message.startsWith("REDIRECT:"));

    if (isRedirect) {
      throw err;
    }

    console.error(
      "[Login] Unexpected error:",
      err instanceof Error ? err.message : "Unknown error"
    );

    return {
      data: null,
      error: "An unexpected error occurred. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
}

/**
 * Password reset request server action
 * Sends password reset email
 * Uses Auth Service resetPassword() directly
 */
export async function passwordResetRequestAction(
  _prevState: ActionState<PasswordResetRequestSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordResetRequestSuccessData>> {
  const email = formData.get("email");

  // Validate input
  const result = passwordResetSchema.safeParse({ email });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    // Call Auth Service directly
    await resetPassword(result.data.email, {
      redirectTo: `${getAppUrl()}/auth/password/update`,
    });

    // Always return success for user enumeration protection
    return {
      data: {
        message: "If an account exists, a password reset email has been sent",
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    console.error(
      "[PasswordResetRequest] Error:",
      err instanceof Error ? err.message : "Unknown error"
    );

    // Still return success for enumeration protection
    return {
      data: {
        message: "If an account exists, a password reset email has been sent",
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  }
}

/**
 * Password update server action
 * Updates password using reset token (unauthenticated flow)
 * Uses Auth Service updatePassword() directly
 *
 * Supports OTP token authentication from password reset email links
 */
export async function passwordUpdateAction(
  _prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const tokenHashValue = formData.get("token_hash");
  const typeValue = formData.get("type");

  // Validate password matches
  if (password !== confirmPassword) {
    return {
      data: null,
      error: null,
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
      isSuccess: false,
    };
  }

  // Validate password requirements
  const result = passwordUpdateSchema.safeParse({ password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  // Extract token_hash and type if provided (OTP authentication from reset email)
  const token_hash =
    typeof tokenHashValue === "string" && tokenHashValue
      ? tokenHashValue
      : undefined;
  const type =
    typeof typeValue === "string" && typeValue
      ? (typeValue as "recovery" | "email")
      : undefined;

  try {
    // Call Auth Service directly
    await updatePassword(result.data.password, {
      ...(token_hash && { token_hash }),
      ...(type && { type }),
    });

    // Success - redirect to login
    redirect("/login");
  } catch (err) {
    // Check if this is a redirect (Next.js throws for redirect)
    // Support both Next.js digest format and test mock format
    const isRedirect =
      (typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof (err as { digest: string }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) ||
      (err instanceof Error && err.message.startsWith("REDIRECT:"));

    if (isRedirect) {
      throw err;
    }

    // Handle AuthServiceError
    if (err instanceof AuthServiceError) {
      // Check for expired token or authentication errors
      if (
        err.message.includes("expired") ||
        err.message.includes("Authentication failed")
      ) {
        return {
          data: null,
          error: "Session has expired. Please request a new reset link.",
          fieldErrors: {},
          isSuccess: false,
        };
      }

      return {
        data: null,
        error: err.message || "Failed to update password. Please try again.",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    console.error(
      "[PasswordUpdate] Error:",
      err instanceof Error ? err.message : "Unknown error"
    );

    return {
      data: null,
      error: "Failed to update password. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
}

/**
 * Password change server action
 * Changes password for authenticated user (requires current password)
 * Uses Auth Service getSession() and updatePassword() directly
 */
export async function passwordChangeAction(
  _prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>> {
  const currentPassword = formData.get("currentPassword");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  // Validate current password is provided
  if (!currentPassword || typeof currentPassword !== "string") {
    return {
      data: null,
      error: null,
      fieldErrors: { currentPassword: ["Current password is required"] },
      isSuccess: false,
    };
  }

  // Validate password matches
  if (password !== confirmPassword) {
    return {
      data: null,
      error: null,
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
      isSuccess: false,
    };
  }

  // Validate password requirements
  const result = passwordUpdateSchema.safeParse({ password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  try {
    // First, get the current user's session to retrieve their email
    const sessionResult = await getSession();

    if (!sessionResult.authenticated || !sessionResult.user?.email) {
      return {
        data: null,
        error: "Authentication required",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    // Verify current password by attempting to sign in with Supabase client
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: sessionResult.user.email,
      password: currentPassword,
    });

    if (signInError) {
      return {
        data: null,
        error: "Current password is incorrect",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    // Update password using Auth Service
    await updatePassword(result.data.password);

    return {
      data: {
        message: "Password updated successfully",
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    // Handle AuthServiceError
    if (err instanceof AuthServiceError) {
      return {
        data: null,
        error: err.message || "Failed to update password. Please try again.",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    console.error(
      "[PasswordChange] Error:",
      err instanceof Error ? err.message : "Unknown error"
    );

    return {
      data: null,
      error: "Failed to update password. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
}

/**
 * Sign out server action
 * Terminates the user's authenticated session and redirects to home page
 * Calls auth service logout() method directly
 */
export async function signOutAction(): Promise<void> {
  try {
    await logout();
    redirect("/");
  } catch (err) {
    // Check if this is a redirect (Next.js throws for redirect)
    const isRedirect =
      (typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof (err as { digest: string }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) ||
      (err instanceof Error && err.message.startsWith("REDIRECT:"));

    if (isRedirect) {
      throw err;
    }

    console.error("[SignOut] Error:", err);
    // Don't redirect on error - let component handle it
  }
}
