"use client";

import type { JSX } from "react";
import { useState, useTransition } from "react";
import {
  addExistingPlaceToListAction,
} from "@/actions/place-actions";
import type {
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

// ── Dialog ────────────────────────────────────────────────────────────────────

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
 *
 * `createFormKey` is incremented on every close so that <CreatePlaceForm> is
 * remounted fresh on the next open, resetting its useActionState to the
 * initial value and preventing stale success/error from persisting.
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
  const [createFormKey, setCreateFormKey] = useState(0);

  const [addState, setAddState] = useState<
    ActionState<AddExistingPlaceSuccessData>
  >(buildAddExistingInitial());
  const [isAddPending, startAddTransition] = useTransition();

  const closeAndReset = () => {
    setOpen(false);
    setSearchTerm("");
    setSelectedPlace(null);
    setAddState(buildAddExistingInitial());
    setPath(hasAvailable ? "search" : "create");
    setCreateFormKey((k) => k + 1);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      closeAndReset();
    } else {
      setOpen(true);
    }
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startAddTransition(async () => {
      const result = await addExistingPlaceToListAction(addState, formData);
      setAddState(result);
      if (result.isSuccess) {
        closeAndReset();
      }
    });
  };

  const filteredPlaces = availablePlaces.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <input type="hidden" name="listId" value={listId} />
            {selectedPlace && (
              <input type="hidden" name="placeId" value={selectedPlace.id} />
            )}

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
                      className={`hover:bg-muted w-full px-3 py-2 text-left text-sm transition-colors ${
                        selectedPlace?.id === place.id
                          ? "bg-muted font-medium"
                          : ""
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
                disabled={isAddPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedPlace || isAddPending}>
                {isAddPending ? "Adding…" : "Add to list"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Path B: Create new place ──────────────────────────────────────── */}
        {path === "create" && (
          <CreatePlaceForm
            key={createFormKey}
            listId={listId}
            onSuccess={closeAndReset}
            onCancel={() => handleOpenChange(false)}
            submitLabel="Create place"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
