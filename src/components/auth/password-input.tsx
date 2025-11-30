"use client";

import { useState, type JSX, type ChangeEvent } from "react";
import { validatePassword } from "@/lib/utils/validation/password";

export interface PasswordInputProps {
  /** Unique identifier for input and label association */
  id: string;
  /** Form field name */
  name: string;
  /** Label text */
  label: string;
  /** Whether field is required */
  required?: boolean;
  /** HTML autocomplete attribute */
  autoComplete?: "current-password" | "new-password";
  /** Error message to display */
  error?: string;
  /** Default value for server-side rendering */
  defaultValue?: string;
  /** Whether to show password strength indicator */
  showStrength?: boolean;
  /** Label for strength indicator (accessibility) */
  strengthLabel?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Password input component with optional strength indicator
 * Client component for real-time strength feedback
 */
export function PasswordInput({
  id,
  name,
  label,
  required,
  autoComplete,
  error,
  defaultValue,
  showStrength = false,
  strengthLabel = "Password strength",
  placeholder,
  className,
}: PasswordInputProps): JSX.Element {
  const [strength, setStrength] = useState<"weak" | "medium" | "strong">(
    "weak"
  );
  const [hasInput, setHasInput] = useState(false);

  const errorId = `${id}-error`;
  const strengthId = `${id}-strength`;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHasInput(value.length > 0);

    if (showStrength && value.length > 0) {
      const result = validatePassword(value);
      setStrength(result.strength);
    }
  };

  return (
    <div className={className}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type="password"
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={handleChange}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          [error ? errorId : null, showStrength ? strengthId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {showStrength && hasInput && (
        <span id={strengthId} aria-live="polite">
          {strengthLabel}: {strength}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
