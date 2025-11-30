import type { JSX } from "react";

export interface ErrorMessageProps {
  /** Error message to display */
  message?: string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Error message display component
 * Only renders when message is provided
 * Uses role="alert" for screen reader announcements
 */
export function ErrorMessage({
  message,
  className,
}: ErrorMessageProps): JSX.Element | null {
  if (!message) {
    return null;
  }

  return (
    <div role="alert" className={className}>
      {message}
    </div>
  );
}
