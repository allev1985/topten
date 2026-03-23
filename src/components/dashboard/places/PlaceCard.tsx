"use client";

import type { JSX, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaceTagEditor } from "./PlaceTagEditor";

interface PlaceCardPlace {
  id: string;
  name: string;
  address: string;
  heroImageUrl: string | null;
  activeListCount?: number;
  tags?: string[];
}

interface PlaceCardProps {
  place: PlaceCardPlace;
  /** Action controls (edit, delete) rendered in the card's trailing region. */
  actions?: ReactNode;
}

/**
 * Shared card for rendering a single place's image, name, address, tags, and
 * optional list-count badge. Action affordances are injected by the parent
 * via the `actions` prop.
 *
 * Tags are editable inline — remove by clicking ×, add by typing and pressing Enter.
 */
export function PlaceCard({ place, actions }: PlaceCardProps): JSX.Element {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {place.heroImageUrl && (
            <img
              src={place.heroImageUrl}
              alt={place.name}
              className="h-16 w-16 shrink-0 rounded-md object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{place.name}</p>
              {place.activeListCount !== undefined && (
                <Badge variant="outline" className="shrink-0 text-xs">
                  {place.activeListCount === 0
                    ? "Not in any list"
                    : place.activeListCount === 1
                      ? "In 1 list"
                      : `In ${place.activeListCount} lists`}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-sm">
              {place.address}
            </p>
          </div>
          {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
        </div>
        <div className="mt-2">
          <PlaceTagEditor placeId={place.id} initialTags={place.tags ?? []} />
        </div>
      </CardContent>
    </Card>
  );
}
