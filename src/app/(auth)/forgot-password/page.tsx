import type { JSX } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

/**
 * Forgot password page
 * Allows users to request a password reset email
 */
export default function ForgotPasswordPage(): JSX.Element {
  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>
          <p>
            Remember your password? <a href="/login">Sign in</a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
