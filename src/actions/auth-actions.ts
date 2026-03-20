"use server";

import { redirect } from "next/navigation";
import {
  signupSchema,
  loginSchema,
  passwordResetSchema,
  passwordUpdateSchema,
} from "@/schemas/auth";
import type { ActionState } from "@/types/forms";
import { config } from "@/lib/config";
import { isValidRedirect } from "@/lib/utils/validation/redirect";
import { maskEmail } from "@/lib/utils/formatting/email";
import {
  signup,
  login,
  logout,
  resetPassword,
  updatePassword,
  changePassword,
  AuthServiceError,
} from "@/lib/auth";
import { mapZodErrors } from "@/lib/utils/validation/zod";
import { requireAuth } from "@/lib/utils/actions";
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("auth-actions");

export interface SignupSuccessData {
  message: string;
  redirectTo: string;
}

export interface LoginSuccessData {
  redirectTo: string;
}

export interface PasswordResetRequestSuccessData {
  message: string;
}

export interface PasswordUpdateSuccessData {
  message: string;
  redirectTo?: string;
}

/**
 * Signup server action
 */
export async function signupAction(
  _prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>> {
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name") ?? email; // fall back to email if no name field

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
    await signup(
      result.data.email,
      result.data.password,
      typeof name === "string" ? name : result.data.email
    );
  } catch (err) {
    // Log internally but still redirect — enumeration protection
    log.error(
      { method: "signupAction", err },
      "Signup error (redirecting for enumeration protection)"
    );
  }

  // Always redirect to verify-email page (user enumeration protection)
  redirect("/verify-email");
}

/**
 * Login server action
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
    log.info(
      { method: "loginAction", email: maskEmail(result.data.email) },
      "Login attempt"
    );

    await login(result.data.email, result.data.password);

    log.info(
      { method: "loginAction", email: maskEmail(result.data.email) },
      "Login successful"
    );

    const targetUrl =
      result.data.redirectTo && isValidRedirect(result.data.redirectTo)
        ? result.data.redirectTo
        : config.auth.redirectRoutes.default;

    redirect(targetUrl);
  } catch (err) {
    const isRedirect =
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      typeof (err as { digest: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT");

    if (isRedirect) throw err;

    if (err instanceof AuthServiceError) {
      return {
        data: null,
        error:
          err.code === "EMAIL_NOT_CONFIRMED"
            ? "Please verify your email before logging in"
            : "Invalid email or password",
        fieldErrors: {},
        isSuccess: false,
      };
    }

    log.error({ method: "loginAction", err }, "Unexpected error");

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
 */
export async function passwordResetRequestAction(
  _prevState: ActionState<PasswordResetRequestSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordResetRequestSuccessData>> {
  const email = formData.get("email");

  const result = passwordResetSchema.safeParse({ email });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  // resetPassword() always returns success (enumeration protection)
  await resetPassword(result.data.email, {
    redirectTo: "/reset-password",
  });

  return {
    data: {
      message: "If an account exists, a password reset email has been sent",
    },
    error: null,
    fieldErrors: {},
    isSuccess: true,
  };
}

/**
 * Password update server action (unauthenticated — from reset email link)
 */
export async function passwordUpdateAction(
  _prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const token = formData.get("token");

  if (password !== confirmPassword) {
    return {
      data: null,
      error: null,
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
      isSuccess: false,
    };
  }

  const result = passwordUpdateSchema.safeParse({ password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  if (!token || typeof token !== "string") {
    return {
      data: null,
      error: "Invalid reset link. Please request a new password reset.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    await updatePassword(result.data.password, token);
    redirect("/login");
  } catch (err) {
    const isRedirect =
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      typeof (err as { digest: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT");

    if (isRedirect) throw err;

    if (err instanceof AuthServiceError) {
      return {
        data: null,
        error: err.message.includes("expired")
          ? "Reset link has expired. Please request a new one."
          : err.message,
        fieldErrors: {},
        isSuccess: false,
      };
    }

    log.error({ method: "passwordUpdateAction", err }, "Unexpected error");
    return {
      data: null,
      error: "Failed to update password. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }
}

/**
 * Password change server action (authenticated — settings page)
 */
export async function passwordChangeAction(
  _prevState: ActionState<PasswordUpdateSuccessData>,
  formData: FormData
): Promise<ActionState<PasswordUpdateSuccessData>> {
  const currentPassword = formData.get("currentPassword");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (!currentPassword || typeof currentPassword !== "string") {
    return {
      data: null,
      error: null,
      fieldErrors: { currentPassword: ["Current password is required"] },
      isSuccess: false,
    };
  }

  if (password !== confirmPassword) {
    return {
      data: null,
      error: null,
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
      isSuccess: false,
    };
  }

  const result = passwordUpdateSchema.safeParse({ password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  const auth = await requireAuth();
  if ("error" in auth) {
    return { data: null, error: auth.error, fieldErrors: {}, isSuccess: false };
  }

  try {
    await changePassword(currentPassword, result.data.password);
    return {
      data: { message: "Password updated successfully" },
      error: null,
      fieldErrors: {},
      isSuccess: true,
    };
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return {
        data: null,
        error: err.message,
        fieldErrors: {},
        isSuccess: false,
      };
    }

    log.error({ method: "passwordChangeAction", err }, "Unexpected error");
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
 */
export async function signOutAction(): Promise<void> {
  try {
    await logout();
    redirect("/");
  } catch (err) {
    const isRedirect =
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      typeof (err as { digest: string }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT");

    if (isRedirect) throw err;

    log.error({ method: "signOutAction", err }, "Sign-out error");
  }
}
