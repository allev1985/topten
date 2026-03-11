import type { JSX } from "react";
import type { PublicPlaceEntry } from "@/lib/public/service/types";
import { PublicPlaceCard } from "./PublicPlaceCard";

interface PublicPlaceListProps {
  places: PublicPlaceEntry[];
}

/**
 * PublicPlaceList — Server Component
 *
 * Renders an ordered list of PublicPlaceCard components.
 * Rank is derived from the array index (1-based) rather than
 * the stored position value, ensuring sequential display.
 * Shows an empty state when the list has no places.
 */
export function PublicPlaceList({ places }: PublicPlaceListProps): JSX.Element {
  if (places.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No places in this list yet.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {places.map((place, index) => (
        <li key={place.id}>
          <PublicPlaceCard place={place} rank={index + 1} />
        </li>
      ))}
    </ol>
  );
}
