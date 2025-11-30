import type { JSX } from "react";
import { ForgotPasswordForm } from "./forgot-password-form";

/**
 * Forgot password page
 * Allows users to request a password reset email
 */
export default function ForgotPasswordPage(): JSX.Element {
  return (
    <main>
      <ForgotPasswordForm />
    </main>
  );
}
