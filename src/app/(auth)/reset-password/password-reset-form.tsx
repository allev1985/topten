"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useFormState } from "@/hooks/use-form-state";
import { passwordUpdateAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validatePassword } from "@/lib/utils/validation/password";

interface PasswordResetFormProps {
  /** Token from password reset email link */
  token?: string;
}

/**
 * Password reset form component
 * Used for reset password flow
 */
export function PasswordResetForm({ token }: PasswordResetFormProps) {
  const { state, formAction } = useFormState(passwordUpdateAction);
  const [strength, setStrength] = useState<"weak" | "medium" | "strong">(
    "weak"
  );
  const [hasInput, setHasInput] = useState(false);

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHasInput(value.length > 0);
    if (value.length > 0) {
      const result = validatePassword(value);
      setStrength(result.strength);
    }
  };

  if (state.isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Password reset successful
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
        {token && <input type="hidden" name="token" value={token} />}

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Enter your new password"
            onChange={handlePasswordChange}
            aria-invalid={state.fieldErrors.password?.[0] ? "true" : undefined}
            aria-describedby={
              [
                state.fieldErrors.password?.[0] ? "password-error" : null,
                hasInput ? "password-strength" : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
          {hasInput && (
            <span
              id="password-strength"
              aria-live="polite"
              className="text-muted-foreground text-sm"
            >
              Password strength: {strength}
            </span>
          )}
          {state.fieldErrors.password?.[0] && (
            <span
              id="password-error"
              role="alert"
              className="text-destructive text-sm"
            >
              {state.fieldErrors.password[0]}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm your new password"
            aria-invalid={
              state.fieldErrors.confirmPassword?.[0] ? "true" : undefined
            }
            aria-describedby={
              state.fieldErrors.confirmPassword?.[0]
                ? "confirmPassword-error"
                : undefined
            }
          />
          {state.fieldErrors.confirmPassword?.[0] && (
            <span
              id="confirmPassword-error"
              role="alert"
              className="text-destructive text-sm"
            >
              {state.fieldErrors.confirmPassword[0]}
            </span>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={state.isPending}
          aria-busy={state.isPending}
        >
          {state.isPending ? "Resetting…" : "Reset Password"}
        </Button>
      </form>

      <p className="text-muted-foreground text-sm">
        <Link href="/login" className="text-foreground">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
