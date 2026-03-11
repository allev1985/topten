import Image from "next/image";
import type { JSX } from "react";
import type { PublicPlaceEntry } from "@/lib/public/service/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PublicPlaceCardProps {
  place: PublicPlaceEntry;
  rank: number;
}

/**
 * PublicPlaceCard — Server Component
 *
 * Renders a single place entry within a public list.
 * Displays the rank, hero image (if set), name, address, and description.
 */
export function PublicPlaceCard({
  place,
  rank,
}: PublicPlaceCardProps): JSX.Element {
  return (
    <Card>
      <CardContent className="flex gap-4 py-4">
        <Badge className="h-8 w-8 flex-shrink-0 rounded-full text-sm justify-center">
          {rank}
        </Badge>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">{place.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{place.address}</p>
          {place.description && (
            <p className="mt-2 text-sm text-foreground">{place.description}</p>
          )}
        </div>

        {place.heroImageUrl && (
          <div className="flex-shrink-0">
            <Image
              src={place.heroImageUrl}
              alt={`Photo of ${place.name}`}
              width={80}
              height={80}
              className="rounded-md object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
