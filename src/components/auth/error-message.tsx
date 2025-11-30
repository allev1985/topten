import type { JSX } from "react";
import { cn } from "@/lib/utils/styling/cn";

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
 * Styled with shadcn Alert destructive variant pattern
 */
export function ErrorMessage({
  message,
  className,
}: ErrorMessageProps): JSX.Element | null {
  if (!message) {
    return null;
  }

  // Apply className only when provided to preserve backward compatibility with tests
  // that expect no class attribute when className is not provided
  return (
    <div role="alert" className={className ? cn(className) : undefined}>
      {message}
    </div>
  );
}
