import type { JSX } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "./forgot-password-form";

/**
 * Forgot password page
 * Allows users to request a password reset email
 */
export default function ForgotPasswordPage(): JSX.Element {
  return (
    <AuthCard
      title="Reset Password"
      description="Enter your email and we'll send you a reset link"
      footer={
        <p>
          Remember your password? <a href="/login">Sign in</a>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
