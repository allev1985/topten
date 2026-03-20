import type { JSX } from "react";
import type { PublicListSummary } from "@/lib/public/types";
import { PublicListCard } from "./PublicListCard";

interface PublicListGridProps {
  lists: PublicListSummary[];
  vanitySlug: string;
}

/**
 * PublicListGrid — Server Component
 *
 * Renders a responsive grid of PublicListCard components.
 * Shows an empty state when no published lists exist.
 */
export function PublicListGrid({
  lists,
  vanitySlug,
}: PublicListGridProps): JSX.Element {
  if (lists.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No published lists yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lists.map((list) => (
        <PublicListCard key={list.id} list={list} vanitySlug={vanitySlug} />
      ))}
    </div>
  );
}
