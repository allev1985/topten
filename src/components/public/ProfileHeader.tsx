import Image from "next/image";
import type { JSX } from "react";

interface ProfileHeaderProps {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  vanitySlug: string;
}

/**
 * ProfileHeader — Server Component
 *
 * Displays a user's avatar (or initials fallback), display name, bio,
 * and vanity slug on their public profile page.
 */
export function ProfileHeader({
  name,
  bio,
  avatarUrl,
  vanitySlug,
}: ProfileHeaderProps): JSX.Element {
  // Generate initials from display name for the avatar fallback
  const initials = name
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <header className="flex items-start gap-4">
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${name}'s avatar`}
            width={80}
            height={80}
            className="rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground"
            aria-label={`${name}'s avatar`}
          >
            {initials}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <p className="text-sm text-muted-foreground">@{vanitySlug}</p>
        {bio && <p className="mt-2 text-sm text-foreground">{bio}</p>}
      </div>
    </header>
  );
}
