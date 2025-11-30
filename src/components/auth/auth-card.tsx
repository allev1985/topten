import type { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils/styling/cn";

export interface AuthCardProps {
  /** Card title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Card content (form) */
  children: ReactNode;
  /** Optional footer content (links, etc.) */
  footer?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Auth page wrapper component
 * Provides consistent structure for all authentication pages
 * Uses shadcn Card styling while preserving semantic HTML structure
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps): JSX.Element {
  return (
    <main className={className}>
      <article
        className={cn(
          "border-border bg-card text-card-foreground rounded-xl border shadow"
        )}
      >
        <header className={cn("flex flex-col space-y-1.5 p-6")}>
          <h1 className={cn("leading-none font-semibold tracking-tight")}>
            {title}
          </h1>
          {description && (
            <p className={cn("text-muted-foreground text-sm")}>{description}</p>
          )}
        </header>
        <section className={cn("p-6 pt-0")}>{children}</section>
        {footer && (
          <footer className={cn("flex items-center p-6 pt-0")}>{footer}</footer>
        )}
      </article>
    </main>
  );
}
