"use client";

import type { JSX } from "react";
import { useState, useTransition } from "react";
import { addExistingPlaceToListAction } from "@/actions/place-actions";
import type { AddExistingPlaceSuccessData } from "@/actions/place-actions";
import type { ActionState } from "@/types/forms";
import type { PlaceSummary } from "@/lib/place/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CreatePlaceForm } from "@/components/dashboard/places/CreatePlaceForm";

interface AddPlaceDialogProps {
  listId: string;
  availablePlaces: PlaceSummary[];
}

const buildAddExistingInitial =
  (): ActionState<AddExistingPlaceSuccessData> => ({
    data: null,
    error: null,
    fieldErrors: {},
    isSuccess: false,
  });

/**
 * Bottom sheet for adding a place to a list.
 *
 * Two sections:
 *   A — "Add a new place": Google Places search via CreatePlaceForm.
 *   B — "Add from existing": 3-column grid of places not already in the list,
 *       with checkboxes to enable multi-select and bulk add.
 *
 * Section B is hidden when there are no available places.
 * `createFormKey` is incremented on every close to remount CreatePlaceForm fresh.
 */
export function AddPlaceDialog({
  listId,
  availablePlaces,
}: AddPlaceDialogProps): JSX.Element {
  const hasAvailable = availablePlaces.length > 0;

  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addError, setAddError] = useState<string | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [isAddPending, startAddTransition] = useTransition();

  const closeAndReset = () => {
    setOpen(false);
    setSelectedIds(new Set());
    setAddError(null);
    setCreateFormKey((k) => k + 1);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      closeAndReset();
    } else {
      setOpen(true);
    }
  };

  const togglePlace = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddSelected = () => {
    if (selectedIds.size === 0) return;
    setAddError(null);

    startAddTransition(async () => {
      let lastError: string | null = null;
      for (const placeId of selectedIds) {
        const formData = new FormData();
        formData.set("listId", listId);
        formData.set("placeId", placeId);
        const result = await addExistingPlaceToListAction(
          buildAddExistingInitial(),
          formData
        );
        if (!result.isSuccess) {
          lastError = result.error ?? "Failed to add place.";
        }
      }
      if (lastError) {
        setAddError(lastError);
      } else {
        closeAndReset();
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button size="sm">Add a place</Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[70vh] w-full overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>Add a place</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-8">
          {/* ── Section A: Add a new place via Google search ──────────────── */}
          <div>
            <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
              Add a new place
            </h3>
            <CreatePlaceForm
              key={createFormKey}
              listId={listId}
              onSuccess={closeAndReset}
              onCancel={closeAndReset}
              submitLabel="Add place"
            />
          </div>

          {/* ── Section B: Add from existing places ───────────────────────── */}
          {hasAvailable && (
            <div className="flex flex-col gap-4">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Add from existing
              </h3>

              {addError && (
                <p role="alert" className="text-destructive text-sm">
                  {addError}
                </p>
              )}

              <div className="grid grid-cols-3 gap-3">
                {availablePlaces.map((place) => {
                  const checked = selectedIds.has(place.id);
                  return (
                    <div
                      key={place.id}
                      onClick={() => !isAddPending && togglePlace(place.id)}
                      className={`relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-colors select-none ${
                        checked
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      } ${isAddPending ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <div className="absolute top-2 right-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => togglePlace(place.id)}
                          disabled={isAddPending}
                          aria-label={`Select ${place.name}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {place.heroImageUrl && (
                        <img
                          src={place.heroImageUrl}
                          alt={place.name}
                          className="h-20 w-full rounded-md object-cover"
                        />
                      )}

                      <div className="min-w-0 pr-6">
                        <p className="truncate text-sm font-medium">
                          {place.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {place.address}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-muted-foreground text-sm">
                  {selectedIds.size === 0
                    ? "Select places to add"
                    : `${selectedIds.size} selected`}
                </p>
                <Button
                  type="button"
                  onClick={handleAddSelected}
                  disabled={selectedIds.size === 0 || isAddPending}
                >
                  {isAddPending
                    ? "Adding…"
                    : `Add ${selectedIds.size > 0 ? selectedIds.size : ""} to list`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
