import type { JSX } from "react";
import { verifyEmailAction } from "@/actions/auth-actions";
import { VerificationPending } from "./verification-pending";
import { VerificationSuccess } from "./verification-success";
import { VerificationError } from "./verification-error";

interface VerifyEmailPageProps {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
  }>;
}

/**
 * Verify email page
 * Handles email verification from Supabase links
 * Supports both OTP (token_hash + type) and PKCE (code) flows
 */
export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const { code, token_hash, type } = params;

  // If no verification parameters, show pending state
  if (!code && !token_hash) {
    return <VerificationPending />;
  }

  // Attempt verification
  const result = await verifyEmailAction({
    code,
    token_hash,
    type: type as "email" | undefined,
  });

  // On success, show success message with redirect
  if (result.isSuccess && result.data) {
    return (
      <VerificationSuccess
        message={result.data.message}
        redirectTo={result.data.redirectTo}
      />
    );
  }

  // Show error state with resend option
  return <VerificationError error={result.error || "Verification failed"} />;
}
