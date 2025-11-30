import type { JSX } from "react";
import { AuthCard } from "@/components/auth/auth-card";

/**
 * Verify email waiting page
 * Shown after signup to instruct user to check their email
 */
export default function VerifyEmailPage(): JSX.Element {
  return (
    <AuthCard
      title="Check your email"
      description="We've sent you a verification link"
      footer={
        <p>
          <a href="/login">Back to sign in</a>
        </p>
      }
    >
      <div>
        <p>
          Please check your inbox and click the verification link to complete
          your registration.
        </p>
        <p>
          <strong>Didn&apos;t receive the email?</strong>
        </p>
        <ul>
          <li>Check your spam or junk folder</li>
          <li>Make sure you entered the correct email address</li>
          <li>Wait a few minutes and try again</li>
        </ul>
      </div>
    </AuthCard>
  );
}
