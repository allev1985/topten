import type { JSX } from "react";
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
    token_hash?: string;
    type?: string;
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
  const { token_hash, type } = params;

  // If no token_hash, show error state
  if (!token_hash) {
    return (
      <main>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              The password reset link you followed appears to be invalid or has
              expired. Please request a new one.
            </p>
          </CardContent>
          <CardFooter>
            <p>
              <a href="/forgot-password">Request a new reset link</a>
            </p>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main>
      <PasswordResetForm token_hash={token_hash} type={type} />
    </main>
  );
}
