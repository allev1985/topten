import type { JSX } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{
    code?: string;
  }>;
}

/**
 * Reset password page
 * Allows users to set a new password after clicking reset link
 */
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const { code } = params;

  // If no code, show error state
  if (!code) {
    return (
      <AuthCard
        title="Invalid Reset Link"
        description="This password reset link is invalid or has expired"
        footer={
          <p>
            <a href="/forgot-password">Request a new reset link</a>
          </p>
        }
      >
        <div>
          <p>
            The password reset link you followed appears to be invalid or has
            expired. Please request a new one.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set New Password"
      description="Enter your new password below"
      footer={
        <p>
          <a href="/login">Back to sign in</a>
        </p>
      }
    >
      <PasswordResetForm />
    </AuthCard>
  );
}
