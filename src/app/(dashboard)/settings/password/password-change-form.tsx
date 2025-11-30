"use client";

import { useFormState } from "@/hooks/use-form-state";
import { passwordChangeAction } from "@/actions/auth-actions";
import { PasswordInput } from "@/components/auth/password-input";
import { FormButton } from "@/components/auth/form-button";
import { ErrorMessage } from "@/components/auth/error-message";

/**
 * Password change form for authenticated users
 * Requires current password verification
 */
export function PasswordChangeForm() {
  const { state, formAction } = useFormState(passwordChangeAction);

  if (state.isSuccess) {
    return (
      <div>
        <p role="status">{state.data?.message}</p>
        <p>Your password has been successfully updated.</p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <ErrorMessage message={state.error} />

      <PasswordInput
        id="currentPassword"
        name="currentPassword"
        label="Current Password"
        required
        autoComplete="current-password"
        placeholder="Enter your current password"
        error={state.fieldErrors.currentPassword?.[0]}
      />

      <PasswordInput
        id="password"
        name="password"
        label="New Password"
        required
        autoComplete="new-password"
        showStrength
        placeholder="Enter your new password"
        error={state.fieldErrors.password?.[0]}
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm New Password"
        required
        autoComplete="new-password"
        placeholder="Confirm your new password"
        error={state.fieldErrors.confirmPassword?.[0]}
      />

      <FormButton pending={state.isPending}>Change Password</FormButton>
    </form>
  );
}
