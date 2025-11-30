/**
 * Form state types for server action responses
 * Used by useFormState hook and authentication server actions
 */

/**
 * Generic form state for server action responses
 * @template T - Type of successful response data
 */
export interface FormState<T = unknown> {
  /** Successful response data */
  data: T | null;
  /** Form-level error message */
  error: string | null;
  /** Field-level validation errors */
  fieldErrors: Record<string, string[]>;
  /** Whether form submission is in progress */
  isPending: boolean;
  /** Whether last submission was successful */
  isSuccess: boolean;
}

/**
 * Action state for server actions (excludes isPending which comes from useActionState)
 */
export type ActionState<T = unknown> = Omit<FormState<T>, "isPending">;

/**
 * Initial form state factory
 * @returns A new FormState object with default values
 */
export function initialFormState<T = unknown>(): FormState<T> {
  return {
    data: null,
    error: null,
    fieldErrors: {},
    isPending: false,
    isSuccess: false,
  };
}

/**
 * Initial action state factory for server actions
 * @returns A new ActionState object with default values
 */
export function initialActionState<T = unknown>(): ActionState<T> {
  return {
    data: null,
    error: null,
    fieldErrors: {},
    isSuccess: false,
  };
}

/**
 * Field error detail from API validation
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Map API error details to field errors record
 * @param details - Array of field errors from API
 * @returns Record mapping field names to arrays of error messages
 */
export function mapFieldErrors(
  details: FieldError[]
): Record<string, string[]> {
  return details.reduce(
    (acc, { field, message }) => {
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push(message);
      return acc;
    },
    {} as Record<string, string[]>
  );
}
