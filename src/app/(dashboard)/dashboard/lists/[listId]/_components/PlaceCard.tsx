"use client";

import type { JSX, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlaceSummary } from "@/types/place";

interface PlaceCardProps {
  place: PlaceSummary;
  listId: string;
  /** Optional action controls (edit, delete) rendered in the card's trailing region. */
  actions?: ReactNode;
}

/**
 * Renders a single place's name and address.
 * Action affordances (edit, delete) are injected by the parent via the
 * optional `actions` prop and wired in during Phases 5 and 6.
 */
export function PlaceCard({ place, actions }: PlaceCardProps): JSX.Element {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{place.name}</p>
          <p className="text-muted-foreground mt-0.5 truncate text-sm">
            {place.address}
          </p>
        </div>
        {actions && (
          <div className="flex shrink-0 gap-1">{actions}</div>
        )}
      </CardContent>
    </Card>
  );
}
