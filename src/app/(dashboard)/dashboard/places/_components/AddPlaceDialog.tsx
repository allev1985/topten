"use client";

import type { JSX } from "react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <Sheet
      open={open}
      onOpenChange={isFormPending ? undefined : handleOpenChange}
    >
      <SheetContent
        side="bottom"
        className="max-h-[70vh] w-full overflow-y-auto rounded-t-2xl"
        onPointerDownOutside={(e) => {
          if (isFormPending) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isFormPending) e.preventDefault();
        }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle>New place</SheetTitle>
        </SheetHeader>

        <CreatePlaceForm
          key={formKey}
          onSuccess={() => handleOpenChange(false)}
          onCancel={() => handleOpenChange(false)}
          onPendingChange={setIsFormPending}
        />
      </SheetContent>
    </Sheet>
  );
}
