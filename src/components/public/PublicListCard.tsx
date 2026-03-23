import Link from "next/link";
import type { JSX } from "react";
import type { PublicListSummary } from "@/lib/public/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { TagBadgeList } from "@/components/shared/TagBadgeList";

interface PublicListCardProps {
  list: PublicListSummary;
  vanitySlug: string;
}

/**
 * PublicListCard — Server Component
 *
 * Renders a summary card for a published list.
 * Links to the list's public URL using the /@{vanitySlug}/{slug} pattern.
 */
export function PublicListCard({
  list,
  vanitySlug,
}: PublicListCardProps): JSX.Element {
  const href = `/@${vanitySlug}/lists/${list.slug}`;
  const updatedDate = list.updatedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={href}
      className="focus-visible:ring-ring block rounded-xl transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <Card className="h-full gap-3 py-5">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">{list.title}</CardTitle>
          {list.description && (
            <CardDescription className="line-clamp-2">
              {list.description}
            </CardDescription>
          )}
          <TagBadgeList tags={list.tags} size="sm" className="mt-1" />
        </CardHeader>
        <CardFooter className="text-muted-foreground gap-3 text-xs">
          <span>
            {list.placeCount} {list.placeCount === 1 ? "place" : "places"}
          </span>
          <span>·</span>
          <span>Updated {updatedDate}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
