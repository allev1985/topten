import type { JSX, ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface FormButtonProps {
  /** Button content */
  children: ReactNode;
  /** Whether form submission is pending */
  pending?: boolean;
  /** Button type */
  type?: "submit" | "button";
  /** Click handler (for non-submit buttons) */
  onClick?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Form submit button with loading state indication
 * Shows disabled state during form submission
 */
export function FormButton({
  children,
  pending = false,
  type = "submit",
  onClick,
  disabled,
  className,
}: FormButtonProps): JSX.Element {
  const isDisabled = disabled || pending;

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={pending}
      className={className}
    >
      {pending ? "Submitting..." : children}
    </Button>
  );
}
