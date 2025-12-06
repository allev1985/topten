"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "@/hooks/use-form-state";
import { signupAction } from "@/actions/auth-actions";
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

export interface SignupFormProps {
  /**
   * Callback invoked on successful signup (prevents default redirect).
   * When provided (modal context): Callback is invoked instead of redirecting
   * When omitted (standalone page): Redirects to /verify-email after signup
   */
  onSuccess?: () => void;
}

/**
 * Signup form client component
 * Handles form state and client-side interactions
 * Can be used standalone or within a modal
 */
export function SignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter();
  const { state, formAction } = useFormState(signupAction);
  const [strength, setStrength] = useState<"weak" | "medium" | "strong">(
    "weak"
  );
  const [hasInput, setHasInput] = useState(false);

  useEffect(() => {
    if (state.isSuccess && state.data?.redirectTo) {
      if (onSuccess) {
        // Modal context: Call onSuccess callback to show success message
        onSuccess();
      } else {
        // Standalone page context: Redirect to verify-email page
        router.push(state.data.redirectTo);
      }
    }
  }, [state.isSuccess, state.data, router, onSuccess]);

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHasInput(value.length > 0);
    if (value.length > 0) {
      const result = validatePassword(value);
      setStrength(result.strength);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Enter your email and password to sign up
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

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Create a password"
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

          <Button
            type="submit"
            disabled={state.isPending}
            aria-busy={state.isPending}
          >
            {state.isPending ? "Submitting..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p>
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </CardFooter>
    </Card>
  );
}
