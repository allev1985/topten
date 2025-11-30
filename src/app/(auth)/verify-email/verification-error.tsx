"use client";

import { useFormState } from "@/hooks/use-form-state";
import { resendVerificationAction } from "@/actions/auth-actions";
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

interface VerificationErrorProps {
  error: string;
}

/**
 * VerificationError component
 * Displays error message with option to resend verification email
 */
export function VerificationError({ error }: VerificationErrorProps) {
  const { state, formAction } = useFormState(resendVerificationAction);

  if (state.isSuccess) {
    return (
      <main>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>Verification email sent</CardDescription>
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
      </main>
    );
  }

  return (
    <main>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Verification Failed</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Enter your email to receive a new verification link:</p>
          <form action={formAction} className="mt-4 space-y-4">
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
            <Button type="submit" disabled={state.isPending}>
              {state.isPending ? "Sending..." : "Resend verification email"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p>
            <a href="/login">Back to sign in</a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
