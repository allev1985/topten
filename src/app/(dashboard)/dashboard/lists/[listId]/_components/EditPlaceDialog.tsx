"use client";

import type { JSX } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { updatePlaceAction } from "@/actions/place-actions";
import type { UpdatePlaceSuccessData } from "@/actions/place-actions";
import type { ActionState } from "@/types/forms";
import type { PlaceSummary } from "@/types/place";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditPlaceDialogProps {
  place: PlaceSummary;
  listId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = { name: string; address: string };

const buildInitialState = (): ActionState<UpdatePlaceSuccessData> => ({
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
});

/**
 * Dialog for editing a place's name and address.
 *
 * Dirty-state tracking (FR-013 – FR-016):
 *   - Save button is disabled when no changes have been made, or form is invalid.
 *   - An "Unsaved changes" badge is visible while the form is dirty.
 *   - Attempting to close with unsaved changes triggers window.confirm().
 *     Confirming discards changes; cancelling returns to the form.
 *   - The close button is disabled while a save is in progress.
 *
 * Note: googlePlaceId is immutable and is never shown or accepted as input.
 */
export function EditPlaceDialog({
  place,
  listId,
  open,
  onOpenChange,
}: EditPlaceDialogProps): JSX.Element {
  const initialValues = useRef<FormValues>({
    name: place.name,
    address: place.address,
  });

  const [formValues, setFormValues] = useState<FormValues>({
    name: place.name,
    address: place.address,
  });

  const [state, formAction, isPending] = useActionState(
    updatePlaceAction,
    buildInitialState()
  );

  // Sync initial ref when the dialog opens for a (potentially) different place
  useEffect(() => {
    if (open) {
      initialValues.current = { name: place.name, address: place.address };
      setFormValues({ name: place.name, address: place.address });
    }
  }, [open, place.name, place.address]);

  // Close on successful save
  useEffect(() => {
    if (state.isSuccess) {
      onOpenChange(false);
    }
  }, [state.isSuccess, onOpenChange]);

  const isDirty =
    formValues.name.trim() !== initialValues.current.name.trim() ||
    formValues.address.trim() !== initialValues.current.address.trim();

  const isValid =
    formValues.name.trim().length > 0 && formValues.address.trim().length > 0;

  const handleOpenChange = (next: boolean) => {
    if (!next && isDirty && !isPending) {
      const ok = window.confirm(
        "You have unsaved changes. Discard them?"
      );
      if (!ok) return; // stay open
    }
    if (!next) {
      // Reset to initial
      setFormValues({
        name: initialValues.current.name,
        address: initialValues.current.address,
      });
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        // Prevent background click from closing when save is in progress
        onPointerDownOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Edit place</DialogTitle>
            {isDirty && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="placeId" value={place.id} />
          <input type="hidden" name="listId" value={listId} />

          {/* Form-level error */}
          {state.error && (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-place-name">Name</Label>
            <Input
              id="edit-place-name"
              name="name"
              value={formValues.name}
              onChange={(e) =>
                setFormValues((v) => ({ ...v, name: e.target.value }))
              }
              maxLength={255}
              disabled={isPending}
            />
            {state.fieldErrors["name"] && (
              <p className="text-destructive text-xs">
                {state.fieldErrors["name"]?.[0]}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="edit-place-address">Address</Label>
            <Input
              id="edit-place-address"
              name="address"
              value={formValues.address}
              onChange={(e) =>
                setFormValues((v) => ({ ...v, address: e.target.value }))
              }
              maxLength={500}
              disabled={isPending}
            />
            {state.fieldErrors["address"] && (
              <p className="text-destructive text-xs">
                {state.fieldErrors["address"]?.[0]}
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
            <Button
              type="submit"
              disabled={!isDirty || !isValid || isPending}
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
