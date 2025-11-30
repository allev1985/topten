"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "@/hooks/use-form-state";
import { loginAction } from "@/actions/auth-actions";
import { FormInput } from "@/components/auth/form-input";
import { PasswordInput } from "@/components/auth/password-input";
import { FormButton } from "@/components/auth/form-button";
import { ErrorMessage } from "@/components/auth/error-message";

export interface LoginFormProps {
  /** Redirect URL after successful login */
  redirectTo?: string;
  /** Initial email value (e.g., from URL params) */
  defaultEmail?: string;
}

/**
 * Login form component
 * Handles authentication with email/password
 */
export function LoginForm({ redirectTo, defaultEmail }: LoginFormProps) {
  const router = useRouter();
  const { state, formAction } = useFormState(loginAction);

  useEffect(() => {
    if (state.isSuccess && state.data?.redirectTo) {
      router.push(state.data.redirectTo);
    }
  }, [state.isSuccess, state.data, router]);

  return (
    <form action={formAction}>
      <ErrorMessage message={state.error} />

      {/* Hidden field for redirect URL */}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      <FormInput
        id="email"
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        defaultValue={defaultEmail}
        placeholder="Enter your email"
        error={state.fieldErrors.email?.[0]}
      />

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        required
        autoComplete="current-password"
        placeholder="Enter your password"
        error={state.fieldErrors.password?.[0]}
      />

      <div>
        <label>
          <input type="checkbox" name="rememberMe" />
          Remember me
        </label>
      </div>

      <FormButton pending={state.isPending}>Sign In</FormButton>
    </form>
  );
}
