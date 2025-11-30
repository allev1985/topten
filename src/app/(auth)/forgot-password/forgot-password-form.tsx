"use client";

import { useFormState } from "@/hooks/use-form-state";
import { passwordResetRequestAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Forgot password form client component
 * Handles password reset request
 */
export function ForgotPasswordForm() {
  const { state, formAction } = useFormState(passwordResetRequestAction);

  if (state.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p role="status">{state.data?.message}</p>
        </CardContent>
        <CardFooter>
          <p>
            <a href="/login">Back to sign in</a>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Enter your email"
              aria-invalid={state.fieldErrors.email?.[0] ? "true" : undefined}
              aria-describedby={
                state.fieldErrors.email?.[0] ? "email-error" : undefined
              }
            />
            {state.fieldErrors.email?.[0] && (
              <span
                id="email-error"
                role="alert"
                className="text-destructive text-sm"
              >
                {state.fieldErrors.email[0]}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={state.isPending}
            aria-busy={state.isPending}
          >
            {state.isPending ? "Submitting..." : "Send Reset Link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p>
          Remember your password? <a href="/login">Sign in</a>
        </p>
      </CardFooter>
    </Card>
  );
}
