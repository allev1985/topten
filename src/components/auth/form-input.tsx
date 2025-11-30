import type { JSX } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FormInputProps {
  /** Unique identifier for input and label association */
  id: string;
  /** Form field name */
  name: string;
  /** Input type */
  type: "text" | "email";
  /** Label text */
  label: string;
  /** Whether field is required */
  required?: boolean;
  /** HTML autocomplete attribute */
  autoComplete?: string;
  /** Error message to display */
  error?: string;
  /** Default value for server-side rendering */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable form input component with label and error display
 * Follows WCAG 2.1 AA accessibility guidelines
 */
export function FormInput({
  id,
  name,
  type,
  label,
  required,
  autoComplete,
  error,
  defaultValue,
  placeholder,
  className,
}: FormInputProps): JSX.Element {
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <span id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
