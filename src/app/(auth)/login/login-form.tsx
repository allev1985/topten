"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "@/hooks/use-form-state";
import { loginAction } from "@/actions/auth-actions";
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

export interface LoginFormProps {
  /** Redirect URL after successful login */
  redirectTo?: string;
  /** Initial email value (e.g., from URL params) */
  defaultEmail?: string;
  /** Callback invoked on successful authentication (before redirect) */
  onSuccess?: (data: { redirectTo: string }) => void;
}

/**
 * Login form component
 * Handles authentication with email/password
 */
export function LoginForm({
  redirectTo,
  defaultEmail,
  onSuccess,
}: LoginFormProps) {
  const router = useRouter();
  const { state, formAction } = useFormState(loginAction);

  useEffect(() => {
    if (state.isSuccess && state.data?.redirectTo) {
      if (onSuccess) {
        onSuccess(state.data);
      } else {
        router.push(state.data.redirectTo);
      }
    }
  }, [state.isSuccess, state.data, router, onSuccess]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Hidden field for redirect URL */}
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={defaultEmail}
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
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={
                state.fieldErrors.password?.[0] ? "true" : undefined
              }
              aria-describedby={
                state.fieldErrors.password?.[0] ? "password-error" : undefined
              }
            />
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

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="rememberMe" name="rememberMe" />
            <Label htmlFor="rememberMe">Remember me</Label>
          </div>

          <Button
            type="submit"
            disabled={state.isPending}
            aria-busy={state.isPending}
          >
            {state.isPending ? "Submitting..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <p>
          Don&apos;t have an account? <a href="/signup">Sign up</a>
        </p>
        <p>
          <a href="/forgot-password">Forgot your password?</a>
        </p>
        <hr className="w-full" />
        <p>
          <button type="button" disabled>
            Sign in with Google (coming soon)
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}
