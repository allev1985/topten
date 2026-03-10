"use client";

import type { JSX } from "react";
import { useState, useTransition } from "react";
import type { PlaceSummary } from "@/types/place";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deletePlaceAction } from "@/actions/place-actions";
import { PlaceCard } from "@/components/dashboard/places/PlaceCard";
import { AddPlaceDialog } from "./AddPlaceDialog";
import { EditPlaceDialog } from "./EditPlaceDialog";

interface PlaceListProps {
  listId: string;
  places: PlaceSummary[];
  availablePlaces: PlaceSummary[];
}

/**
 * Renders the list of places for a given list.
 *
 * Owns the edit dialog state — passes an "Edit" button into each PlaceCard via
 * the `actions` prop, and renders a single EditPlaceDialog controlled by the
 * currently-selected place.
 *
 * Delete affordances are injected in Phase 6.
 */
export function PlaceList({
  listId,
  places,
  availablePlaces,
}: PlaceListProps): JSX.Element {
  const [editTarget, setEditTarget] = useState<PlaceSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PlaceSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);

    const formData = new FormData();
    formData.set("placeId", deleteTarget.id);
    formData.set("listId", listId);

    startDeleteTransition(async () => {
      const result = await deletePlaceAction(
        { data: null, error: null, fieldErrors: {}, isSuccess: false },
        formData
      );
      if (!result.isSuccess) {
        setDeleteError(result.error ?? "Failed to delete place.");
      } else {
        setDeleteTarget(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {places.length > 0
            ? `${places.length} place${places.length === 1 ? "" : "s"}`
            : "Places"}
        </h2>
        <AddPlaceDialog listId={listId} availablePlaces={availablePlaces} />
      </div>

      {/* Place list or empty state */}
      {places.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <p className="text-base font-medium">No places yet — add one!</p>
          <p className="text-sm">
            Use the &ldquo;Add a place&rdquo; button to start building your list.
          </p>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {places.map((place) => (
            <li key={place.id}>
              <PlaceCard
                place={place}
                actions={
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditTarget(place)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(place)}
                      disabled={isDeleting}
                    >
                      Delete
                    </Button>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}

      {/* Edit dialog (single instance, controlled by editTarget) */}
      {editTarget && (
        <EditPlaceDialog
          place={editTarget}
          listId={listId}
          open={editTarget !== null}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this place?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be removed from this list.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <p role="alert" className="text-destructive text-sm">
              {deleteError}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing…" : "Remove place"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
