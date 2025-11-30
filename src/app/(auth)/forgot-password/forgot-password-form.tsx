"use client";

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
      <div className="space-y-4">
        <p role="status">{state.data?.message}</p>
        <p>
          <a href="/login">Back to sign in</a>
        </p>
      </div>
    );
  }

  return (
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
  );
}
