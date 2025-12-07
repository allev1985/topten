/**
 * Helper functions for checking Supabase authentication errors
 */

interface SupabaseAuthError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Check if a Supabase error indicates an unverified email
 * 
 * Supabase returns status 400 with code 'email_not_confirmed' for unverified emails.
 * This function provides a consistent way to detect this error condition.
 * 
 * @param error - The error object from Supabase auth
 * @returns true if the error indicates an unverified email
 */
export function isEmailNotVerifiedError(
  error: SupabaseAuthError | null | undefined
): boolean {
  if (!error) return false;

  return (
    error.code === "email_not_confirmed" ||
    (error.status === 400 &&
      error.message.toLowerCase().includes("not confirmed"))
  );
}
