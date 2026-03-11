import type { JSX } from "react";
import Link from "next/link";

/**
 * Global 404 page.
 *
 * Rendered when notFound() is called in any Server Component or when a
 * route does not match any page segment.
 */
export default function NotFound(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">
        This page could not be found.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        The profile, list, or page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Go back home
      </Link>
    </main>
  );
}
