"use client";

import type { LandingPageClientProps } from "@/types/components";

/**
 * Client Component wrapper for the landing page
 *
 * This component receives authentication state as a prop from the Server Component
 * and renders appropriate content based on whether the user is authenticated.
 *
 * @param props - Component props containing authentication state
 */
export default function LandingPageClient({
  isAuthenticated,
}: LandingPageClientProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
          YourFavs
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Curate and share your favorite places
        </p>

        {/* Conditional rendering based on auth state */}
        {isAuthenticated ? (
          <nav className="flex gap-4">
            <a
              href="/dashboard"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Go to Dashboard
            </a>
          </nav>
        ) : (
          <nav className="flex gap-4">
            <a
              href="/login"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
            >
              Log In
            </a>
            <a
              href="/signup"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Sign Up
            </a>
          </nav>
        )}
      </main>
    </div>
  );
}
