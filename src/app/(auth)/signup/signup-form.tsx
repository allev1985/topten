"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "@/hooks/use-form-state";
import { signupAction } from "@/actions/auth-actions";
import { FormInput } from "@/components/auth/form-input";
import { PasswordInput } from "@/components/auth/password-input";
import { FormButton } from "@/components/auth/form-button";
import { ErrorMessage } from "@/components/auth/error-message";

/**
 * Signup form client component
 * Handles form state and client-side interactions
 */
export function SignupForm() {
  const router = useRouter();
  const { state, formAction } = useFormState(signupAction);

  useEffect(() => {
    if (state.isSuccess && state.data?.redirectTo) {
      router.push(state.data.redirectTo);
    }
  }, [state.isSuccess, state.data, router]);

  return (
    <form action={formAction}>
      <ErrorMessage message={state.error} />

      <FormInput
        id="email"
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        placeholder="Enter your email"
        error={state.fieldErrors.email?.[0]}
      />

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        required
        autoComplete="new-password"
        showStrength
        placeholder="Create a password"
        error={state.fieldErrors.password?.[0]}
      />

      <FormButton pending={state.isPending}>Create Account</FormButton>
    </form>
  );
}
