"use client";

import type { JSX } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { updatePlaceAction } from "@/actions/place-actions";
import type { UpdatePlaceSuccessData } from "@/actions/place-actions";
import type { ActionState } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditPlaceDialogProps {
  place: {
    id: string;
    name: string;
    address: string;
    description?: string | null;
  };
  /** When provided, ownership is verified via list membership and the list page
   *  is revalidated on save. Omit when editing from the My Places context. */
  listId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = { description: string };

const buildInitialState = (): ActionState<UpdatePlaceSuccessData> => ({
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
});

export function EditPlaceDialog({
  place,
  listId,
  open,
  onOpenChange,
}: EditPlaceDialogProps): JSX.Element {
  const initialValues = useRef<FormValues>({
    description: place.description ?? "",
  });

  const [formValues, setFormValues] = useState<FormValues>({
    description: place.description ?? "",
  });

  const [state, formAction, isPending] = useActionState(
    updatePlaceAction,
    buildInitialState()
  );

  // Sync initial ref when the dialog opens for a (potentially) different place
  useEffect(() => {
    if (open) {
      initialValues.current = { description: place.description ?? "" };
      setFormValues({ description: place.description ?? "" });
    }
  }, [open, place.description]);

  // Close on successful save
  useEffect(() => {
    if (state.isSuccess) onOpenChange(false);
  }, [state.isSuccess, onOpenChange]);

  const isDirty =
    formValues.description.trim() !== initialValues.current.description.trim();

  const handleOpenChange = (next: boolean) => {
    if (!next && isDirty && !isPending) {
      const ok = window.confirm("You have unsaved changes. Discard them?");
      if (!ok) return;
    }
    if (!next) {
      setFormValues({ description: initialValues.current.description });
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {listId && <input type="hidden" name="listId" value={listId} />}

          {state.error && (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          )}

          {/* Read-only place identity */}
          <div className="space-y-1">
            <p className="text-sm font-medium">{place.name}</p>
            <p className="text-muted-foreground text-sm">{place.address}</p>
          </div>

          {/* Editable description */}
          <div className="space-y-2">
            <Label htmlFor="edit-place-description">
              Notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="edit-place-description"
              name="description"
              placeholder="Add your notes about this place…"
              maxLength={2000}
              rows={4}
              value={formValues.description}
              onChange={(e) => setFormValues({ description: e.target.value })}
              disabled={isPending}
            />
            {state.fieldErrors["description"] && (
              <p className="text-destructive text-xs">
                {state.fieldErrors["description"]?.[0]}
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
            <Button type="submit" disabled={!isDirty || isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
