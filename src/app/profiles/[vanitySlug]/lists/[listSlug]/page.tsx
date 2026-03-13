import type { JSX } from "react";
import type { Metadata } from "next";

export const revalidate = 60;
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublicProfile,
  getPublicListDetail,
} from "@/lib/public/service";
import { PublicPlaceList } from "@/components/public/PublicPlaceList";

interface ListPageProps {
  params: Promise<{ vanitySlug: string; listSlug: string }>;
}

/**
 * Generate SEO metadata for a public list page.
 */
export async function generateMetadata({
  params,
}: ListPageProps): Promise<Metadata> {
  const { vanitySlug, listSlug } = await params;
  const profile = await getPublicProfile(vanitySlug);

  if (!profile) {
    return { title: "List not found — myfaves" };
  }

  const listDetail = await getPublicListDetail({
    userId: profile.id,
    listSlug,
  });

  if (!listDetail) {
    return { title: "List not found — myfaves" };
  }

  const title = `${listDetail.title} by ${profile.name} — myfaves`;
  const description =
    listDetail.description ??
    `${profile.name}'s list of favourite places on myfaves.`;
  const url = `/@${vanitySlug}/lists/${listSlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
    },
  };
}

/**
 * Public list detail page — Server Component
 *
 * Displays a single published list with all its places.
 * The layout has already verified the profile exists, so getPublicProfile
 * here is a deduplicated cache() call.
 *
 * URL: /@{vanitySlug}/lists/{listSlug} (rewritten to /profiles/{vanitySlug}/lists/{listSlug})
 */
export default async function PublicListPage({
  params,
}: ListPageProps): Promise<JSX.Element> {
  const { vanitySlug, listSlug } = await params;

  const profile = await getPublicProfile(vanitySlug);
  // profile is guaranteed non-null by the parent layout, but TS doesn't know that
  if (!profile) {
    notFound();
  }

  const listDetail = await getPublicListDetail({
    userId: profile.id,
    listSlug,
  });

  if (!listDetail) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <nav className="mb-6">
        <Link
          href={`/@${vanitySlug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to {profile.name}&apos;s lists
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{listDetail.title}</h1>
        {listDetail.description && (
          <p className="mt-2 text-muted-foreground">{listDetail.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Updated{" "}
          {listDetail.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <PublicPlaceList places={listDetail.places} />
    </main>
  );
}
