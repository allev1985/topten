"use client";

import type { JSX } from "react";
import { useActionState, useEffect, useState } from "react";
import {
  createPlaceAction,
  addExistingPlaceToListAction,
} from "@/actions/place-actions";
import type {
  CreatePlaceSuccessData,
  AddExistingPlaceSuccessData,
} from "@/actions/place-actions";
import type { ActionState } from "@/types/forms";
import type { PlaceSummary } from "@/types/place";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddPlaceDialogProps {
  listId: string;
  availablePlaces: PlaceSummary[];
}

const buildCreateInitial = (): ActionState<CreatePlaceSuccessData> => ({
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
});

const buildAddExistingInitial = (): ActionState<AddExistingPlaceSuccessData> => ({
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
});

/**
 * Dialog for adding a place to a list.
 *
 * Two paths:
 *   A — Search existing places (client-side filter by name) and attach one.
 *       Only shown when availablePlaces is non-empty.
 *   B — Create a brand-new place with a name and address.
 *
 * If availablePlaces is empty, defaults to Path B.
 * Closes automatically on success of either path.
 */
export function AddPlaceDialog({
  listId,
  availablePlaces,
}: AddPlaceDialogProps): JSX.Element {
  const hasAvailable = availablePlaces.length > 0;
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<"search" | "create">(
    hasAvailable ? "search" : "create"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSummary | null>(null);

  const [createState, createAction, isCreatePending] = useActionState(
    createPlaceAction,
    buildCreateInitial()
  );

  const [addState, addAction, isAddPending] = useActionState(
    addExistingPlaceToListAction,
    buildAddExistingInitial()
  );

  // Close on success
  useEffect(() => {
    if (createState.isSuccess || addState.isSuccess) {
      setOpen(false);
      setSearchTerm("");
      setSelectedPlace(null);
    }
  }, [createState.isSuccess, addState.isSuccess]);

  // Reset state when dialog opens/closes
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearchTerm("");
      setSelectedPlace(null);
      setPath(hasAvailable ? "search" : "create");
    }
  };

  const filteredPlaces = availablePlaces.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPending = isCreatePending || isAddPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">Add a place</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a place</DialogTitle>
        </DialogHeader>

        {/* Path toggle — only shown when available places exist */}
        {hasAvailable && (
          <div className="flex gap-2 border-b pb-3">
            <button
              type="button"
              onClick={() => setPath("search")}
              className={`text-sm font-medium transition-colors ${
                path === "search"
                  ? "text-primary border-primary border-b-2 pb-1"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              From existing places
            </button>
            <button
              type="button"
              onClick={() => setPath("create")}
              className={`text-sm font-medium transition-colors ${
                path === "create"
                  ? "text-primary border-primary border-b-2 pb-1"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create new
            </button>
          </div>
        )}

        {/* ── Path A: Search existing places ───────────────────────────────── */}
        {path === "search" && (
          <form action={addAction} className="space-y-4">
            <input type="hidden" name="listId" value={listId} />
            {selectedPlace && (
              <input type="hidden" name="placeId" value={selectedPlace.id} />
            )}

            {/* Form-level error */}
            {addState.error && (
              <p role="alert" className="text-destructive text-sm">
                {addState.error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="place-search">Search by name</Label>
              <Input
                id="place-search"
                placeholder="Type to filter places…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedPlace(null);
                }}
                autoComplete="off"
              />
            </div>

            {/* Filtered results */}
            {searchTerm && filteredPlaces.length === 0 && (
              <p className="text-muted-foreground text-sm">No places found.</p>
            )}

            {filteredPlaces.length > 0 && (
              <ul className="max-h-48 divide-y overflow-y-auto rounded-md border">
                {filteredPlaces.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlace(place);
                        setSearchTerm(place.name);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                        selectedPlace?.id === place.id ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <span className="block font-medium">{place.name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {place.address}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedPlace || isPending}>
                {isAddPending ? "Adding…" : "Add to list"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Path B: Create new place ──────────────────────────────────────── */}
        {path === "create" && (
          <form action={createAction} className="space-y-4">
            <input type="hidden" name="listId" value={listId} />

            {/* Form-level error */}
            {createState.error && (
              <p role="alert" className="text-destructive text-sm">
                {createState.error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="place-name">Name</Label>
              <Input
                id="place-name"
                name="name"
                placeholder="e.g. The Coffee House"
                maxLength={255}
                required
              />
              {createState.fieldErrors["name"] && (
                <p className="text-destructive text-xs">
                  {createState.fieldErrors["name"]?.[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="place-address">Address</Label>
              <Input
                id="place-address"
                name="address"
                placeholder="e.g. 1 Main St, London"
                maxLength={500}
                required
              />
              {createState.fieldErrors["address"] && (
                <p className="text-destructive text-xs">
                  {createState.fieldErrors["address"]?.[0]}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatePending}>
                {isCreatePending ? "Creating…" : "Create place"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
