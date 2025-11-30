"use client";

import { useFormState } from "@/hooks/use-form-state";
import {
  passwordUpdateAction,
  passwordChangeAction,
} from "@/actions/auth-actions";
import { PasswordInput } from "@/components/auth/password-input";
import { FormButton } from "@/components/auth/form-button";
import { ErrorMessage } from "@/components/auth/error-message";

export interface PasswordResetFormProps {
  /** Callback after successful password reset */
  onSuccess?: () => void;
  /** Whether this is for authenticated password change (requires current password) */
  requireCurrentPassword?: boolean;
}

/**
 * Password reset/change form component
 * Used for both reset password flow and authenticated password change
 */
export function PasswordResetForm({
  onSuccess,
  requireCurrentPassword = false,
}: PasswordResetFormProps) {
  const action = requireCurrentPassword
    ? passwordChangeAction
    : passwordUpdateAction;
  const { state, formAction } = useFormState(action);

  // Handle success callback
  if (state.isSuccess && onSuccess) {
    onSuccess();
  }

  // Show success message if completed and no callback
  if (state.isSuccess && !onSuccess) {
    return (
      <div>
        <p role="status">{state.data?.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <ErrorMessage message={state.error} />

      {requireCurrentPassword && (
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          label="Current Password"
          required
          autoComplete="current-password"
          placeholder="Enter your current password"
          error={state.fieldErrors.currentPassword?.[0]}
        />
      )}

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
        label="Confirm Password"
        required
        autoComplete="new-password"
        placeholder="Confirm your new password"
        error={state.fieldErrors.confirmPassword?.[0]}
      />

      <FormButton pending={state.isPending}>
        {requireCurrentPassword ? "Change Password" : "Reset Password"}
      </FormButton>
    </form>
  );
}
