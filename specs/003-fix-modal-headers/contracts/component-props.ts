/**
 * Component Props Contracts for Auth Forms with Variant Support
 * Feature: 003-fix-modal-headers
 *
 * This file defines the TypeScript interfaces for authentication form components
 * with configurable presentation wrappers (card vs inline).
 */

/**
 * Presentation variant for form components.
 * - "card": Form wrapped in Card component with header (standalone page usage)
 * - "inline": Form content only without Card wrapper (modal usage)
 */
export type FormVariant = "card" | "inline";

/**
 * Props for the LoginForm component.
 *
 * @example
 * // Standalone page usage (default)
 * <LoginForm redirectTo="/dashboard" />
 *
 * @example
 * // Modal usage
 * <LoginForm variant="inline" onSuccess={handleSuccess} />
 */
export interface LoginFormProps {
  /**
   * Controls the presentation wrapper.
   * @default "card"
   */
  variant?: FormVariant;

  /**
   * Redirect URL after successful login.
   * Passed to the server action and returned in success callback.
   */
  redirectTo?: string;

  /**
   * Initial email value (e.g., from URL params or pre-filled).
   */
  defaultEmail?: string;

  /**
   * Callback invoked on successful authentication (before redirect).
   *
   * When provided:
   * - Callback is invoked with redirect data
   * - Automatic redirect is suppressed (caller handles navigation)
   * - Used in modal contexts to close modal before redirecting
   *
   * When omitted:
   * - Form automatically redirects to redirectTo URL after success
   * - Used in standalone page contexts
   */
  onSuccess?: (data: { redirectTo: string }) => void;
}

/**
 * Props for the SignupForm component.
 *
 * @example
 * // Standalone page usage (default)
 * <SignupForm />
 *
 * @example
 * // Modal usage
 * <SignupForm variant="inline" onSuccess={handleSuccess} />
 */
export interface SignupFormProps {
  /**
   * Controls the presentation wrapper.
   * @default "card"
   */
  variant?: FormVariant;

  /**
   * Callback invoked on successful signup (prevents default redirect).
   *
   * When provided (modal context):
   * - Callback is invoked after successful signup
   * - Automatic redirect is suppressed
   * - Modal typically shows success message instead of redirecting
   *
   * When omitted (standalone page):
   * - Form automatically redirects to /verify-email after signup
   */
  onSuccess?: () => void;
}

/**
 * Props for the LoginModal component.
 * No changes to existing interface - variant is set internally.
 */
export interface LoginModalProps {
  /**
   * Controls modal visibility
   */
  isOpen: boolean;

  /**
   * Callback invoked when modal should close
   */
  onClose: () => void;

  /**
   * Redirect URL after successful login
   */
  redirectTo?: string;
}

/**
 * Props for the SignupModal component.
 * No changes to existing interface - variant is set internally.
 */
export interface SignupModalProps {
  /**
   * Controls modal visibility
   */
  isOpen: boolean;

  /**
   * Callback invoked when modal should close
   */
  onClose: () => void;
}

/**
 * Type guard to check if a variant is valid.
 * Useful for runtime validation if variant comes from external source.
 */
export function isValidFormVariant(variant: unknown): variant is FormVariant {
  return variant === "card" || variant === "inline";
}

/**
 * Default variant for backward compatibility.
 * All existing usage assumes card variant.
 */
export const DEFAULT_FORM_VARIANT: FormVariant = "card";
