import type { JSX } from "react";
import type { Metadata } from "next";

export const revalidate = 60;
import {
  getPublicProfile,
  getPublicListsForProfile,
} from "@/lib/public/service";
import { ProfileHeader } from "@/components/public/ProfileHeader";
import { PublicListGrid } from "@/components/public/PublicListGrid";

interface ProfilePageProps {
  params: Promise<{ vanitySlug: string }>;
}

/**
 * Generate SEO metadata for a public profile page.
 *
 * Note: getPublicProfile is wrapped in React.cache so the DB query
 * is deduplicated across the layout, generateMetadata, and page render.
 */
export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { vanitySlug } = await params;
  const profile = await getPublicProfile(vanitySlug);

  if (!profile) {
    return { title: "Profile not found — YourFavs" };
  }

  const title = `${profile.name} (@${profile.vanitySlug}) — YourFavs`;
  const description =
    profile.bio ?? `Discover ${profile.name}'s favourite places on YourFavs.`;
  const url = `/@${profile.vanitySlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url,
    },
  };
}

/**
 * Public profile page — Server Component
 *
 * Displays a user's published lists. React.cache deduplicates the
 * getPublicProfile call made in the layout, generateMetadata, and here.
 *
 * URL: /@{vanitySlug} (rewritten to /profiles/{vanitySlug})
 */
export default async function ProfilePage({
  params,
}: ProfilePageProps): Promise<JSX.Element> {
  const { vanitySlug } = await params;

  // Both are cache()-wrapped — layout call is deduplicated
  const profile = await getPublicProfile(vanitySlug);
  const lists = await getPublicListsForProfile(profile!.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <ProfileHeader
        name={profile!.name}
        bio={profile!.bio}
        avatarUrl={profile!.avatarUrl}
        vanitySlug={profile!.vanitySlug}
      />
      <section className="mt-8">
        <PublicListGrid lists={lists} vanitySlug={vanitySlug} />
      </section>
    </main>
  );
}
