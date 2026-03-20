"use client";

import { useState, type ChangeEvent } from "react";
import { useFormState } from "@/hooks/use-form-state";
import { passwordChangeAction } from "@/actions/auth-actions";
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
import { validatePassword } from "@/lib/utils/validation/password";

/**
 * Password change form for authenticated users
 * Requires current password verification
 */
export function PasswordChangeForm() {
  const { state, formAction } = useFormState(passwordChangeAction);
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
      <Card>
        <CardHeader>
          <CardTitle>Password Changed</CardTitle>
          <CardDescription>
            Your password has been successfully updated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p role="status">{state.data?.message}</p>
        </CardContent>
        <CardFooter>
          <p>You can now use your new password to sign in.</p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
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
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your current password"
              aria-invalid={
                state.fieldErrors.currentPassword?.[0] ? "true" : undefined
              }
              aria-describedby={
                state.fieldErrors.currentPassword?.[0]
                  ? "currentPassword-error"
                  : undefined
              }
            />
            {state.fieldErrors.currentPassword?.[0] && (
              <span
                id="currentPassword-error"
                role="alert"
                className="text-destructive text-sm"
              >
                {state.fieldErrors.currentPassword[0]}
              </span>
            )}
          </div>

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
              aria-invalid={
                state.fieldErrors.password?.[0] ? "true" : undefined
              }
              aria-describedby={
                [
                  state.fieldErrors.password?.[0] ? "password-error" : null,
                  "password-strength",
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
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
            disabled={state.isPending}
            aria-busy={state.isPending}
          >
            {state.isPending ? "Submitting..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
