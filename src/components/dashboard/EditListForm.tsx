"use client";

import type { JSX } from "react";
import { useActionState, useEffect, useState } from "react";
import { updateListAction } from "@/actions/list-actions";
import type { UpdateListSuccessData } from "@/actions/list-actions";
import type { ActionState } from "@/types/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EditListFormProps {
  listId: string;
  initialTitle: string;
  initialDescription?: string;
  /** Called when the list is successfully updated */
  onSuccess?: () => void;
}

const buildInitialState = (): ActionState<UpdateListSuccessData> => ({
  data: null,
  error: null,
  fieldErrors: {},
  isSuccess: false,
});

/**
 * Edit List form
 *
 * Pre-fills title and description from the current list values.
 * Passes `listId` as a hidden field so the server action can identify the list.
 * Submit is disabled when no changes have been made, or while pending.
 */
export function EditListForm({
  listId,
  initialTitle,
  initialDescription = "",
  onSuccess,
}: EditListFormProps): JSX.Element {
  const [state, formAction, isPending] = useActionState(
    updateListAction,
    buildInitialState()
  );

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");

  const isDirty =
    title.trim() !== initialTitle.trim() ||
    description.trim() !== (initialDescription ?? "").trim();

  // Notify parent on success
  useEffect(() => {
    if (state.isSuccess) {
      onSuccess?.();
    }
  }, [state.isSuccess, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden list ID */}
      <input type="hidden" name="listId" value={listId} />

      {/* Form-level error */}
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={255}
          aria-describedby={
            state.fieldErrors.title ? "edit-title-error" : undefined
          }
        />
        {state.fieldErrors.title && (
          <p
            id="edit-title-error"
            role="alert"
            className="text-destructive text-sm"
          >
            {state.fieldErrors.title[0]}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A short description of this list (optional)"
          aria-describedby={
            state.fieldErrors.description ? "edit-description-error" : undefined
          }
        />
        {state.fieldErrors.description && (
          <p
            id="edit-description-error"
            role="alert"
            className="text-destructive text-sm"
          >
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending || !isDirty} className="w-full">
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
