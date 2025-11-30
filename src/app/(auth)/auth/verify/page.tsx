import type { JSX } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/auth-card";
import { REDIRECT_ROUTES } from "@/lib/config";

interface AuthVerifyPageProps {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    code?: string;
    error?: string;
    error_description?: string;
  }>;
}

/**
 * Auth verification handler page
 * Processes email verification tokens and redirects appropriately
 */
export default async function AuthVerifyPage({
  searchParams,
}: AuthVerifyPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const { token_hash, type, code, error, error_description } = params;

  // Handle error from Supabase
  if (error) {
    return (
      <AuthCard
        title="Verification Failed"
        description={
          error_description || "The verification link is invalid or has expired"
        }
        footer={
          <p>
            <a href="/signup">Try signing up again</a>
          </p>
        }
      >
        <div>
          <p>
            Your verification link may have expired. Please request a new one by
            signing up again.
          </p>
        </div>
      </AuthCard>
    );
  }

  const supabase = await createClient();

  // Handle PKCE code exchange
  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return (
        <AuthCard
          title="Verification Failed"
          description="Unable to verify your email"
          footer={
            <p>
              <a href="/signup">Try signing up again</a>
            </p>
          }
        >
          <div>
            <p>
              There was a problem verifying your email. The link may have
              expired.
            </p>
          </div>
        </AuthCard>
      );
    }

    redirect(REDIRECT_ROUTES.auth.success);
  }

  // Handle OTP token verification
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "signup",
    });

    if (verifyError) {
      return (
        <AuthCard
          title="Verification Failed"
          description="The verification link is invalid or has expired"
          footer={
            <p>
              <a href="/signup">Try signing up again</a>
            </p>
          }
        >
          <div>
            <p>
              Your verification link may have expired. Please request a new one
              by signing up again.
            </p>
          </div>
        </AuthCard>
      );
    }

    redirect(REDIRECT_ROUTES.auth.success);
  }

  // No valid verification parameters
  return (
    <AuthCard
      title="Invalid Link"
      description="This verification link is incomplete"
      footer={
        <p>
          <a href="/login">Go to sign in</a>
        </p>
      }
    >
      <div>
        <p>The verification link appears to be incomplete or invalid.</p>
      </div>
    </AuthCard>
  );
}
