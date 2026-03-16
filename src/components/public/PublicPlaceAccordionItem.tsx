"use client";

import Image from "next/image";
import { ImageIcon, ChevronDown } from "lucide-react";
import type { JSX } from "react";
import type { PublicPlaceEntry } from "@/lib/public/service/types";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface PublicPlaceAccordionItemProps {
  place: PublicPlaceEntry;
}

/**
 * PublicPlaceAccordionItem — Client Component
 *
 * Renders a single place as a disclosure card within a 2-column grid.
 * The trigger shows the hero image (or a placeholder) with the place
 * name and address overlaid via a gradient. When the place has a
 * description, tapping expands to reveal it.
 * When no expandable content exists the card is rendered statically.
 */
export function PublicPlaceAccordionItem({
  place,
}: PublicPlaceAccordionItemProps): JSX.Element {
  const hasContent = Boolean(place.description);

  const heroImage = (
    <div className="relative aspect-video w-full">
      {place.heroImageUrl ? (
        <Image
          src={place.heroImageUrl}
          alt={`Photo of ${place.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      ) : (
        <div className="bg-muted flex h-full w-full items-center justify-center">
          <ImageIcon className="text-muted-foreground/40 h-10 w-10" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Name + address + optional expand indicator */}
      <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between gap-2 p-3">
        <div className="min-w-0 text-left">
          <p className="leading-snug font-semibold text-white drop-shadow">
            {place.name}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-white/80 drop-shadow">
            {place.address}
          </p>
        </div>
        {hasContent && (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-white/70 transition-transform duration-200 group-data-[state=open]/card:rotate-180" />
        )}
      </div>
    </div>
  );

  if (!hasContent) {
    return (
      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        {heroImage}
      </div>
    );
  }

  return (
    <Collapsible className="group/card bg-card overflow-hidden rounded-xl border shadow-sm">
      <CollapsibleTrigger className="block w-full">
        {heroImage}
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
        <p className="text-muted-foreground px-4 py-3 text-sm">
          {place.description}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
