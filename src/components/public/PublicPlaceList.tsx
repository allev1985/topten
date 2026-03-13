import type { JSX } from "react";
import type { PublicPlaceEntry } from "@/lib/public/service/types";
import { PublicPlaceAccordionItem } from "./PublicPlaceAccordionItem";

interface PublicPlaceListProps {
  places: PublicPlaceEntry[];
}

/**
 * PublicPlaceList — Server Component
 *
 * Renders places in a 2-column accordion grid.
 * Each place shows a hero image with overlaid name and address;
 * tapping expands to reveal the description and any future properties.
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
    <div className="grid items-start gap-4 sm:grid-cols-2">
      {places.map((place) => (
        <PublicPlaceAccordionItem key={place.id} place={place} />
      ))}
    </div>
  );
}
