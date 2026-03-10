"use client";

import type { JSX } from "react";
import { useState, useActionState, useEffect } from "react";
import { createStandalonePlaceAction } from "@/actions/place-actions";
import type { CreateStandalonePlaceSuccessData } from "@/actions/place-actions";
import type { ActionState } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const buildInitialState = (): ActionState<CreateStandalonePlaceSuccessData> => ({
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
});

/**
 * Dialog for adding a new place to the user's library (not attached to any list).
 */
export function AddPlaceDialog({
  open,
  onOpenChange,
}: AddPlaceDialogProps): JSX.Element {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [state, formAction, isPending] = useActionState(
    createStandalonePlaceAction,
    buildInitialState()
  );

  // Close and reset on success
  useEffect(() => {
    if (state.isSuccess) {
      setName("");
      setAddress("");
      onOpenChange(false);
    }
  }, [state.isSuccess, onOpenChange]);

  // Reset form when dialog closes
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName("");
      setAddress("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : handleOpenChange}>
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
          <DialogTitle>New place</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="add-place-name">Name</Label>
            <Input
              id="add-place-name"
              name="name"
              placeholder="e.g. The Coffee House"
              maxLength={255}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
            {state.fieldErrors["name"] && (
              <p className="text-destructive text-xs">
                {state.fieldErrors["name"]?.[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-place-address">Address</Label>
            <Input
              id="add-place-address"
              name="address"
              placeholder="e.g. 1 Main St, London"
              maxLength={500}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
              disabled={isPending || !name.trim() || !address.trim()}
            >
              {isPending ? "Adding…" : "Add place"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
