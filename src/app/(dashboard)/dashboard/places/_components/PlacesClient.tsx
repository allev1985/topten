"use client";

import type { JSX } from "react";
import { useState } from "react";
import type { PlaceWithListCount } from "@/lib/place";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { PlaceCard } from "@/components/dashboard/places/PlaceCard";
import { AddPlaceDialog } from "./AddPlaceDialog";
import { EditPlaceDialog } from "@/components/dashboard/places/EditPlaceDialog";
import { DeletePlaceDialog } from "./DeletePlaceDialog";

interface PlacesClientProps {
  initialPlaces: PlaceWithListCount[];
  initialError?: string;
}

/**
 * Client component that orchestrates the My Places page.
 *
 * Manages the open/close state for AddPlace, EditPlace, and DeletePlace dialogs.
 * Renders the list of PlaceCards or an empty-state prompt.
 */
export function PlacesClient({
  initialPlaces,
  initialError,
}: PlacesClientProps): JSX.Element {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlaceWithListCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlaceWithListCount | null>(
    null
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Places</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage all the places in your library.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New place
        </Button>
      </div>

      {/* Load error */}
      {initialError && (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {initialError}
        </p>
      )}

      {/* Place list or empty state */}
      {initialPlaces.length === 0 && !initialError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MapPin className="text-muted-foreground mb-4 h-12 w-12" />
          <h2 className="text-lg font-medium">No places yet</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Add your first place to get started.
          </p>
          <Button className="mt-4" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New place
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {initialPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${place.name}`}
                    onClick={() => setEditTarget(place)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${place.name}`}
                    onClick={() => setDeleteTarget(place)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddPlaceDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

      {editTarget && (
        <EditPlaceDialog
          place={editTarget}
          open={editTarget !== null}
          onOpenChange={(open: boolean) => {
            if (!open) setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeletePlaceDialog
          place={deleteTarget}
          open={deleteTarget !== null}
          onOpenChange={(open: boolean) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
