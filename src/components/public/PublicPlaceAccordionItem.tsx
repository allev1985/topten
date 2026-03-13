"use client";

import Image from "next/image";
import { ImageIcon, ChevronDown } from "lucide-react";
import type { JSX } from "react";
import type { PublicPlaceEntry } from "@/lib/public/service/types";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface PublicPlaceAccordionItemProps {
  place: PublicPlaceEntry;
}

/**
 * PublicPlaceAccordionItem — Client Component
 *
 * Renders a single place as an accordion item within a 2-column grid.
 * The trigger shows the hero image (or a placeholder) with the place
 * name and address overlaid via a gradient. The accordion content
 * reveals the description and any future additional properties.
 * When no expandable content exists the card is rendered statically.
 */
export function PublicPlaceAccordionItem({
  place,
}: PublicPlaceAccordionItemProps): JSX.Element {
  const hasContent = Boolean(place.description);

  const heroImage = (
    <div className="relative w-full aspect-video">
      {place.heroImageUrl ? (
        <Image
          src={place.heroImageUrl}
          alt={`Photo of ${place.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Name + address + optional expand indicator */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-2 p-3">
        <div className="min-w-0 text-left">
          <p className="font-semibold text-white leading-snug drop-shadow">
            {place.name}
          </p>
          <p className="mt-0.5 text-xs text-white/80 leading-snug drop-shadow">
            {place.address}
          </p>
        </div>
        {hasContent && (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-white/70 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        )}
      </div>
    </div>
  );

  if (!hasContent) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {heroImage}
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-xl border bg-card shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value={place.id} className="border-b-0">
          <AccordionTrigger className="rounded-none p-0 hover:no-underline [&>svg]:hidden">
            {heroImage}
          </AccordionTrigger>

          <AccordionContent className="px-4 py-3 text-sm text-muted-foreground">
            {place.description}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
