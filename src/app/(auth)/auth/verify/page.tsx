import type { JSX } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Verification Failed</CardTitle>
            <CardDescription>
              {error_description ||
                "The verification link is invalid or has expired"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Your verification link may have expired. Please request a new one
              by signing up again.
            </p>
          </CardContent>
          <CardFooter>
            <p>
              <a href="/signup">Try signing up again</a>
            </p>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const supabase = await createClient();

  // Handle PKCE code exchange
  if (code) {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return (
        <main>
          <Card>
            <CardHeader>
              <CardTitle>Verification Failed</CardTitle>
              <CardDescription>Unable to verify your email</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                There was a problem verifying your email. The link may have
                expired.
              </p>
            </CardContent>
            <CardFooter>
              <p>
                <a href="/signup">Try signing up again</a>
              </p>
            </CardFooter>
          </Card>
        </main>
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
        <main>
          <Card>
            <CardHeader>
              <CardTitle>Verification Failed</CardTitle>
              <CardDescription>
                The verification link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Your verification link may have expired. Please request a new
                one by signing up again.
              </p>
            </CardContent>
            <CardFooter>
              <p>
                <a href="/signup">Try signing up again</a>
              </p>
            </CardFooter>
          </Card>
        </main>
      );
    }

    redirect(REDIRECT_ROUTES.auth.success);
  }

  // No valid verification parameters
  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Invalid Link</CardTitle>
          <CardDescription>
            This verification link is incomplete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>The verification link appears to be incomplete or invalid.</p>
        </CardContent>
        <CardFooter>
          <p>
            <a href="/login">Go to sign in</a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
