import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicProfile } from "@/lib/public/service";
import type { JSX } from "react";

interface ProfileLayoutProps {
  children: React.ReactNode;
  params: Promise<{ vanitySlug: string }>;
}

/**
 * Profile layout — Server Component
 *
 * Validates that the vanity slug corresponds to an active user.
 * If no matching profile exists, triggers a 404. This prevents
 * child pages from needing to duplicate the existence check.
 *
 * Note: /@{vanitySlug} URLs are rewritten to /profiles/{vanitySlug}
 * by the rewrites() config in next.config.ts.
 */
export default async function ProfileLayout({
  children,
  params,
}: ProfileLayoutProps): Promise<JSX.Element> {
  const { vanitySlug } = await params;
  const profile = await getPublicProfile(vanitySlug);

  if (!profile) {
    notFound();
  }

  return (
    <div className="bg-background min-h-screen">
      <nav className="px-4 py-4 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center transition-opacity hover:opacity-80"
          aria-label="myfaves home"
        >
          <span
            className="font-serif text-3xl leading-none tracking-tight select-none"
            aria-label="myfaves"
          >
            <span className="text-foreground">my</span>
            <span className="text-violet-700">faves</span>
          </span>
        </Link>
      </nav>
      {children}
    </div>
  );
}
