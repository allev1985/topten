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
import { REDIRECT_ROUTES, getAppUrl } from "@/lib/config";
import { isValidRedirect } from "@/lib/utils/validation/redirect";

/**
 * API error response format from auth endpoints
 */
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

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
 * Calls /api/auth/signup endpoint
 */
export async function signupAction(
  _prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>> {
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate input (for immediate feedback - API will re-validate)
  const result = signupSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  const baseUrl = getAppUrl();

  try {
    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: result.data.email,
        password: result.data.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      // Log error but don't expose to user for enumeration protection
      console.error("[Signup] Error:", errorData.error.message);
    }
  } catch (err) {
    // Log network errors but still redirect for enumeration protection
    console.error(
      "[Signup] Network error:",
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  // Always redirect to verify-email page (user enumeration protection)
  redirect("/verify-email");
}

/**
 * Login server action
 * Authenticates user with email/password
 * Calls /api/auth/login endpoint
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

  // Validate input (for immediate feedback - API will re-validate)
  const result = loginSchema.safeParse({ email, password, redirectTo });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  const baseUrl = getAppUrl();

  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: result.data.email,
        password: result.data.password,
        redirectTo: result.data.redirectTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      // Use generic error message for security
      return {
        data: null,
        error: errorData.error.message || "Invalid email or password",
        fieldErrors: mapApiDetailsToFieldErrors(errorData.error.details),
        isSuccess: false,
      };
    }

    // Success - get validated redirect URL from API response
    const targetUrl =
      data.redirectTo && isValidRedirect(data.redirectTo)
        ? data.redirectTo
        : REDIRECT_ROUTES.default;

    redirect(targetUrl);
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

    console.error(
      "[Login] Network error:",
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
 * Calls /api/auth/password/reset endpoint
 */
export async function passwordResetRequestAction(
  _prevState: ActionState<PasswordResetRequestSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordResetRequestSuccessData>> {
  const email = formData.get("email");

  // Validate input (for immediate feedback - API will re-validate)
  const result = passwordResetSchema.safeParse({ email });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  const baseUrl = getAppUrl();

  try {
    const response = await fetch(`${baseUrl}/api/auth/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: result.data.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      // For validation errors, return field errors
      if (errorData.error.code === "VALIDATION_ERROR") {
        return {
          data: null,
          error: null,
          fieldErrors: mapApiDetailsToFieldErrors(errorData.error.details),
          isSuccess: false,
        };
      }
      // For other errors (shouldn't happen due to enumeration protection)
      // but fall through to success response anyway
    }

    // Always return success for user enumeration protection
    return {
      data: {
        message:
          data.message ||
          "If an account exists, a password reset email has been sent",
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    console.error(
      "[PasswordResetRequest] Network error:",
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
 * Calls /api/auth/password PUT endpoint
 */
export async function passwordUpdateAction(
  _prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  // Validate password matches
  if (password !== confirmPassword) {
    return {
      data: null,
      error: null,
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
      isSuccess: false,
    };
  }

  // Validate password requirements (for immediate feedback - API will re-validate)
  const result = passwordUpdateSchema.safeParse({ password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  const baseUrl = getAppUrl();
  const cookieHeader = await getCookieHeader();

  try {
    const response = await fetch(`${baseUrl}/api/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        password: result.data.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;

      // Check for authentication/session errors
      if (
        errorData.error.code === "AUTH_ERROR" ||
        errorData.error.message.toLowerCase().includes("session") ||
        errorData.error.message.toLowerCase().includes("authentication")
      ) {
        return {
          data: null,
          error: "Session has expired. Please request a new reset link.",
          fieldErrors: {},
          isSuccess: false,
        };
      }

      // Handle validation errors
      if (errorData.error.code === "VALIDATION_ERROR") {
        return {
          data: null,
          error: null,
          fieldErrors: mapApiDetailsToFieldErrors(errorData.error.details),
          isSuccess: false,
        };
      }

      return {
        data: null,
        error: "Failed to update password. Please try again.",
        fieldErrors: {},
        isSuccess: false,
      };
    }

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

    console.error(
      "[PasswordUpdate] Network error:",
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
 * Calls /api/auth/password PUT endpoint after verifying current password via /api/auth/login
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

  // Validate password requirements (for immediate feedback - API will re-validate)
  const result = passwordUpdateSchema.safeParse({ password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  const baseUrl = getAppUrl();
  const cookieHeader = await getCookieHeader();

  try {
    // First, get the current user's session to retrieve their email
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!sessionResponse.ok) {
      return {
        data: null,
        error: "Authentication required",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    const sessionData = await sessionResponse.json();

    if (!sessionData.user?.email) {
      return {
        data: null,
        error: "Authentication required",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    // Verify current password by attempting to log in
    const verifyResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        email: sessionData.user.email,
        password: currentPassword,
      }),
    });

    if (!verifyResponse.ok) {
      return {
        data: null,
        error: "Current password is incorrect",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    // Update password
    const updateResponse = await fetch(`${baseUrl}/api/auth/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        password: result.data.password,
      }),
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      const errorData = updateData as ApiErrorResponse;

      // Handle validation errors
      if (errorData.error.code === "VALIDATION_ERROR") {
        return {
          data: null,
          error: null,
          fieldErrors: mapApiDetailsToFieldErrors(errorData.error.details),
          isSuccess: false,
        };
      }

      return {
        data: null,
        error: "Failed to update password. Please try again.",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    return {
      data: {
        message: "Password updated successfully",
      },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    console.error(
      "[PasswordChange] Network error:",
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
