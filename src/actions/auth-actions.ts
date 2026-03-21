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
  sendMFACode,
  verifyMFACode,
  AuthServiceError,
} from "@/lib/auth";
import { isSlugAvailable, updateSlug } from "@/lib/profile";
import { mapZodErrors } from "@/lib/utils/validation/zod";
import { requireAuth } from "@/lib/utils/actions";
import { createServiceLogger } from "@/lib/services/logging";
import { getClientIP } from "@/lib/utils/request";
import {
  loginIPLimiter,
  loginEmailLimiter,
  signupLimiter,
  resetPasswordIPLimiter,
  resetPasswordEmailLimiter,
  mfaSendLimiter,
  mfaVerifyLimiter,
  passwordChangeLimiter,
} from "@/lib/services/rate-limit";

const log = createServiceLogger("auth-actions");

const RATE_LIMIT_MESSAGE = "Too many attempts. Please try again later.";

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

export interface VerifyMFASuccessData {
  redirectTo: string;
}

/**
 * Signup server action
 */
export async function signupAction(
  _prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>> {
  const ip = await getClientIP();
  const ipCheck = await signupLimiter.check(ip);
  if (!ipCheck.allowed) {
    return {
      data: null,
      error: RATE_LIMIT_MESSAGE,
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const name = formData.get("name");
  const vanitySlug = formData.get("vanitySlug");

  if (
    typeof password === "string" &&
    typeof confirmPassword === "string" &&
    password !== confirmPassword
  ) {
    return {
      data: null,
      error: null,
      fieldErrors: { confirmPassword: ["Passwords do not match"] },
      isSuccess: false,
    };
  }

  const result = signupSchema.safeParse({ email, password, name, vanitySlug });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  // Pre-check slug before creating the user — safe to surface this error
  // (does not reveal whether the email already exists)
  try {
    const slugFree = await isSlugAvailable(result.data.vanitySlug);
    if (!slugFree) {
      return {
        data: null,
        error: null,
        fieldErrors: { vanitySlug: ["This profile URL is already taken"] },
        isSuccess: false,
      };
    }
  } catch (err) {
    log.warn(
      { method: "signupAction", err },
      "Slug availability check failed — proceeding with signup"
    );
  }

  let userId: string | undefined;
  try {
    const signupResult = await signup(
      result.data.email,
      result.data.password,
      result.data.name
    );
    userId = signupResult.user?.id ?? undefined;
  } catch (err) {
    // Log internally but still redirect — enumeration protection
    log.error(
      { method: "signupAction", err },
      "Signup error (redirecting for enumeration protection)"
    );
  }

  // Best-effort: override the auto-generated slug with the user's chosen one
  if (userId) {
    try {
      await updateSlug(userId, result.data.vanitySlug);
    } catch (err) {
      log.warn(
        { method: "signupAction", userId, err },
        "Post-signup slug update failed — auto-generated slug retained"
      );
    }
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
  const ip = await getClientIP();
  const ipCheck = await loginIPLimiter.check(ip);
  if (!ipCheck.allowed) {
    return {
      data: null,
      error: RATE_LIMIT_MESSAGE,
      fieldErrors: {},
      isSuccess: false,
    };
  }

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

  const emailCheck = await loginEmailLimiter.check(
    result.data.email.toLowerCase()
  );
  if (!emailCheck.allowed) {
    return {
      data: null,
      error: RATE_LIMIT_MESSAGE,
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    log.info(
      { method: "loginAction", email: maskEmail(result.data.email) },
      "Login attempt"
    );

    const loginResult = await login(result.data.email, result.data.password);

    if (loginResult.requiresMFA) {
      // two-factor cookie is now set — redirect to MFA verification
      const target =
        result.data.redirectTo && isValidRedirect(result.data.redirectTo)
          ? result.data.redirectTo
          : config.auth.redirectRoutes.default;
      redirect(`/verify-mfa?redirectTo=${encodeURIComponent(target)}`);
    }

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
  const ip = await getClientIP();
  const ipCheck = await resetPasswordIPLimiter.check(ip);
  if (!ipCheck.allowed) {
    return {
      data: null,
      error: RATE_LIMIT_MESSAGE,
      fieldErrors: {},
      isSuccess: false,
    };
  }

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

  const emailCheck = await resetPasswordEmailLimiter.check(
    result.data.email.toLowerCase()
  );
  if (!emailCheck.allowed) {
    return {
      data: null,
      error: RATE_LIMIT_MESSAGE,
      fieldErrors: {},
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

  if (
    typeof password === "string" &&
    typeof confirmPassword === "string" &&
    password !== confirmPassword
  ) {
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

  if (
    typeof password === "string" &&
    typeof confirmPassword === "string" &&
    password !== confirmPassword
  ) {
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

  const rateLimitCheck = await passwordChangeLimiter.check(auth.userId);
  if (!rateLimitCheck.allowed) {
    return {
      data: null,
      error: RATE_LIMIT_MESSAGE,
      fieldErrors: {},
      isSuccess: false,
    };
  }

  try {
    await changePassword(currentPassword, result.data.password);
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

  // Session has been revoked by the service — redirect outside the try/catch
  // so Next.js's NEXT_REDIRECT exception is never caught and suppressed.
  // The user re-authenticates with the new password on the login page.
  redirect("/login?notice=password_changed");
}

/**
 * Send MFA code server action
 * Triggers BetterAuth to generate and email a one-time code to the user.
 * Requires the two-factor cookie set during the password-login step.
 */
export async function sendMFACodeAction(): Promise<{ error?: string }> {
  const ip = await getClientIP();
  const ipCheck = await mfaSendLimiter.check(ip);
  if (!ipCheck.allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  try {
    await sendMFACode();
    return {};
  } catch (err) {
    log.error({ method: "sendMFACodeAction", err }, "Failed to send MFA code");
    return { error: "Failed to send verification code. Please try again." };
  }
}

/**
 * Verify MFA code server action
 * Validates the submitted code and, on success, creates a full session.
 */
export async function verifyMFAAction(
  _prevState: ActionState<VerifyMFASuccessData>,
  formData: FormData
): Promise<ActionState<VerifyMFASuccessData>> {
  const ip = await getClientIP();
  const ipCheck = await mfaVerifyLimiter.check(ip);
  if (!ipCheck.allowed) {
    return {
      data: null,
      error: RATE_LIMIT_MESSAGE,
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const code = formData.get("code");
  const redirectTo = formData.get("redirectTo");

  if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return {
      data: null,
      error: null,
      fieldErrors: { code: ["Enter the 6-digit code from your email"] },
      isSuccess: false,
    };
  }

  try {
    await verifyMFACode(code.trim());
  } catch (err) {
    if (err instanceof AuthServiceError) {
      const sessionExpired =
        err.code === "INVALID_MFA_SESSION" ||
        err.code === "MFA_CODE_EXPIRED" ||
        err.code === "TOO_MANY_MFA_ATTEMPTS";

      return {
        data: null,
        error: sessionExpired
          ? `${err.message} Please log in again.`
          : err.message,
        fieldErrors: {},
        isSuccess: false,
      };
    }

    log.error({ method: "verifyMFAAction", err }, "Unexpected error");
    return {
      data: null,
      error: "Something went wrong. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const targetUrl =
    typeof redirectTo === "string" && isValidRedirect(redirectTo)
      ? redirectTo
      : config.auth.redirectRoutes.default;

  redirect(targetUrl);
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
