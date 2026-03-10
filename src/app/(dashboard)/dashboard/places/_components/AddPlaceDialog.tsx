"use client";

import type { JSX } from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatePlaceForm } from "@/components/dashboard/places/CreatePlaceForm";

interface AddPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for adding a new place to the user's library (not attached to any list).
 */
export function AddPlaceDialog({
  open,
  onOpenChange,
}: AddPlaceDialogProps): JSX.Element {
  const [formKey, setFormKey] = useState(0);
  const [isFormPending, setIsFormPending] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) setFormKey((k) => k + 1);
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isFormPending ? undefined : handleOpenChange}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (isFormPending) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isFormPending) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>New place</DialogTitle>
        </DialogHeader>

        <CreatePlaceForm
          key={formKey}
          onSuccess={() => handleOpenChange(false)}
          onCancel={() => handleOpenChange(false)}
          onPendingChange={setIsFormPending}
        />
      </DialogContent>
    </Dialog>
  );
}
