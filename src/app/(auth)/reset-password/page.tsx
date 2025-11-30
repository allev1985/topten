import type { JSX } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordResetForm } from "./password-reset-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{
    code?: string;
  }>;
}

/**
 * Page state type for reset password page
 */
type PageState =
  | { type: "form" }
  | { type: "error"; errorType: "expired" | "invalid" | "access_denied" };

/**
 * Error state component for reset password page
 */
function ErrorState({
  errorType,
}: {
  errorType: "expired" | "invalid" | "access_denied";
}): JSX.Element {
  const config = {
    expired: {
      title: "Reset Link Expired",
      description: "This password reset link has expired",
      message:
        "Password reset links are only valid for a limited time. Please request a new one.",
    },
    invalid: {
      title: "Invalid Reset Link",
      description: "This password reset link is invalid",
      message:
        "The password reset link you followed is invalid or has already been used. Please request a new one.",
    },
    access_denied: {
      title: "Access Denied",
      description: "You need a valid reset link to access this page",
      message: "To reset your password, please request a password reset email.",
    },
  };

  const { title, description, message } = config[errorType];

  return (
    <main>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{message}</p>
        </CardContent>
        <CardFooter>
          <p>
            <a href="/forgot-password">Request a new password reset link</a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

/**
 * Reset password page
 * Allows users to set a new password after clicking reset link
 *
 * Supports three scenarios:
 * 1. Email link flow: User clicks reset link with code parameter
 * 2. Authenticated user: User navigates directly while logged in
 * 3. Access denied: Unauthenticated user without code
 */
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const { code } = params;

  const supabase = await createClient();
  let pageState: PageState;

  if (code) {
    // Exchange code for session (email link flow)
    console.info("[ResetPassword]", "Attempting code exchange");
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Determine if the error is due to expiration
      // Check error code first if available, fall back to message matching
      // This follows the pattern from /api/auth/verify/route.ts
      const isExpired =
        error.code === "otp_expired" ||
        error.message.toLowerCase().includes("expired");
      console.info(
        "[ResetPassword]",
        `Code exchange failed: ${isExpired ? "expired" : "invalid"}`
      );
      pageState = { type: "error", errorType: isExpired ? "expired" : "invalid" };
    } else {
      console.info("[ResetPassword]", "Code exchange successful");
      pageState = { type: "form" };
    }
  } else {
    // Check for existing session (authenticated user flow)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      console.info("[ResetPassword]", "User has existing session");
      pageState = { type: "form" };
    } else {
      console.info("[ResetPassword]", "No code and no session - access denied");
      pageState = { type: "error", errorType: "access_denied" };
    }
  }

  // Render based on state
  if (pageState.type === "error") {
    return <ErrorState errorType={pageState.errorType} />;
  }

  return (
    <main>
      <PasswordResetForm />
    </main>
  );
}
