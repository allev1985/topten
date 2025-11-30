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
      <main>
        <Card>
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
      <PasswordResetForm />
    </main>
  );
}
