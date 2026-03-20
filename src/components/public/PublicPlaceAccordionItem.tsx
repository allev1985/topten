"use client";

import Image from "next/image";
import { ImageIcon, ChevronDown } from "lucide-react";
import type { JSX } from "react";
import type { PublicPlaceEntry } from "@/lib/public/types";
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
 * Renders a single place as a disclosure card within a grid.
 * The hero image is shown at the top, with the place name and address
 * displayed below it in black text. When the place has a description,
 * the card header is tappable to expand and reveal it.
 */
export function PublicPlaceAccordionItem({
  place,
}: PublicPlaceAccordionItemProps): JSX.Element {
  const hasContent = Boolean(place.description);

  const heroImage = (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-white">
      {place.heroImageUrl ? (
        <Image
          src={place.heroImageUrl}
          alt={`Photo of ${place.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <div className="bg-muted flex h-full w-full items-center justify-center">
          <ImageIcon className="text-muted-foreground/40 h-10 w-10" />
        </div>
      )}
    </div>
  );

  const nameAndAddress = (
    <div className="flex items-start justify-between gap-2 px-3 py-2">
      <div className="min-w-0 text-left">
        <p className="text-foreground leading-snug font-semibold">
          {place.name}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
          {place.address}
        </p>
      </div>
      {hasContent && (
        <ChevronDown className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0 transition-transform duration-200 group-data-[state=open]/card:rotate-180" />
      )}
    </div>
  );

  if (!hasContent) {
    return (
      <div className="bg-card overflow-hidden">
        {heroImage}
        {nameAndAddress}
      </div>
    );
  }

  return (
    <Collapsible className="group/card bg-card overflow-hidden">
      <CollapsibleTrigger className="block w-full">
        {heroImage}
        {nameAndAddress}
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
        <p className="text-muted-foreground px-3 py-3 text-sm">
          {place.description}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
