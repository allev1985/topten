"use client";

import Link from "next/link";
import { useFormState } from "@/hooks/use-form-state";
import { passwordResetRequestAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Forgot password form client component
 * Handles password reset request
 */
export function ForgotPasswordForm() {
  const { state, formAction } = useFormState(passwordResetRequestAction);

  if (state.isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-muted-foreground" role="status">
            {state.data?.message}
          </p>
        </div>
        <Link href="/login" className="text-muted-foreground text-sm">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5">
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
            placeholder="you@example.com"
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
          className="w-full"
          disabled={state.isPending}
          aria-busy={state.isPending}
        >
          {state.isPending ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-muted-foreground text-sm">
        Remember your password?{" "}
        <Link href="/login" className="text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  );
}
