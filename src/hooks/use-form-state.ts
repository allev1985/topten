"use client";

import { useActionState, useCallback } from "react";
import type { ActionState, FormState } from "@/types/forms";

/**
 * Hook for managing form state with server actions
 * Wraps React 19's useActionState with a consistent interface
 *
 * @template T - Type of successful response data
 * @param action - Server action function
 * @param initialState - Optional partial initial state
 * @returns Object with state, formAction, and reset function
 */
export function useFormState<T>(
  action: (
    prevState: ActionState<T>,
    formData: FormData
  ) => Promise<ActionState<T>>,
  initialState?: Partial<ActionState<T>>
): {
  /** Current form state including isPending */
  state: FormState<T>;
  /** Form action to bind to form element */
  formAction: (formData: FormData) => void;
  /** Reset form state - consumers should use form key prop for full reset */
  reset: () => void;
} {
  const defaultInitialState: ActionState<T> = {
    data: null,
    error: null,
    fieldErrors: {},
    isSuccess: false,
    ...initialState,
  };

  const [state, formAction, isPending] = useActionState(
    action,
    defaultInitialState
  );

  const formState: FormState<T> = {
    ...state,
    isPending,
  };

  // Reset is a no-op placeholder - consumers should use a key prop on the form
  // to force re-mount and reset state
  const reset = useCallback(() => {
    // Form reset is typically handled by changing the key prop on the form element
    // This function is provided for API consistency
  }, []);

  return { state: formState, formAction, reset };
}
