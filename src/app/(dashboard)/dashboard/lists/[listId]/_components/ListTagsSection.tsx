"use client";

import { Badge } from "@/components/ui/badge";

interface ListTagsSectionProps {
  initialTags: string[];
}

/**
 * Read-only tags section for the list detail page header.
 *
 * Displays the union of all place tags for places in this list.
 * Tags cannot be edited here — they are derived from the places
 * in the list and edited on each place individually.
 */
export function ListTagsSection({ initialTags }: ListTagsSectionProps) {
  if (initialTags.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {initialTags.map((label) => (
        <Badge key={label} variant="secondary" className="text-xs">
          {label}
        </Badge>
      ))}
    </div>
  );
}
