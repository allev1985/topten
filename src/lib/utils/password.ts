/**
 * Password validation utility for YourFavs
 * Validates passwords against security requirements
 *
 * Requirements (from FR-002, FR-003):
 * - Minimum 12 characters
 * - At least 1 lowercase letter
 * - At least 1 uppercase letter
 * - At least 1 digit
 * - At least 1 symbol (special character)
 */

import { PASSWORD_REQUIREMENTS } from "@/lib/config";

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
  checks: {
    minLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasDigit: boolean;
    hasSymbol: boolean;
  };
}

/**
 * Validates a password against security requirements
 * @param password - The password to validate
 * @returns PasswordValidationResult with validation status, errors, strength, and individual checks
 */
export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const errors: string[] = [];

  if (!checks.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`
    );
  }
  if (!checks.hasLowercase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!checks.hasUppercase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!checks.hasDigit) {
    errors.push("Password must contain at least one number");
  }
  if (!checks.hasSymbol) {
    errors.push("Password must contain at least one special character");
  }

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const isValid = errors.length === 0;

  let strength: "weak" | "medium" | "strong";
  if (passedChecks <= PASSWORD_REQUIREMENTS.minWeakChecks) {
    strength = "weak";
  } else if (passedChecks <= PASSWORD_REQUIREMENTS.minMediumChecks) {
    strength = "medium";
  } else {
    strength = "strong";
  }

  return {
    isValid,
    errors,
    strength,
    checks,
  };
}

/**
 * Get password requirements as display strings
 * @returns Array of requirement strings for UI display
 */
export function getPasswordRequirements(): string[] {
  return [
    `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    "At least one lowercase letter",
    "At least one uppercase letter",
    "At least one number",
    "At least one special character (!@#$%^&*...)",
  ];
}
