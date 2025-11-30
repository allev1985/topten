"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  signupSchema,
  loginSchema,
  passwordResetSchema,
  passwordUpdateSchema,
} from "@/schemas/auth";
import type { ActionState } from "@/types/forms";
import { REDIRECT_ROUTES, getAppUrl } from "@/lib/config";

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
 * Validate redirect URL for security
 */
function isValidRedirectUrl(url: string): boolean {
  // Must be a relative path starting with /
  if (!url.startsWith("/")) return false;
  // Must not be a protocol-relative URL
  if (url.startsWith("//")) return false;
  // Must not contain protocol handlers
  if (url.includes(":")) return false;
  return true;
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
 * Signup server action
 * Creates a new user account with email/password
 */
export async function signupAction(
  _prevState: ActionState<SignupSuccessData>,
  formData: FormData
): Promise<ActionState<SignupSuccessData>> {
  const email = formData.get("email");
  const password = formData.get("password");

  // Validate input
  const result = signupSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      data: null,
      error: null,
      fieldErrors: mapZodErrors(result.error.issues),
      isSuccess: false,
    };
  }

  const supabase = await createClient();
  const siteUrl = getAppUrl() || process.env.NEXT_PUBLIC_SITE_URL || "";

  // Always return success message for user enumeration protection
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/verify`,
    },
  });

  // Log error but don't expose to user for enumeration protection
  if (error) {
    console.error("[Signup] Error:", error.message);
  }

  // Always redirect to verify-email page
  redirect("/verify-email");
}

/**
 * Login server action
 * Authenticates user with email/password
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

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    // Use generic error message for security
    return {
      data: null,
      error: "Invalid email or password",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  // Validate and use redirect URL
  const targetUrl =
    redirectTo && isValidRedirectUrl(redirectTo)
      ? redirectTo
      : REDIRECT_ROUTES.default;

  redirect(targetUrl);
}

/**
 * Password reset request server action
 * Sends password reset email
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

  const supabase = await createClient();
  const siteUrl = getAppUrl() || process.env.NEXT_PUBLIC_SITE_URL || "";

  // Always return success for user enumeration protection
  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${siteUrl}/reset-password`,
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
 * Password update server action
 * Updates password using reset token (unauthenticated flow)
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

  const supabase = await createClient();

  // Check if user has a valid session (from reset link)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: "Session has expired. Please request a new reset link.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return {
      data: null,
      error: "Failed to update password. Please try again.",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  // Sign out after password reset to force re-login
  await supabase.auth.signOut();

  redirect("/login");
}

/**
 * Password change server action
 * Changes password for authenticated user (requires current password)
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

  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return {
      data: null,
      error: "Authentication required",
      fieldErrors: {},
      isSuccess: false,
    };
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
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

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (updateError) {
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
}
