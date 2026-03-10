"use client";

import type { JSX } from "react";
import type { PlaceWithListCount } from "@/lib/place/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface PlaceCardProps {
  place: PlaceWithListCount;
  onEdit: (place: PlaceWithListCount) => void;
  onDelete: (place: PlaceWithListCount) => void;
}

/**
 * Card displaying a single place with its active-list count badge
 * and Edit / Delete action buttons.
 */
export function PlaceCard({
  place,
  onEdit,
  onDelete,
}: PlaceCardProps): JSX.Element {
  return (
    <div className="flex items-start justify-between rounded-lg border p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{place.name}</h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {place.activeListCount === 0
              ? "Not in any list"
              : place.activeListCount === 1
                ? "In 1 list"
                : `In ${place.activeListCount} lists`}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1 truncate text-sm">
          {place.address}
        </p>
      </div>

      <div className="ml-4 flex shrink-0 gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${place.name}`}
          onClick={() => onEdit(place)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${place.name}`}
          onClick={() => onDelete(place)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
