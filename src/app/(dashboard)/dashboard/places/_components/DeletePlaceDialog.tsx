"use client";

import type { JSX } from "react";
import { useActionState, useEffect } from "react";
import { deletePlaceGlobalAction } from "@/actions/place-actions";
import type { DeletePlaceGlobalSuccessData } from "@/actions/place-actions";
import type { ActionState } from "@/types/forms";
import type { PlaceWithListCount } from "@/lib/place";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DeletePlaceDialogProps {
  place: PlaceWithListCount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const buildInitialState = (): ActionState<DeletePlaceGlobalSuccessData> => ({
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
});

/**
 * Confirmation dialog for permanently soft-deleting a place.
 *
 * Warns the user when the place is currently attached to one or more lists
 * so they understand the cascade effect.
 */
export function DeletePlaceDialog({
  place,
  open,
  onOpenChange,
}: DeletePlaceDialogProps): JSX.Element {
  const [state, formAction, isPending] = useActionState(
    deletePlaceGlobalAction,
    buildInitialState()
  );

  // Close on successful delete
  useEffect(() => {
    if (state.isSuccess) {
      onOpenChange(false);
    }
  }, [state.isSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Delete place</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium">{place.name}</span>? This cannot be
            undone.
            {place.activeListCount > 0 && (
              <>
                {" "}
                It will also be removed from{" "}
                {place.activeListCount === 1
                  ? "1 list"
                  : `${place.activeListCount} lists`}
                .
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <input type="hidden" name="placeId" value={place.id} />

          {state.error && (
            <p role="alert" className="text-destructive mb-4 text-sm">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Deleting…" : "Delete place"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
