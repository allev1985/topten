import type { JSX, ReactNode } from "react";

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
      <article>
        <header>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </header>
        <section>{children}</section>
        {footer && <footer>{footer}</footer>}
      </article>
    </main>
  );
}
