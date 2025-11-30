"use client";

import { useFormState } from "@/hooks/use-form-state";
import { passwordResetRequestAction } from "@/actions/auth-actions";
import { FormInput } from "@/components/auth/form-input";
import { FormButton } from "@/components/auth/form-button";
import { ErrorMessage } from "@/components/auth/error-message";

/**
 * Forgot password form client component
 * Handles password reset request
 */
export function ForgotPasswordForm() {
  const { state, formAction } = useFormState(passwordResetRequestAction);

  if (state.isSuccess) {
    return (
      <div>
        <p role="status">{state.data?.message}</p>
        <p>
          <a href="/login">Back to sign in</a>
        </p>
      </div>
    );
  }

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

      <FormButton pending={state.isPending}>Send Reset Link</FormButton>
    </form>
  );
}
